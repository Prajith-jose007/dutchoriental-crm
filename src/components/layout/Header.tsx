
'use client';

import Link from 'next/link';
import { Bell, UserCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react'; // Added useState, useEffect

export function Header() {
  const [mounted, setMounted] = useState(false); // State to track if component has mounted
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true); // Set to true after component mounts on client
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUserRole');
      localStorage.removeItem('currentUserEmail');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      
      {/* This div was identified as the source of hydration mismatch */}
      {/* Conditionally render to ensure server and initial client render match */}
      {mounted ? (
        <div className="relative flex-1 md:grow-0 md:ml-4">
          {/* Content for this div, if any, can be placed here */}
          {/* E.g., Search for larger screens, could be hidden on mobile if space is an issue */}
        </div>
      ) : (
        // Render a consistent placeholder that matches what the server would output for this structure,
        // or simply a div with the correct classes if the content itself isn't the issue.
        // Given the diff, the server renders an old structure. The client expects the new one.
        // By rendering the new structure's div shell, we align the initial client render.
        <div className="relative flex-1 md:grow-0 md:ml-4" />
      )}

      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
          />
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-8 w-8" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
