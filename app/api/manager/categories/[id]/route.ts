import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireManager } from '@/lib/permissions';
import { validateCategoryInput } from '@/lib/validations/category';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireManager(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('manager_id', userId)
      .eq('status', 'enable')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
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

    const validation = validateCategoryInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({
        name: body.name.trim(),
        color: body.color,
      })
      .eq('id', id)
      .eq('manager_id', userId)
      .eq('status', 'enable')
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
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

    const { data: products, error: checkError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('category_id', id)
      .eq('manager_id', userId)
      .eq('status', 'enable')
      .limit(1);

    if (checkError) throw checkError;

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category: it still has active products. Remove or reassign them first.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ status: 'disable' })
      .eq('id', id)
      .eq('manager_id', userId)
      .eq('status', 'enable')
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
