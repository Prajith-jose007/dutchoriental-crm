
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppName } from "@/lib/navigation";
import { Logo } from "@/components/icons/Logo"; // Import Logo
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/types";

const ADMIN_EMAIL = 'admin@dutchoriental.com';
const ADMIN_PASSWORD = 'Dutch@123#';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';
const USER_EMAIL_STORAGE_KEY = 'currentUserEmail';
const USER_ID_STORAGE_KEY = 'currentUserId';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isAuthenticated = false;
    try {
      isAuthenticated = !!localStorage.getItem(USER_ROLE_STORAGE_KEY);
    } catch (e) {
      console.error("Error accessing localStorage in login page:", e);
    }

    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      setIsCheckingAuth(false);
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
      let role = 'user';
      let loggedInUserId: string | null = null;

      // Fetch all users to find the ID and verify role more dynamically if needed
      // For this specific implementation, we hardcode admin check and find ID for any user
      const usersResponse = await fetch('/api/users');
      if (!usersResponse.ok) {
        console.error("Failed to fetch users during login", usersResponse.statusText);
        setError('Login failed. Could not verify user details.');
        setIsLoading(false);
        return;
      }
      const allUsers: User[] = await usersResponse.json();
      const matchedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (matchedUser) {
        loggedInUserId = matchedUser.id;
        // Check for admin credentials specifically
        if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
          role = 'admin';
        } else if (password === matchedUser.password) { // Simplified password check
          // This is just a placeholder for real password verification
          // In a real app, compare hashed passwords
          role = matchedUser.designation === 'System Administrator' || matchedUser.designation === 'Admin' ? 'admin' : 'user';
        }
         else {
          setError('Invalid email or password.');
          setIsLoading(false);
          return;
        }
      } else {
        setError('Invalid email or password.');
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem(USER_ROLE_STORAGE_KEY, role);
      localStorage.setItem(USER_EMAIL_STORAGE_KEY, email);
      if (loggedInUserId) {
        localStorage.setItem(USER_ID_STORAGE_KEY, loggedInUserId);
      } else {
        // Should not happen if matchedUser is found, but as a fallback:
        localStorage.removeItem(USER_ID_STORAGE_KEY);
      }

      toast({
        title: `${role.charAt(0).toUpperCase() + role.slice(1)} Login Successful`,
        description: 'Redirecting to dashboard...',
      });
      router.push('/dashboard');

    } catch (storageError) {
      console.error("Error accessing localStorage or fetching users during login:", storageError);
      setError('Login failed. An unexpected error occurred.');
      toast({
        title: 'Login Error',
        description: 'Failed to complete login process.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
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
            Enter your credentials to access the aqualeads CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@dutchoriental.com"
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
          <p>&copy; {new Date().getFullYear()} aqualeads CRM. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
