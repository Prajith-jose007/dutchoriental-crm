
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isAuthenticated = false;
    try {
      isAuthenticated = !!localStorage.getItem('currentUserRole');
    } catch (e) {
      console.error("Error accessing localStorage for auth check:", e);
      // Fallback: assume not authenticated if localStorage is inaccessible
    }

    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
    // Set checking to false after the redirect logic is initiated
    // This might still show a brief loading skeleton, which is acceptable for this check.
    setIsCheckingAuth(false); 
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // This part will ideally not be seen as redirect should happen quickly
  return null; 
}
