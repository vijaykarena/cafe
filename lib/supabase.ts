import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables in .env")
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export function getProductImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path === 'pending-upload') return '';
  return supabase.storage.from('product').getPublicUrl(path).data.publicUrl;
}
