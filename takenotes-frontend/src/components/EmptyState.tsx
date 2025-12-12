'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/src/contexts/AuthContext';

export function EmptyState() {
  const { user } = useAuth();
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <Image src="/icons/coffee.png" alt="Coffee" width={220} height={220} />
      <div className="mt-5 max-w-md text-base sm:text-lg" style={{ color: '#88642A' }}>
        I’m just here waiting for your charming notes...
      </div>
    </div>
  );
}

