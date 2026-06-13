import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    let query = supabaseServer.from('orders').select('*, order_items(*)');
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

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
    const { data: order, error: orderErr } = await supabaseServer
      .from('orders')
      .insert({
        session_id: body.session_id,
        table_id: body.table_id || null,
        customer_id: body.customer_id || null,
        order_number: body.order_number,
        subtotal: body.subtotal,
        tax: body.tax,
        discount_amount: body.discount_amount,
        total: body.total,
        status: body.status || 'paid',
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

    const { data: items, error: itemsErr } = await supabaseServer
      .from('order_items')
      .insert(itemsPayload)
      .select();

    if (itemsErr) throw itemsErr;

    // 3. Create KDS Ticket automatically
    const { error: kdsErr } = await supabaseServer
      .from('kds_tickets')
      .insert({
        order_id: order.id,
        status: 'to_cook',
      });

    if (kdsErr) {
      console.error('KDS Ticket Creation Error:', kdsErr);
    }

    return NextResponse.json({ order, items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { order_id, items } = body;

    if (!order_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing order_id or items' }, { status: 400 });
    }

    // 1. Fetch current order
    const { data: order, error: orderErr } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
    const { error: updateOrderErr } = await supabaseServer
      .from('orders')
      .update({
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      })
      .eq('id', order_id);

    if (updateOrderErr) throw updateOrderErr;

    // 4. Insert new items
    const { data: insertedItems, error: itemsErr } = await supabaseServer
      .from('order_items')
      .insert(itemsPayload)
      .select();

    if (itemsErr) throw itemsErr;

    // 5. Update or create KDS ticket to 'to_cook'
    const { data: kdsTicket, error: kdsFetchErr } = await supabaseServer
      .from('kds_tickets')
      .select('*')
      .eq('order_id', order_id)
      .maybeSingle();

    if (kdsTicket) {
      await supabaseServer
        .from('kds_tickets')
        .update({ status: 'to_cook' })
        .eq('id', kdsTicket.id);
    } else {
      await supabaseServer
        .from('kds_tickets')
        .insert({ order_id, status: 'to_cook' });
    }

    return NextResponse.json({ success: true, items: insertedItems });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
