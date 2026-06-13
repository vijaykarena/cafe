import { supabaseAdmin } from '@/lib/supabase-server';

const BUCKET_NAME = 'product';

export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() || 'webp';
  const filePath = `${productId}/item.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return filePath;
}

export async function deleteProductImage(productId: string): Promise<void> {
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(productId);

  if (listError) {
    throw new Error(`Failed to list product images: ${listError.message}`);
  }

  if (files && files.length > 0) {
    const paths = files.map((f) => `${productId}/${f.name}`);
    const { error: removeError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (removeError) {
      throw new Error(`Failed to delete product images: ${removeError.message}`);
    }
  }
}

export function getProductImageUrl(path: string): string {
  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}
