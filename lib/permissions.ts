import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export function getAuthUser(request: Request) {
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role');

  if (!userId || !role) {
    throw NextResponse.json(
      { error: 'Unauthorized: Missing authentication headers' },
      { status: 401 }
    );
  }

  return { userId, role };
}

export function requireManager(request: Request) {
  const { userId, role } = getAuthUser(request);

  if (role !== 'manager') {
    throw NextResponse.json(
      { error: 'Forbidden: Only managers can perform this action' },
      { status: 403 }
    );
  }

  return { userId, role };
}

export async function getManagerId(request: Request): Promise<string> {
  const { userId, role } = getAuthUser(request);

  if (role === 'manager') {
    return userId;
  }

  if (role === 'cashier' || role === 'waiter') {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('manager_id')
      .eq('id', userId)
      .single();

    if (error || !profile?.manager_id) {
      throw NextResponse.json(
        { error: 'Could not resolve manager scope for this user' },
        { status: 403 }
      );
    }

    return profile.manager_id;
  }

  throw NextResponse.json(
    { error: 'Forbidden: Role does not have access to this resource' },
    { status: 403 }
  );
}
