import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Update session and retrieve current user
  const { supabaseResponse, user, profile } = await updateSession(request);

  // 2. Exclude public auth pages, signup, login, and assets from RBAC redirects
  if (
    path.startsWith("/api/auth") ||
    path === "/signup" ||
    path === "/login" ||
    path.includes(".")
  ) {
    return supabaseResponse;
  }

  // 3. Redirect or block if no user session is active
  if (!user) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing session token" },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Extract role and status from DB profile, fallback to user metadata
  const role = profile?.role || user.user_metadata?.role || "cashier";
  const isArchived = profile?.is_archived === true || user.user_metadata?.is_archived === true;

  if (isArchived) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden: Account archived/suspended" },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Set request headers to forward user info to API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-user-role", role);

  // Construct response carrying updated request headers
  const finalResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Copy updated cookies from Supabase SSR response to the final response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
    });
  });

  // 5. RBAC Rules Enforcement

  // --- API Routes Access Control ---
  if (path.startsWith("/api/")) {
    // Admin gets full access
    if (role === "admin") return finalResponse;

    // Manager gets full access to configs and terminal operations
    if (role === "manager") {
      return finalResponse;
    }

    // Cashier constraints
    if (role === "cashier") {
      const allowedPaths = [
        "/api/sessions",
        "/api/orders",
        "/api/categories",
        "/api/products",
        "/api/tables",
        "/api/customers",
        "/api/promotions",
        "/api/settings",
      ];
      if (!allowedPaths.some((p) => path.startsWith(p))) {
        return NextResponse.json(
          { error: "Forbidden: Cashiers do not have access to this resource" },
          { status: 403 },
        );
      }
      // Read-Only for configuration endpoints (POST/PUT/DELETE are restricted)
      const isWrite = ["POST", "PUT", "DELETE"].includes(request.method);
      if (
        isWrite &&
        (path.startsWith("/api/products") ||
          path.startsWith("/api/categories") ||
          path.startsWith("/api/tables") ||
          path.startsWith("/api/settings"))
      ) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Cashiers are restricted from modifying catalog properties",
          },
          { status: 403 },
        );
      }
      return finalResponse;
    }

    // Waiter constraints
    if (role === "waiter") {
      const allowedPaths = [
        "/api/orders",
        "/api/categories",
        "/api/products",
        "/api/tables",
        "/api/customers",
      ];
      if (!allowedPaths.some((p) => path.startsWith(p))) {
        return NextResponse.json(
          { error: "Forbidden: Waiters do not have access to this resource" },
          { status: 403 },
        );
      }
      const isWrite = ["POST", "PUT", "DELETE"].includes(request.method);
      // Waiters can only POST/write orders
      if (isWrite && !path.startsWith("/api/orders")) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Waiters are restricted from modifying catalog properties",
          },
          { status: 403 },
        );
      }
      return finalResponse;
    }

    // Cook constraints
    if (role === "cook") {
      if (!path.startsWith("/api/kds")) {
        return NextResponse.json(
          { error: "Forbidden: Cooks are restricted to KDS operations only" },
          { status: 403 },
        );
      }
      return finalResponse;
    }

    return NextResponse.json(
      { error: "Forbidden: Role unrecognized" },
      { status: 403 },
    );
  }

  // --- Frontend Pages Access Control ---
  if (path.startsWith("/pos")) {
    return NextResponse.redirect(new URL("/cashier", request.url));
  }

  if (path.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/manager")) {
    if (role !== "admin" && role !== "manager") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/cashier")) {
    if (role !== "admin" && role !== "manager" && role !== "cashier") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/waiter")) {
    if (role !== "admin" && role !== "manager" && role !== "waiter") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path.startsWith("/kds")) {
    if (role !== "admin" && role !== "manager" && role !== "cook") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return finalResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
