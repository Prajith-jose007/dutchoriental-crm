
import type { Lead, User, Yacht, Invoice, BookingReportData, RevenueData, Agent, PieChartDataItem, BookingsByAgentData } from './types';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Alice Smith', email: 'alice@dutchoriental.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
  { id: 'DO-admin', name: 'Admin User', email: 'admin@dutchoriental.com', designation: 'System Administrator', avatarUrl: 'https://placehold.co/100x100.png?text=AU', status: 'Active' },
];

// These arrays will be used by the API routes to initialize their in-memory stores.
// They can be minimal as the primary way to manage this data should be via the app's UI and API.
export const placeholderAgents: Agent[] = [
  { id: 'DO-agentA', name: 'Prime Charters Agency', email: 'contact@primecharters.com', discountRate: 12, websiteUrl: 'https://primecharters.com', status: 'Active' },
  { id: 'DO-agentB', name: 'Luxury Yacht Bookings Co.', email: 'bookings@luxuryyachtbookings.com', discountRate: 15, websiteUrl: 'https://luxuryyachtbookings.com', status: 'Active' },
  { id: 'DO-agentC', name: 'Seven Seas Agents', email: 'info@sevenseasagents.com', discountRate: 10, status: 'Non Active' },
];

export const placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png',
    dhowChildRate: 89, dhowAdultRate: 129, dhowVipRate: 189, dhowVipChildRate: 139, dhowVipAlcoholRate: 249,
    oeChildRate: 99, oeAdultRate: 149, oeVipRate: 209, oeVipChildRate: 159, oeVipAlcoholRate: 269,
    sunsetChildRate: 79, sunsetAdultRate: 119, sunsetVipRate: 179, sunsetVipChildRate: 129, sunsetVipAlcoholRate: 239,
    lotusChildRate: 109, lotusAdultRate: 159, lotusVipRate: 219, lotusVipChildRate: 169, lotusVipAlcoholRate: 279,
    royalRate: 5000, othersAmtCake_rate: 150,
  },
  {
    id: 'DO-yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Available', imageUrl: 'https://placehold.co/600x400.png',
    dhowChildRate: 95, dhowAdultRate: 135, dhowVipRate: 195, dhowVipChildRate: 145, dhowVipAlcoholRate: 255,
    oeChildRate: 105, oeAdultRate: 155, oeVipRate: 215, oeVipChildRate: 165, oeVipAlcoholRate: 275,
    sunsetChildRate: 85, sunsetAdultRate: 125, sunsetVipRate: 185, sunsetVipChildRate: 135, sunsetVipAlcoholRate: 245,
    lotusChildRate: 115, lotusAdultRate: 165, lotusVipRate: 225, lotusVipChildRate: 175, lotusVipAlcoholRate: 285,
    royalRate: 7500, othersAmtCake_rate: 200,
  },
  {
    id: 'DO-yacht3', name: 'Marina Dream', capacity: 30, status: 'Maintenance', imageUrl: 'https://placehold.co/600x400.png',
    dhowChildRate: 80, dhowAdultRate: 120, dhowVipRate: 180, dhowVipChildRate: 130, dhowVipAlcoholRate: 240,
    oeChildRate: 90, oeAdultRate: 130, oeVipRate: 190, oeVipChildRate: 140, oeVipAlcoholRate: 250,
    royalRate: 4000, othersAmtCake_rate: 100,
  },
];


