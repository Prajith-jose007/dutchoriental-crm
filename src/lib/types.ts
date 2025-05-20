export interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  avatarUrl?: string;
}

export interface Yacht {
  id: string;
  name: string;
  imageUrl?: string;
  capacity: number;
  status: 'Available' | 'Booked' | 'Maintenance';
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
  id: string;
  agent: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Closed Won' | 'Closed Lost';
  month: string; // e.g., "YYYY-MM"
  yacht: string;
  type: string; // e.g., "Corporate", "Private Party", "Tour"
  invoiceId?: string;
  packageType: string; // e.g., "DHOW", "OE", "SUNSET", "LOTUS"
  clientName: string;
  free?: boolean;
  // Package details as individual items or structured data
  dhowChild89?: number; // Store quantity or amount, needs clarification
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
  othersAmtCake?: number;
  quantity: number; // Overall quantity or specific item quantity?
  rate: number;
  totalAmount: number;
  commissionPercentage: number;
  netAmount: number;
  paidAmount: number;
  balanceAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingReportData {
  month: string;
  bookings: number;
}

export interface RevenueData {
  period: string; // 'Daily', 'Monthly', 'Yearly'
  amount: number;
}
