
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppName } from '@/lib/navigation';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
<<<<<<< HEAD
const DEFAULT_FALLBACK_PLACEHOLDER_LOGO_URL = 'logo.svg';
=======
const DEFAULT_ICON_SRC = '/logo.svg'; // Updated to logo.svg
>>>>>>> 64f629a26fd8c9d177c3ff74edb1567067cea52c

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  textClassName?: string;
  hideDefaultText?: boolean;
}

export function Logo({ className, textClassName, hideDefaultText = false, ...rest }: LogoProps) {
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>(DEFAULT_ICON_SRC);
  const [showDefaultIcon, setShowDefaultIcon] = useState(true);

  useEffect(() => {
    let storedLogo = null;
    try {
      storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    } catch (error) {
      console.error("Could not access localStorage for logo:", error);
    }

    if (storedLogo) {
      setUploadedLogoUrl(storedLogo);
      setCurrentSrc(storedLogo);
      setShowDefaultIcon(false); 
    } else {
      setCurrentSrc(DEFAULT_ICON_SRC);
      setShowDefaultIcon(true);
    }
    setIsLoading(false);
  }, []);

  const handleImageError = () => {
    console.warn(`Error loading image: ${currentSrc}. Attempting fallback or showing text only.`);
    if (currentSrc !== DEFAULT_ICON_SRC && uploadedLogoUrl) {
      setCurrentSrc(DEFAULT_ICON_SRC);
      setShowDefaultIcon(true);
      setUploadedLogoUrl(null); 
      try {
        localStorage.removeItem(LOGO_STORAGE_KEY);
      } catch (error) {
        console.error("Could not remove from localStorage:", error);
      }
    } else {
      setShowDefaultIcon(false);
      setCurrentSrc(''); 
    }
  };

  if (isLoading) {
    return (
      <div
        style={{ height: '50px', maxWidth: '150px', width: '100%' }}
        className={cn("animate-pulse bg-muted/50 rounded-md flex items-center justify-center", className)}
        {...rest}
      />
    );
  }

  const shouldShowImage = (showDefaultIcon && currentSrc === DEFAULT_ICON_SRC) || (uploadedLogoUrl && currentSrc === uploadedLogoUrl);

  return (
    <div className={cn("flex items-center justify-center gap-2", className)} style={{ height: '50px', maxWidth: '150px' }} {...rest}>
      {shouldShowImage && currentSrc && (
        <Image
          src={currentSrc}
          alt={`${AppName} Logo`}
          width={40} 
          height={40} 
          className="object-contain"
          onError={handleImageError}
          priority 
        />
      )}
      {!hideDefaultText && !uploadedLogoUrl && ( 
        <span className={cn(
          "font-semibold text-lg text-primary hidden md:inline-block group-data-[state=expanded]:md:inline-block group-data-[state=collapsed]:md:hidden whitespace-nowrap overflow-hidden text-ellipsis",
          textClassName
        )}>
          {AppName}
        </span>
      )}
    </div>
  );
}
