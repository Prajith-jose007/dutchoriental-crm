
import type { Lead, User, Yacht, Invoice, BookingReportData, RevenueData, Agent, PieChartDataItem, BookingsByAgentData } from './types';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Alice Smith', email: 'alice@dutchoriental.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
];

export const placeholderAgents: Agent[] = [
  { id: 'DO-agentA', name: 'Prime Charters Agency', email: 'contact@primecharters.com', discountRate: 12, websiteUrl: 'https://primecharters.com', status: 'Active' },
  { id: 'DO-agentB', name: 'Luxury Yacht Bookings Co.', email: 'bookings@luxuryyachtbookings.com', discountRate: 15, websiteUrl: 'https://lyb.co', status: 'Active' },
  { id: 'DO-agentC', name: 'Nautical Adventures Ltd.', email: 'info@nauticaladventures.com', discountRate: 10, status: 'Non Active' },
  { id: 'DO-agentD', name: 'Old Timer Fleet (Closed)', email: 'archive@oldtimerfleet.com', discountRate: 5, status: 'Dead' },
];

export const placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/300x200.png?text=Sea+Serpent',
    dhowChildRate: 89, dhowAdultRate: 120, dhowVipRate: 199, dhowVipChildRate: 150, dhowVipAlcoholRate: 250,
    oeChildRate: 100, oeAdultRate: 150, oeVipRate: 220, oeVipChildRate: 180, oeVipAlcoholRate: 280,
    sunsetChildRate: 110, sunsetAdultRate: 170, sunsetVipRate: 250, sunsetVipChildRate: 200, sunsetVipAlcoholRate: 300,
    lotusChildRate: 120, lotusAdultRate: 180, lotusVipRate: 270, lotusVipChildRate: 220, lotusVipAlcoholRate: 320,
    royalRate: 500,
    othersAmtCake_rate: 100, // If cake becomes a per-unit item, otherwise this is unused
  },
  {
    id: 'DO-yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Booked', imageUrl: 'https://placehold.co/300x200.png?text=Ocean+Voyager',
    dhowChildRate: 95, dhowAdultRate: 130, dhowVipRate: 210, dhowVipChildRate: 160, dhowVipAlcoholRate: 260,
    oeChildRate: 105, oeAdultRate: 160, oeVipRate: 230, oeVipChildRate: 190, oeVipAlcoholRate: 290,
    royalRate: 550,
  },
  {
    id: 'DO-yacht3', name: 'Marina Queen', capacity: 75, status: 'Maintenance', imageUrl: 'https://placehold.co/300x200.png?text=Marina+Queen',
    dhowChildRate: 80, dhowAdultRate: 110, dhowVipRate: 190, dhowVipChildRate: 140, dhowVipAlcoholRate: 240,
    royalRate: 450,
  },
  {
    id: 'DO-yacht4', name: 'Azure Spirit', capacity: 60, status: 'Available', imageUrl: 'https://placehold.co/300x200.png?text=Azure+Spirit',
    dhowChildRate: 92, dhowAdultRate: 125, dhowVipRate: 205, dhowVipChildRate: 155, dhowVipAlcoholRate: 255,
    royalRate: 520,
  },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp', amount: 1200, dueDate: '2024-08-15', status: 'Paid', createdAt: '2024-07-01' },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd', amount: 2600, dueDate: '2024-08-20', status: 'Pending', createdAt: '2024-07-05' },
  { id: 'DO-inv003', leadId: 'DO-lead3', clientName: 'Solutions Inc', amount: 1100, dueDate: '2024-07-25', status: 'Overdue', createdAt: '2024-06-10' },
  { id: 'DO-inv004', leadId: 'DO-lead4', clientName: 'Global Co', amount: 2500, dueDate: '2024-09-01', status: 'Pending', createdAt: '2024-07-15' },
  { id: 'DO-inv005', leadId: 'DO-lead1', clientName: 'Alpha LLC (Repeat)', amount: 1200, dueDate: '2024-09-10', status: 'Paid', createdAt: '2024-08-01' },
];


