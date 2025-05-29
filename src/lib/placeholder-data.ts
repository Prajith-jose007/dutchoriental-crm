
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
   {
    id: 'DO-AGENT-003',
    name: 'Global Charters Inc.',
    agency_code: 'GC003',
    address: '789 Business Bay, Dubai, UAE',
    phone_no: '+971525556666',
    email: 'support@globalcharters.com',
    status: 'Non Active',
    TRN_number: '100458965200003',
    customer_type_id: 'INTL-TOUR',
    discount: 12.5, // Example discount
    websiteUrl: 'https://globalcharters.com'
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

export let placeholderLeads: Lead[] = [
  {
    id: 'DO-001',
    agent: 'DO-AGENT-001',
    status: 'Conformed',
    month: formatISO(new Date('2024-07-15T14:00:00+04:00')), // Event Date
    notes: 'Confirmed booking, client very happy.',
    yacht: 'DO-yacht1',
    type: 'Dinner Cruise',
    transactionId: '202400001',
    modeOfPayment: 'Online',
    qty_childRate: 0,
    qty_adultStandardRate: 10, // 10 * 129 = 1290
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 0,
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 0,
    totalAmount: 1290,
    commissionPercentage: 10,
    commissionAmount: 129, // 10% of 1290
    netAmount: 1161,
    paidAmount: 1290,
    balanceAmount: 0,
    createdAt: formatISO(new Date('2024-06-15T14:00:00+04:00')),
    updatedAt: formatISO(new Date('2024-07-01T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-002',
    agent: 'DO-AGENT-002',
    status: 'Upcoming',
    month: formatISO(new Date('2024-07-25T18:30:00+04:00')),
    notes: 'Follow up next week.',
    yacht: 'DO-yacht2',
    type: 'Private',
    transactionId: '202400002',
    modeOfPayment: 'Credit',
    qty_childRate: 0,
    qty_adultStandardRate: 10, // 10 * 135 = 1350 (assuming yacht2 adultStandardRate is 135)
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 0,
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 0,
    totalAmount: 1350,
    commissionPercentage: 15,
    commissionAmount: 202.5,
    netAmount: 1147.5,
    paidAmount: 500,
    balanceAmount: 647.5, // 1147.5 - 500
    createdAt: formatISO(new Date('2024-06-20T14:00:00+04:00')),
    updatedAt: formatISO(new Date('2024-07-05T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-003',
    agent: 'DO-AGENT-001',
    status: 'Conformed',
    month: formatISO(new Date('2024-08-10T16:00:00+04:00')),
    notes: '',
    yacht: 'DO-yacht1',
    type: 'Dinner Cruise',
    transactionId: undefined,
    modeOfPayment: 'Cash/Card',
    qty_childRate: 0,
    qty_adultStandardRate: 10, // 10 * 129 = 1290
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 0,
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 0,
    totalAmount: 1290,
    commissionPercentage: 10,
    commissionAmount: 129,
    netAmount: 1161,
    paidAmount: 1290,
    balanceAmount: 0,
    createdAt: formatISO(new Date('2024-07-10T14:00:00+04:00')),
    updatedAt: formatISO(new Date('2024-07-12T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-004',
    agent: 'DO-AGENT-001',
    status: 'Upcoming',
    month: formatISO(new Date('2024-08-20T22:00:00+04:00')),
    notes: 'Special request for decoration.',
    yacht: 'DO-yacht1',
    type: 'Private',
    transactionId: '202400003',
    modeOfPayment: 'Online',
    qty_childRate: 0,
    qty_adultStandardRate: 0,
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 20, // 20 * 189 (Sea Serpent VIP Adult) = 3780
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 1, // 1 * 150 (Sea Serpent Cake Service) = 150
    totalAmount: 3930, // 3780 + 150
    commissionPercentage: 10,
    commissionAmount: 393,
    netAmount: 3537,
    paidAmount: 0,
    balanceAmount: 3537,
    createdAt: formatISO(new Date('2024-07-20T14:00:00+04:00')),
    updatedAt: formatISO(new Date('2024-07-20T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user3',
    ownerUserId: 'DO-user3'
  },
  {
    id: 'DO-005',
    agent: 'DO-AGENT-002',
    status: 'Balance',
    month: formatISO(new Date('2024-09-05T20:00:00+04:00')),
    notes: 'Client paid deposit.',
    yacht: 'DO-yacht1',
    type: 'Dinner Cruise',
    transactionId: '202400004',
    modeOfPayment: 'Credit',
    qty_childRate: 10, // 10 * 89 = 890
    qty_adultStandardRate: 10, // 10 * 129 = 1290
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 0,
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 0,
    totalAmount: 2180, // 890 + 1290
    commissionPercentage: 15,
    commissionAmount: 327,
    netAmount: 1853,
    paidAmount: 1000,
    balanceAmount: 853,
    createdAt: formatISO(new Date('2024-08-10T14:00:00+04:00')),
    updatedAt: formatISO(new Date('2024-08-15T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-006',
    agent: 'DO-AGENT-001',
    status: 'Closed',
    month: formatISO(new Date('2024-05-05T20:00:00+04:00')),
    notes: 'Event cancelled by client.',
    yacht: 'DO-yacht2',
    type: 'Private',
    transactionId: '202400005',
    modeOfPayment: 'Online',
    qty_childRate: 0,
    qty_adultStandardRate: 0,
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 5, // 5 * 195 (Ocean Voyager VIP) = 975
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 0,
    totalAmount: 975,
    commissionPercentage: 10,
    commissionAmount: 97.5,
    netAmount: 877.5,
    paidAmount: 975, // Full amount paid before cancellation, might need refund logic elsewhere.
    balanceAmount: 0,
    createdAt: formatISO(new Date('2024-04-10T14:00:00+04:00')),
    updatedAt: formatISO(new Date('2024-04-15T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
];

export let placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-001', clientName: 'Tech Corp', amount: 1290, dueDate: formatISO(addDays(today, 15)), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-002', clientName: 'Innovate Ltd', amount: 1350, dueDate: formatISO(addDays(today, 20)), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
  { id: 'DO-inv003', leadId: 'DO-003', clientName: 'Solutions Inc', amount: 1290, dueDate: formatISO(subDays(today, 5)), status: 'Pending', createdAt: formatISO(subDays(today, 10)) }, // Example of an overdue invoice
  { id: 'DO-inv004', leadId: 'DO-004', clientName: 'Global Co', amount: 3930, dueDate: formatISO(addDays(today, 30)), status: 'Pending', createdAt: formatISO(subDays(today, 1)) },
  { id: 'DO-inv005', leadId: 'DO-005', clientName: 'Celebrations LLC', amount: 2180, dueDate: formatISO(addDays(today, 10)), status: 'Pending', createdAt: formatISO(subDays(today, 2)) },
];
