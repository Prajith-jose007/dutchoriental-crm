
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Ship, Settings, Briefcase, BarChart3, Ticket } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  requiredPermission?: string; // Use string loosely to match Permission type
  items?: NavItem[];
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
    requiredPermission: 'view_reports',
  },
  {
    title: 'Agents',
    href: '/agents',
    icon: Briefcase,
    requiredPermission: 'create_agent',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    requiredPermission: 'manage_users',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermission: 'manage_users',
  },
];

export const AppName = "IBS - Internal Booking System";