export const placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1', agent: 'DO-agentA', status: 'Closed Won', month: '2024-07', yacht: 'DO-yacht1',
    type: 'Corporate Event', invoiceId: 'DO-inv001', modeOfPayment: 'Online', clientName: 'Tech Corp',
    dhowAdultQty: 10, // 10 * 120 (from DO-yacht1 dhowAdultRate) = 1200
    totalAmount: 1200, commissionPercentage: 12, commissionAmount: 144, // 1200 * 0.12
    netAmount: 1056, paidAmount: 1200, balanceAmount: 0,
    createdAt: '2024-06-15', updatedAt: '2024-07-01'
  },
  {
    id: 'DO-lead2', agent: 'DO-agentB', status: 'Proposal Sent', month: '2024-07', yacht: 'DO-yacht2',
    type: 'Private Party', modeOfPayment: 'Offline', clientName: 'Innovate Ltd',
    oeAdultQty: 20, // 20 * 160 (from DO-yacht2 oeAdultRate) = 3200. Example, if yacht2 had oeAdultRate
    // Assuming oeAdultRate on DO-yacht2 is 130 for this example to reach 2600
    // placeholderYachts needs oeAdultRate for DO-yacht2. Let's assume it's 130 for this lead.
    // To make this consistent, Ocean Voyager (DO-yacht2) needs oeAdultRate.
    // For this lead example: oeAdultQty: 20 * (rate of 130, assuming that's what makes 2600) = 2600
    // I will ensure DO-yacht2 has oeAdultRate.
    totalAmount: 2600, commissionPercentage: 15, commissionAmount: 390, // 2600 * 0.15
    netAmount: 2210, paidAmount: 1000, balanceAmount: 1600,
    createdAt: '2024-06-20', updatedAt: '2024-07-05'
  },
  {
    id: 'DO-lead3', agent: 'DO-agentA', status: 'Closed Won', month: '2024-08', yacht: 'DO-yacht3',
    type: 'Tour Group', modeOfPayment: 'Credit', clientName: 'Solutions Inc',
    dhowAdultQty: 10, // 10 * 110 (from DO-yacht3 dhowAdultRate) = 1100
    totalAmount: 1100, commissionPercentage: 12, commissionAmount: 132,
    netAmount: 968, paidAmount: 1100, balanceAmount: 0,
    createdAt: '2024-07-10', updatedAt: '2024-07-12'
  },
  {
    id: 'DO-lead4', agent: 'DO-agentC', status: 'New', month: '2024-08', yacht: 'DO-yacht4',
    type: 'Wedding Reception', modeOfPayment: 'Online', clientName: 'Global Co',
    royalQty: 5, // 5 * 520 (from DO-yacht4 royalRate) = 2600
    othersAmtCake: 150, // Total should be 2600 + 150 = 2750.
    // The original totalAmount was 9560. This is a big change due to new structure. Let's adjust this example.
    // Let's say dhowVipQty: 20 * (rate of DO-yacht4.dhowVipRate which is 205) = 4100
    // And othersAmtCake = 100. Total = 4200
    dhowVipQty: 20,
    othersAmtCake: 100,
    totalAmount: 4200, commissionPercentage: 10, commissionAmount: 420,
    netAmount: 3780, paidAmount: 0, balanceAmount: 4200,
    createdAt: '2024-07-20', updatedAt: '2024-07-20'
  },
  {
    id: 'DO-lead5', agent: 'DO-agentB', status: 'Closed Won', month: '2024-09', yacht: 'DO-yacht1',
    type: 'Birthday Celebration', modeOfPayment: 'Offline', clientName: 'Celebrations LLC',
    dhowChildQty: 10, // 10 * 89 = 890
    dhowAdultQty: 10, // 10 * 120 = 1200. Total = 890 + 1200 = 2090
    totalAmount: 2090, commissionPercentage: 15, commissionAmount: 313.50,
    netAmount: 1776.50, paidAmount: 2090, balanceAmount: 0,
    createdAt: '2024-08-10', updatedAt: '2024-08-15'
  }
];
// Correcting placeholderLeads based on DO-yacht2 having more rates
placeholderYachts[1] = { // DO-yacht2
    ...placeholderYachts[1],
    oeChildRate: 105, oeAdultRate: 160, oeVipRate: 230, oeVipChildRate: 190, oeVipAlcoholRate: 290,
    sunsetChildRate: 115, sunsetAdultRate: 170, sunsetVipRate: 250, sunsetVipChildRate: 200, sunsetVipAlcoholRate: 300,
    lotusChildRate: 125, lotusAdultRate: 180, lotusVipRate: 270, lotusVipChildRate: 220, lotusVipAlcoholRate: 320,
};
// Re-calculate for DO-lead2 using new yacht rates if needed
// placeholderLeads[1].oeAdultQty = 20; // 20 * 160 (oeAdultRate for DO-yacht2) = 3200
// placeholderLeads[1].totalAmount = 3200;
// placeholderLeads[1].commissionAmount = 3200 * 0.15; // 480
// placeholderLeads[1].netAmount = 3200 - 480; // 2720
// placeholderLeads[1].balanceAmount = 3200 - placeholderLeads[1].paidAmount;

