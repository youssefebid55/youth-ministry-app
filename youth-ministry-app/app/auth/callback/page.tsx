'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Getting session...');
        
        // Wait for Supabase to process hash tokens
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session:', session);
        console.log('Error:', error);
        
        // Show session info on screen for debugging
        setSessionInfo({
          hasSession: !!session,
          email: session?.user?.email || 'No email',
          error: error?.message || 'No error'
        });
        
        if (session) {
          setStatus('✅ Session found! Redirecting in 5 seconds...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 5000); // 5 second delay so you can see it
        } else {
          setStatus('❌ No session found. Redirecting to login in 5 seconds...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 5000);
        }
      } catch (err) {
        console.error('Error:', err);
        setStatus('❌ Error occurred. Redirecting to login in 5 seconds...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 5000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <p className="text-xl mb-4">{status}</p>
        {sessionInfo && (
          <div className="bg-white p-4 rounded-lg shadow text-left mt-4">
            <p><strong>Has Session:</strong> {sessionInfo.hasSession ? 'YES' : 'NO'}</p>
            <p><strong>Email:</strong> {sessionInfo.email}</p>
            <p><strong>Error:</strong> {sessionInfo.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}