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

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { register, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      toast.error('Validation Error', 'All required fields must be completed.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      toast.warning('Password Weak', 'Password must be 8 or more characters.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await register({
        name,
        email,
        password,
        workspaceName: workspaceName.trim() || undefined,
      });
      toast.success('Workspace Created', 'Welcome to Career Intelligence OS!');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please verify input parameters.';
      setErrorMessage(msg);
      toast.error('Registration Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-[#080a0f] text-slate-100 overflow-hidden">
      {/* 4D Particle Background */}
      <SpatialParticleField density="medium" networkLines={true} interactive={true} />

      {/* Floating Crystal Glass Container */}
      <div className="relative z-10 w-full max-w-md animate-fade-in my-8">
        <Card material="crystal" className="border-white/20 shadow-2xl backdrop-blur-3xl">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/25 via-indigo-500/25 to-purple-500/25 border border-white/20 shadow-glass-crystal">
              <span className="font-bold text-lg text-white">CI</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Initialize Workspace
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Deploy an isolated enterprise recruitment intelligence tenant
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
                label="Full Name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Work Email"
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Master Password (min. 8 characters)"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

              <Input
                label="Workspace / Organization Name (Optional)"
                type="text"
                placeholder="Acme Talent Intelligence"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                helperText="An isolated tenant will automatically be provisioned"
              />
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button type="submit" variant="crystal" className="w-full h-11" isLoading={isLoading}>
                Create Tenant & Launch Workspace
              </Button>
              <p className="text-center text-xs text-slate-400">
                Already registered?{' '}
                <Link href="/login" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
                  Sign in to existing workspace
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
