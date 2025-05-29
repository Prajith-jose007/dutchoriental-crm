
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { mainNavItems, AppName } from '@/lib/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react'; // Import useEffect and useState

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client-side
    setMounted(true);
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error("Error accessing localStorage for user role in SidebarNav:", error);
      setIsAdmin(false);
    }
  }, []);

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4">
        <Logo hideDefaultText={true} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => {
            // Client-side check for admin-only items
            if (item.title === 'Agents' && mounted && !isAdmin) {
              return null; // Don't render Agents link if not admin and component is mounted
            }
            if (item.title === 'Agents' && !mounted) {
                return null; // Avoid rendering on server / initial client render if role not yet checked
            }

            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  aria-label={item.title}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border">
         {/* Example User Profile in Footer - can be removed or expanded */}
        <div className="flex items-center p-2 gap-2">
          <UserCircle className="h-8 w-8 text-sidebar-foreground"/>
          <div className={cn("flex flex-col", state === "expanded" ? "opacity-100" : "opacity-0", "transition-opacity duration-300")}>
            <span className="text-sm font-medium text-sidebar-foreground">Admin User</span>
            <span className="text-xs text-sidebar-foreground/70">admin@dutchoriental.com</span>
          </div>
        </div>
        <Button variant="ghost" className={cn("w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", state === "collapsed" && "justify-center")}>
          <LogOut className="h-4 w-4" />
          <span className={cn(state === "expanded" ? "opacity-100" : "opacity-0", "transition-opacity duration-300")}>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
