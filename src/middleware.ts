import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isLoginPath = pathname === '/admin/login';

  // Unauthenticated → bounce to /admin/login (except the login page itself).
  if (!user && !isLoginPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    if (pathname !== '/admin') {
      url.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(url);
  }

  // Already authenticated, visiting /admin/login → forward to /admin.
  if (user && isLoginPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    url.searchParams.delete('next');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run only on /admin and its subpaths. Public pages and APIs are not gated.
  matcher: ['/admin/:path*'],
};
