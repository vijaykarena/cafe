import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const cookId = request.headers.get('x-user-id');
    const role = request.headers.get('x-user-role');

    const { data, error } = await supabaseAdmin
      .from('kds_tickets')
      .select('*, orders(*, order_items(*, products(*)))')
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Format to match KdsTicket structure expected by KDS frontend page
    let formatted = data.map((ticket: any) => ({
      id: ticket.id,
      orderNumber: ticket.orders?.order_number || 'ORD-UNKNOWN',
      table: ticket.orders?.table_id || 'Takeaway', // or resolve table name
      time: ticket.created_at,
      status: ticket.status,
      assignedTo: ticket.assigned_to || null,
      items: (ticket.orders?.order_items || []).filter((oi: any) => !oi.is_served).map((oi: any) => ({
        id: oi.id,
        name: oi.products?.name || 'Unknown Item',
        quantity: oi.quantity,
        isCompleted: oi.is_completed_in_kitchen || false,
        category: 'Menu', // or resolve category name
      })),
    }));

    // Cook-specific filtering: cooks only see their own preparing/completed tickets
    if (role === 'cook' && cookId) {
      formatted = formatted.filter((ticket: any) =>
        ticket.status === 'to_cook' || ticket.assignedTo === cookId
      );
    }

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
      const cookId = request.headers.get('x-user-id');
      const updateData: Record<string, any> = { status: body.status };

      // Assign ticket to cook when picking up (preparing), unassign when returning to queue
      if (body.status === 'preparing' && cookId) {
        updateData.assigned_to = cookId;
      } else if (body.status === 'to_cook') {
        updateData.assigned_to = null;
      }

      const { data, error } = await supabaseAdmin
        .from('kds_tickets')
        .update(updateData)
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('kds_tickets')
      .delete()
      .eq('order_id', orderId);

    if (error) throw error;

    // Mark all current order_items as served
    await supabaseAdmin
      .from('order_items')
      .update({ is_served: true })
      .eq('order_id', orderId);

    // Retrieve order to perform a "touch" update and trigger realtime events on the orders table
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('id', orderId)
      .maybeSingle();

    if (order) {
      await supabaseAdmin
        .from('orders')
        .update({ total: order.total })
        .eq('id', orderId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

