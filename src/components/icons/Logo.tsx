
'use client';

import { useState, useEffect, type HTMLAttributes } from 'react';
import Image from 'next/image';
import { AppName } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
const DEFAULT_LOGO_SRC = '/logo.svg'; // Standardized constant for the default logo

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  textClassName?: string;
  hideDefaultText?: boolean;
}

export function Logo({ className, textClassName, hideDefaultText = false, ...rest }: LogoProps) {
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string>(DEFAULT_LOGO_SRC);
  const [showDefaultAppName, setShowDefaultAppName] = useState(!hideDefaultText);

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
      setShowDefaultAppName(false); // If custom logo, don't show app name text
    } else {
      // If no stored logo, use the default and decide on text based on hideDefaultText
      setCurrentSrc(DEFAULT_LOGO_SRC);
      setShowDefaultAppName(!hideDefaultText);
    }
    setIsLoading(false);
  }, [hideDefaultText]); // Re-run if hideDefaultText changes

  const handleImageError = () => {
    console.warn(`Error loading image: ${currentSrc}. Fallback or text only.`);
    if (currentSrc !== DEFAULT_LOGO_SRC && uploadedLogoUrl) {
      // If uploaded logo fails, try to fall back to default SVG
      setCurrentSrc(DEFAULT_LOGO_SRC);
      setShowDefaultAppName(!hideDefaultText); // Show app name with default icon if not hidden
      setUploadedLogoUrl(null);
      try {
        localStorage.removeItem(LOGO_STORAGE_KEY);
      } catch (error) {
        console.error("Could not remove from localStorage:", error);
      }
    } else {
      // If default SVG also fails, show nothing or just text
      setCurrentSrc(''); // No image source
      setShowDefaultAppName(!hideDefaultText); // Show app name if not hidden
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

  const showImage = currentSrc && currentSrc !== '';

  return (
    <div className={cn("flex items-center justify-center gap-2", className)} style={{ height: '50px', maxWidth: '150px' }} {...rest}>
      {showImage ? (
        <Image
          src={currentSrc}
          alt={`${AppName} Logo`}
          width={40}
          height={40}
          className="object-contain"
          onError={handleImageError}
          priority={currentSrc === DEFAULT_LOGO_SRC} // Prioritize loading default system logo
        />
      ) : null}
      {showDefaultAppName && (
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
