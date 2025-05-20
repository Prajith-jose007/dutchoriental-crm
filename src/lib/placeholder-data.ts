import type { Lead, User, Yacht, Invoice, BookingReportData, RevenueData } from './types';

export const placeholderUsers: User[] = [
  { id: 'user1', name: 'Alice Smith', email: 'alice@example.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user2', name: 'Bob Johnson', email: 'bob@example.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: 'user3', name: 'Carol White', email: 'carol@example.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png' },
];

export const placeholderYachts: Yacht[] = [
  { id: 'yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/300x200.png' },
  { id: 'yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Booked', imageUrl: 'https://placehold.co/300x200.png' },
  { id: 'yacht3', name: 'Marina Queen', capacity: 75, status: 'Maintenance', imageUrl: 'https://placehold.co/300x200.png' },
  { id: 'yacht4', name: 'Azure Spirit', capacity: 60, status: 'Available', imageUrl: 'https://placehold.co/300x200.png' },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'inv001', leadId: 'lead1', clientName: 'Tech Corp', amount: 15000, dueDate: '2024-08-15', status: 'Paid', createdAt: '2024-07-01' },
  { id: 'inv002', leadId: 'lead2', clientName: 'Innovate Ltd', amount: 22000, dueDate: '2024-08-20', status: 'Pending', createdAt: '2024-07-05' },
  { id: 'inv003', leadId: 'lead3', clientName: 'Solutions Inc', amount: 18000, dueDate: '2024-07-25', status: 'Overdue', createdAt: '2024-06-10' },
  { id: 'inv004', leadId: 'lead4', clientName: 'Global Co', amount: 30000, dueDate: '2024-09-01', status: 'Pending', createdAt: '2024-07-15' },
];

export const placeholderLeads: Lead[] = [
  { 
    id: 'lead1', agent: 'Alice Smith', status: 'Closed Won', month: '2024-07', yacht: 'Ocean Voyager', 
    type: 'Corporate Event', invoiceId: 'inv001', packageType: 'LOTUS', clientName: 'Tech Corp',
    lotusVip499: 10, // Example: 10 VIP packages
    quantity: 10, rate: 1500, totalAmount: 15000, commissionPercentage: 10, 
    netAmount: 13500, paidAmount: 15000, balanceAmount: 0,
    createdAt: '2024-06-15', updatedAt: '2024-07-01'
  },
  { 
    id: 'lead2', agent: 'Bob Johnson', status: 'Proposal Sent', month: '2024-07', yacht: 'The Sea Serpent', 
    type: 'Private Party', packageType: 'SUNSET', clientName: 'Innovate Ltd',
    sunsetDrinks299: 20,
    quantity: 20, rate: 1100, totalAmount: 22000, commissionPercentage: 8, 
    netAmount: 20240, paidAmount: 10000, balanceAmount: 12000,
    createdAt: '2024-06-20', updatedAt: '2024-07-05'
  },
  { 
    id: 'lead3', agent: 'Alice Smith', status: 'Qualified', month: '2024-08', yacht: 'Marina Queen', 
    type: 'Tour Group', packageType: 'OE', clientName: 'Solutions Inc',
    oeFood149: 50,
    quantity: 50, rate: 360, totalAmount: 18000, commissionPercentage: 12, 
    netAmount: 15840, paidAmount: 0, balanceAmount: 18000,
    createdAt: '2024-07-10', updatedAt: '2024-07-12'
  },
  { 
    id: 'lead4', agent: 'Bob Johnson', status: 'New', month: '2024-08', yacht: 'Azure Spirit', 
    type: 'Wedding Reception', packageType: 'DHOW', clientName: 'Global Co',
    dhowVip299: 30, othersAmtCake: 500,
    quantity: 30, rate: 1000, totalAmount: 30500, commissionPercentage: 10, 
    netAmount: 27450, paidAmount: 0, balanceAmount: 30500,
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
