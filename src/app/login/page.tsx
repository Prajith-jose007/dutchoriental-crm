
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

const ADMIN_EMAIL = 'admin@dutchoriental.com';
const ADMIN_PASSWORD = 'Dutch@123#';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';
const USER_EMAIL_STORAGE_KEY = 'currentUserEmail';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Start true to check auth

  useEffect(() => {
    // This effect checks if the user is already authenticated
    // If so, it redirects them away from the login page.
    let isAuthenticated = false;
    try {
      isAuthenticated = !!localStorage.getItem(USER_ROLE_STORAGE_KEY);
    } catch (e) {
      console.error("Error accessing localStorage in login page:", e);
    }

    if (isAuthenticated) {
      router.replace('/dashboard');
      // No need to setIsCheckingAuth(false) here, as the redirect will unmount this component.
    } else {
      setIsCheckingAuth(false); // Auth check done, user is not authenticated.
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      try {
        if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
          localStorage.setItem(USER_ROLE_STORAGE_KEY, 'admin');
          localStorage.setItem(USER_EMAIL_STORAGE_KEY, email);
          toast({
            title: 'Admin Login Successful',
            description: 'Redirecting to dashboard...',
          });
          router.push('/dashboard'); // Use push for history
        } else {
          // For any other valid credentials (simulated for now)
          // In a real app, you'd verify against a database
          // For simplicity here, any other login is treated as a standard user
          localStorage.setItem(USER_ROLE_STORAGE_KEY, 'user');
          localStorage.setItem(USER_EMAIL_STORAGE_KEY, email);
          toast({
            title: 'Login Successful',
            description: 'Redirecting to dashboard...',
          });
          router.push('/dashboard'); // Use push for history
        }
      } catch (storageError) {
        console.error("Error accessing localStorage during login:", storageError);
        setError('Login failed. Could not save session.');
        toast({
          title: 'Login Error',
          description: 'Failed to save session information.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  if (isCheckingAuth) {
    // Render a skeleton or loading state while checking auth
    // This prevents the login form from flashing if the user is already logged in
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center items-center mb-4">
                         <Skeleton className="h-12 w-36" /> {/* Placeholder for Logo */}
                    </div>
                    <Skeleton className="h-6 w-24 mx-auto mb-2" /> {/* Placeholder for "Login" title */}
                    <Skeleton className="h-4 w-3/4 mx-auto" /> {/* Placeholder for description */}
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

  // If not checking auth (i.e., user is confirmed not logged in), render login form
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Logo hideDefaultText={true} className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl">Member Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the DutchOriental CRM.
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
          <p>&copy; {new Date().getFullYear()} DutchOriental CRM. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
