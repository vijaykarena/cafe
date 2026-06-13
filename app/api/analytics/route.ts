import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: orders, error } = await supabaseServer
      .from('orders')
      .select('*, order_items(*, products(*, categories(*)))');

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
      rawOrders: orders, // Can be parsed further by dashboard components
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
