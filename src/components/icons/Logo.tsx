
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppName } from '@/lib/navigation';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
const DEFAULT_ICON_SRC = '/icon.svg'; // Using the static SVG from public

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  textClassName?: string;
  hideDefaultText?: boolean;
}

export function Logo({ className, textClassName, hideDefaultText = false, ...rest }: LogoProps) {
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>(DEFAULT_ICON_SRC);
  const [showDefaultIcon, setShowDefaultIcon] = useState(true); // To control if default icon.svg should attempt to render

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
      setShowDefaultIcon(false); // An uploaded logo exists, so don't try to show the default icon.svg initially
    } else {
      setCurrentSrc(DEFAULT_ICON_SRC); // No stored logo, use /icon.svg
      setShowDefaultIcon(true);
    }
    setIsLoading(false);
  }, []);

  const handleImageError = () => {
    console.warn(`Error loading image: ${currentSrc}. Attempting fallback or showing text only.`);
    if (currentSrc !== DEFAULT_ICON_SRC && uploadedLogoUrl) {
      // If the uploaded logo failed, try falling back to the default icon.svg
      setCurrentSrc(DEFAULT_ICON_SRC);
      setShowDefaultIcon(true); // Indicate that we are now trying to show the default
      setUploadedLogoUrl(null); // Clear the problematic uploaded URL state
      try {
        localStorage.removeItem(LOGO_STORAGE_KEY); // Also remove it from storage
      } catch (error) {
        console.error("Could not remove from localStorage:", error);
      }
    } else {
      // If DEFAULT_ICON_SRC (/icon.svg) also fails, or if there was no uploaded logo to begin with,
      // then don't try to render an Image component for it anymore.
      setShowDefaultIcon(false);
      setCurrentSrc(''); // Ensure no Image tag attempts to render a faulty src
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
          width={40} // Consistent width
          height={40} // Consistent height
          className="object-contain"
          onError={handleImageError}
          priority // Good for LCP elements like a logo
        />
      )}
      {!hideDefaultText && !uploadedLogoUrl && ( // Show AppName text only if no uploaded logo and hideDefaultText is false
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
