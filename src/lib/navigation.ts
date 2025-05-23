
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ClipboardList, Users, Ship, Settings, Briefcase, KanbanSquare } from 'lucide-react';

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
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const AppLogo = Ship;
export const AppName = "DutchOriental CRM";
