
import type { Lead, User, Yacht, Invoice, BookingReportData, RevenueData } from './types';

export const placeholderUsers: User[] = [
  { id: 'user1', name: 'Alice Smith', email: 'alice@example.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png', commissionRate: 10 },
  { id: 'user2', name: 'Bob Johnson', email: 'bob@example.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png', commissionRate: 8 },
  { id: 'user3', name: 'Carol White', email: 'carol@example.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png', commissionRate: 0 }, // Admins might not have commission
];

export const placeholderYachts: Yacht[] = [
  { 
    id: 'yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/300x200.png',
    dhowChild89_rate: 89, dhowFood99_rate: 99, dhowDrinks199_rate: 199, dhowVip299_rate: 299,
    oeChild129_rate: 129, oeFood149_rate: 149, oeDrinks249_rate: 249, oeVip349_rate: 349,
    sunsetChild179_rate: 179, sunsetFood199_rate: 199, sunsetDrinks299_rate: 299,
    lotusFood249_rate: 249, lotusDrinks349_rate: 349, lotusVip399_rate: 399, lotusVip499_rate: 499,
    othersAmtCake_rate: 100, // Example rate for a standard cake, if 'othersAmtCake' becomes a quantity field
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
];

export const placeholderLeads: Lead[] = [
  { 
    id: 'lead1', agent: 'Alice Smith', status: 'Closed Won', month: '2024-07', yacht: 'yacht2', // Ocean Voyager
    type: 'Corporate Event', invoiceId: 'inv001', packageType: 'LOTUS', clientName: 'Tech Corp',
    lotusVip499: 10, // Example: 10 VIP packages
    quantity: 10, rate: 1500, // These might be overridden by package calculation
    totalAmount: 15000, commissionPercentage: 10, commissionAmount: 1500,
    netAmount: 13500, paidAmount: 15000, balanceAmount: 0,
    createdAt: '2024-06-15', updatedAt: '2024-07-01'
  },
  { 
    id: 'lead2', agent: 'Bob Johnson', status: 'Proposal Sent', month: '2024-07', yacht: 'yacht1', // The Sea Serpent
    type: 'Private Party', packageType: 'SUNSET', clientName: 'Innovate Ltd',
    sunsetDrinks299: 20,
    quantity: 20, rate: 1100, 
    totalAmount: 22000, commissionPercentage: 8, commissionAmount: 1760,
    netAmount: 20240, paidAmount: 10000, balanceAmount: 12000,
    createdAt: '2024-06-20', updatedAt: '2024-07-05'
  },
  { 
    id: 'lead3', agent: 'Alice Smith', status: 'Qualified', month: '2024-08', yacht: 'yacht3', // Marina Queen
    type: 'Tour Group', packageType: 'OE', clientName: 'Solutions Inc',
    oeFood149: 50,
    quantity: 50, rate: 360, 
    totalAmount: 18000, commissionPercentage: 10, commissionAmount: 1800, // Alice's rate
    netAmount: 16200, paidAmount: 0, balanceAmount: 18000,
    createdAt: '2024-07-10', updatedAt: '2024-07-12'
  },
  { 
    id: 'lead4', agent: 'Bob Johnson', status: 'New', month: '2024-08', yacht: 'yacht4', // Azure Spirit
    type: 'Wedding Reception', packageType: 'DHOW', clientName: 'Global Co',
    dhowVip299: 30, othersAmtCake: 500, // othersAmtCake is a direct amount
    quantity: 30, rate: 1000, 
    totalAmount: 30500, commissionPercentage: 8, commissionAmount: 2440, // Bob's rate
    netAmount: 28060, paidAmount: 0, balanceAmount: 30500,
    createdAt: '2024-07-20', updatedAt: '2024-07-20'
  },
];

export const placeholderBookingReport: BookingReportData[] = [
  { month: 'Jan', bookings: 120 },
  { month: 'Feb', bookings: 180 },
  { month: 'Mar', bookings: 200 },
  { month: 'Apr', bookings: 278 },
  { month: 'May', bookings: 189 },
  { month: 'Jun', bookings: 239 },
  { month: 'Jul', bookings: 150 },
];

export const placeholderRevenueData: RevenueData[] = [
    { period: 'Today', amount: 5250 },
    { period: 'This Month', amount: 85600 },
    { period: 'This Year', amount: 750200 },
];
