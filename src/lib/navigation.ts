
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Ship, Settings, Briefcase, BarChart3, KanbanSquare, Target, FolderKanban, Building2, Ticket } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  adminOnly?: boolean;
  items?: NavItem[]; // Added for sub-menus
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bookings',
    href: '/bookings',
    icon: Briefcase,
  },
  {
    title: 'Guest Check-In',
    href: '/check-in',
    icon: Ticket,
  },
  {
    title: 'Yachts',
    href: '/yachts',
    icon: Ship,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Agents',
    href: '/agents',
    icon: Briefcase,
    adminOnly: true, // Mark as admin only
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    adminOnly: true, // Mark as admin only
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    adminOnly: true, // Mark as admin only
  },
];

export const AppName = "DutchOriental CRM";
