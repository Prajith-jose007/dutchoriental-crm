
import type { Lead, User, Yacht, Invoice, BookingReportData, RevenueData, Agent, PieChartDataItem, BookingsByAgentData } from './types';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Alice Smith', email: 'alice@dutchoriental.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
  { id: 'DO-admin', name: 'Admin User', email: 'admin@dutchoriental.com', designation: 'System Administrator', avatarUrl: 'https://placehold.co/100x100.png?text=AU', status: 'Active' },
];

export const placeholderAgents: Agent[] = [
  // Data will be fetched from API
];

export const placeholderYachts: Yacht[] = [
  // Data will be fetched from API
];

// This data is used for Invoice related components which are not yet live via APIs
export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp', amount: 1200, dueDate: '2024-08-15', status: 'Paid', createdAt: '2024-07-01' },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd', amount: 1600, dueDate: '2024-08-20', status: 'Pending', createdAt: '2024-07-05' },
  { id: 'DO-inv003', leadId: 'DO-lead3', clientName: 'Solutions Inc', amount: 1100, dueDate: '2024-07-25', status: 'Overdue', createdAt: '2024-06-10' },
  { id: 'DO-inv004', leadId: 'DO-lead4', clientName: 'Global Co', amount: 4200, dueDate: '2024-09-01', status: 'Pending', createdAt: '2024-07-15' },
  { id: 'DO-inv005', leadId: 'DO-lead5', clientName: 'Alpha LLC (Repeat)', amount: 2090, dueDate: '2024-09-10', status: 'Paid', createdAt: '2024-08-01' },
];


// Placeholder leads can be used for initial seeding if the leads API returns empty
export const placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1', agent: 'DO-agentA', status: 'Closed Won', month: '2024-07', yacht: 'DO-yacht1',
    type: 'Corporate Event', invoiceId: 'DO-inv001', modeOfPayment: 'Online', clientName: 'Tech Corp',
    dhowAdultQty: 10, totalAmount: 1200, commissionPercentage: 12, commissionAmount: 144,
    netAmount: 1056, paidAmount: 1200, balanceAmount: 0,
    createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-07-01T10:00:00Z', lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead2', agent: 'DO-agentB', status: 'Proposal Sent', month: '2024-07', yacht: 'DO-yacht2',
    type: 'Private Party', modeOfPayment: 'Offline', clientName: 'Innovate Ltd',
    oeAdultQty: 10, totalAmount: 1600, commissionPercentage: 15, commissionAmount: 240,
    netAmount: 1360, paidAmount: 500, balanceAmount: 1100,
    createdAt: '2024-06-20T10:00:00Z', updatedAt: '2024-07-05T10:00:00Z', lastModifiedByUserId: 'DO-user2', ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-lead3', agent: 'DO-agentA', status: 'Closed Won', month: '2024-08', yacht: 'DO-yacht3',
    type: 'Tour Group', modeOfPayment: 'Credit', clientName: 'Solutions Inc',
    dhowAdultQty: 10, totalAmount: 1100, commissionPercentage: 12, commissionAmount: 132,
    netAmount: 968, paidAmount: 1100, balanceAmount: 0,
    createdAt: '2024-07-10T10:00:00Z', updatedAt: '2024-07-12T10:00:00Z', lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead4', agent: 'DO-agentC', status: 'New', month: '2024-08', yacht: 'DO-yacht4',
    type: 'Wedding Reception', modeOfPayment: 'Online', clientName: 'Global Co',
    dhowVipQty: 20, othersAmtCake: 100, totalAmount: 4200, commissionPercentage: 10, commissionAmount: 420,
    netAmount: 3780, paidAmount: 0, balanceAmount: 4200,
    createdAt: '2024-07-20T10:00:00Z', updatedAt: '2024-07-20T10:00:00Z', lastModifiedByUserId: 'DO-user3', ownerUserId: 'DO-user3'
  },
  {
    id: 'DO-lead5', agent: 'DO-agentB', status: 'Qualified', month: '2024-09', yacht: 'DO-yacht1',
    type: 'Birthday Celebration', modeOfPayment: 'Offline', clientName: 'Celebrations LLC',
    dhowChildQty: 10, dhowAdultQty: 10, totalAmount: 2090, commissionPercentage: 15, commissionAmount: 313.50,
    netAmount: 1776.50, paidAmount: 2090, balanceAmount: 0,
    createdAt: '2024-08-10T10:00:00Z', updatedAt: '2024-08-15T10:00:00Z', lastModifiedByUserId: 'DO-user2', ownerUserId: 'DO-user2'
  }
];


// Dashboard related placeholder data - some of these will become dynamic
// BookingReportChart - Will become dynamic based on live leads
export const placeholderBookingReport: BookingReportData[] = [
  // Data will be fetched from API
];

// RevenueSummary - Will become dynamic based on live leads
export const placeholderRevenueData: RevenueData[] = [
    // Data will be fetched from API
];

// InvoiceStatusPieChart - Remains on placeholderInvoices for now
const paidInvoicesCount = placeholderInvoices.filter(inv => inv.status === 'Paid').length;
const pendingInvoicesCount = placeholderInvoices.filter(inv => inv.status === 'Pending').length;
const overdueInvoicesCount = placeholderInvoices.filter(inv => inv.status === 'Overdue').length;

export const placeholderInvoiceStatusData: PieChartDataItem[] = [
  { name: 'Paid', value: paidInvoicesCount, fill: 'hsl(var(--chart-1))' },
  { name: 'Pending', value: pendingInvoicesCount, fill: 'hsl(var(--chart-2))' },
  { name: 'Overdue', value: overdueInvoicesCount, fill: 'hsl(var(--chart-3))' },
].filter(item => item.value > 0);


// SalesByYachtPieChart - Will become dynamic based on live leads and yachts
export const placeholderSalesByYacht: PieChartDataItem[] = [
    // Data will be fetched from API
];


// BookingsByAgentBarChart - Will become dynamic based on live leads and agents
export const placeholderBookingsByAgent: BookingsByAgentData[] = [
    // Data will be fetched from API
];
