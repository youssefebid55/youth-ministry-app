'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase automatically handles the hash tokens
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        // Session established, go to dashboard
        router.push('/dashboard');
      } else {
        // No session, go back to login
        router.push('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p>Completing sign in...</p>
    </div>
  );
}