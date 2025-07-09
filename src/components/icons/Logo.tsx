'use client';

import { useState, useEffect, type HTMLAttributes } from 'react';
import Image from 'next/image';
import { AppName } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
const DEFAULT_LOGO_SRC = '/logo.svg'; // Points to public/logo.svg

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
    console.warn(`Error loading image: ${currentSrc}. Fallback to default SVG or text only.`);
    if (currentSrc !== DEFAULT_LOGO_SRC && uploadedLogoUrl) {
      // If the custom uploaded logo fails, try falling back to the default SVG
      setCurrentSrc(DEFAULT_LOGO_SRC);
      setShowDefaultAppName(!hideDefaultText); // Show app name if default SVG is used and hideDefaultText is false
      setUploadedLogoUrl(null); 
      try {
        localStorage.removeItem(LOGO_STORAGE_KEY);
      } catch (error) {
        console.error("Could not remove from localStorage:", error);
      }
    } else if (currentSrc === DEFAULT_LOGO_SRC) {
      // If the default SVG itself fails (e.g., file not found), hide the image and show text
      setCurrentSrc(''); 
      setShowDefaultAppName(!hideDefaultText);
    } else {
      // General fallback if currentSrc was already empty
      setShowDefaultAppName(!hideDefaultText);
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn("animate-pulse bg-muted/50 rounded-md flex items-center justify-center h-10 w-full", className)}
        {...rest}
      />
    );
  }

  const showImage = currentSrc && currentSrc !== '';

  return (
    <div 
      className={cn("relative flex items-center justify-center w-full", className)}
      {...rest}
    >
      {showImage ? (
        <Image
          src={currentSrc}
          alt={`${AppName} Logo`}
          fill 
          className="object-contain" 
          onError={handleImageError}
          priority={currentSrc === DEFAULT_LOGO_SRC} // Prioritize if it's the default local SVG
        />
      ) : null}
      {showDefaultAppName && !showImage && ( // Only show AppName text if image isn't shown
        <span className={cn(
          "font-semibold text-lg text-primary whitespace-nowrap overflow-hidden text-ellipsis",
          textClassName
        )}>
          {AppName}
        </span>
      )}
    </div>
  );
}
