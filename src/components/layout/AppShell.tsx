
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
      // Fallback: assume not authenticated if localStorage is inaccessible
    }
    setIsAuthenticated(authStatus);
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, pathname, router]);

  if (isAuthLoading) {
    // Show a full-page skeleton or loading indicator while checking auth
    // This prevents a flash of content for pages that might get redirected
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If on login page or authenticated, render the shell and children
  // Note: The login page itself should not use AppShell to avoid redirect loops if AppShell redirects.
  // This assumes that AppShell is *not* part of the layout for /login.
  // If it is, the check `pathname !== '/login'` handles it.

  if (!isAuthenticated && pathname !== '/login') {
    // This case should ideally be caught by the loading state or redirect,
    // but as a fallback, render nothing or a minimal loader to avoid showing AppShell UI.
    return null; 
  }
  
  // If authenticated, or if it's the login page (which shouldn't use AppShell), render children.
  // For authenticated routes, render the full AppShell.
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

  // For non-authenticated access to pages not /login (should be redirected)
  // or for the login page itself if it somehow gets wrapped by AppShell (it shouldn't).
  // This primarily handles the case where children is the login page.
  return <>{children}</>;
}
