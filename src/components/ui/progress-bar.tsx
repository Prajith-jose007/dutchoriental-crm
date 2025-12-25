
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function ProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // This triggers when the route changes
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 500); // Small delay to show bar
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
            <div className="h-1 bg-primary animate-progress-bar origin-left" />
            <style jsx>{`
        .animate-progress-bar {
          animation: progress-bar 1.5s ease-in-out infinite;
        }
        @keyframes progress-bar {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
        </div>
    );
}
