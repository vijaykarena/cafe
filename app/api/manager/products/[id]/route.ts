import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireManager } from '@/lib/permissions';
import { validateProductInput } from '@/lib/validations/product';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireManager(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(id, name, color)')
      .eq('id', id)
      .eq('manager_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireManager(request);
    const { id } = await params;
    const body = await request.json();

    const validation = validateProductInput(body, false);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    if (body.category_id) {
      const { data: category, error: catError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('id', body.category_id)
        .eq('manager_id', userId)
        .is('deleted_at', null)
        .single();

      if (catError || !category) {
        return NextResponse.json(
          { error: 'Category not found or does not belong to you' },
          { status: 400 }
        );
      }
    }

    const updatePayload: Record<string, any> = {};
    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.category_id !== undefined) updatePayload.category_id = body.category_id;
    if (body.price !== undefined) updatePayload.price = body.price;
    if (body.tax !== undefined) updatePayload.tax = body.tax;
    if (body.unit_of_measure !== undefined) updatePayload.unit_of_measure = body.unit_of_measure;
    if (body.description !== undefined) updatePayload.description = body.description || null;
    if (body.image_url !== undefined) updatePayload.image_url = body.image_url;
    if (body.is_available !== undefined) updatePayload.is_available = body.is_available;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .eq('manager_id', userId)
      .is('deleted_at', null)
      .select('*, categories(id, name, color)')
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireManager(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('manager_id', userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
