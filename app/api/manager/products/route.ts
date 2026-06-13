import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireManager } from "@/lib/permissions";
import { validateProductInput } from "@/lib/validations/product";

export async function GET(request: Request) {
  try {
    const { userId } = requireManager(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const isPaginated = !!(pageStr && limitStr);
    const page = parseInt(pageStr || "1", 10);
    const limit = parseInt(limitStr || "10", 10);

    const categoryFilter = searchParams.get("category_id");
    const availabilityFilter = searchParams.get("availability");

    const selectStr = search.trim()
      ? "*, categories!inner(id, name, color)"
      : "*, categories(id, name, color)";

    let query = supabaseAdmin
      .from("products")
      .select(selectStr, { count: "exact" })
      .eq("manager_id", userId)
      .eq("status", "enable");

    if (search.trim())
      query = query.or(
        `name.ilike.%${search.trim()}%,categories.name.ilike.%${search.trim()}%`,
      );

    if (categoryFilter && categoryFilter !== "all")
      query = query.eq("category_id", categoryFilter);

    if (availabilityFilter && availabilityFilter !== "all")
      query = query.eq("is_available", availabilityFilter === "available");

    query = query.order("name");

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

    const validation = validateProductInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 },
      );
    }

    const { data: category, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("id", body.category_id)
      .eq("manager_id", userId)
      .eq("status", "enable")
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { error: "Category not found or does not belong to you" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        manager_id: userId,
        category_id: body.category_id,
        name: body.name.trim(),
        price: body.price,
        tax: body.tax,
        description: body.description || null,
        image_url: body.image_url,
        is_available:
          body.is_available !== undefined ? body.is_available : true,
        status: "enable",
      })
      .select("*, categories(id, name, color)")
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
