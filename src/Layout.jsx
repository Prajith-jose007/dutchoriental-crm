import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Ship,
  Package,
  Users,
  Calendar,
  FileText,
  ShoppingCart,
  Warehouse,
  UserCog,
  ClipboardList,
  CreditCard,
  Coffee,
  Wine,
  DollarSign,
  ChevronDown,
  LogOut,
  Menu,
  Home,
  Target,
  Utensils,
  UsersRound,
  Shield // Added Shield icon
} from "lucide-react";
import logo from "@/assets/logo.png";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/lib/AuthContext";

const navigationSections = [
  {
    title: "CRM",
    items: [
      { title: "Dashboard", url: "CRMDashboard", icon: Home },
      { title: "Opportunity", url: "Opportunity", icon: Target },
      {
        title: "Sales",
        icon: DollarSign,
        subItems: [
          { title: "Private Bookings", url: "PrivateBookings", icon: Calendar },
          { title: "Shared Bookings", url: "SharedBookings", icon: Calendar }
        ]
      },
      { title: "Clients", url: "Clients", icon: UsersRound },
      { title: "Agents", url: "Agents", icon: Users },
      { title: "Yachts & Packages", url: "Yachts", icon: Ship },
      { title: "Catering", url: "Catering", icon: Utensils },
      { title: "Sales Invoice", url: "Invoices", icon: FileText }
    ],
    pages: ["CRMDashboard", "Opportunity", "PrivateBookings", "SharedBookings", "Clients", "Agents", "Yachts", "Packages", "Catering", "Invoices"]
  },
  {
    title: "Purchase & Inventory",
    items: [
      { title: "Purchase Dashboard", url: "PurchaseDashboard", icon: Home },
      { title: "Vendors", url: "Vendors", icon: ShoppingCart },
      { title: "Purchase Orders", url: "PurchaseOrders", icon: ClipboardList },
      { title: "Inventory", url: "Inventory", icon: Warehouse }
    ],
    pages: ["PurchaseDashboard", "Vendors", "PurchaseOrders", "Inventory"]
  },
  {
    title: "HRMS & Payroll",
    items: [
      { title: "HRM Dashboard", url: "HRMDashboard", icon: Home },
      { title: "Employees", url: "Employees", icon: UserCog },
      { title: "Attendance", url: "Attendance", icon: ClipboardList },
      { title: "Leaves", url: "Leaves", icon: Calendar },
      { title: "Payroll", url: "Payroll", icon: CreditCard }
    ],
    pages: ["HRMDashboard", "Employees", "Attendance", "Leaves", "Payroll"]
  },
  {
    title: "POS System",
    items: [
      { title: "POS Dashboard", url: "POSDashboard", icon: Home },
      { title: "Restaurant POS", url: "RestaurantPOS", icon: Coffee },
      { title: "Bar POS", url: "BarPOS", icon: Wine },
      { title: "POS Orders", url: "POSOrders", icon: FileText }
    ],
    pages: ["POSDashboard", "RestaurantPOS", "BarPOS", "POSOrders"]
  },
  {
    title: "Accounts",
    items: [
      { title: "Accounts Dashboard", url: "AccountsDashboard", icon: Home },
      { title: "Ledger", url: "Ledger", icon: DollarSign },
      { title: "Financial Reports", url: "FinancialReports", icon: FileText }
    ],
    pages: ["AccountsDashboard", "Ledger", "FinancialReports"]
  },
  {
    title: "Administration",
    items: [
      { title: "User Management", url: "Users", icon: Shield },
      { title: "App Settings", url: "AppSettings", icon: Shield }
    ],
    pages: ["Users", "AppSettings"]
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState(["Sales"]);

  const { data: settings = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSettings.list()
  });

  const appLogo = settings.find(s => s.setting_key === 'app_logo')?.setting_value;
  const appName = settings.find(s => s.setting_key === 'app_name')?.setting_value || 'DutchOriental';

  const toggleSection = (title) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const { user } = useAuth(); // Get user from context
  const isOnMainDashboard = location.pathname === createPageUrl("Dashboard");

  // Filter sections based on user access
  const filteredSections = navigationSections.map(section => {
    // Admin has access to everything
    if (user?.role === 'admin') return section;

    // Map section titles to app_access keys (simple mapping)
    // This logic might need refinement based on exact naming
    // For now, we'll check if any of the section's items are allowed

    // Or better, check specific module access
    // Modules: crm, purchase, hrms, pos, accounts

    let hasAccess = false;
    const access = user?.app_access || [];

    if (section.title === "CRM" && access.includes('crm')) hasAccess = true;
    if (section.title === "Purchase & Inventory" && access.includes('purchase')) hasAccess = true;
    if (section.title === "HRMS & Payroll" && access.includes('hrms')) hasAccess = true;
    if (section.title === "POS System" && access.includes('pos')) hasAccess = true;
    if (section.title === "Accounts" && access.includes('accounts')) hasAccess = true;
    if (section.title === "Administration") return null; // Hide admin from non-admins

    return hasAccess ? section : null;
  }).filter(Boolean);

  // If admin, show administration
  if (user?.role === 'admin') {
    // Ensure Administration is there (it is in the list already)
  }

  const currentSection = filteredSections.find(section =>
    section.pages.includes(currentPageName)
  );

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --ocean-blue: #0A2463;
          --ocean-teal: #247BA0;
          --ocean-light: #1E88E5;
          --sand: #F4E9CD;
          --white: #FFFFFF;
          --gray-50: #F8FAFC;
          --gray-100: #F1F5F9;
          --gray-200: #E2E8F0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>

      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-blue-50">
        {!isOnMainDashboard && currentSection && (
          <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader className="border-b border-gray-100 p-6">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={logo} alt={appName} className="h-12 object-contain" />
                <div>
                  {/* <h2 className="font-bold text-xl text-gray-900">{appName}</h2> */}
                  <p className="text-xs text-gray-500">{currentSection.title}</p>
                </div>
              </Link>
            </SidebarHeader>

            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {currentSection.items.map((item) => {
                      if (item.subItems) {
                        return (
                          <Collapsible
                            key={item.title}
                            open={openSections.includes(item.title)}
                            onOpenChange={() => toggleSection(item.title)}
                          >
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors mb-1">
                              <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-sm">{item.title}</span>
                              </div>
                              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.includes(item.title) ? 'rotate-180' : ''}`} />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-4 mt-1">
                              {item.subItems.map((subItem) => {
                                const isActive = location.pathname === createPageUrl(subItem.url);
                                return (
                                  <SidebarMenuItem key={subItem.title}>
                                    <SidebarMenuButton
                                      asChild
                                      className={`rounded-lg mb-1 transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                        : 'hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                    >
                                      <Link to={createPageUrl(subItem.url)} className="flex items-center gap-3 px-3 py-2">
                                        <subItem.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                        <span className="font-medium text-sm">{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }

                      const isActive = location.pathname === createPageUrl(item.url);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`rounded-lg mb-1 transition-all duration-200 ${isActive
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                              : 'hover:bg-blue-50 hover:text-blue-700'
                              }`}
                          >
                            <Link to={createPageUrl(item.url)} className="flex items-center gap-3 px-3 py-2.5">
                              <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                              <span className="font-medium text-sm">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-100 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-gray-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </SidebarFooter>
          </Sidebar>
        )}

        <main className="flex-1 flex flex-col">
          {!isOnMainDashboard && currentSection && (
            <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden shadow-sm">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <h1 className="text-lg font-semibold text-gray-900">DutchOriental - {currentSection.title}</h1>
              </div>
            </header>
          )}

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}