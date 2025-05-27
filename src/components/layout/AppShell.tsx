
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
    let authStatus = false;
    try {
      authStatus = !!localStorage.getItem(USER_ROLE_STORAGE_KEY);
    } catch (e) {
      console.error("Error accessing localStorage in AppShell for auth check:", e);
      // authStatus remains false, which is the safe default
    }
    setIsAuthenticated(authStatus);
    setIsAuthLoading(false);
  }, []); // Runs once on mount to check auth status

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
    // This effect depends on the auth state and current path
    // It will re-run if these values change, ensuring redirection if auth state changes
  }, [isAuthLoading, isAuthenticated, pathname, router]);

  if (isAuthLoading) {
    // Show a full-page skeleton or loading indicator while checking auth
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If user is not authenticated AND they are NOT on the login page,
  // they should have been redirected by the useEffect above.
  // Return null or a loader to prevent rendering protected content during redirect.
  if (!isAuthenticated && pathname !== '/login') {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <p>Redirecting to login...</p>
            <Skeleton className="h-12 w-1/2 mb-4 mt-4" />
            <Skeleton className="h-8 w-1/3 mb-2" />
        </div>
    ); // Or simply return null
  }

  // User is authenticated and not on the login page. Render the app shell.
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

  // At this point, the user is either:
  // 1. Not authenticated AND IS on the login page (pathname === '/login').
  // 2. Authenticated AND IS on the login page (login page itself should redirect them away).
  // In both these cases for the login page, we just render the children (the login page content).
  return <>{children}</>;
}
