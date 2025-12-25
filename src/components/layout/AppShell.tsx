
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { ProgressBar } from '@/components/ui/progress-bar';
import { Suspense } from 'react';

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
      // authStatus remains false, which is a safe default (prompts login)
    }

    setIsAuthenticated(authStatus); // Set auth state based on localStorage

    if (authStatus) { // User is authenticated
      if (pathname === '/login') {
        // Authenticated but on login page, redirect.
        // isAuthLoading remains true until the redirect effectively changes the pathname,
        // causing this effect to re-run for the new path.
        router.replace('/dashboard');
      } else {
        // Authenticated and on a protected page. Stop loading.
        setIsAuthLoading(false);
      }
    } else { // User is NOT authenticated
      if (pathname !== '/login') {
        // Not authenticated and on a protected page, redirect.
        // isAuthLoading remains true until redirect.
        router.replace('/login');
      } else {
        // Not authenticated and on login page. Stop loading.
        setIsAuthLoading(false);
      }
    }
  }, [pathname, router]);

  if (isAuthLoading) {
    // Show a full-page skeleton or loading indicator while checking auth
    // or while a redirect is pending.
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

  // At this point, isAuthLoading is false.
  // The correct page content (or login page) should be rendered.

  return (
    <>
      <Suspense fallback={null}>
        <ProgressBar />
      </Suspense>
      {isAuthenticated && pathname !== '/login' ? (
        <SidebarProvider defaultOpen={true}>
          <SidebarNav />
          <SidebarInset className="flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      ) : pathname === '/login' ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
    </>
  );
}
