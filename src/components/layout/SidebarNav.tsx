
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
  SidebarMenuBadge,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle } from 'lucide-react';

export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar(); // Removed 'open' as it wasn't used

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4">
        <Logo textClassName={cn(state === "expanded" ? "opacity-100" : "opacity-0", "transition-opacity duration-300")} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => {
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
                {/* Example badge, can be dynamic */}
                {/* {item.title === 'Leads' && <SidebarMenuBadge>12</SidebarMenuBadge>} */}
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
