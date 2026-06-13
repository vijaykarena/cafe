import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");

    const isPaginated = !!(pageStr && limitStr);
    const page = parseInt(pageStr || "1", 10);
    const limit = parseInt(limitStr || "10", 10);

    let query = supabaseServer.from("profiles").select("*", { count: "exact" });

    if (userRole === "manager" && userId) {
      query = query
        .eq("manager_id", userId)
        .in("role", ["cook", "cashier", "waiter"]);
    }

    if (search.trim()) {
      const trimmed = search.trim();
      query = query.or(
        `name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,role.ilike.%${trimmed}%`,
      );
    }

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const creatorToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : "";
    if (!creatorToken) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token." },
        { status: 401 },
      );
    }

    const { supabaseServer, supabaseAdmin } =
      await import("@/lib/supabase-server");

    // 1. Verify the creator's identity and role using their token
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(creatorToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token." },
        { status: 401 },
      );
    }

    // Fetch creator's role from profiles using admin client to guarantee access
    const { data: creatorProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !creatorProfile) {
      return NextResponse.json(
        { error: "Unauthorized: Could not verify user role." },
        { status: 403 },
      );
    }

    const creatorRole = creatorProfile.role;
    const body = await request.json();
    const targetRole = body.role;
    const name = body.name;
    const email = body.email;
    const password = body.password;
    let manager_id = body.manager_id || null;

    if (!email || !password || !name || !targetRole) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    // 2. Enforce Role Hierarchy and Manager ID logic
    if (creatorRole === "admin") {
      const allowedRoles = ["manager", "cook", "cashier", "waiter"];
      if (!allowedRoles.includes(targetRole)) {
        return NextResponse.json(
          { error: `Admin cannot create role: ${targetRole}` },
          { status: 400 },
        );
      }

      // If admin creates an employee, they MUST assign a manager.
      if (["cook", "cashier", "waiter"].includes(targetRole)) {
        if (!manager_id) {
          return NextResponse.json(
            { error: "You must select a Manager for this employee." },
            { status: 400 },
          );
        }
      } else if (targetRole === "manager") {
        manager_id = null; // Managers do not have a manager
      }
    } else if (creatorRole === "manager") {
      const allowedRoles = ["cook", "cashier", "waiter"];
      if (!allowedRoles.includes(targetRole)) {
        return NextResponse.json(
          { error: `Manager cannot create role: ${targetRole}` },
          { status: 400 },
        );
      }
      // Manager implicitly sets themselves as the manager
      manager_id = user.id;
    } else {
      return NextResponse.json(
        { error: "You do not have permission to create users." },
        { status: 403 },
      );
    }

    // 3. Create the user using Supabase Admin API
    const { data: authData, error } = await supabaseAdmin.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: targetRole,
          ...(manager_id ? { manager_id } : {}),
        },
      },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${targetRole}!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Build update object dynamically to avoid overriding with undefined
    const updateData: any = {};
    if (body.is_archived !== undefined)
      updateData.is_archived = body.is_archived;
    if (body.is_banned !== undefined) updateData.is_banned = body.is_banned;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.role !== undefined) updateData.role = body.role;

    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;

    // If is_banned was provided, update Supabase Auth
    if (body.is_banned !== undefined) {
      import("@/lib/supabase-server").then(async ({ supabaseAdmin }) => {
        await supabaseAdmin.auth.admin.updateUserById(body.id, {
          ban_duration: body.is_banned ? "876000h" : "none",
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
    const id = searchParams.get("id");
    if (!id) throw new Error("Missing ID parameter");

    // We no longer hard delete users, we only ban them.
    const { supabaseAdmin } = await import("@/lib/supabase-server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_banned: true })
      .eq("id", id);

    if (error) throw error;

    // Ban in Supabase auth
    import("@/lib/supabase-server").then(async ({ supabaseAdmin }) => {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: "876000h",
      });
    });

    return NextResponse.json({ success: true, banned: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
