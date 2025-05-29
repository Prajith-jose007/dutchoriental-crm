
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppLogo, AppName } from '@/lib/navigation';
import type { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
const DEFAULT_FALLBACK_PLACEHOLDER_LOGO_URL = 'logo.svg';

interface LogoProps extends LucideProps {
  textClassName?: string;
  hideDefaultText?: boolean; // New prop
}

export function Logo({ className, textClassName, hideDefaultText = false, ...rest }: LogoProps) {
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
      if (storedLogo) {
        setUploadedLogoUrl(storedLogo);
      }
    } catch (error) {
      console.error("Could not access localStorage for logo:", error);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{ height: '50px', maxWidth: '150px', width: '100%' }}
        className="animate-pulse bg-muted/50 rounded-md flex items-center justify-center"
      />
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

  // Fallback to default logo (icon + text, or icon only if hideDefaultText is true)
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} style={{ height: '50px', maxWidth: '150px' }}>
      <AppLogo className={cn("h-8 w-8 text-primary", rest.className)} {...rest} />
      {!hideDefaultText && (
        <span className={cn("font-semibold text-lg text-primary hidden md:inline-block group-data-[state=expanded]:md:inline-block group-data-[state=collapsed]:md:hidden whitespace-nowrap overflow-hidden text-ellipsis", textClassName)}>
          {AppName}
        </span>
      )}
    </div>
  );
}
