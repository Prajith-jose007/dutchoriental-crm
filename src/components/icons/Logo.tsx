
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
    // Match dimensions closer to the actual image (150x50)
    // Using a div with height and max-width for better consistency with potential text logo
    return (
      <div 
        style={{ height: '50px', maxWidth: '150px', width: '100%' }} 
        className="animate-pulse bg-muted/50 rounded-md flex items-center justify-center"
      >
         {/* Optional: A very faint placeholder text or icon if needed */}
      </div>
    );
  }

  if (uploadedLogoUrl) {
    return (
      <Image
        src={uploadedLogoUrl}
        alt={`${AppName} Logo`}
        width={150} 
        height={50}  
        className={cn("object-contain", className)} 
        data-ai-hint="company logo"
        onError={() => {
          console.warn('Error loading stored company logo. Removing invalid entry.');
          try {
            localStorage.removeItem(LOGO_STORAGE_KEY);
          } catch (error) {
            console.error("Could not remove from localStorage:", error);
          }
          setUploadedLogoUrl(null); 
        }}
        priority 
      />
    );
  }

  // Fallback to default logo (icon + text)
  return (
    <div className={cn("flex items-center gap-2", className)} style={{ height: '50px', maxWidth: '150px' }}>
      <AppLogo className={cn("h-7 w-7 text-primary", rest.className)} {...rest} />
      <span className={cn("font-semibold text-lg text-primary hidden md:inline-block group-data-[state=expanded]:md:inline-block group-data-[state=collapsed]:md:hidden whitespace-nowrap overflow-hidden text-ellipsis", textClassName)}>
        {AppName}
      </span>
    </div>
  );
}
