import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireManager } from '@/lib/permissions';
import { validateCategoryInput } from '@/lib/validations/category';

export async function GET(request: Request) {
  try {
    const { userId } = requireManager(request);

    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
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

    const validation = validateCategoryInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        manager_id: userId,
        name: body.name.trim(),
        color: body.color,
      })
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

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
