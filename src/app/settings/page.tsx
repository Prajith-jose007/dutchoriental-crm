
import { PageHeader } from '@/components/PageHeader';
import { LogoUpload } from './_components/LogoUpload';
import { ThemeSettings } from './_components/ThemeSettings';
import { AdminUserManagement } from './_components/AdminUserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Settings"
        description="Configure and customize your DutchOriental CRM."
      />
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="users">User Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="space-y-6">
            <LogoUpload />
            {/* Add other general settings here */}
          </div>
        </TabsContent>
        <TabsContent value="appearance">
          <div className="space-y-6">
            <ThemeSettings />
          </div>
        </TabsContent>
        <TabsContent value="users">
          <div className="space-y-6">
            <AdminUserManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
