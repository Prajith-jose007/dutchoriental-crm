
export interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  avatarUrl?: string;
  websiteUrl?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  password?: string; // Only used for form data, not directly stored as-is
}

export interface Agent {
  id: string;
  name: string;
  agency_code?: string;
  address?: string;
  phone_no?: string;
  email: string;
  status: 'Active' | 'Non Active' | 'Dead';
  TRN_number?: string;
  customer_type_id?: string;
  discount: number;
  websiteUrl?: string;
}

export interface YachtPackageItem {
  id: string; // Client-side unique ID
  name: string;
  rate: number;
}

export type YachtCategory = 'Dinner Cruise' | 'Superyacht Sightseeing Cruise' | 'Private Cruise';
export const yachtCategoryOptions: YachtCategory[] = ['Dinner Cruise', 'Superyacht Sightseeing Cruise', 'Private Cruise'];

export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';
  category: YachtCategory;
  packages?: YachtPackageItem[]; // Array of custom packages for this yacht
  customPackageInfo?: string; // General notes about packages
}

export interface Invoice {
  id: string;
  leadId: string;
  clientName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD format for MySQL DATE compatibility
  status: 'Paid' | 'Pending' | 'Overdue';
  createdAt: string; // ISO Date string
}

export type LeadStatus = 'Balance' | 'Closed' | 'Conformed' | 'Upcoming';
export const leadStatusOptions: LeadStatus[] = ['Balance', 'Closed', 'Conformed', 'Upcoming'];

export type ModeOfPayment = 'Online' | 'Credit' | 'Cash/Card';
export const modeOfPaymentOptions: ModeOfPayment[] = ['Online', 'Credit', 'Cash/Card'];

// Updated LeadType
export type LeadType = 'Dinner Cruise' | 'Superyacht Sightseeing Cruise' | 'Private Cruise';
export const leadTypeOptions: LeadType[] = ['Dinner Cruise', 'Superyacht Sightseeing Cruise', 'Private Cruise'];

// New interface for storing package quantities on a lead
export interface LeadPackageQuantity {
  packageId: string;    // ID of the package from the selected Yacht (YachtPackageItem.id)
  packageName: string;  // Name of the package from the Yacht (for display/record)
  quantity: number;
  rate: number;         // Rate of the package at the time of booking (for historical record)
}

export interface Lead {
  id: string;
  agent: string; // Agent ID
  status: LeadStatus;
  month: string; // Primary Lead/Event Date as ISO string (e.g., "2024-08-15T00:00:00.000Z")
  notes?: string;
  yacht: string; // Yacht ID
  type: LeadType;
  transactionId?: string;
  modeOfPayment: ModeOfPayment;
  clientName: string;

  packageQuantities?: LeadPackageQuantity[]; // Stores quantities for dynamically selected packages

  totalAmount: number;
  commissionPercentage: number;
  commissionAmount?: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;

  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  lastModifiedByUserId?: string;
  ownerUserId?: string;
}

// For Dashboard and Reports
export interface BookingReportData {
  month: string; // "MMM yyyy"
  bookings: number;
}

export interface RevenueData {
  period: string;
  amount: number;
}

export interface PieChartDataItem {
  name: string;
  value: number;
  fill: string;
}

export interface BookingsByAgentData {
  agentName: string;
  bookings: number;
}

// Re-exporting for easier import in CSV parser (though CSV for dynamic packages is complex)
export type { LeadStatus as ExportedLeadStatus, ModeOfPayment as ExportedModeOfPayment, LeadType as ExportedLeadType };
