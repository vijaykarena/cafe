import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Exclude auth API endpoints, login, signup, and static assets
  if (
    path.startsWith('/api/auth') || 
    path === '/login' || 
    path === '/signup' || 
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Extract Access Token (Cookie or Authorization Header)
  let token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    token = request.cookies.get('sb-access-token')?.value;
  }

  // 2. Redirect or block if no token found
  if (!token) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Initialize Supabase client (Edge compatible config)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // 4. Verify user token
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Extract role and status from JWT user metadata (bypasses DB select query for performance)
  const role = user.user_metadata?.role || 'cashier';
  const isArchived = user.user_metadata?.is_archived === true;

  if (isArchived) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden: Account archived/suspended' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 6. RBAC Rules Enforcement

  // --- API Routes Access Control ---
  if (path.startsWith('/api/')) {
    // Admin gets full access
    if (role === 'admin') return NextResponse.next();

    // Manager gets full access to configs and terminal operations
    if (role === 'manager') {
      // Block manager from creating admins or managers in staff CRUD (handled in Route handler or proxy)
      return NextResponse.next();
    }

    // Cashier constraints
    if (role === 'cashier') {
      const allowedPaths = ['/api/sessions', '/api/orders', '/api/categories', '/api/products', '/api/tables', '/api/customers', '/api/promotions', '/api/settings'];
      if (!allowedPaths.some(p => path.startsWith(p))) {
        return NextResponse.json({ error: 'Forbidden: Cashiers do not have access to this resource' }, { status: 403 });
      }
      // Read-Only for configuration endpoints (POST/PUT/DELETE are restricted)
      const isWrite = ['POST', 'PUT', 'DELETE'].includes(request.method);
      if (isWrite && (path.startsWith('/api/products') || path.startsWith('/api/categories') || path.startsWith('/api/tables') || path.startsWith('/api/settings'))) {
        return NextResponse.json({ error: 'Forbidden: Cashiers are restricted from modifying catalog properties' }, { status: 403 });
      }
      return NextResponse.next();
    }

    // Waiter constraints
    if (role === 'waiter') {
      const allowedPaths = ['/api/orders', '/api/categories', '/api/products', '/api/tables', '/api/customers'];
      if (!allowedPaths.some(p => path.startsWith(p))) {
        return NextResponse.json({ error: 'Forbidden: Waiters do not have access to this resource' }, { status: 403 });
      }
      const isWrite = ['POST', 'PUT', 'DELETE'].includes(request.method);
      // Waiters can only POST/write orders
      if (isWrite && !path.startsWith('/api/orders')) {
        return NextResponse.json({ error: 'Forbidden: Waiters are restricted from modifying catalog properties' }, { status: 403 });
      }
      return NextResponse.next();
    }

    // Cook constraints
    if (role === 'cook') {
      if (!path.startsWith('/api/kds')) {
        return NextResponse.json({ error: 'Forbidden: Cooks are restricted to KDS operations only' }, { status: 403 });
      }
      return NextResponse.next();
    }

    return NextResponse.json({ error: 'Forbidden: Role unrecognized' }, { status: 403 });
  }

  // --- Frontend Pages Access Control ---
  if (path.startsWith('/pos')) {
    return NextResponse.redirect(new URL('/cashier', request.url));
  }

  if (path.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (path.startsWith('/manager')) {
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (path.startsWith('/cashier')) {
    if (role !== 'admin' && role !== 'manager' && role !== 'cashier') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (path.startsWith('/waiter')) {
    if (role !== 'admin' && role !== 'manager' && role !== 'waiter') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (path.startsWith('/kds')) {
    if (role !== 'admin' && role !== 'manager' && role !== 'cook') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Set request headers to forward user info to API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/manager/:path*', '/pos/:path*', '/cashier/:path*', '/waiter/:path*', '/kds/:path*'],
};

