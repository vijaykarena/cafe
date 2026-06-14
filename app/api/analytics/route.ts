import { NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const searchParams = new URL(request.url).searchParams;
    const period = searchParams.get('period') || 'Today';

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*, products(*, categories(*)))');

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (period === 'This Week') {
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Assuming Monday start
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract);
    } else if (period === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'All Time') {
      startDate = new Date(0); // 1970
    }

    if (period !== 'All Time') {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (userRole === 'manager' && userId) {
      query = query.eq('manager_id', userId);

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
