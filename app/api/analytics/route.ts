import { NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    let query = supabaseServer
      .from('orders')
      .select('*, order_items(*, products(*, categories(*)))');

    if (userRole === 'manager' && userId) {
      // 1. Fetch all profiles managed by this manager, plus the manager themselves
      const { data: staff, error: staffErr } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('manager_id', userId);

      if (staffErr) throw staffErr;

      const staffIds = [userId, ...(staff?.map((s) => s.id) || [])];

      // 2. Query sessions opened by any of these staff IDs
      const { data: sessions, error: sessionsErr } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .in('opened_by', staffIds);

      if (sessionsErr) throw sessionsErr;

      const sessionIds = sessions?.map((s) => s.id) || [];

      // 3. Filter orders belonging to these sessions
      if (sessionIds.length > 0) {
        query = query.in('session_id', sessionIds);
      } else {
        // No sessions means no orders
        return NextResponse.json({
          totalOrders: 0,
          revenue: 0.00,
          avgOrderValue: 0.00,
          rawOrders: [],
        });
      }
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    // Calculate metrics
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

    // Return calculations
    return NextResponse.json({
      totalOrders,
      revenue,
      avgOrderValue,
      rawOrders: orders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
