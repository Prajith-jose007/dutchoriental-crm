import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ClipboardList, Users, Ship, Settings, Anchor } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: ClipboardList,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Yachts', // Added Yachts as a separate section for managing yachts if needed
    href: '/yachts',
    icon: Ship,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const AppLogo = Anchor; // Using Anchor as a placeholder for nautical theme
export const AppName = "AquaLeads CRM";
