import { NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'floors') {
      const { data, error } = await supabaseServer.from('floors').select('*').order('name');
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (type === 'tables') {
      const { data, error } = await supabaseServer.from('tables').select('*').order('table_number');
      if (error) throw error;
      return NextResponse.json(data);
    }

    // Default: return both
    const { data: floors, error: errF } = await supabaseServer.from('floors').select('*').order('name');
    if (errF) throw errF;
    const { data: tables, error: errT } = await supabaseServer.from('tables').select('*').order('table_number');
    if (errT) throw errT;

    return NextResponse.json({ floors, tables });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.type === 'floor') {
      const { data, error } = await supabaseAdmin
        .from('floors')
        .insert({ name: body.name, status: body.status || 'enable' })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabaseAdmin
        .from('tables')
        .insert({
          floor_id: body.floor_id,
          table_number: body.table_number,
          seats: body.seats,
          is_active: body.is_active ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    if (body.type === 'floor') {
      const { data, error } = await supabaseAdmin
        .from('floors')
        .update({ name: body.name, status: body.status })
        .eq('id', body.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Future table updates
      return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
