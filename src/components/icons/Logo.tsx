
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppLogo, AppName } from '@/lib/navigation';
import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
// Fallback if the stored logo is invalid, not the primary default if nothing is stored.
const DEFAULT_FALLBACK_PLACEHOLDER_LOGO_URL = 'https://placehold.co/150x50.png?text=DutchOriental+Logo';


export function Logo({ className, textClassName, ...rest }: LucideProps & { textClassName?: string }) {
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This code runs only on the client-side
    try {
      const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
      if (storedLogo) {
        setUploadedLogoUrl(storedLogo);
      }
    } catch (error) {
      console.error("Could not access localStorage for logo:", error);
      // Potentially in a SSR or restricted environment, fallback to default
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    // Render a placeholder or null during the initial client-side check to avoid hydration mismatch
    // and to prevent flash of default logo if a custom one is stored.
    // Adjusted placeholder size to be less intrusive.
    return <div style={{ width: 100, height: 30 }} className="animate-pulse bg-muted/50 rounded-md"></div>;
  }

  if (uploadedLogoUrl) {
    return (
      <Image
        src={uploadedLogoUrl}
        alt={`${AppName} Logo`}
        width={150} // Consistent with LogoUpload preview size
        height={50}  // Consistent with LogoUpload preview size
        className={cn("object-contain", className)} // Apply passed className for external styling/sizing if needed
        data-ai-hint="company logo"
        onError={() => {
          // If the stored logo URL is broken (e.g., invalid data URI)
          console.warn('Error loading stored company logo. Removing invalid entry.');
          try {
            localStorage.removeItem(LOGO_STORAGE_KEY);
          } catch (error) {
            console.error("Could not remove from localStorage:", error);
          }
          setUploadedLogoUrl(null); // Trigger re-render to show default logo
        }}
        priority // If logo is critical LCP element
      />
    );
  }

  // Fallback to default logo (icon + text) if no valid uploaded logo is found
  return (
    <div className="flex items-center gap-2">
      <AppLogo className={cn("h-7 w-7 text-primary", className)} {...rest} />
      <span className={cn("font-semibold text-lg text-primary hidden md:inline-block group-data-[state=expanded]:md:inline-block group-data-[state=collapsed]:md:hidden", textClassName)}>
        {AppName}
      </span>
    </div>
  );
}
