
import type { Lead, User, Yacht, Invoice, Agent } from './types';
import { formatISO } from 'date-fns';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Alice Smith', email: 'alice@dutchoriental.com', designation: 'Sales Manager', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
  { id: 'DO-admin', name: 'Admin User', email: 'admin@dutchoriental.com', designation: 'System Administrator', avatarUrl: 'https://placehold.co/100x100.png?text=AU', status: 'Active', password: 'DutchOriental@123#' },
];

export let placeholderAgents: Agent[] = [
  { 
    id: 'DO-agentA', 
    name: 'Prime Charters Agency', 
    agency_code: 'PCA001',
    address: '123 Marina Drive, Dubai',
    phone_no: '+971501234567',
    email: 'contact@primecharters.com', 
    discount: 12, 
    websiteUrl: 'https://primecharters.com', 
    status: 'Active',
    TRN_number: '100298765400003',
    customer_type_id: 'CT-CORP-01'
  },
  { 
    id: 'DO-agentB', 
    name: 'Luxury Yacht Bookings Co.', 
    agency_code: 'LYB002',
    address: '456 Ocean View Rd, Dubai',
    phone_no: '+971559876543',
    email: 'bookings@luxuryyachtbookings.com', 
    discount: 15, 
    websiteUrl: 'https://luxuryyachtbookings.com', 
    status: 'Active',
    TRN_number: '100300012300003',
    customer_type_id: 'CT-VIP-02'
  },
];


export let placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Sea+Serpent',
    childRate: 89,
    adultStandardRate: 129,
    adultStandardDrinksRate: 159,
    vipChildRate: 139,
    vipAdultRate: 189,
    vipAdultDrinksRate: 249,
    royalChildRate: 200,
    royalAdultRate: 300,
    royalDrinksRate: 380,
    othersAmtCake_rate: 150,
  },
  {
    id: 'DO-yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Ocean+Voyager',
    childRate: 95,
    adultStandardRate: 135,
    adultStandardDrinksRate: 165,
    vipChildRate: 145,
    vipAdultRate: 195,
    vipAdultDrinksRate: 255,
    royalChildRate: 220,
    royalAdultRate: 320,
    royalDrinksRate: 400,
    othersAmtCake_rate: 200,
  },
];

