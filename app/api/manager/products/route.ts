import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireManager } from '@/lib/permissions';
import { validateProductInput } from '@/lib/validations/product';

export async function GET(request: Request) {
  try {
    const { userId } = requireManager(request);

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, color)')
      .eq('manager_id', userId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = requireManager(request);
    const body = await request.json();

    const validation = validateProductInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', body.category_id)
      .eq('manager_id', userId)
      .is('deleted_at', null)
      .single();

    if (catError || !category) {
      return NextResponse.json({ error: 'Category not found or does not belong to you' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        manager_id: userId,
        category_id: body.category_id,
        name: body.name.trim(),
        price: body.price,
        tax: body.tax,
        unit_of_measure: body.unit_of_measure,
        description: body.description || null,
        image_url: body.image_url,
        is_available: body.is_available !== undefined ? body.is_available : true,
      })
      .select('*, categories(id, name, color)')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
