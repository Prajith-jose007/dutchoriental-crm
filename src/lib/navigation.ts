
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ClipboardList, Users, Ship, Settings, Briefcase, KanbanSquare, BarChart3 } from 'lucide-react';

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
    title: 'Pipeline',
    href: '/leads/pipeline',
    icon: KanbanSquare,
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
  },
];

// AppLogo constant (e.g. Ship from lucide-react) is no longer exported from here
// as the Logo.tsx component now uses /icon.svg by default.
export const AppName = "DutchOriental CRM";
