
import type { Lead, User, Yacht, Invoice, Agent, YachtCategory, YachtPackageItem, LeadPackageQuantity, PaymentConfirmationStatus } from './types';
import { formatISO, subDays, addDays, format, parseISO } from 'date-fns';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Naufal', email: 'naufal@dutchoriental.com', designation: 'Acounts', avatarUrl: 'https://placehold.co/100x100.png?text=NS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
  { id: 'DO-admin', name: 'Admin User', email: 'admin@dutchoriental.com', designation: 'System Administrator', avatarUrl: 'https://placehold.co/100x100.png?text=AU', status: 'Active', password: 'Dutch@123#' },
];

export const placeholderAgents: Agent[] = [
  {
    id: 'DO-001',
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
    id: 'DO-002',
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
    id: 'DO-003',
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

const today = new Date();

export const placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht-lotus', name: 'LOTUS ROYALE', capacity: 150, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Lotus+Royale',
    category: 'Dinner Cruise',
    packages: [
      { id: 'lr-child', name: 'CHILD', rate: 150 },
      { id: 'lr-adult', name: 'ADULT', rate: 250 },
      { id: 'lr-ad-alc', name: 'AD ALC', rate: 350 },
      { id: 'lr-vip-ch', name: 'VIP CH', rate: 250 },
      { id: 'lr-vip-ad', name: 'VIP AD', rate: 450 },
      { id: 'lr-vip-ad-alc', name: 'VIP AD ALC', rate: 600 },
      { id: 'lr-royal-ch', name: 'ROYAL CH', rate: 350 },
      { id: 'lr-royal-ad', name: 'ROYAL AD', rate: 700 },
      { id: 'lr-royal-alc', name: 'ROYAL ALC', rate: 900 },
    ],
    customPackageInfo: "Luxury dinner cruise experience.",
  },
  {
    id: 'DO-yacht-ocean', name: 'OCEAN EMPRESS', capacity: 200, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Ocean+Empress',
    category: 'Dinner Cruise',
    packages: [
      { id: 'oe-child', name: 'CHILD', rate: 120 },
      { id: 'oe-adult', name: 'ADULT', rate: 220 },
      { id: 'oe-ad-alc', name: 'AD ALC', rate: 300 },
      { id: 'oe-vip-ch', name: 'VIP CH', rate: 200 },
      { id: 'oe-vip-ad', name: 'VIP AD', rate: 400 },
      { id: 'oe-vip-alc', name: 'VIP ALC', rate: 550 },
    ],
    customPackageInfo: "Grandiose vessel for large dinner events."
  },
  {
    id: 'DO-yacht-mansour', name: 'AL MANSOUR', capacity: 80, status: 'Maintenance', imageUrl: 'https://placehold.co/600x400.png?text=Al+Mansour',
    category: 'Dinner Cruise',
    packages: [
      { id: 'am-child', name: 'CHILD', rate: 100 },
      { id: 'am-adult', name: 'ADULT', rate: 180 },
      { id: 'am-vip-ch', name: 'VIP CH', rate: 150 },
      { id: 'am-vip-ad', name: 'VIP AD', rate: 300 },
      { id: 'am-vip-alc', name: 'VIP ALC', rate: 420 },
    ],
    customPackageInfo: "Classic dhow experience, currently under maintenance."
  },
  {
    id: 'DO-yacht-super', name: 'SUPERYACHT SIGHTSEEING', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Superyacht+Sightseeing',
    category: 'Superyacht Sightseeing Cruise',
    packages: [
      { id: 'ss-basic', name: 'BASIC', rate: 199 },
      { id: 'ss-premium', name: 'PREMIUM', rate: 299 },
      { id: 'ss-standard', name: 'STANDARD', rate: 249 },
      { id: 'ss-vip', name: 'VIP', rate: 399 },
    ],
    customPackageInfo: "Experience Dubai's landmarks from a superyacht."
  },
  {
    id: 'DO-yacht-private1', name: 'The Serene Yacht', capacity: 20, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Serene+Yacht',
    category: 'Private Cruise',
    packages: [
        { id: 'private-hourly', name: 'Hourly Charter', rate: 1500},
        { id: 'private-softdrinks', name: 'Soft Drinks Package pp', rate: 50},
    ],
    customPackageInfo: "Ideal for private, intimate gatherings. Hourly rate applies."
  }
];


