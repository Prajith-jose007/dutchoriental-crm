
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface AppShellProps {
  children: ReactNode;
}

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // This effect runs once on component mount to determine initial auth state
    let authStatus = false;
    try {
      authStatus = !!localStorage.getItem(USER_ROLE_STORAGE_KEY);
    } catch (e) {
      console.error("Error accessing localStorage in AppShell for auth check:", e);
      // authStatus remains false, which is the safe default
    }
    setIsAuthenticated(authStatus);
    setIsAuthLoading(false); // Auth check complete
  }, []);

  useEffect(() => {
    // This effect handles redirection based on auth state and current path
    if (isAuthLoading) {
      return; // Don't do anything until the initial auth check is complete
    }

    if (isAuthenticated) {
      if (pathname === '/login') {
        // If authenticated and on login page, redirect to dashboard
        router.replace('/dashboard');
      }
      // If authenticated and not on login, allow rendering (handled below)
    } else {
      // Not authenticated
      if (pathname !== '/login') {
        // If not authenticated and not on login page, redirect to login
        router.replace('/login');
      }
      // If not authenticated and on login page, allow rendering (handled below)
    }
  }, [isAuthLoading, isAuthenticated, pathname, router]);

  if (isAuthLoading) {
    // Show a full-page skeleton or loading indicator while checking auth
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Skeleton className="h-16 w-48 mb-6" /> {/* Logo placeholder */}
        <Skeleton className="h-8 w-1/3 mb-4" /> {/* Title placeholder */}
        <div className="w-full max-w-4xl space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    // User is not authenticated and is trying to access a protected page.
    // The useEffect above should have initiated a redirect.
    // Render a minimal loading state or null to prevent flashing protected content.
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
    );
  }

  if (isAuthenticated && pathname === '/login') {
    // User is authenticated but somehow on the login page.
    // The useEffect above should have initiated a redirect.
    // Render a minimal loading state or null.
     return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
    );
  }

  // Render the shell for authenticated users on protected pages
  if (isAuthenticated && pathname !== '/login') {
    return (
      <SidebarProvider defaultOpen={true}>
        <SidebarNav />
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Render children directly if it's the login page and user is not (yet) authenticated
  // or if it's a page that doesn't require the AppShell (though currently all non-login pages do)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Fallback, should ideally not be reached if logic is correct
  return null;
}
