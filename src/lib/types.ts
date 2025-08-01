
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
  id: string;
  name: string;
  rate: number;
}

export const yachtCategoryOptions = ['Dinner Cruise', 'Superyacht Sightseeing Cruise', 'Private Cruise'] as const;
export type YachtCategory = typeof yachtCategoryOptions[number];


export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';
  category: YachtCategory;
  packages?: YachtPackageItem[];
  customPackageInfo?: string;
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

export const leadStatusOptions = ['Balance', 'Closed'] as const;
export type LeadStatus = typeof leadStatusOptions[number];

export const modeOfPaymentOptions = ['CARD', 'CASH', 'CASH / CARD', 'NOMOD', 'PAYMOD', 'RUZINN', 'CREDIT', 'OTHER'] as const;
export type ModeOfPayment = typeof modeOfPaymentOptions[number];

export const leadTypeOptions = ['Dinner Cruise', 'Superyacht Sightseeing Cruise', 'Private Cruise'] as const;
export type LeadType = typeof leadTypeOptions[number];

export const paymentConfirmationStatusOptions = ['CONFIRMED', 'UNCONFIRMED'] as const;
export type PaymentConfirmationStatus = typeof paymentConfirmationStatusOptions[number];

export interface LeadPackageQuantity {
  packageId: string;
  packageName: string;
  quantity: number;
  rate: number;
}

export interface Lead {
  id: string;
  agent: string;
  status: LeadStatus;
  month: string;
  notes?: string;
  yacht: string;
  type: LeadType;
  hoursOfBooking?: number;
  catering?: string;
  paymentConfirmationStatus: PaymentConfirmationStatus;
  transactionId?: string;
  modeOfPayment: ModeOfPayment;
  clientName: string;

  packageQuantities?: LeadPackageQuantity[];
  freeGuestCount?: number;
  perTicketRate?: number;

  totalAmount: number;
  commissionPercentage: number;
  commissionAmount?: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;

  createdAt: string;
  updatedAt: string;
  lastModifiedByUserId?: string;
  ownerUserId?: string;
}

export const opportunityPipelinePhaseOptions = ['New', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;
export type OpportunityPipelinePhase = typeof opportunityPipelinePhaseOptions[number];

export const opportunityPriorityOptions = ['Low', 'Medium', 'High'] as const;
export type OpportunityPriority = typeof opportunityPriorityOptions[number];

export const opportunityStatusOptions = ['Active', 'On Hold', 'Inactive'] as const;
export type OpportunityStatus = typeof opportunityStatusOptions[number];

export interface Opportunity {
    id: string;
    estimatedClosingDate: string; // ISO Date String
    potentialCustomer: string;
    ownerUserId: string;
    yachtId: string;
    productType: YachtCategory;
    pipelinePhase: OpportunityPipelinePhase;
    priority: OpportunityPriority;
    estimatedRevenue: number;
    meanExpectedValue?: number; // Optional, can be calculated
    currentStatus: OpportunityStatus;
    followUpUpdates?: string; // Text field for notes/updates
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
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


export type { LeadStatus as ExportedLeadStatus, ModeOfPayment as ExportedModeOfPayment, LeadType as ExportedLeadType, PaymentConfirmationStatus as ExportedPaymentConfirmationStatus };
