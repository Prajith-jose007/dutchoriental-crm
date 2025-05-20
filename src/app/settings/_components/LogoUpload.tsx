
'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LogoUpload() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>('https://placehold.co/150x50.png?text=DutchOriental+Logo'); // Placeholder for existing logo
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    // Placeholder for actual upload logic
    if (logoPreview) {
      setCurrentLogo(logoPreview);
      setLogoPreview(null); // Clear preview after "upload"
      toast({ title: 'Success', description: 'Logo uploaded successfully.' });
    } else {
      toast({ title: 'Error', description: 'Please select a logo to upload.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Logo</CardTitle>
        <CardDescription>Update the company logo displayed in the CRM.</CardDescription>
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
              className="rounded border p-2 bg-muted"
              data-ai-hint="company logo"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
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
              className="rounded border p-2 bg-muted"
              data-ai-hint="logo preview"
            />
          </div>
        )}
        
        <Button onClick={handleUpload} disabled={!logoPreview}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload New Logo
        </Button>
      </CardContent>
    </Card>
  );
}
