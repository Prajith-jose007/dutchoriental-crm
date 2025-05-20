'use client'; // Required for using next/navigation for client-side redirect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Optional: Show a loading state while redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Skeleton className="h-12 w-1/2 mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
