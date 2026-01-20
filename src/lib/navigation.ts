
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Ship, Settings, Briefcase, BarChart3, KanbanSquare, Target, FolderKanban, Building2, Ticket, FileSpreadsheet, CreditCard, CheckCircle, UserSquare2 } from 'lucide-react';

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
    title: 'Private Charter',
    href: '/private-charter',
    icon: Ship,
    items: [
      {
        title: 'Dashboard',
        href: '/private-charter',
        icon: LayoutDashboard,
      },
      {
        title: 'Leads',
        href: '/private-charter/leads',
        icon: KanbanSquare,
      },
      {
        title: 'Quotations',
        href: '/private-charter/quotations',
        icon: FileSpreadsheet,
      },
      {
        title: 'Yachts',
        href: '/private-charter/yachts',
        icon: Ship,
      },
      {
        title: 'Payments',
        href: '/private-charter/payments',
        icon: CreditCard,
      },
      {
        title: 'Check-In',
        href: '/private-charter/check-in',
        icon: Ticket,
      },
      {
        title: 'Customers',
        href: '/private-charter/customers',
        icon: Building2,
      },
      {
        title: 'Tasks',
        href: '/private-charter/tasks',
        icon: CheckCircle,
      },
      {
        title: 'Agents',
        href: '/private-charter/agents',
        icon: UserSquare2,
        adminOnly: true,
      },
      {
        title: 'Reports',
        href: '/private-charter/reports',
        icon: BarChart3,
      },
    ]
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

export const AppName = "Desert Rose Yacht CRM";
