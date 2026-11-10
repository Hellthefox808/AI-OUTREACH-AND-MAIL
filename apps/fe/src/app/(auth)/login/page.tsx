'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  SpatialParticleField,
  useToast,
} from '@career-intelligence/ui';
import { useAuth } from '../../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      toast.error('Validation Error', 'Email and password are required.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await login({ email, password });
      toast.success('Authenticated', 'Access granted. Initializing workspace...');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your workspace identity.';
      setErrorMessage(msg);
      toast.error('Authentication Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-[#080a0f] text-slate-100 overflow-hidden">
      {/* 4D Particle Background */}
      <SpatialParticleField density="medium" networkLines={true} interactive={true} />

      {/* Floating Crystal Glass Authentication Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Card material="crystal" className="border-white/20 shadow-2xl backdrop-blur-3xl">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/25 via-indigo-500/25 to-purple-500/25 border border-white/20 shadow-glass-crystal">
              <span className="font-bold text-lg text-white">CI</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Career Intelligence OS
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Enter your spatial recruitment & candidate intelligence workspace
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="rounded-xl bg-rose-500/10 p-3.5 text-xs text-rose-300 border border-rose-500/25 animate-in fade-in-0">
                  {errorMessage}
                </div>
              )}

              <Input
                label="Work Email"
                type="email"
                autoComplete="email"
                placeholder="operator@workspace.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />

              <Input
                label="Security Key / Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                }
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                }
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" variant="crystal" className="w-full h-11" isLoading={isLoading}>
                Authenticate & Enter Workspace
              </Button>
              <p className="text-center text-xs text-slate-400">
                Need to initialize a workspace?{' '}
                <Link href="/register" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                  Create new tenant
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
