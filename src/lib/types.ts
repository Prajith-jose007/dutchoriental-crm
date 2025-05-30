
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

export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';
  customPackageInfo?: string;

  // 9 Standardized Package Rates
  childRate?: number;
  adultStandardRate?: number;
  adultStandardDrinksRate?: number;
  vipChildRate?: number;
  vipAdultRate?: number;
  vipAdultDrinksRate?: number;
  royalChildRate?: number;
  royalAdultRate?: number;
  royalDrinksRate?: number;

  // New: Array for multiple custom other charges
  otherCharges?: Array<{ id: string; name: string; rate: number }>;
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

export type LeadType = 'Dinner Cruise' | 'Sunset Cruise' | 'Private';
export const leadTypeOptions: LeadType[] = ['Dinner Cruise', 'Sunset Cruise', 'Private'];


export interface Lead {
  id:string;
  agent: string; // Agent ID
  status: LeadStatus;
  month: string; // Primary Lead/Event Date as ISO string (YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DD)
  notes?: string;
  yacht: string; // Yacht ID
  type: LeadType;
  transactionId?: string;
  modeOfPayment: ModeOfPayment;
  clientName: string;

  // Standardized 9 Package Quantities that map to Yacht rates
  qty_childRate?: number;
  qty_adultStandardRate?: number;
  qty_adultStandardDrinksRate?: number;
  qty_vipChildRate?: number;
  qty_vipAdultRate?: number;
  qty_vipAdultDrinksRate?: number;
  qty_royalChildRate?: number;
  qty_royalAdultRate?: number;
  qty_royalDrinksRate?: number;

  // This will be re-evaluated in Phase 2 to link to specific otherCharges from the yacht
  othersAmtCake?: number; // Currently acts as a quantity for the yacht's single custom charge

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
