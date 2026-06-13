import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireManager } from '@/lib/permissions';
import { uploadProductImage } from '@/lib/storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireManager(request);
    const { id } = await params;

    const { data: product, error: findError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('manager_id', userId)
      .is('deleted_at', null)
      .single();

    if (findError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    const imageUrl = await uploadProductImage(id, file);

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', id)
      .eq('manager_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ image_url: data.image_url });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
