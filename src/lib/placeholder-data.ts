
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
    dhowChild89_rate: 89, dhowFood99_rate: 99, dhowDrinks199_rate: 199, dhowVip299_rate: 299,
    oeChild129_rate: 129, oeFood149_rate: 149, oeDrinks249_rate: 249, oeVip349_rate: 349,
    sunsetChild179_rate: 179, sunsetFood199_rate: 190, sunsetDrinks299_rate: 299,
    lotusFood249_rate: 249, lotusDrinks349_rate: 349, lotusVip399_rate: 399, lotusVip499_rate: 499,
    othersAmtCake_rate: 100, // This rate is for a potential "Cake Package Qty", but Lead.othersAmtCake is a direct amount.
  },
  {
    id: 'DO-yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Booked', imageUrl: 'https://placehold.co/300x200.png?text=Ocean+Voyager',
    dhowChild89_rate: 95, dhowFood99_rate: 105, dhowDrinks199_rate: 205, dhowVip299_rate: 305,
    oeChild129_rate: 135, oeFood149_rate: 155, oeDrinks249_rate: 255, oeVip349_rate: 355,
    sunsetChild179_rate: 185, sunsetFood199_rate: 205, sunsetDrinks299_rate: 305,
    lotusFood249_rate: 255, lotusDrinks349_rate: 355, lotusVip399_rate: 405, lotusVip499_rate: 505,
    othersAmtCake_rate: 120,
  },
  {
    id: 'DO-yacht3', name: 'Marina Queen', capacity: 75, status: 'Maintenance', imageUrl: 'https://placehold.co/300x200.png?text=Marina+Queen',
    dhowChild89_rate: 80, dhowFood99_rate: 90, dhowDrinks199_rate: 190, dhowVip299_rate: 290,
    oeChild129_rate: 120, oeFood149_rate: 140, oeDrinks249_rate: 240, oeVip349_rate: 340,
    sunsetChild179_rate: 170, sunsetFood199_rate: 190, sunsetDrinks299_rate: 290,
    lotusFood249_rate: 240, lotusDrinks349_rate: 340, lotusVip399_rate: 390, lotusVip499_rate: 490,
    othersAmtCake_rate: 90,
  },
  {
    id: 'DO-yacht4', name: 'Azure Spirit', capacity: 60, status: 'Available', imageUrl: 'https://placehold.co/300x200.png?text=Azure+Spirit',
    dhowChild89_rate: 92, dhowFood99_rate: 102, dhowDrinks199_rate: 202, dhowVip299_rate: 302,
    oeChild129_rate: 132, oeFood149_rate: 152, oeDrinks249_rate: 252, oeVip349_rate: 352,
    sunsetChild179_rate: 182, sunsetFood199_rate: 202, sunsetDrinks299_rate: 302,
    lotusFood249_rate: 252, lotusDrinks349_rate: 352, lotusVip399_rate: 402, lotusVip499_rate: 502,
    othersAmtCake_rate: 110,
  },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp', amount: 5050, dueDate: '2024-08-15', status: 'Paid', createdAt: '2024-07-01' },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd', amount: 5980, dueDate: '2024-08-20', status: 'Pending', createdAt: '2024-07-05' },
  { id: 'DO-inv003', leadId: 'DO-lead3', clientName: 'Solutions Inc', amount: 7000, dueDate: '2024-07-25', status: 'Overdue', createdAt: '2024-06-10' },
  { id: 'DO-inv004', leadId: 'DO-lead4', clientName: 'Global Co', amount: 9560, dueDate: '2024-09-01', status: 'Pending', createdAt: '2024-07-15' },
  { id: 'DO-inv005', leadId: 'DO-lead1', clientName: 'Alpha LLC (Repeat)', amount: 4444, dueDate: '2024-09-10', status: 'Paid', createdAt: '2024-08-01' },
];

export const placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1', agent: 'DO-agentA', status: 'Closed Won', month: '2024-07', yacht: 'DO-yacht2',
    type: 'Corporate Event', invoiceId: 'DO-inv001', modeOfPayment: 'Online', clientName: 'Tech Corp',
    lotusVip499: 10, // 10 * 505 (from DO-yacht2) = 5050
    quantity: 10, rate: 0, // General quantity/rate not used if specific package items are
    totalAmount: 5050, commissionPercentage: 12, commissionAmount: 606, // 5050 * 0.12
    netAmount: 4444, paidAmount: 5050, balanceAmount: 0,
    createdAt: '2024-06-15', updatedAt: '2024-07-01'
  },
  {
    id: 'DO-lead2', agent: 'DO-agentB', status: 'Proposal Sent', month: '2024-07', yacht: 'DO-yacht1',
    type: 'Private Party', modeOfPayment: 'Offline', clientName: 'Innovate Ltd',
    sunsetDrinks299: 20, // 20 * 299 (from DO-yacht1) = 5980
    quantity: 20, rate: 0,
    totalAmount: 5980, commissionPercentage: 15, commissionAmount: 897, // 5980 * 0.15
    netAmount: 5083, paidAmount: 2500, balanceAmount: 3480,
    createdAt: '2024-06-20', updatedAt: '2024-07-05'
  },
  {
    id: 'DO-lead3', agent: 'DO-agentA', status: 'Closed Won', month: '2024-08', yacht: 'DO-yacht3',
    type: 'Tour Group', modeOfPayment: 'Credit', clientName: 'Solutions Inc',
    oeFood149: 50, // 50 * 140 (from DO-yacht3) = 7000
    quantity: 50, rate: 0,
    totalAmount: 7000, commissionPercentage: 12, commissionAmount: 840, // 7000 * 0.12
    netAmount: 6160, paidAmount: 7000, balanceAmount: 0,
    createdAt: '2024-07-10', updatedAt: '2024-07-12'
  },
  {
    id: 'DO-lead4', agent: 'DO-agentC', status: 'New', month: '2024-08', yacht: 'DO-yacht4',
    type: 'Wedding Reception', modeOfPayment: 'Online', clientName: 'Global Co',
    dhowVip299: 30, othersAmtCake: 500, // (30 * 302 from DO-yacht4) + 500 = 9060 + 500 = 9560
    quantity: 30, rate: 0,
    totalAmount: 9560, commissionPercentage: 10, commissionAmount: 956, // 9560 * 0.10
    netAmount: 8604, paidAmount: 0, balanceAmount: 9560,
    createdAt: '2024-07-20', updatedAt: '2024-07-20'
  },
  {
    id: 'DO-lead5', agent: 'DO-agentB', status: 'Closed Won', month: '2024-09', yacht: 'DO-yacht1',
    type: 'Birthday Celebration', modeOfPayment: 'Offline', clientName: 'Celebrations LLC',
    dhowFood99: 30, // 30 * 99 (from DO-yacht1) = 2970
    quantity: 30, rate: 0,
    totalAmount: 2970, commissionPercentage: 15, commissionAmount: 445.50,
    netAmount: 2524.50, paidAmount: 2970, balanceAmount: 0,
    createdAt: '2024-08-10', updatedAt: '2024-08-15'
  }
];

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


// Placeholder data for Sales by Yacht Pie Chart
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
    fill: `hsl(var(--chart-${(index % 5) + 1}))`, // Cycle through chart colors
  };
}).filter(item => item.value > 0);


// Placeholder data for Bookings by Agent Bar Chart
const bookingsByAgentMap = new Map<string, number>();
placeholderLeads.forEach(lead => {
  if (lead.status === 'Closed Won') { // Only count confirmed bookings
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
