
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Ship, Settings, Briefcase, BarChart3, KanbanSquare, Target, FolderKanban, Building2, Ticket, FileSpreadsheet, CreditCard, CheckCircle, UserSquare2 } from 'lucide-react';

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
        requiredPermission: 'create_agent',
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

export const AppName = "Desert Rose Yacht CRM";
