
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

export interface YachtPackage {
  id: string; // Unique ID for the package item, e.g., client-generated UUID
  name: string;
  rate: number;
}

export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';
  packages?: YachtPackage[]; // Array of custom packages
  customPackageInfo?: string; // General notes
}

export interface Invoice {
  id: string;
  leadId: string;
  clientName: string;
  amount: number;
  dueDate: string; // ISO Date string
  status: 'Paid' | 'Pending' | 'Overdue';
  createdAt: string; // ISO Date string
}

export type LeadStatus = 'Balance' | 'Closed' | 'Conformed' | 'Upcoming';
export const leadStatusOptions: LeadStatus[] = ['Balance', 'Closed', 'Conformed', 'Upcoming'];

export type ModeOfPayment = 'Online' | 'Credit' | 'Cash/Card';
export const modeOfPaymentOptions: ModeOfPayment[] = ['Online', 'Credit', 'Cash/Card'];

export type LeadType = 'Dinner Cruise' | 'Sunset Cruise' | 'Private';
export const leadTypeOptions: LeadType[] = ['Dinner Cruise', 'Sunset Cruise', 'Private'];


export interface Lead {
  id:string;
  agent: string; // Agent ID
  status: LeadStatus;
  month: string; // Primary Lead/Event Date as ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
  notes?: string; // For user feed/notes about the lead
  yacht: string; // Yacht ID
  type: LeadType; 
  transactionId?: string; 
  modeOfPayment: ModeOfPayment;
  clientName: string;

  // These will be deprecated/replaced once leads consume dynamic yacht packages
  qty_childRate?: number;
  qty_adultStandardRate?: number;
  qty_adultStandardDrinksRate?: number;
  qty_vipChildRate?: number;
  qty_vipAdultRate?: number;
  qty_vipAdultDrinksRate?: number;
  qty_royalChildRate?: number;
  qty_royalAdultRate?: number;
  qty_royalDrinksRate?: number;
  
  othersAmtCake?: number; 

  totalAmount: number;
  commissionAmount?: number;
  commissionPercentage: number; 
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;

  createdAt: string; 
  updatedAt: string; 
  lastModifiedByUserId?: string; 
  ownerUserId?: string; 
}

export interface BookingReportData {
  month: string; 
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
