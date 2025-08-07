
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Ship, Settings, Briefcase, BarChart3, KanbanSquare, Target, FolderKanban } from 'lucide-react';

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
    title: 'CRM',
    href: '/crm',
    icon: FolderKanban,
    items: [
      {
        title: 'CRM Dashboard',
        href: '/crm',
        icon: Target,
      },
      {
        title: 'Opportunity',
        href: '/crm/opportunity',
        icon: KanbanSquare,
      },
      {
        title: 'Leads',
        href: '/leads/pipeline',
        icon: KanbanSquare,
      },
    ]
  },
  {
    title: 'Bookings',
    href: '/leads',
    icon: Briefcase,
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
    items: [
      {
        title: 'CRM Report',
        href: '/reports',
        icon: BarChart3,
      },
      {
        title: 'Shared Report',
        href: '/reports/shared',
        icon: BarChart3,
      },
    ]
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    adminOnly: true, // Mark as admin only
  },
];

export const AppName = "DutchOriental CRM";