export let placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1', agent: 'DO-agentA', status: 'Conformed', month: formatISO(new Date('2024-07-15T10:00:00Z')), notes: 'Confirmed booking, client very happy.', yacht: 'DO-yacht1',
    type: 'Corporate Event', invoiceId: 'DO-inv001', modeOfPayment: 'Online', clientName: 'Tech Corp',
    dhowAdultQty: 10, // Mapped to adultStandardRate (129) = 1290
    totalAmount: 1290, commissionPercentage: 12, commissionAmount: 154.8,
    netAmount: 1135.2, paidAmount: 1290, balanceAmount: 0,
    createdAt: '2024-06-15T10:00:00Z', updatedAt: '2024-07-01T10:00:00Z', lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead2', agent: 'DO-agentB', status: 'Upcoming', month: formatISO(new Date('2024-07-25T14:30:00Z')), notes: 'Follow up next week.', yacht: 'DO-yacht2',
    type: 'Private Party', modeOfPayment: 'Credit', clientName: 'Innovate Ltd',
    oeAdultQty: 10, // Mapped to adultStandardRate (135) = 1350
    totalAmount: 1350, commissionPercentage: 15, commissionAmount: 202.5,
    netAmount: 1147.5, paidAmount: 500, balanceAmount: 850,
    createdAt: '2024-06-20T10:00:00Z', updatedAt: '2024-07-05T10:00:00Z', lastModifiedByUserId: 'DO-user2', ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-lead3', agent: 'DO-agentA', status: 'Conformed', month: formatISO(new Date('2024-08-10T12:00:00Z')), yacht: 'DO-yacht1', // Yacht 1
    type: 'Tour Group', modeOfPayment: 'Cash/Card', clientName: 'Solutions Inc',
    dhowAdultQty: 10, // Mapped to adultStandardRate (129) = 1290
    totalAmount: 1290, commissionPercentage: 12, commissionAmount: 154.8,
    netAmount: 1135.2, paidAmount: 1290, balanceAmount: 0,
    createdAt: '2024-07-10T10:00:00Z', updatedAt: '2024-07-12T10:00:00Z', lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead4', agent: 'DO-agentA', status: 'Upcoming', month: formatISO(new Date('2024-08-20T18:00:00Z')), yacht: 'DO-yacht1',
    type: 'Wedding Reception', modeOfPayment: 'Online', clientName: 'Global Co',
    dhowVipQty: 20, // Mapped to vipAdultRate (189) = 3780
    othersAmtCake: 100,
    totalAmount: 3780 + 100, commissionPercentage: 12, commissionAmount: (3780 + 100) * 0.12,
    netAmount: (3780 + 100) * 0.88, paidAmount: 0, balanceAmount: 3780 + 100,
    createdAt: '2024-07-20T10:00:00Z', updatedAt: '2024-07-20T10:00:00Z', lastModifiedByUserId: 'DO-user3', ownerUserId: 'DO-user3'
  },
  {
    id: 'DO-lead5', agent: 'DO-agentB', status: 'Balance', month: formatISO(new Date('2024-09-05T16:00:00Z')), yacht: 'DO-yacht1',
    type: 'Birthday Celebration', modeOfPayment: 'Credit', clientName: 'Celebrations LLC',
    dhowChildQty: 10, // Mapped to childRate (89) = 890
    dhowAdultQty: 10, // Mapped to adultStandardRate (129) = 1290
    totalAmount: 890 + 1290, commissionPercentage: 15, commissionAmount: (890 + 1290) * 0.15,
    netAmount: (890 + 1290) * 0.85, paidAmount: 1000, balanceAmount: (890 + 1290) - 1000,
    createdAt: '2024-08-10T10:00:00Z', updatedAt: '2024-08-15T10:00:00Z', lastModifiedByUserId: 'DO-user2', ownerUserId: 'DO-user2'
  },
   {
    id: 'DO-lead6', agent: 'DO-agentA', status: 'Closed', month: formatISO(new Date('2024-05-05T16:00:00Z')), yacht: 'DO-yacht2',
    type: 'Anniversary', modeOfPayment: 'Online', clientName: 'Old Ventures',
    oeVipQty: 5, // Mapped to vipAdultRate (195) = 975
    totalAmount: 975, commissionPercentage: 12, commissionAmount: 975 * 0.12,
    netAmount: 975 * 0.88, paidAmount: 975, balanceAmount: 0,
    createdAt: '2024-04-10T10:00:00Z', updatedAt: '2024-04-15T10:00:00Z', lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  }
];

export let placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp', amount: 1290, dueDate: formatISO(new Date('2024-08-15')), status: 'Paid', createdAt: formatISO(new Date('2024-07-01')) },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd', amount: 1350, dueDate: formatISO(new Date('2024-08-20')), status: 'Pending', createdAt: formatISO(new Date('2024-07-05')) },
  { id: 'DO-inv003', leadId: 'DO-lead3', clientName: 'Solutions Inc', amount: 1290, dueDate: formatISO(new Date('2024-07-25')), status: 'Overdue', createdAt: formatISO(new Date('2024-06-10')) },
  { id: 'DO-inv004', leadId: 'DO-lead4', clientName: 'Global Co', amount: 3880, dueDate: formatISO(new Date('2024-09-01')), status: 'Pending', createdAt: formatISO(new Date('2024-07-15')) },
  { id: 'DO-inv005', leadId: 'DO-lead5', clientName: 'Celebrations LLC', amount: 2180, dueDate: formatISO(new Date('2024-09-10')), status: 'Pending', createdAt: formatISO(new Date('2024-08-01')) },
];
