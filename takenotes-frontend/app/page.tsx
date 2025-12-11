'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/src/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/sign-in');
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Image src="/icons/coffee.png" alt="Loading" width={240} height={240} className="animate-pulse" />
    </div>
  );
}
