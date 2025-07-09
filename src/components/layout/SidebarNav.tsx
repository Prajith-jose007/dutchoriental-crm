
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { mainNavItems, AppName } from '@/lib/navigation';
import type { User } from '@/lib/types'; // Import User type
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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { useToast } from '@/hooks/use-toast'; 

const USER_ROLE_STORAGE_KEY = 'currentUserRole';
const USER_EMAIL_STORAGE_KEY = 'currentUserEmail';

export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter(); 
  const { toast } = useToast(); 

  const [loggedInUserName, setLoggedInUserName] = useState<string | null>(null);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);

  useEffect(() => {
    setMounted(true);
    let role = null;
    let email = null;
    try {
      role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      email = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
    } catch (error) {
      console.error("Error accessing localStorage in SidebarNav:", error);
    }
    setIsAdmin(role === 'admin');
    setLoggedInUserEmail(email); // This might be null if not found
  }, []);

  useEffect(() => {
    if (mounted) {
      if (loggedInUserEmail && loggedInUserEmail !== 'Not logged in') { // Only fetch if there's a real email
        const fetchUserDetails = async () => {
          setIsLoadingUserDetails(true);
          try {
            const response = await fetch('/api/users');
            if (!response.ok) {
              let errorData = { message: `Failed to fetch users. Status: ${response.status}` };
              try {
                const apiError = await response.json();
                errorData.message = apiError.message || apiError.error || errorData.message;
              } catch (e) {
                console.warn("Failed to parse error response from /api/users as JSON.", e);
                errorData.message = `Failed to fetch users. Status: ${response.status} - ${response.statusText || 'No status text'}`;
              }
              console.error("[SidebarNav] Error fetching users from API:", errorData, "Full response status:", response.status);
              throw new Error(errorData.message);
            }
            const users: User[] = await response.json();
            const currentUser = users.find(user => user.email && user.email.toLowerCase() === loggedInUserEmail.toLowerCase());
            if (currentUser) {
              setLoggedInUserName(currentUser.name);
            } else {
              setLoggedInUserName('User'); // Fallback name
              console.warn(`[SidebarNav] User with email ${loggedInUserEmail} not found in fetched users list.`);
            }
          } catch (error) {
            console.error('[SidebarNav] Error fetching user details for sidebar:', error);
            setLoggedInUserName('User'); 
            toast({ title: "Error", description: "Could not load user details for sidebar.", variant: "destructive" });
          } finally {
            setIsLoadingUserDetails(false);
          }
        };
        fetchUserDetails();
      } else {
        // No valid email in localStorage or it's the placeholder
        setLoggedInUserName('Guest');
        setLoggedInUserEmail('Not logged in'); // Ensure placeholder if email was null
        setIsLoadingUserDetails(false);
      }
    }
  }, [mounted, loggedInUserEmail, toast]);

  const handleLogout = () => {
    try {
      localStorage.removeItem(USER_ROLE_STORAGE_KEY);
      localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
      
      setLoggedInUserName('Guest');
      setLoggedInUserEmail('Not logged in');
      setIsAdmin(false);
      
      router.push('/login');
      toast({ 
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: 'Logout Error',
        description: 'Could not clear session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 flex flex-row items-center gap-2">
        <div className="h-10">
          <Logo hideDefaultText={true} className="w-auto h-full" />
        </div>
        {state === 'expanded' && <h1 className="font-bold text-xl text-sidebar-foreground">CRM</h1>}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => {
            if (item.adminOnly && mounted && !isAdmin) {
              return null; 
            }
            if (item.adminOnly && !mounted) {
              return null; 
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
        <div className="flex items-center p-2 gap-2">
          <UserCircle className="h-8 w-8 text-sidebar-foreground" />
          <div className={cn("flex flex-col", state === "expanded" ? "opacity-100" : "opacity-0", "transition-opacity duration-300 overflow-hidden")}>
            {isLoadingUserDetails ? (
              <>
                <span className="text-sm font-medium text-sidebar-foreground">Loading...</span>
                <span className="text-xs text-sidebar-foreground/70"></span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-sidebar-foreground truncate" title={loggedInUserName || ''}>
                  {loggedInUserName || 'User'}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate" title={loggedInUserEmail || ''}>
                  {loggedInUserEmail || 'user@example.com'}
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            state === "collapsed" && "justify-center"
          )}
          onClick={handleLogout} 
        >
          <LogOut className="h-4 w-4" />
          <span className={cn(state === "expanded" ? "opacity-100" : "opacity-0", "transition-opacity duration-300")}>
            Logout
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