// Let's re-adjust DO-lead2 for simplicity with updated yacht data
placeholderLeads[1].oeAdultQty = 10; // 10 * 160 (Ocean Voyager's oeAdultRate) = 1600
placeholderLeads[1].totalAmount = 1600;
placeholderLeads[1].commissionAmount = 1600 * 0.15; // 240
placeholderLeads[1].netAmount = 1600 - 240; // 1360
placeholderLeads[1].paidAmount = 500; // Given
placeholderLeads[1].balanceAmount = 1600 - 500; // 1100

export const placeholderBookingReport: BookingReportData[] = [
  { month: 'Jan', bookings: 12 },
  { month: 'Feb', bookings: 18 },
  { month: 'Mar', bookings: 20 },
  { month: 'Apr', bookings: 27 },
  { month: 'May', bookings: 19 },
  { month: 'Jun', bookings: 23 },
  { month: 'Jul', bookings: 15 },
];

export const placeholderRevenueData: RevenueData[] = [
    { period: 'Today', amount: 5250 },
    { period: 'This Month', amount: 85600 },
    { period: 'This Year', amount: 750200 },
];

const paidInvoices = placeholderInvoices.filter(inv => inv.status === 'Paid').length;
const pendingInvoices = placeholderInvoices.filter(inv => inv.status === 'Pending').length;
const overdueInvoices = placeholderInvoices.filter(inv => inv.status === 'Overdue').length;

export const placeholderInvoiceStatusData: PieChartDataItem[] = [
  { name: 'Paid', value: paidInvoices, fill: 'hsl(var(--chart-1))' },
  { name: 'Pending', value: pendingInvoices, fill: 'hsl(var(--chart-2))' },
  { name: 'Overdue', value: overdueInvoices, fill: 'hsl(var(--chart-3))' },
].filter(item => item.value > 0);


const salesByYachtMap = new Map<string, number>();
placeholderLeads.forEach(lead => {
  if (lead.status === 'Closed Won') {
    const currentSales = salesByYachtMap.get(lead.yacht) || 0;
    salesByYachtMap.set(lead.yacht, currentSales + (lead.netAmount || 0));
  }
});

export const placeholderSalesByYacht: PieChartDataItem[] = Array.from(salesByYachtMap.entries()).map(([yachtId, totalRevenue], index) => {
  const yacht = placeholderYachts.find(y => y.id === yachtId);
  return {
    name: yacht ? yacht.name : `Yacht ${yachtId.substring(0,6)}...`,
    value: totalRevenue,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`, 
  };
}).filter(item => item.value > 0);


const bookingsByAgentMap = new Map<string, number>();
placeholderLeads.forEach(lead => {
  if (lead.status === 'Closed Won') { 
    const currentBookings = bookingsByAgentMap.get(lead.agent) || 0;
    bookingsByAgentMap.set(lead.agent, currentBookings + 1);
  }
});

export const placeholderBookingsByAgent: BookingsByAgentData[] = Array.from(bookingsByAgentMap.entries()).map(([agentId, bookingsCount]) => {
  const agent = placeholderAgents.find(a => a.id === agentId);
  return {
    agentName: agent ? agent.name.substring(0,15) + (agent.name.length > 15 ? '...' : '') : `Agent ${agentId.substring(0,6)}...`,
    bookings: bookingsCount,
  };
}).filter(item => item.bookings > 0);
