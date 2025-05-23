
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppName } from "@/lib/navigation";
import { Ship } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Define admin credentials (should ideally be from a secure source in a real app)
const ADMIN_EMAIL = 'admin@dutchoriental.com';
const ADMIN_PASSWORD = 'DutchOriental@123#';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    // --- Simulated Login Logic ---
    setTimeout(() => { // Simulate network delay
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        try {
          localStorage.setItem('currentUserRole', 'admin');
          localStorage.setItem('currentUserEmail', email); // Store email for potential display
          toast({
            title: 'Admin Login Successful',
            description: 'Redirecting to dashboard...',
          });
          router.push('/dashboard');
        } catch (storageError) {
          console.error("Error accessing localStorage:", storageError);
          setError('Login failed. Could not save session.');
          setIsLoading(false);
        }
      } else {
        // For simplicity, any other login is treated as a regular user for now
        // In a real app, you'd validate against a user database
        try {
          localStorage.setItem('currentUserRole', 'user'); 
          localStorage.setItem('currentUserEmail', email);
          toast({
            title: 'Login Successful',
            description: 'Redirecting to dashboard...',
          });
          router.push('/dashboard');
        } catch (storageError) {
            console.error("Error accessing localStorage:", storageError);
            setError('Login failed. Could not save session.');
            setIsLoading(false);
        }
      }
      // setIsLoading(false); // This might be set too early if router.push is slow
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Ship className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">{AppName} Login</CardTitle>
          </div>
          <CardDescription>
            Enter your credentials to access the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
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
