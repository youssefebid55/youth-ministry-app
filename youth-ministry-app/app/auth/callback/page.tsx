'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('Getting session...');
        
        // Wait a moment for Supabase to process the hash tokens
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Callback - Session:', session);
        console.log('Callback - Error:', error);
        
        if (session) {
          setStatus('Session found! Redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        } else {
          setStatus('No session found. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('Error occurred. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-lg">{status}</p>
      </div>
    </div>
  );
}