'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// These would typically come from your theme definition or CSS variables
const themeColors = [
  { name: 'Primary Color', id: 'primaryColor', defaultValue: '#1A5276' },
  { name: 'Accent Color', id: 'accentColor', defaultValue: '#E67E22' },
  { name: 'Background Color', id: 'backgroundColor', defaultValue: '#D5DBDB' },
];

export function ThemeSettings() {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you would update CSS variables or call an API
    toast({ title: 'Theme Updated', description: 'Theme settings applied (placeholder).' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
        <CardDescription>Adjust the look and feel of the CRM. Changes require a refresh to take full effect (conceptual).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {themeColors.map(color => (
            <div key={color.id} className="space-y-2">
              <Label htmlFor={color.id}>{color.name}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  id={`${color.id}-picker`}
                  defaultValue={color.defaultValue}
                  className="w-12 h-10 p-1"
                  // Note: Direct binding to CSS vars needs more complex setup
                />
                <Input
                  type="text"
                  id={color.id}
                  defaultValue={color.defaultValue}
                  className="flex-1"
                  placeholder="e.g., #1A5276"
                />
              </div>
            </div>
          ))}
          
          <div className="space-y-2">
            <Label htmlFor="layoutStyle">Layout Style</Label>
            {/* Placeholder for layout options */}
            <select id="layoutStyle" className="w-full p-2 border rounded-md bg-input">
              <option value="default">Default</option>
              <option value="compact">Compact</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <Button type="submit">
            <Palette className="mr-2 h-4 w-4" />
            Apply Theme Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
