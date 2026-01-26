import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If accessing dashboard without session, redirect to login
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If accessing login with session, redirect to dashboard
  if (req.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};