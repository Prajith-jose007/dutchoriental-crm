
import type { Lead, User, Yacht, Invoice, Agent, YachtCategory, YachtPackageItem, LeadPackageQuantity, PaymentConfirmationStatus } from './types';
import { formatISO, subDays, addDays, format, parseISO, getYear } from 'date-fns';

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
const currentYear = getYear(today);

export const placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht-lotus', name: 'LOTUS ROYALE', capacity: 150, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Lotus+Royale',
    category: 'Dinner Cruise',
    packages: [
      { id: 'lr-child', name: 'CHILD', rate: 150 },
      { id: 'lr-adult', name: 'ADULT', rate: 250 },
      { id: 'lr-child-top', name: 'CHILD TOP DECK', rate: 200 },
      { id: 'lr-adult-top', name: 'ADULT TOP DECK', rate: 300 },
      { id: 'lr-ad-alc', name: 'ADULT ALC', rate: 350 },
      { id: 'lr-vip-ch', name: 'VIP CHILD', rate: 250 },
      { id: 'lr-vip-ad', name: 'VIP ADULT', rate: 450 },
      { id: 'lr-vip-alc', name: 'VIP ALC', rate: 600 },
      { id: 'lr-royal-ch', name: 'ROYAL CHILD', rate: 350 },
      { id: 'lr-royal-ad', name: 'ROYAL ADULT', rate: 700 },
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
      { id: 'oe-child-top', name: 'CHILD TOP DECK', rate: 170 },
      { id: 'oe-adult-top', name: 'ADULT TOP DECK', rate: 270 },
      { id: 'oe-ad-alc', name: 'ADULT ALC', rate: 300 },
      { id: 'oe-vip-ch', name: 'VIP CHILD', rate: 200 },
      { id: 'oe-vip-ad', name: 'VIP ADULT', rate: 400 },
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
      { id: 'am-vip-ch', name: 'VIP CHILD', rate: 150 },
      { id: 'am-vip-ad', name: 'VIP ADULT', rate: 300 },
      { id: 'am-vip-alc', name: 'VIP ALC', rate: 420 },
    ],
    customPackageInfo: "Classic dhow experience, currently under maintenance."
  },
  {
    id: 'DO-yacht-super', name: 'SUPERYACHT SIGHTSEEING', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Superyacht+Sightseeing',
    category: 'Superyacht Sightseeing Cruise',
    packages: [
      { id: 'ss-basic', name: 'BASIC', rate: 199 },
      { id: 'ss-standard', name: 'STANDARD', rate: 249 },
      { id: 'ss-premium', name: 'PREMIUM', rate: 299 },
      { id: 'ss-vip', name: 'VIP', rate: 399 },
    ],
    customPackageInfo: "Experience Dubai's landmarks from a superyacht."
  },
  {
    id: 'DO-yacht-private1', name: 'The Serene Yacht', capacity: 20, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Serene+Yacht',
    category: 'Private Cruise',
    packages: [
        { id: 'private-hourly', name: 'HOUR CHARTER', rate: 1500},
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
    month: formatISO(parseISO(`${currentYear}-07-15T14:00:00`)),
    notes: 'Confirmed booking for annual dinner.',
    type: 'Dinner Cruise',
    paymentConfirmationStatus: 'CONFIRMED',
    transactionId: `TRN-${currentYear}00001`,
    modeOfPayment: 'CARD',
    packageQuantities: [
      { packageId: 'lr-adult', packageName: 'ADULT', quantity: 50, rate: 250 },
      { packageId: 'lr-ad-alc', packageName: 'ADULT ALC', quantity: 30, rate: 350 },
      { packageId: 'lr-vip-alc', packageName: 'VIP ALC', quantity: 2, rate: 499 } // Corrected packageId from lr-vip-ad-alc
    ],
    freeGuestCount: 5,
    perTicketRate: 100,
    totalAmount: (50 * 250) + (30 * 350) + (2 * 499) + 100, // Recalculate totalAmount based on corrected package
    commissionPercentage: 10,
    commissionAmount: 2409.80, // Recalculated: ((50 * 250) + (30 * 350) + (2*499) + 100) * 0.10
    netAmount: 21688.20, // Recalculated
    paidAmount: 21688.20, // Assuming fully paid
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
    month: formatISO(parseISO(`${currentYear}-07-25T18:30:00`)),
    notes: 'Prospective client for regular sightseeing tours. Payment pending.',
    type: 'Superyacht Sightseeing Cruise',
    paymentConfirmationStatus: 'CONFIRMED',
    transactionId: `TRN-${currentYear}00002`,
    modeOfPayment: 'CREDIT',
    packageQuantities: [
      { packageId: 'ss-premium', packageName: 'PREMIUM', quantity: 20, rate: 299 },
    ],
    freeGuestCount: 2,
    perTicketRate: undefined,
    totalAmount: 20 * 299,
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
    status: 'Upcoming',
    month: formatISO(parseISO(`${currentYear}-08-10T16:00:00`)),
    notes: 'Birthday party, deposit paid. Awaiting event.',
    type: 'Private Cruise',
    paymentConfirmationStatus: 'UNCONFIRMED',
    transactionId: `TRN-${currentYear}00003`,
    modeOfPayment: 'CASH / CARD',
    packageQuantities: [
      { packageId: 'private-hourly', packageName: 'HOUR CHARTER', quantity: 4, rate: 1500 },
    ],
    freeGuestCount: 0,
    perTicketRate: undefined,
    totalAmount: 4 * 1500,
    commissionPercentage: 10,
    commissionAmount: 600,
    netAmount: 5400,
    paidAmount: 3000,
    balanceAmount: 2400,
    createdAt: formatISO(subDays(today, 10)),
    updatedAt: formatISO(subDays(today, 2)),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
];

const lead1NetAmount = placeholderLeads.find(l => l.id === 'DO-001')?.netAmount || 0;
const lead2NetAmount = placeholderLeads.find(l => l.id === 'DO-002')?.netAmount || 0;
const lead3NetAmount = placeholderLeads.find(l => l.id === 'DO-003')?.netAmount || 0;

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-001', clientName: 'Tech Corp Events', amount: lead1NetAmount, dueDate: format(addDays(parseISO(placeholderLeads[0].month), 7), 'yyyy-MM-dd'), status: 'Paid', createdAt: formatISO(subDays(today, 14)) },
  { id: 'DO-inv002', leadId: 'DO-002', clientName: 'Sunset Tours R Us', amount: lead2NetAmount, dueDate: format(addDays(parseISO(placeholderLeads[1].month), 7), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 9)) },
  { id: 'DO-inv003', leadId: 'DO-003', clientName: 'Private Celebration Planners', amount: lead3NetAmount, dueDate: format(addDays(parseISO(placeholderLeads[2].month), 7), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 1)) },
];
