
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/Logo"; // Import Logo
import { AppName } from "@/lib/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const USER_ROLE_STORAGE_KEY = 'currentUserRole';
const USER_EMAIL_STORAGE_KEY = 'currentUserEmail';
const USER_NAME_STORAGE_KEY = 'currentUserName';
const USER_ID_STORAGE_KEY = 'currentUserId';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    let isAuthenticated = false;
    try {
      isAuthenticated = !!localStorage.getItem(USER_ROLE_STORAGE_KEY);
    } catch (e) {
      console.error("Error accessing localStorage in login page:", e);
    }

    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    // Simulate API call for credential check
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed.');
        setIsLoading(false);
        return;
      }

      const { id, role, name } = data;

      localStorage.setItem(USER_ROLE_STORAGE_KEY, role);
      localStorage.setItem(USER_EMAIL_STORAGE_KEY, email);
      localStorage.setItem(USER_ID_STORAGE_KEY, id);
      localStorage.setItem(USER_NAME_STORAGE_KEY, name || '');

      toast({
        title: `Login Successful`,
        description: `Welcome back, ${name || 'User'}! Redirecting...`,
      });

      // Keep isLoading(true) to show the redirecting state
      router.push('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center items-center mb-4">
              <Skeleton className="h-12 w-36" />
            </div>
            <Skeleton className="h-6 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter className="flex flex-col items-center text-xs text-muted-foreground">
            <Skeleton className="h-4 w-1/2" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Logo hideDefaultText={true} className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl">Member Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the {AppName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@desertroseyacht.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {AppName}. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
