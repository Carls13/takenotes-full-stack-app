'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button, PasswordInput, TextInput } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';

export default function SignUpPage() {
  const { signUp, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signUp(email, password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <Image src="/icons/cat.png" alt="Cat" width={120} height={120} />
          </div>
          <h1 className="text-4xl" style={{ fontFamily: 'var(--font-inria-serif)', color: '#88642A' }}>Yay, New Friend!</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <TextInput
              type="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              unstyled
              className="w-full bg-transparent text-black border-2 border-[#88642A] rounded-[2px] px-3 py-2 text-sm outline-none focus:border-[#88642A] placeholder:text-black"
            />
          </div>

          <div>
            <PasswordInput
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              unstyled
              inputClassName="w-full bg-transparent text-black border-2 border-[#88642A] rounded-[2px] px-3 py-2 pr-10 text-sm outline-none focus:border-[#88642A] placeholder:text-black"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            unstyled
            className="w-full rounded-[46px] border-2 border-[#88642A] bg-transparent text-[#88642A] px-4 py-2 text-sm hover:bg-[#F3E6D4]"
            disabled={submitting || loading}
          >
            {submitting ? 'Creating account…' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link className="font-medium underline" href="/sign-in" style={{ color: '#88642A' }}>
            We’re already friends!
          </Link>
        </div>
      </div>
    </div>
  );
}
