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
