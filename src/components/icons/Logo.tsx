
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppName } from '@/lib/navigation'; // AppLogo is no longer needed here
import type { HTMLAttributes } from 'react'; // Changed from LucideProps
import { cn } from '@/lib/utils';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
// We will now use /icon.svg from the public folder as the primary fallback.
const DEFAULT_ICON_SRC = '/icon.svg';

interface LogoProps extends HTMLAttributes<HTMLDivElement> { // Changed props to extend HTMLAttributes for a div
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
      // If no stored logo, we'll use the default icon.svg
      setCurrentSrc(DEFAULT_ICON_SRC);
      setShowDefaultIcon(true);
    }
    setIsLoading(false);
  }, []);

  const handleImageError = () => {
    console.warn(`Error loading image: ${currentSrc}. Falling back or attempting default.`);
    if (currentSrc !== DEFAULT_ICON_SRC) {
      // If the uploaded logo failed, try the default icon.svg
      setCurrentSrc(DEFAULT_ICON_SRC);
      setShowDefaultIcon(true);
      // If it was the uploaded logo that failed, also clear it from storage
      if (uploadedLogoUrl && currentSrc === uploadedLogoUrl) {
        try {
          localStorage.removeItem(LOGO_STORAGE_KEY);
          setUploadedLogoUrl(null);
        } catch (error) {
          console.error("Could not remove from localStorage:", error);
        }
      }
    } else {
      // If default icon.svg also fails, perhaps render nothing or just text
      setShowDefaultIcon(false); // To avoid infinite loop if default also fails
      // Optionally, set currentSrc to a known good placeholder if even /icon.svg fails
      // For now, it will try to render AppName text if hideDefaultText is false
    }
  };

  if (isLoading) {
    return (
      <div
        style={{ height: '50px', maxWidth: '150px', width: '100%' }}
        className="animate-pulse bg-muted/50 rounded-md flex items-center justify-center"
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)} style={{ height: '50px', maxWidth: '150px' }} {...rest}>
      {(showDefaultIcon || uploadedLogoUrl) && (
        <Image
          src={currentSrc} // This will be either uploaded logo or /icon.svg
          alt={`${AppName} Logo`}
          width={hideDefaultText ? 40 : 30} // Adjust size slightly if text is hidden
          height={hideDefaultText ? 40 : 30}
          className="object-contain" // removed custom className from here to apply to wrapper
          onError={handleImageError}
          priority // Good for LCP elements like a logo
        />
      )}
      {!hideDefaultText && (
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
