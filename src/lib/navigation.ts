
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ClipboardList, Users, Ship, Settings, Briefcase } from 'lucide-react'; // Changed Anchor to Ship

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
    title: 'Agents',
    href: '/agents',
    icon: Briefcase,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Yachts',
    href: '/yachts',
    icon: Ship, // Kept Ship for Yachts section
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const AppLogo = Ship; // Changed from Anchor to Ship for the main app logo
export const AppName = "DutchOriental CRM"; // Changed AppName
