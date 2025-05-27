
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

export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';

  // New standardized package rates
  childRate?: number;
  adultStandardRate?: number;
  adultStandardDrinksRate?: number;
  vipChildRate?: number;
  vipAdultRate?: number;
  vipAdultDrinksRate?: number;
  royalChildRate?: number;
  royalAdultRate?: number;
  royalDrinksRate?: number;

  // This field seems like a leftover, decide if it's needed or if it's part of the 9 rates above
  othersAmtCake_rate?: number; 
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
export type ModeOfPayment = 'Online' | 'Credit' | 'Cash/Card';


export interface Lead {
  id:string;
  agent: string; // Agent ID
  status: LeadStatus;
  month: string; // Primary Lead/Event Date as ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
  notes?: string; // For user feed/notes about the lead
  yacht: string; // Yacht ID
  type: string; // Lead type
  invoiceId?: string;
  modeOfPayment: ModeOfPayment;
  clientName: string;

  // DHOW Package Quantities
  dhowChildQty?: number;
  dhowAdultQty?: number;
  dhowVipQty?: number;
  dhowVipChildQty?: number;
  dhowVipAlcoholQty?: number;

  // OE Package Quantities
  oeChildQty?: number;
  oeAdultQty?: number;
  oeVipQty?: number;
  oeVipChildQty?: number;
  oeVipAlcoholQty?: number;

  // SUNSET Package Quantities
  sunsetChildQty?: number;
  sunsetAdultQty?: number;
  sunsetVipQty?: number;
  sunsetVipChildQty?: number;
  sunsetVipAlcoholQty?: number;

  // LOTUS Package Quantities
  lotusChildQty?: number;
  lotusAdultQty?: number;
  lotusVipQty?: number;
  lotusVipChildQty?: number;
  lotusVipAlcoholQty?: number;

  // Royal Package Quantities
  royalQty?: number;
  
  othersAmtCake?: number; // Direct amount for other charges like cake

  totalAmount: number;
  commissionAmount?: number;
  commissionPercentage: number; // From Agent
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;

  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
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
export type { LeadStatus as ExportedLeadStatus, ModeOfPayment as ExportedModeOfPayment };
