import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('payment_methods')
      .select('*')
      .order('name');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    let result;
    if (body.id) {
      // Toggle enabled status
      const { data, error } = await supabaseServer
        .from('payment_methods')
        .update({ is_enabled: body.is_enabled })
        .eq('id', body.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else if (body.name === 'upi') {
      // Update UPI ID
      const { data, error } = await supabaseServer
        .from('payment_methods')
        .update({ upi_id: body.upi_id })
        .eq('name', 'upi')
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      throw new Error('Invalid update payload');
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
