import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('kds_tickets')
      .select('*, orders(*, order_items(*, products(*)))')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Format to match KdsTicket structure expected by KDS frontend page
    const formatted = data.map((ticket: any) => ({
      id: ticket.id,
      orderNumber: ticket.orders?.order_number || 'ORD-UNKNOWN',
      table: ticket.orders?.table_id || 'Takeaway', // or resolve table name
      time: ticket.created_at,
      status: ticket.status,
      items: (ticket.orders?.order_items || []).map((oi: any) => ({
        id: oi.id,
        name: oi.products?.name || 'Unknown Item',
        quantity: oi.quantity,
        isCompleted: oi.is_completed_in_kitchen || false,
        category: 'Menu', // or resolve category name
      })),
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (body.ticket_id && body.status) {
      // Update KDS Ticket Status (to_cook -> preparing -> completed)
      const { data, error } = await supabaseAdmin
        .from('kds_tickets')
        .update({ status: body.status })
        .eq('id', body.ticket_id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    } else if (body.item_id && body.hasOwnProperty('is_completed')) {
      // Toggle individual order item completion status in kitchen
      const { data, error } = await supabaseAdmin
        .from('order_items')
        .update({ is_completed_in_kitchen: body.is_completed })
        .eq('id', body.item_id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      throw new Error('Invalid update parameters');
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
