"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/login?mode=signup');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]">
      <div className="animate-pulse text-indigo-600 font-medium">Redirecting to signup...</div>
    </div>
  );
}
