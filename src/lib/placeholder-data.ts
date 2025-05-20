
import type { Lead, User, Yacht, Invoice, BookingReportData, RevenueData, Agent, PieChartDataItem } from './types';

export const placeholderUsers: User[] = [
  { id: 'user1', name: 'Alice Smith', email: 'alice@example.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 'user2', name: 'Bob Johnson', email: 'bob@example.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png', status: 'Active' },
  { id: 'user3', name: 'Carol White', email: 'carol@example.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png', status: 'Active' },
];

export const placeholderAgents: Agent[] = [
  { id: 'agentA', name: 'Prime Charters Agency', email: 'contact@primecharters.com', discountRate: 12, websiteUrl: 'https://primecharters.com', status: 'Active' },
  { id: 'agentB', name: 'Luxury Yacht Bookings Co.', email: 'bookings@lyb.co', discountRate: 15, websiteUrl: 'https://lyb.co', status: 'Active' },
  { id: 'agentC', name: 'Nautical Adventures Ltd.', email: 'info@nauticalltd.com', discountRate: 10, status: 'Non Active' }, // Updated status
  { id: 'agentD', name: 'Old Timer Fleet (Closed)', email: 'archive@oldtimer.com', discountRate: 5, status: 'Dead' }, // Updated status
];

export const placeholderYachts: Yacht[] = [
  { 
    id: 'yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/300x200.png',
    dhowChild89_rate: 89, dhowFood99_rate: 99, dhowDrinks199_rate: 199, dhowVip299_rate: 299,
    oeChild129_rate: 129, oeFood149_rate: 149, oeDrinks249_rate: 249, oeVip349_rate: 349,
    sunsetChild179_rate: 179, sunsetFood199_rate: 190, sunsetDrinks299_rate: 299, // Corrected typo sunsetFood199_rate
    lotusFood249_rate: 249, lotusDrinks349_rate: 349, lotusVip399_rate: 399, lotusVip499_rate: 499,
    othersAmtCake_rate: 100,
  },
  { 
    id: 'yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Booked', imageUrl: 'https://placehold.co/300x200.png',
    dhowChild89_rate: 95, dhowFood99_rate: 105, dhowDrinks199_rate: 205, dhowVip299_rate: 305,
    oeChild129_rate: 135, oeFood149_rate: 155, oeDrinks249_rate: 255, oeVip349_rate: 355,
    sunsetChild179_rate: 185, sunsetFood199_rate: 205, sunsetDrinks299_rate: 305,
    lotusFood249_rate: 255, lotusDrinks349_rate: 355, lotusVip399_rate: 405, lotusVip499_rate: 505,
    othersAmtCake_rate: 120,
  },
  { 
    id: 'yacht3', name: 'Marina Queen', capacity: 75, status: 'Maintenance', imageUrl: 'https://placehold.co/300x200.png',
    dhowChild89_rate: 80, dhowFood99_rate: 90, dhowDrinks199_rate: 190, dhowVip299_rate: 290,
    oeChild129_rate: 120, oeFood149_rate: 140, oeDrinks249_rate: 240, oeVip349_rate: 340,
    sunsetChild179_rate: 170, sunsetFood199_rate: 190, sunsetDrinks299_rate: 290,
    lotusFood249_rate: 240, lotusDrinks349_rate: 340, lotusVip399_rate: 390, lotusVip499_rate: 490,
    othersAmtCake_rate: 90,
  },
  { 
    id: 'yacht4', name: 'Azure Spirit', capacity: 60, status: 'Available', imageUrl: 'https://placehold.co/300x200.png',
    dhowChild89_rate: 92, dhowFood99_rate: 102, dhowDrinks199_rate: 202, dhowVip299_rate: 302,
    oeChild129_rate: 132, oeFood149_rate: 152, oeDrinks249_rate: 252, oeVip349_rate: 352,
    sunsetChild179_rate: 182, sunsetFood199_rate: 202, sunsetDrinks299_rate: 302,
    lotusFood249_rate: 252, lotusDrinks349_rate: 352, lotusVip399_rate: 402, lotusVip499_rate: 502,
    othersAmtCake_rate: 110,
  },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'inv001', leadId: 'lead1', clientName: 'Tech Corp', amount: 15000, dueDate: '2024-08-15', status: 'Paid', createdAt: '2024-07-01' },
  { id: 'inv002', leadId: 'lead2', clientName: 'Innovate Ltd', amount: 22000, dueDate: '2024-08-20', status: 'Pending', createdAt: '2024-07-05' },
  { id: 'inv003', leadId: 'lead3', clientName: 'Solutions Inc', amount: 18000, dueDate: '2024-07-25', status: 'Overdue', createdAt: '2024-06-10' },
  { id: 'inv004', leadId: 'lead4', clientName: 'Global Co', amount: 30000, dueDate: '2024-09-01', status: 'Pending', createdAt: '2024-07-15' },
  { id: 'inv005', leadId: 'lead1', clientName: 'Alpha LLC', amount: 12000, dueDate: '2024-09-10', status: 'Paid', createdAt: '2024-08-01' },
];

