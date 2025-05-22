
import type { Lead, User, Yacht, Invoice, BookingReportData, RevenueData, Agent, PieChartDataItem, BookingsByAgentData } from './types';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Alice Smith', email: 'alice@dutchoriental.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
];

// This will be largely replaced by API calls, can be empty or minimal for initial seeding
export const placeholderAgents: Agent[] = [
  // { id: 'DO-agentA', name: 'Prime Charters Agency', email: 'contact@primecharters.com', discountRate: 12, websiteUrl: 'https://primecharters.com', status: 'Active' },
];

// This will be largely replaced by API calls, can be empty or minimal for initial seeding
export const placeholderYachts: Yacht[] = [
  // {
  //   id: 'DO-yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/300x200.png?text=Sea+Serpent',
  //   dhowChildRate: 89, dhowAdultRate: 120, dhowVipRate: 199, dhowVipChildRate: 150, dhowVipAlcoholRate: 250,
  //   oeChildRate: 100, oeAdultRate: 150, oeVipRate: 220, oeVipChildRate: 180, oeVipAlcoholRate: 280,
  //   sunsetChildRate: 110, sunsetAdultRate: 170, sunsetVipRate: 250, sunsetVipChildRate: 200, sunsetVipAlcoholRate: 300,
  //   lotusChildRate: 120, lotusAdultRate: 180, lotusVipRate: 270, lotusVipChildRate: 220, lotusVipAlcoholRate: 320,
  //   royalRate: 500,
  //   othersAmtCake_rate: 100,
  // },
];

// This data is used for Invoice related components which are not yet live
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
    createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-07-01T10:00:00Z'
  },
  {
    id: 'DO-lead2', agent: 'DO-agentB', status: 'Proposal Sent', month: '2024-07', yacht: 'DO-yacht2',
    type: 'Private Party', modeOfPayment: 'Offline', clientName: 'Innovate Ltd',
    oeAdultQty: 10, totalAmount: 1600, commissionPercentage: 15, commissionAmount: 240,
    netAmount: 1360, paidAmount: 500, balanceAmount: 1100,
    createdAt: '2024-06-20T10:00:00Z', updatedAt: '2024-07-05T10:00:00Z'
  },
  {
    id: 'DO-lead3', agent: 'DO-agentA', status: 'Closed Won', month: '2024-08', yacht: 'DO-yacht3',
    type: 'Tour Group', modeOfPayment: 'Credit', clientName: 'Solutions Inc',
    dhowAdultQty: 10, totalAmount: 1100, commissionPercentage: 12, commissionAmount: 132,
    netAmount: 968, paidAmount: 1100, balanceAmount: 0,
    createdAt: '2024-07-10T10:00:00Z', updatedAt: '2024-07-12T10:00:00Z'
  },
  {
    id: 'DO-lead4', agent: 'DO-agentC', status: 'New', month: '2024-08', yacht: 'DO-yacht4',
    type: 'Wedding Reception', modeOfPayment: 'Online', clientName: 'Global Co',
    dhowVipQty: 20, othersAmtCake: 100, totalAmount: 4200, commissionPercentage: 10, commissionAmount: 420,
    netAmount: 3780, paidAmount: 0, balanceAmount: 4200,
    createdAt: '2024-07-20T10:00:00Z', updatedAt: '2024-07-20T10:00:00Z'
  },
  {
    id: 'DO-lead5', agent: 'DO-agentB', status: 'Closed Won', month: '2024-09', yacht: 'DO-yacht1',
    type: 'Birthday Celebration', modeOfPayment: 'Offline', clientName: 'Celebrations LLC',
    dhowChildQty: 10, dhowAdultQty: 10, totalAmount: 2090, commissionPercentage: 15, commissionAmount: 313.50,
    netAmount: 1776.50, paidAmount: 2090, balanceAmount: 0,
    createdAt: '2024-08-10T10:00:00Z', updatedAt: '2024-08-15T10:00:00Z'
  }
];


// Dashboard related placeholder data - some of these will become dynamic
// BookingReportChart - Will become dynamic based on live leads
export const placeholderBookingReport: BookingReportData[] = [
  { month: 'Jan', bookings: 12 }, { month: 'Feb', bookings: 18 }, { month: 'Mar', bookings: 20 },
  { month: 'Apr', bookings: 27 }, { month: 'May', bookings: 19 }, { month: 'Jun', bookings: 23 },
  { month: 'Jul', bookings: 15 },
];

// RevenueSummary - Will become dynamic based on live leads
export const placeholderRevenueData: RevenueData[] = [
    { period: 'Today', amount: 5250 },
    { period: 'This Month', amount: 85600 },
    { period: 'This Year', amount: 750200 },
];

// InvoiceStatusPieChart - Remains on placeholderInvoices
const paidInvoices = placeholderInvoices.filter(inv => inv.status === 'Paid').length;
const pendingInvoices = placeholderInvoices.filter(inv => inv.status === 'Pending').length;
const overdueInvoices = placeholderInvoices.filter(inv => inv.status === 'Overdue').length;

export const placeholderInvoiceStatusData: PieChartDataItem[] = [
  { name: 'Paid', value: paidInvoices, fill: 'hsl(var(--chart-1))' },
  { name: 'Pending', value: pendingInvoices, fill: 'hsl(var(--chart-2))' },
  { name: 'Overdue', value: overdueInvoices, fill: 'hsl(var(--chart-3))' },
].filter(item => item.value > 0);


// SalesByYachtPieChart - Will become dynamic based on live leads and yachts
const salesByYachtMap = new Map<string, number>();
placeholderLeads.forEach(lead => {
  if (lead.status === 'Closed Won' && lead.netAmount) {
    const currentSales = salesByYachtMap.get(lead.yacht) || 0;
    salesByYachtMap.set(lead.yacht, currentSales + (lead.netAmount || 0));
  }
});

export const placeholderSalesByYacht: PieChartDataItem[] = Array.from(salesByYachtMap.entries()).map(([yachtId, totalRevenue], index) => {
  // This part will be tricky without live yacht data for names, so it might show IDs
  return {
    name: `Yacht ${yachtId.substring(0,6)}...`,
    value: totalRevenue,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`, 
  };
}).filter(item => item.value > 0);


// BookingsByAgentBarChart - Will become dynamic based on live leads and agents
const bookingsByAgentMap = new Map<string, number>();
placeholderLeads.forEach(lead => {
  if (lead.status === 'Closed Won') { 
    const currentBookings = bookingsByAgentMap.get(lead.agent) || 0;
    bookingsByAgentMap.set(lead.agent, currentBookings + 1);
  }
});

export const placeholderBookingsByAgent: BookingsByAgentData[] = Array.from(bookingsByAgentMap.entries()).map(([agentId, bookingsCount]) => {
  // This part will be tricky without live agent data for names
  return {
    agentName: `Agent ${agentId.substring(0,6)}...`,
    bookings: bookingsCount,
  };
}).filter(item => item.bookings > 0);