// Placeholder leads can be used for initial seeding if the leads API returns empty
// or for the API route to initialize its in-memory store.
export const placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1', agent: 'DO-agentA', status: 'Closed Won', month: '2024-07', yacht: 'DO-yacht1',
    type: 'Corporate Event', invoiceId: 'DO-inv001', modeOfPayment: 'Online', clientName: 'Tech Corp',
    dhowAdultQty: 10, totalAmount: 1290, commissionPercentage: 12, commissionAmount: 154.8,
    netAmount: 1135.2, paidAmount: 1290, balanceAmount: 0,
    createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-07-01T10:00:00Z', lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead2', agent: 'DO-agentB', status: 'Proposal Sent', month: '2024-07', yacht: 'DO-yacht2',
    type: 'Private Party', modeOfPayment: 'Offline', clientName: 'Innovate Ltd',
    oeAdultQty: 10, totalAmount: 1550, commissionPercentage: 15, commissionAmount: 232.5,
    netAmount: 1317.5, paidAmount: 500, balanceAmount: 1050,
    createdAt: '2024-06-20T10:00:00Z', updatedAt: '2024-07-05T10:00:00Z', lastModifiedByUserId: 'DO-user2', ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-lead3', agent: 'DO-agentA', status: 'Closed Won', month: '2024-08', yacht: 'DO-yacht3',
    type: 'Tour Group', modeOfPayment: 'Credit', clientName: 'Solutions Inc',
    dhowAdultQty: 10, totalAmount: 1200, commissionPercentage: 12, commissionAmount: 144,
    netAmount: 1056, paidAmount: 1200, balanceAmount: 0,
    createdAt: '2024-07-10T10:00:00Z', updatedAt: '2024-07-12T10:00:00Z', lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead4', agent: 'DO-agentC', status: 'New', month: '2024-08', yacht: 'DO-yacht1', // Changed to DO-yacht1 to match rates
    type: 'Wedding Reception', modeOfPayment: 'Online', clientName: 'Global Co',
    dhowVipQty: 20, othersAmtCake: 100, totalAmount: 3880, commissionPercentage: 10, commissionAmount: 388, // (20*189)+100 = 3780+100=3880
    netAmount: 3492, paidAmount: 0, balanceAmount: 3880,
    createdAt: '2024-07-20T10:00:00Z', updatedAt: '2024-07-20T10:00:00Z', lastModifiedByUserId: 'DO-user3', ownerUserId: 'DO-user3'
  },
  {
    id: 'DO-lead5', agent: 'DO-agentB', status: 'Qualified', month: '2024-09', yacht: 'DO-yacht1',
    type: 'Birthday Celebration', modeOfPayment: 'Offline', clientName: 'Celebrations LLC',
    dhowChildQty: 10, dhowAdultQty: 10, totalAmount: 2180, commissionPercentage: 15, commissionAmount: 327, // (10*89)+(10*129) = 890+1290=2180
    netAmount: 1853, paidAmount: 2180, balanceAmount: 0,
    createdAt: '2024-08-10T10:00:00Z', updatedAt: '2024-08-15T10:00:00Z', lastModifiedByUserId: 'DO-user2', ownerUserId: 'DO-user2'
  }
];

// This data is used for Invoice related components as there's no Invoice API yet.
export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp', amount: 1290, dueDate: '2024-08-15', status: 'Paid', createdAt: '2024-07-01' },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd', amount: 1550, dueDate: '2024-08-20', status: 'Pending', createdAt: '2024-07-05' },
  { id: 'DO-inv003', leadId: 'DO-lead3', clientName: 'Solutions Inc', amount: 1200, dueDate: '2024-07-25', status: 'Overdue', createdAt: '2024-06-10' },
  { id: 'DO-inv004', leadId: 'DO-lead4', clientName: 'Global Co', amount: 3880, dueDate: '2024-09-01', status: 'Pending', createdAt: '2024-07-15' },
  { id: 'DO-inv005', leadId: 'DO-lead5', clientName: 'Alpha LLC (Repeat)', amount: 2180, dueDate: '2024-09-10', status: 'Paid', createdAt: '2024-08-01' },
];


// Dashboard related placeholder data - some of these will become dynamic
// BookingReportChart - Will use live leads
export const placeholderBookingReport: BookingReportData[] = [
  // Data will be fetched from API/calculated from live leads
];

// RevenueSummary - Will use live leads
export const placeholderRevenueData: RevenueData[] = [
    // Data will be fetched from API/calculated from live leads
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


// SalesByYachtPieChart - Will use live leads and yachts
export const placeholderSalesByYacht: PieChartDataItem[] = [
    // Data will be fetched from API/calculated from live leads & yachts
];


// BookingsByAgentBarChart - Will use live leads and agents
export const placeholderBookingsByAgent: BookingsByAgentData[] = [
    // Data will be fetched from API/calculated from live leads & agents
];
