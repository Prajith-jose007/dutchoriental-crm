
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    let isAuthenticated = false;
    try {
      isAuthenticated = !!localStorage.getItem('currentUserRole');
    } catch (e) {
      console.error("Error accessing localStorage for auth check:", e);
    }

    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return null;
}
