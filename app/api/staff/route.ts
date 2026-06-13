import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    let query = supabaseServer
      .from('profiles')
      .select('*')
      .order('name');

    if (userRole === 'manager' && userId) {
      query = query.eq('manager_id', userId);
    }

    const { data, error } = await query;
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
      .from('profiles')
      .insert({
        id: body.id || crypto.randomUUID(),
        name: body.name,
        email: body.email,
        role: body.role || 'cashier',
        is_archived: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseServer
      .from('profiles')
      .update({
        is_archived: body.is_archived,
        name: body.name,
        role: body.role,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('Missing ID parameter');

    const { error } = await supabaseServer
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
