
import type { Lead, User, Yacht, Invoice, Agent, LeadType, ModeOfPayment, LeadStatus, YachtPackageItem } from './types';
import { formatISO, parseISO, subDays, addDays, format } from 'date-fns';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Naufal', email: 'naufal@dutchoriental.com', designation: 'Acounts', avatarUrl: 'https://placehold.co/100x100.png?text=NS', status: 'Active', password: 'password123' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active', password: 'password123' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active', password: 'password123' },
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
    discount: 12.5,
    websiteUrl: 'https://globalcharters.com'
  },
];


export let placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Sea+Serpent',
    customPackageInfo: "Weekend special: Includes free jet ski for 1 hour.",
    packages: [
      { id: 'pkg1-child', name: 'Child Day Pass', rate: 89 },
      { id: 'pkg1-adult-std', name: 'Adult Standard Day Pass', rate: 129 },
      { id: 'pkg1-adult-std-dr', name: 'Adult Standard Day Pass + Drinks', rate: 159 },
      { id: 'pkg1-vip-child', name: 'VIP Child Experience', rate: 139 },
      { id: 'pkg1-vip-adult', name: 'VIP Adult Experience', rate: 189 },
      { id: 'pkg1-vip-adult-dr', name: 'VIP Adult Experience + Premium Drinks', rate: 249 },
      { id: 'pkg1-royal-child', name: 'Royal Child Gala', rate: 200 },
      { id: 'pkg1-royal-adult', name: 'Royal Adult Gala', rate: 300 },
      { id: 'pkg1-royal-adult-dr', name: 'Royal Adult Gala + All Inclusive', rate: 380 },
      { id: 'pkg1-cake', name: 'Cake Service Fee', rate: 150 },
    ],
  },
  {
    id: 'DO-yacht2', name: 'Ocean Voyager', capacity: 100, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Ocean+Voyager',
    customPackageInfo: "Corporate events preferred. Custom catering available.",
    packages: [
      { id: 'pkg2-basic', name: 'Basic Cruise Ticket', rate: 95 },
      { id: 'pkg2-standard', name: 'Standard Cruise Ticket', rate: 135 },
      { id: 'pkg2-premium', name: 'Premium Cruise with Meal', rate: 165 },
      { id: 'pkg2-corp-vip', name: 'Corporate VIP Package', rate: 255 },
    ],
  },
];

const today = new Date();

// Sample leads updated to use the new 9 standardized quantity fields
export let placeholderLeads: Lead[] = [
  {
    id: 'DO-001',
    agent: 'DO-AGENT-001',
    status: 'Conformed',
    month: formatISO(parseISO('2024-07-15T14:00:00+04:00')),
    notes: 'Confirmed booking, client very happy.',
    yacht: 'DO-yacht1', // Sea Serpent
    type: 'Corporate Event' as LeadType,
    transactionId: '202400001',
    modeOfPayment: 'Online' as ModeOfPayment,
    qty_adultStandardRate: 10, // Corresponds to "Adult Standard Day Pass" on Sea Serpent
    totalAmount: 1290, // 10 * 129
    commissionPercentage: 10,
    commissionAmount: 129,
    netAmount: 1161,
    paidAmount: 1161,
    balanceAmount: 0,
    createdAt: formatISO(parseISO('2024-06-15T14:00:00+04:00')),
    updatedAt: formatISO(parseISO('2024-07-01T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-002',
    agent: 'DO-AGENT-002',
    status: 'Upcoming',
    month: formatISO(parseISO('2024-07-25T18:30:00+04:00')),
    notes: 'Follow up next week.',
    yacht: 'DO-yacht2', // Ocean Voyager
    type: 'Private Party' as LeadType,
    transactionId: '202400002',
    modeOfPayment: 'Credit' as ModeOfPayment,
    qty_childRate: 5,  // Corresponds to "Basic Cruise Ticket" on Ocean Voyager
    qty_adultStandardRate: 5, // Corresponds to "Standard Cruise Ticket" on Ocean Voyager
    totalAmount: 1150, // (5 * 95) + (5 * 135) = 475 + 675
    commissionPercentage: 15,
    commissionAmount: 172.5,
    netAmount: 977.5,
    paidAmount: 500,
    balanceAmount: 477.5, // 977.5 - 500
    createdAt: formatISO(parseISO('2024-06-20T14:00:00+04:00')),
    updatedAt: formatISO(parseISO('2024-07-05T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-003',
    agent: 'DO-AGENT-001',
    status: 'Conformed',
    month: formatISO(parseISO('2024-08-10T16:00:00+04:00')),
    notes: '',
    yacht: 'DO-yacht1', // Sea Serpent
    type: 'Tour Group' as LeadType,
    transactionId: undefined,
    modeOfPayment: 'Cash/Card' as ModeOfPayment,
    qty_vipAdultRate: 10, // Corresponds to "VIP Adult Experience" on Sea Serpent
    othersAmtCake: 1, // Quantity for "Cake Service Fee" (rate 150)
    totalAmount: 2040, // (10 * 189) + (1 * 150) = 1890 + 150
    commissionPercentage: 10,
    commissionAmount: 204,
    netAmount: 1836,
    paidAmount: 1836,
    balanceAmount: 0,
    createdAt: formatISO(parseISO('2024-07-10T14:00:00+04:00')),
    updatedAt: formatISO(parseISO('2024-07-12T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
];

export let placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-001', clientName: 'Tech Corp', amount: 1290, dueDate: format(addDays(today, 15), 'yyyy-MM-dd'), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-002', clientName: 'Innovate Ltd', amount: 1150, dueDate: format(addDays(today, 20), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
  { id: 'DO-inv003', leadId: 'DO-003', clientName: 'Solutions Inc', amount: 2040, dueDate: format(subDays(today, 5), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 10)) },
];
