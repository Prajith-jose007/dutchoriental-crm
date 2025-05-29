
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
      setShowDefaultAppName(false); 
    } else {
      setCurrentSrc(DEFAULT_LOGO_SRC);
      setShowDefaultAppName(!hideDefaultText);
    }
    setIsLoading(false);
  }, [hideDefaultText]);

  const handleImageError = () => {
    console.warn(`Error loading image: ${currentSrc}. Fallback or text only.`);
    if (currentSrc !== DEFAULT_LOGO_SRC && uploadedLogoUrl) {
      setCurrentSrc(DEFAULT_LOGO_SRC);
      setShowDefaultAppName(!hideDefaultText);
      setUploadedLogoUrl(null); // Clear the problematic uploaded URL state
      try {
        localStorage.removeItem(LOGO_STORAGE_KEY);
      } catch (error) {
        console.error("Could not remove from localStorage:", error);
      }
    } else {
      setCurrentSrc(''); 
      setShowDefaultAppName(!hideDefaultText);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{ height: '50px', width: '100%' }} // Updated skeleton style
        className={cn("animate-pulse bg-muted/50 rounded-md flex items-center justify-center", className)}
        {...rest}
      />
    );
  }

  const showImage = currentSrc && currentSrc !== '';

  return (
    <div 
      className={cn("relative flex items-center justify-center w-full", className)} // Added w-full and relative
      style={{ height: '50px' }} 
      {...rest}
    >
      {showImage ? (
        <Image
          src={currentSrc}
          alt={`${AppName} Logo`}
          fill // Use fill to make image cover the parent div
          className="object-contain" // Maintain aspect ratio and fit within bounds
          onError={handleImageError}
          priority={currentSrc === DEFAULT_LOGO_SRC}
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
