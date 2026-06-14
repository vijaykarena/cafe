import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(*), kds_tickets(*)");
    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Create order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        session_id: body.session_id,
        table_id: body.table_id || null,
        customer_id: body.customer_id || null,
        order_number: body.order_number,
        subtotal: body.subtotal,
        tax: body.tax,
        discount_amount: body.discount_amount,
        total: body.total,
        status: body.status || "paid",
        payment_method: body.payment_method || null,
        payment_reference: body.payment_reference || null,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 2. Insert items
    const itemsPayload = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      tax_rate: item.product.tax,
      total_price: item.product.price * item.quantity,
      is_completed_in_kitchen: false,
    }));

    const { data: items, error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(itemsPayload)
      .select();

    if (itemsErr) throw itemsErr;

    // 3. Create KDS Ticket automatically
    const { error: kdsErr } = await supabaseAdmin.from("kds_tickets").insert({
      order_id: order.id,
      status: "to_cook",
    });

    if (kdsErr) {
      console.error("KDS Ticket Creation Error:", kdsErr);
    }

    return NextResponse.json({ order, items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      order_id,
      items,
      status,
      payment_method,
      payment_reference,
      subtotal,
      tax,
      discount_amount,
      total,
    } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    if (status === "paid") {
      // 1. Update order status and payment fields
      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          payment_method: payment_method || null,
          payment_reference: payment_reference || null,
          subtotal: subtotal,
          tax: tax,
          discount_amount: discount_amount || 0,
          total: total,
        })
        .eq("id", order_id)
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. If there are items to append, insert them
      if (items && items.length > 0) {
        const itemsPayload = items.map((item: any) => ({
          order_id: order_id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: Number(item.product.price),
          tax_rate: Number(item.product.tax || 0),
          total_price: Number(item.product.price) * item.quantity,
          is_completed_in_kitchen: false,
        }));

        const { error: itemsErr } = await supabaseAdmin
          .from("order_items")
          .insert(itemsPayload);

        if (itemsErr) throw itemsErr;

        // Also create/update KDS ticket to 'to_cook' for the appended items
        const { data: kdsTicket } = await supabaseAdmin
          .from("kds_tickets")
          .select("*")
          .eq("order_id", order_id)
          .maybeSingle();

        if (kdsTicket) {
          await supabaseAdmin
            .from("kds_tickets")
            .update({ status: "to_cook" })
            .eq("id", kdsTicket.id);
        } else {
          await supabaseAdmin
            .from("kds_tickets")
            .insert({ order_id, status: "to_cook" });
        }
      }

      return NextResponse.json({ success: true, order });
    }

    // Existing append logic (waiter "Send to Kitchen")
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing items to append" },
        { status: 400 },
      );
    }

    // 1. Fetch current order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Calculate appended totals
    let addedSubtotal = 0;
    let addedTax = 0;

    const itemsPayload = items.map((item: any) => {
      const itemPrice = Number(item.product.price);
      const itemTaxRate = Number(item.product.tax || 0);
      const itemSubtotal = itemPrice * item.quantity;
      const itemTax = (itemSubtotal * itemTaxRate) / 100;

      addedSubtotal += itemSubtotal;
      addedTax += itemTax;

      return {
        order_id: order_id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: itemPrice,
        tax_rate: itemTaxRate,
        total_price: itemSubtotal,
        is_completed_in_kitchen: false,
      };
    });

    const newSubtotal = Number(order.subtotal) + addedSubtotal;
    const newTax = Number(order.tax) + addedTax;
    const newTotal = newSubtotal + newTax - Number(order.discount_amount || 0);

    // 3. Update order totals
    const { error: updateOrderErr } = await supabaseAdmin
      .from("orders")
      .update({ subtotal: newSubtotal, tax: newTax, total: newTotal })
      .eq("id", order_id);

    if (updateOrderErr) throw updateOrderErr;

    // 4. Insert new items
    const { data: insertedItems, error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .insert(itemsPayload)
      .select();

    if (itemsErr) throw itemsErr;

    // 5. Update or create KDS ticket to 'to_cook'
    const { data: kdsTicket, error: kdsFetchErr } = await supabaseAdmin
      .from("kds_tickets")
      .select("*")
      .eq("order_id", order_id)
      .maybeSingle();

    if (kdsTicket) {
      await supabaseAdmin
        .from("kds_tickets")
        .update({ status: "to_cook" })
        .eq("id", kdsTicket.id);
    } else {
      await supabaseAdmin
        .from("kds_tickets")
        .insert({ order_id, status: "to_cook" });
    }

    return NextResponse.json({ success: true, items: insertedItems });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
