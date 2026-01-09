
'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
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
const USER_EMAIL_STORAGE_KEY = 'currentUserEmail';
const USER_NAME_STORAGE_KEY = 'currentUserName';
const USER_ID_STORAGE_KEY = 'currentUserId';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
      localStorage.removeItem(USER_NAME_STORAGE_KEY);
      localStorage.removeItem(USER_ID_STORAGE_KEY);
      setIsAuthenticated(false);
      router.replace('/login');
    } catch (e) {
      console.error("Error during idle logout:", e);
    }
  }, [router]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    let authStatus = false;
    try {
      authStatus = !!localStorage.getItem(USER_ROLE_STORAGE_KEY);
    } catch (e) {
      console.error("Error accessing localStorage in AppShell for auth check:", e);
    }

    setIsAuthenticated(authStatus);

    if (authStatus) {
      if (pathname === '/login') {
        router.replace('/dashboard');
      } else {
        setIsAuthLoading(false);
      }
    } else {
      if (pathname !== '/login') {
        router.replace('/login');
      } else {
        setIsAuthLoading(false);
      }
    }
  }, [pathname, router]);

  // Idle session management
  useEffect(() => {
    if (!isAuthenticated || pathname === '/login') {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetIdleTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetIdleTimer();

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, pathname, resetIdleTimer]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Skeleton className="h-16 w-48 mb-6" />
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

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
