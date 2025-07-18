
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ClipboardList, Users, Ship, Settings, Briefcase, BarChart3, Activity } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  adminOnly?: boolean; // Added for role-based visibility
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bookings',
    href: '/leads',
    icon: ClipboardList,
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
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    adminOnly: true, // Mark as admin only
  },
  {
    title: 'CRM',
    href: '/dashboard',
    icon: Activity,
  },
];

export const AppName = "aqualeads CRM";
