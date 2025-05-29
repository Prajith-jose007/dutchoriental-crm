
import type { Lead, User, Yacht, Invoice, Agent, LeadType, ModeOfPayment, LeadStatus, YachtPackage } from './types';
import { formatISO, parseISO, subDays, addDays, format } from 'date-fns';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Naufal', email: 'naufal@dutchoriental.com', designation: 'Acounts', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
  { id: 'DO-admin', name: 'Admin User', email: 'admin@dutchoriental.com', designation: 'System Administrator', avatarUrl: 'https://placehold.co/100x100.png?text=AU', status: 'Active', password: 'Dutch@123#' },
];

export let placeholderAgents: Agent[] = [
  {
    id: 'DO-AGENT-001',
    name: 'Maritime Masters LLC',
    agency_code: 'MM001',
    address: '123 Port Rashid, Dubai, UAE',
    phone_no: '+971501112222',
    email: 'contact@maritimemasters.com',
    status: 'Active',
    TRN_number: '100298765400003',
    customer_type_id: 'CORP-REG',
    discount: 10,
    websiteUrl: 'https://maritimemasters.com'
  },
  {
    id: 'DO-AGENT-002',
    name: 'Aqua Voyage Agency',
    agency_code: 'AV002',
    address: '456 Jumeirah Beach Rd, Dubai, UAE',
    phone_no: '+971553334444',
    email: 'info@aquavoyage.ae',
    status: 'Active',
    TRN_number: '100300012300003',
    customer_type_id: 'VIP-IND',
    discount: 15,
    websiteUrl: 'https://aquavoyage.ae'
  },
];


export let placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Sea+Serpent',
    packages: [
      { id: 'ss-child', name: 'Standard Child Pass', rate: 89 },
      { id: 'ss-adult', name: 'Standard Adult Pass', rate: 129 },
      { id: 'ss-adult-drinks', name: 'Standard Adult Pass + Drinks', rate: 159 },
      { id: 'ss-vip-child', name: 'VIP Child Pass', rate: 139 },
      { id: 'ss-vip-adult', name: 'VIP Adult Pass', rate: 189 },
      { id: 'ss-vip-adult-drinks', name: 'VIP Adult Pass + Drinks', rate: 249 },
    ],
    customPackageInfo: "Weekend special: Includes free jet ski for 1 hour (Admin Note)"
  },
  {
    id: 'DO-yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Ocean+Voyager',
    packages: [
      { id: 'ov-child', name: 'Child Ticket', rate: 95 },
      { id: 'ov-adult-std', name: 'Adult Standard Ticket', rate: 135 },
      { id: 'ov-adult-prem', name: 'Adult Premium Ticket (Incl. Soft Drinks)', rate: 165 },
      { id: 'ov-vip', name: 'VIP Experience (All Inclusive)', rate: 255 },
    ],
    customPackageInfo: "Corporate events preferred."
  },
];

const today = new Date();

// Note: placeholderLeads will need significant update once leads consume dynamic yacht packages.
// For now, their financial calculations based on old yacht rates will be incorrect.
// This is an intermediate state.
export let placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1', agent: 'DO-AGENT-001', status: 'Conformed' as LeadStatus, 
    month: formatISO(parseISO(format(addDays(today, 15), 'yyyy-MM-dd'))),
    notes: 'Confirmed booking, client very happy.', yacht: 'DO-yacht1',
    type: 'Dinner Cruise' as LeadType, transactionId: '202400001', modeOfPayment: 'Online' as ModeOfPayment, clientName: 'Tech Corp',
    qty_adultStandardRate: 10, // Example: 10 * Sea Serpent's 'Standard Adult Pass' rate (129) = 1290
    totalAmount: 1290, commissionPercentage: 10, commissionAmount: 129, // 10% of 1290
    netAmount: 1161, paidAmount: 1290, balanceAmount: 0,
    createdAt: formatISO(parseISO(format(subDays(today, 10), 'yyyy-MM-dd'))), 
    updatedAt: formatISO(parseISO(format(subDays(today, 5), 'yyyy-MM-dd'))), 
    lastModifiedByUserId: 'DO-user1', ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead2', agent: 'DO-AGENT-002', status: 'Upcoming' as LeadStatus, 
    month: formatISO(parseISO(format(addDays(today, 25), 'yyyy-MM-dd'))),
    notes: 'Follow up next week.', yacht: 'DO-yacht2',
    type: 'Private' as LeadType, transactionId: '202400002', modeOfPayment: 'Credit' as ModeOfPayment, clientName: 'Innovate Ltd',
    qty_adultStandardRate: 10, // Example: 10 * Ocean Voyager's 'Adult Standard Ticket' rate (135) = 1350
    totalAmount: 1350, commissionPercentage: 15, commissionAmount: 202.5, // 15% of 1350
    netAmount: 1147.5, paidAmount: 500, balanceAmount: 850,
    createdAt: formatISO(parseISO(format(subDays(today, 8), 'yyyy-MM-dd'))), 
    updatedAt: formatISO(parseISO(format(subDays(today, 3), 'yyyy-MM-dd'))), 
    lastModifiedByUserId: 'DO-user2', ownerUserId: 'DO-user2'
  },
];

export let placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp', amount: 1290, dueDate: formatISO(addDays(today, 15)), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd', amount: 1350, dueDate: formatISO(addDays(today, 20)), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
];
