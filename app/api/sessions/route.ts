import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Check for open sessions
    const { data: openSessions, error: openErr } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false });

    if (openErr) throw openErr;

    if (openSessions && openSessions.length > 0) {
      return NextResponse.json({ active: true, session: openSessions[0] });
    }

    // Check for last closed session
    const { data: closedSessions, error: closedErr } = await supabaseServer
      .from('sessions')
      .select('*')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(1);

    if (closedErr) throw closedErr;

    return NextResponse.json({
      active: false,
      session: null,
      lastSession: closedSessions && closedSessions.length > 0 ? closedSessions[0] : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseServer
      .from('sessions')
      .insert({
        opened_by: body.opened_by,
        opening_balance: body.opening_balance,
        status: 'open',
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
      .from('sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closing_balance: body.closing_balance,
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
