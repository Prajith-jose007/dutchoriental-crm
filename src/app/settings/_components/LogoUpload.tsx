
'use client';

import { useState, type ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LOGO_STORAGE_KEY = 'dutchOrientalCrmCompanyLogo';
const DEFAULT_LOGO_URL = 'https://placehold.co/150x50.png?text=DutchOriental+Logo';

export function LogoUpload() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(DEFAULT_LOGO_URL);
  const { toast } = useToast();

  useEffect(() => {
    const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (storedLogo) {
      setCurrentLogo(storedLogo);
    } else {
      setCurrentLogo(DEFAULT_LOGO_URL); // Fallback to default if nothing in storage
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleUpload = () => {
    if (logoPreview) {
      try {
        localStorage.setItem(LOGO_STORAGE_KEY, logoPreview);
        setCurrentLogo(logoPreview);
        setLogoPreview(null); // Clear preview after "upload"
        toast({ title: 'Success', description: 'Logo uploaded and saved locally.' });
      } catch (error) {
        console.error('Failed to save logo to localStorage:', error);
        toast({ title: 'Error', description: 'Could not save logo. Storage might be full.', variant: 'destructive'});
      }
    } else {
      toast({ title: 'Error', description: 'Please select a logo to upload.', variant: 'destructive' });
    }
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem(LOGO_STORAGE_KEY);
    setCurrentLogo(DEFAULT_LOGO_URL);
    setLogoPreview(null);
    toast({ title: 'Logo Removed', description: 'Company logo has been reset to default.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Logo</CardTitle>
        <CardDescription>Update the company logo displayed in the CRM. Changes are saved in your browser.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Current Logo:</h3>
          {currentLogo ? (
            <Image 
              src={currentLogo} 
              alt="Current Company Logo" 
              width={150} 
              height={50} 
              className="rounded border p-2 bg-muted object-contain"
              data-ai-hint="company logo"
              onError={() => {
                // Handle case where stored image might be invalid or removed from source if it was an external URL
                console.warn('Error loading current logo, resetting to default.');
                localStorage.removeItem(LOGO_STORAGE_KEY);
                setCurrentLogo(DEFAULT_LOGO_URL);
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No logo uploaded yet. Displaying default.</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="logo-upload" className="text-sm font-medium">Select new logo (PNG, JPG, SVG)</label>
          <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleFileChange} />
        </div>

        {logoPreview && (
          <div>
            <h3 className="text-sm font-medium mb-2">New Logo Preview:</h3>
            <Image 
              src={logoPreview} 
              alt="New Logo Preview" 
              width={150} 
              height={50} 
              className="rounded border p-2 bg-muted object-contain"
              data-ai-hint="logo preview"
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleUpload} disabled={!logoPreview}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload New Logo
          </Button>
          {currentLogo && currentLogo !== DEFAULT_LOGO_URL && (
            <Button variant="outline" onClick={handleRemoveLogo}>
              Remove Current Logo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
