
export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Sales' | 'Accounts';

export interface User {
  id: string;
  name: string;
  email: string;
  designation: UserRole; // Using designation as the role field
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

export const yachtCategoryOptions = ['Dinner Cruise', 'Superyacht Sightseeing Cruise', 'Private Cruise', 'Shared Cruise'] as const;
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
  pricePerHour?: number;
  minHours?: number;
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

export const leadStatusOptions = [
  'New',
  'Contacted',
  'Follow-up',
  'Quoted',
  'Negotiation',
  'Confirmed',
  'Closed (Won)',
  'Unconfirmed',
  'Balance',
  'In Progress',
  'Checked In',
  'Completed',
  'Lost',
  'Closed (Lost)'
] as const;
export type LeadStatus = typeof leadStatusOptions[number];

export const leadSourceOptions = ['Website', 'WhatsApp', 'Instagram', 'Walk-in', 'Partner', 'Agent'] as const;
export type LeadSource = typeof leadSourceOptions[number];

export const yachtTypeOptions = ['Luxury', 'Mega Yacht', 'Catamaran', 'Speedboat'] as const;
export type YachtType = typeof yachtTypeOptions[number];

export const leadOccasionOptions = ['Birthday', 'Anniversary', 'Corporate', 'Proposal', 'Party', 'Other'] as const;
export type LeadOccasion = typeof leadOccasionOptions[number];

export const leadPriorityOptions = ['Low', 'Medium', 'High'] as const;
export type LeadPriority = typeof leadPriorityOptions[number];

export const modeOfPaymentOptions = ['CARD', 'CASH', 'CASH / CARD', 'NOMOD', 'PAYMOD', 'RUZINN', 'CREDIT', 'OTHER'] as const;
export type ModeOfPayment = typeof modeOfPaymentOptions[number];

export const leadTypeOptions = ['Dinner Cruise', 'Superyacht Sightseeing Cruise', 'Private Cruise', 'Shared Cruise'] as const;
export type LeadType = typeof leadTypeOptions[number];

export const paymentConfirmationStatusOptions = ['CONFIRMED', 'UNCONFIRMED'] as const;
export type PaymentConfirmationStatus = typeof paymentConfirmationStatusOptions[number];

export interface LeadPackageQuantity {
  packageId: string;
  packageName: string;
  quantity: number;
  rate: number;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationality?: string;
  language?: string;
  totalBookings: number;
  totalRevenue: number;
  lastBookingDate?: string;
  customerType: 'New' | 'Repeat' | 'VIP' | 'Corporate';
  preferences?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  agent: string; // Linked Agent ID
  status: LeadStatus;
  month: string; // Event Date/Time
  notes?: string;
  yacht: string; // Yacht ID
  type: LeadType;
  paymentConfirmationStatus: PaymentConfirmationStatus;
  transactionId?: string;
  bookingRefNo?: string;
  modeOfPayment: ModeOfPayment;
  clientName: string; // Often linked to first/last name

  // New Lead fields
  customerPhone?: string;
  customerEmail?: string;
  nationality?: string;
  language?: string;
  source?: LeadSource;
  customAgentName?: string;
  customAgentPhone?: string;
  inquiryDate?: string;
  yachtType?: YachtType;
  adultsCount?: number;
  kidsCount?: number;
  durationHours?: number;
  budgetRange?: string;
  occasion?: LeadOccasion;
  priority?: LeadPriority;
  nextFollowUpDate?: string;
  closingProbability?: number; // %

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

  checkInStatus?: 'Checked In' | 'Not Checked In' | 'Partially Checked In';
  checkInTime?: string;
  freeGuestDetails?: FreeGuestDetail[];
  checkedInQuantities?: CheckedInQuantity[];

  // Operation details
  captainName?: string;
  crewDetails?: string;
  idVerified?: boolean;
  extraHoursUsed?: number;
  extraCharges?: number;
  customerSignatureUrl?: string;
}

export interface Quotation {
  id: string;
  leadId: string;
  yachtId: string;
  basePricePerHour: number;
  durationHours: number;
  subtotal: number;
  addonDetails?: {
    bbqSetup?: number;
    dj?: number;
    decorations?: number;
    waterSports?: number;
    foodBeverage?: number;
    alcoholPackage?: number;
  };
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  validUntil: string;
  createdAt: string;
}

export interface Task {
  id: string;
  leadId?: string;
  bookingId?: string;
  opportunityId?: string;
  type: 'Call' | 'WhatsApp' | 'Email';
  dueDate: string;
  assignedTo: string; // User ID
  status: 'Pending' | 'Completed';
  notes?: string;
  createdAt: string;
}

export interface CheckedInQuantity {
  packageId: string;
  quantity: number;
}

export interface FreeGuestDetail {
  type: string;
  quantity: number;
}

export const opportunityPipelinePhaseOptions = ['New', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;
export type OpportunityPipelinePhase = typeof opportunityPipelinePhaseOptions[number];

export const opportunityPriorityOptions = ['Low', 'Medium', 'High'] as const;
export type OpportunityPriority = typeof opportunityPriorityOptions[number];

export const opportunityStatusOptions = ['Active', 'On Hold', 'Inactive'] as const;
export type OpportunityStatus = typeof opportunityStatusOptions[number];

export const opportunityReportTypeOptions = ['Trip', 'Phone Call', 'Email', 'Meeting'] as const;
export type OpportunityReportType = typeof opportunityReportTypeOptions[number];

export const opportunityTripReportStatusOptions = ['In Process', 'Completed', 'Pending'] as const;
export type OpportunityTripReportStatus = typeof opportunityTripReportStatusOptions[number];

export interface Opportunity {
  id: string;
  potentialCustomer: string;
  subject: string;
  ownerUserId: string;
  yachtId: string;
  productType: YachtCategory;
  pipelinePhase: OpportunityPipelinePhase;
  priority: OpportunityPriority;
  currentStatus: OpportunityStatus;
  estimatedRevenue: number;
  closingProbability?: number;
  meanExpectedValue?: number;
  followUpUpdates?: string;
  createdAt: string;
  updatedAt: string;
  estimatedClosingDate: string;
  location?: string;
  reportType?: OpportunityReportType;
  tripReportStatus?: OpportunityTripReportStatus;
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
