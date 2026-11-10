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
} from '@career-intelligence/ui';
import { useAuth } from '../../../lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
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
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please verify input parameters.';
      setErrorMessage(msg);
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
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
