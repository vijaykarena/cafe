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
      query = query
        .eq('manager_id', userId)
        .in('role', ['cook', 'cashier', 'waiter']);
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
    const { supabaseAdmin } = await import('@/lib/supabase-server');
    const { data, error } = await supabaseAdmin
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
    
    // Build update object dynamically to avoid overriding with undefined
    const updateData: any = {};
    if (body.is_archived !== undefined) updateData.is_archived = body.is_archived;
    if (body.is_banned !== undefined) updateData.is_banned = body.is_banned;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.role !== undefined) updateData.role = body.role;

    const { supabaseAdmin } = await import('@/lib/supabase-server');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    // If is_banned was provided, update Supabase Auth
    if (body.is_banned !== undefined) {
      import('@/lib/supabase-server').then(async ({ supabaseAdmin }) => {
        await supabaseAdmin.auth.admin.updateUserById(body.id, {
          ban_duration: body.is_banned ? '876000h' : 'none'
        });
      });
    }

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

    // We no longer hard delete users, we only ban them.
    const { supabaseAdmin } = await import('@/lib/supabase-server');
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', id);

    if (error) throw error;

    // Ban in Supabase auth
    import('@/lib/supabase-server').then(async ({ supabaseAdmin }) => {
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    });

    return NextResponse.json({ success: true, banned: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
