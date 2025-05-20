
export interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  avatarUrl?: string;
  commissionRate?: number; // Added commission rate
}

export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';
  // Storing rates for each package item directly on the yacht
  dhowChild89_rate?: number;
  dhowFood99_rate?: number;
  dhowDrinks199_rate?: number;
  dhowVip299_rate?: number;
  oeChild129_rate?: number;
  oeFood149_rate?: number;
  oeDrinks249_rate?: number;
  oeVip349_rate?: number;
  sunsetChild179_rate?: number;
  sunsetFood199_rate?: number;
  sunsetDrinks299_rate?: number;
  lotusFood249_rate?: number;
  lotusDrinks349_rate?: number;
  lotusVip399_rate?: number;
  lotusVip499_rate?: number;
  othersAmtCake_rate?: number; // Assuming 'othersAmtCake' might also have a configurable base rate per yacht if it's a recurring item. Or it's a direct amount.
                                // For now, if 'othersAmtCake' in Lead is a direct amount, this field might not be used in calc the same way.
                                // If 'othersAmtCake' in Lead becomes a quantity, this rate is used.
                                // The PRD field name implies it's an amount, so this yacht rate might be for a default quantity=1 scenario.
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

export interface PackageItem {
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Lead {
  id:string;
  agent: string; // User ID or Name
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Closed Won' | 'Closed Lost';
  month: string; // e.g., "YYYY-MM"
  yacht: string; // Yacht ID
  type: string; // e.g., "Corporate", "Private Party", "Tour"
  invoiceId?: string;
  packageType: 'DHOW' | 'OE' | 'SUNSET' | 'LOTUS' | 'OTHER' | ''; // Made it more specific, added empty for initial
  clientName: string;
  free?: boolean;
  // Package details - these fields store quantities
  dhowChild89?: number;
  dhowFood99?: number;
  dhowDrinks199?: number;
  dhowVip299?: number;
  oeChild129?: number;
  oeFood149?: number;
  oeDrinks249?: number;
  oeVip349?: number;
  sunsetChild179?: number;
  sunsetFood199?: number;
  sunsetDrinks299?: number;
  lotusFood249?: number;
  lotusDrinks349?: number;
  lotusVip399?: number;
  lotusVip499?: number;
  othersAmtCake?: number; // This is an amount, not a quantity.
  
  quantity: number; // Overall/primary quantity - may be less relevant if totalAmount is sum of packages
  rate: number; // Primary rate - may be less relevant
  
  totalAmount: number;
  commissionAmount?: number; // Calculated field
  commissionPercentage: number; // This comes from Agent, but stored on lead for record keeping
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface BookingReportData {
  month: string;
  bookings: number;
}

export interface RevenueData {
  period: string; // 'Daily', 'Monthly', 'Yearly'
  amount: number;
}
