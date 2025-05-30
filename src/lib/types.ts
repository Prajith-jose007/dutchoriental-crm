
export interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  avatarUrl?: string;
  websiteUrl?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  password?: string;
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
  id: string; // Client-side unique ID for form management, or DB ID if persisted
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
  packages?: YachtPackageItem[];
  customPackageInfo?: string;
  // other_charges_json is a DB implementation detail, not directly in the type
}

export interface Invoice {
  id: string;
  leadId: string;
  clientName: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD format
  status: 'Paid' | 'Pending' | 'Overdue';
  createdAt: string; // ISO Date string
}

export type LeadStatus = 'Balance' | 'Closed' | 'Conformed' | 'Upcoming';
export const leadStatusOptions: LeadStatus[] = ['Balance', 'Closed', 'Conformed', 'Upcoming'];

export type ModeOfPayment = 'Online' | 'Credit' | 'Cash/Card';
export const modeOfPaymentOptions: ModeOfPayment[] = ['Online', 'Credit', 'Cash/Card'];

export type LeadType = 'Dinner Cruise' | 'Superyacht Sightseeing Cruise' | 'Private Cruise';
export const leadTypeOptions: LeadType[] = ['Dinner Cruise', 'Superyacht Sightseeing Cruise', 'Private Cruise'];


export interface LeadPackageQuantity {
  packageId: string;    // ID of the package from the selected Yacht.packages
  packageName: string;  // Name of the package from the Yacht (for display/record)
  quantity: number;
  rate: number;         // Rate of that package at the time of booking (copied from Yacht.packages[...].rate)
}

export interface Lead {
  id: string;
  agent: string; // Agent ID
  status: LeadStatus;
  month: string; // Primary Lead/Event Date as ISO string
  notes?: string;
  yacht: string; // Yacht ID
  type: LeadType;
  transactionId?: string;
  modeOfPayment: ModeOfPayment;
  clientName: string;

  packageQuantities?: LeadPackageQuantity[]; // Array of selected packages and their quantities

  totalAmount: number;
  commissionPercentage: number;
  commissionAmount?: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number; // This will store the signed value

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

// Re-exporting for easier import in CSV parser
export type { LeadStatus as ExportedLeadStatus, ModeOfPayment as ExportedModeOfPayment, LeadType as ExportedLeadType };
