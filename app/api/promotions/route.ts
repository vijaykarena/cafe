import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'coupons') {
      const { data, error } = await supabaseServer.from('coupons').select('*');
      if (error) throw error;
      return NextResponse.json(data);
    }
    
    if (type === 'promotions') {
      const { data, error } = await supabaseServer.from('promotions').select('*');
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data: coupons, error: errC } = await supabaseServer.from('coupons').select('*');
    if (errC) throw errC;
    const { data: promotions, error: errP } = await supabaseServer.from('promotions').select('*');
    if (errP) throw errP;

    return NextResponse.json({ coupons, promotions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.type === 'coupon') {
      const { data, error } = await supabaseServer
        .from('coupons')
        .insert({
          code: body.code,
          discount_type: body.discount_type,
          value: body.value,
          is_active: body.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabaseServer
        .from('promotions')
        .insert({
          name: body.name,
          type: body.promo_type,
          trigger_product_id: body.trigger_product_id || null,
          min_quantity: body.min_quantity || null,
          min_order_amount: body.min_order_amount || null,
          discount_type: body.discount_type,
          value: body.value,
          is_active: body.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
