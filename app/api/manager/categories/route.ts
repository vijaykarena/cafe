import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireManager } from '@/lib/permissions';
import { validateCategoryInput } from '@/lib/validations/category';

export async function GET(request: Request) {
  try {
    const { userId } = requireManager(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const isPaginated = !!(pageStr && limitStr);
    const page = parseInt(pageStr || '1', 10);
    const limit = parseInt(limitStr || '10', 10);

    let query = supabaseAdmin
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('manager_id', userId)
      .eq('status', 'enable');

    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    query = query.order('name');

    if (isPaginated) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return NextResponse.json({ data, total: count || 0 });
    } else {
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json(data);
    }
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
        status: 'enable',
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
