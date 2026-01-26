import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as 'magiclink' | null;

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
      // Successful auth - redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    }
  }

  // If there's an error, redirect back to login
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}