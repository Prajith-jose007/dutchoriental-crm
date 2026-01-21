import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Upload, Image as ImageIcon } from "lucide-react";

export default function AppSettings() {
  const [logoFile, setLogoFile] = useState(null);
  const [appName, setAppName] = useState("");
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const allSettings = await base44.entities.AppSettings.list();
      return allSettings;
    }
  });

  const createOrUpdateSetting = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = settings.find(s => s.setting_key === key);
      if (existing) {
        return base44.entities.AppSettings.update(existing.id, { setting_value: value });
      } else {
        return base44.entities.AppSettings.create({ setting_key: key, setting_value: value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appSettings']);
    }
  });

  const currentLogo = settings.find(s => s.setting_key === 'app_logo')?.setting_value;
  const currentAppName = settings.find(s => s.setting_key === 'app_name')?.setting_value || 'DutchOriental';

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
      await createOrUpdateSetting.mutateAsync({ key: 'app_logo', value: file_url });
      setLogoFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleAppNameSave = async () => {
    if (!appName) return;
    await createOrUpdateSetting.mutateAsync({ key: 'app_name', value: appName });
    setAppName("");
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Access Denied - Admin Only</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">App Settings</h1>
          <p className="text-gray-600">Manage application branding and configuration</p>
        </div>

        {/* App Logo */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Application Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentLogo && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600 mb-2 block">Current Logo</Label>
                <img src={currentLogo} alt="App Logo" className="h-16 object-contain" />
              </div>
            )}

            <div>
              <Label>Upload New Logo</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                />
                <Button
                  onClick={handleLogoUpload}
                  disabled={!logoFile || uploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Recommended: PNG or SVG, max 200px height</p>
            </div>
          </CardContent>
        </Card>

        {/* App Name */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Application Name
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm text-gray-600 mb-2 block">Current Name</Label>
              <p className="text-xl font-bold">{currentAppName}</p>
            </div>

            <div>
              <Label>Change Application Name</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Enter new app name"
                />
                <Button
                  onClick={handleAppNameSave}
                  disabled={!appName}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Theme (Coming Soon) */}
        <Card className="border-none shadow-lg opacity-50">
          <CardHeader>
            <CardTitle>Color Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Coming soon - customize app colors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}