export const placeholderLeads: Lead[] = [
  {
    id: 'DO-001',
    clientName: 'Tech Corp Events',
    agent: 'DO-001',
    yacht: 'DO-yacht-lotus',
    status: 'Closed',
    month: formatISO(parseISO('2024-07-15T14:00:00')),
    notes: 'Confirmed booking for annual dinner.',
    type: 'Dinner Cruise',
    paymentConfirmationStatus: 'PAID',
    transactionId: 'T20240715001',
    modeOfPayment: 'CARD',
    packageQuantities: [
      { packageId: 'lr-adult', packageName: 'ADULT', quantity: 50, rate: 250 },
      { packageId: 'lr-ad-alc', packageName: 'AD ALC', quantity: 30, rate: 350 },
    ],
    freeGuestCount: 5,
    perTicketRate: undefined, // Or a specific rate if applicable
    totalAmount: 23000,
    commissionPercentage: 10,
    commissionAmount: 2300,
    netAmount: 20700,
    paidAmount: 20700,
    balanceAmount: 0,
    createdAt: formatISO(subDays(today, 30)),
    updatedAt: formatISO(subDays(today, 15)),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-002',
    clientName: 'Sunset Tours R Us',
    agent: 'DO-002',
    yacht: 'DO-yacht-super',
    status: 'Balance',
    month: formatISO(parseISO('2024-07-25T18:30:00')),
    notes: 'Prospective client for regular sightseeing tours.',
    type: 'Superyacht Sightseeing Cruise',
    paymentConfirmationStatus: 'CONFIRMED',
    modeOfPayment: 'CREDIT',
    packageQuantities: [
      { packageId: 'ss-premium', packageName: 'PREMIUM', quantity: 20, rate: 299 },
    ],
    freeGuestCount: 2,
    perTicketRate: 299, // Example: Assuming this is the primary ticket rate for this lead
    totalAmount: 5980,
    commissionPercentage: 15,
    commissionAmount: 897,
    netAmount: 5083,
    paidAmount: 1000,
    balanceAmount: 4083,
    createdAt: formatISO(subDays(today, 25)),
    updatedAt: formatISO(subDays(today, 10)),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-003',
    clientName: 'Private Celebration Planners',
    agent: 'DO-001',
    yacht: 'DO-yacht-private1',
    status: 'Balance',
    month: formatISO(parseISO('2024-08-10T16:00:00')),
    notes: 'Birthday party, deposit paid.',
    type: 'Private Cruise',
    paymentConfirmationStatus: 'CONFIRMED',
    modeOfPayment: 'CASH / CARD',
    packageQuantities: [
      { packageId: 'private-hourly', packageName: 'Hourly Charter', quantity: 4, rate: 1500 },
      { packageId: 'private-softdrinks', packageName: 'Soft Drinks Package pp', quantity: 15, rate: 50},
    ],
    freeGuestCount: 0,
    perTicketRate: undefined, // N/A for hourly charter type lead in this example
    totalAmount: 6750,
    commissionPercentage: 10,
    commissionAmount: 675,
    netAmount: 6075,
    paidAmount: 3000,
    balanceAmount: 3075,
    createdAt: formatISO(subDays(today, 10)),
    updatedAt: formatISO(subDays(today, 2)),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-001', clientName: 'Tech Corp Events', amount: 20700, dueDate: format(addDays(parseISO(placeholderLeads[0].month), 7), 'yyyy-MM-dd'), status: 'Paid', createdAt: formatISO(subDays(today, 14)) },
  { id: 'DO-inv002', leadId: 'DO-002', clientName: 'Sunset Tours R Us', amount: 5083, dueDate: format(addDays(parseISO(placeholderLeads[1].month), 7), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 9)) },
  { id: 'DO-inv003', leadId: 'DO-003', clientName: 'Private Celebration Planners', amount: 6075, dueDate: format(addDays(parseISO(placeholderLeads[2].month), 7), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 1)) },
];
