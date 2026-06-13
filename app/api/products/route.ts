// TODO: DEPRECATED — Use /api/manager/products instead. This route lacks manager_id scoping.

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*')
      .order('name');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseServer
      .from('products')
      .insert({
        name: body.name,
        category_id: body.category_id || null,
        price: body.price,
        unit_of_measure: body.unit_of_measure,
        tax: body.tax,
        description: body.description || null,
        image_url: body.image_url || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
