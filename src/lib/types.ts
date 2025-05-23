
export interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  avatarUrl?: string;
  websiteUrl?: string;
  status?: 'Active' | 'Inactive' | 'Archived';
  password?: string; // Added for form handling, not secure storage
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  discountRate: number;
  websiteUrl?: string;
  status: 'Active' | 'Non Active' | 'Dead';
}

export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';

  // DHOW Package Rates
  dhowChildRate?: number;
  dhowAdultRate?: number;
  dhowVipRate?: number;
  dhowVipChildRate?: number;
  dhowVipAlcoholRate?: number;

  // OE Package Rates
  oeChildRate?: number;
  oeAdultRate?: number;
  oeVipRate?: number;
  oeVipChildRate?: number;
  oeVipAlcoholRate?: number;

  // SUNSET Package Rates
  sunsetChildRate?: number;
  sunsetAdultRate?: number;
  sunsetVipRate?: number;
  sunsetVipChildRate?: number;
  sunsetVipAlcoholRate?: number;

  // LOTUS Package Rates
  lotusChildRate?: number;
  lotusAdultRate?: number;
  lotusVipRate?: number;
  lotusVipChildRate?: number;
  lotusVipAlcoholRate?: number;

  // Royal Package Rate (General)
  royalRate?: number;

  othersAmtCake_rate?: number;
}

export interface Invoice {
  id: string;
  leadId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  createdAt: string;
}

export type LeadStatus = 'New' | 'Connected' | 'Qualified' | 'Proposal Sent' | 'Closed Won' | 'Closed Lost';
export type ModeOfPayment = 'Online' | 'Credit' | 'Cash/Card';


export interface Lead {
  id:string;
  agent: string; // Agent ID
  status: LeadStatus;
  month: string; // YYYY-MM for reporting/event month
  eventDate?: string; // Optional specific date for the event/booking (ISO date string)
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
  lastModifiedByUserId?: string; // ID of the user who last created/updated the lead
  ownerUserId?: string; // ID of the user who "owns" this lead
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