export const placeholderLeads: Lead[] = [
  { 
    id: 'lead1', agent: 'agentA', status: 'Closed Won', month: '2024-07', yacht: 'yacht2', 
    type: 'Corporate Event', invoiceId: 'inv001', packageType: 'LOTUS', clientName: 'Tech Corp',
    lotusVip499: 10, 
    quantity: 10, rate: 1500, // This rate might be overridden by package calc
    totalAmount: 5050, commissionPercentage: 12, commissionAmount: 606, 
    netAmount: 4444, paidAmount: 5050, balanceAmount: 0,
    createdAt: '2024-06-15', updatedAt: '2024-07-01'
  },
  { 
    id: 'lead2', agent: 'agentB', status: 'Proposal Sent', month: '2024-07', yacht: 'yacht1', 
    type: 'Private Party', packageType: 'SUNSET', clientName: 'Innovate Ltd',
    sunsetDrinks299: 20,
    quantity: 20, rate: 1100, 
    totalAmount: 5980, commissionPercentage: 15, commissionAmount: 897, 
    netAmount: 5083, paidAmount: 2500, balanceAmount: 3480,
    createdAt: '2024-06-20', updatedAt: '2024-07-05'
  },
  { 
    id: 'lead3', agent: 'agentA', status: 'Closed Won', month: '2024-08', yacht: 'yacht3', 
    type: 'Tour Group', packageType: 'OE', clientName: 'Solutions Inc',
    oeFood149: 50,
    quantity: 50, rate: 360, 
    totalAmount: 7000, commissionPercentage: 12, commissionAmount: 840, 
    netAmount: 6160, paidAmount: 7000, balanceAmount: 0,
    createdAt: '2024-07-10', updatedAt: '2024-07-12'
  },
  { 
    id: 'lead4', agent: 'agentC', status: 'New', month: '2024-08', yacht: 'yacht4', 
    type: 'Wedding Reception', packageType: 'DHOW', clientName: 'Global Co',
    dhowVip299: 30, othersAmtCake: 500,
    quantity: 30, rate: 1000, 
    totalAmount: 9560, commissionPercentage: 10, commissionAmount: 956, 
    netAmount: 8604, paidAmount: 0, balanceAmount: 9560,
    createdAt: '2024-07-20', updatedAt: '2024-07-20'
  },
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

// Calculate invoice status data for pie chart
const paidInvoices = placeholderInvoices.filter(inv => inv.status === 'Paid').length;
const pendingInvoices = placeholderInvoices.filter(inv => inv.status === 'Pending').length;
const overdueInvoices = placeholderInvoices.filter(inv => inv.status === 'Overdue').length;

export const placeholderInvoiceStatusData: PieChartDataItem[] = [
  { name: 'Paid', value: paidInvoices, fill: 'hsl(var(--chart-1))' },
  { name: 'Pending', value: pendingInvoices, fill: 'hsl(var(--chart-2))' },
  { name: 'Overdue', value: overdueInvoices, fill: 'hsl(var(--chart-3))' },
].filter(item => item.value > 0); // Filter out series with 0 value for cleaner chart
