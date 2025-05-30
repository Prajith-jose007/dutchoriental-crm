
import type { Lead, User, Yacht, Invoice, Agent, LeadType, ModeOfPayment, LeadStatus, YachtPackageItem } from './types';
import { formatISO, parseISO, subDays, addDays, format } from 'date-fns';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Naufal', email: 'naufal@dutchoriental.com', designation: 'Acounts', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active', password: 'password123' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active', password: 'password123' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active', password: 'password123' },
  { id: 'DO-admin', name: 'Admin User', email: 'admin@dutchoriental.com', designation: 'System Administrator', avatarUrl: 'https://placehold.co/100x100.png?text=AU', status: 'Active', password: 'Dutch@123#' },
];

export const placeholderAgents: Agent[] = [
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


export const placeholderYachts: Yacht[] = [
  {
    id: 'DO-YACHT-LOTUS', name: 'LOTUS ROYALE', capacity: 150, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Lotus+Royale',
    customPackageInfo: "Flagship luxury experience. All-inclusive options available.",
    packages: [
      { id: 'lotus-child', name: 'LOTUS Child', rate: 150 },
      { id: 'lotus-adult', name: 'LOTUS Adult', rate: 250 },
      { id: 'lotus-ad-alc', name: 'LOTUS Adult + Alcohol', rate: 350 },
      { id: 'lotus-vip-ch', name: 'LOTUS VIP Child', rate: 220 },
      { id: 'lotus-vip-ad', name: 'LOTUS VIP Adult', rate: 400 },
      { id: 'lotus-vip-ad-alc', name: 'LOTUS VIP Adult + Alcohol', rate: 550 },
      { id: 'lotus-royal-ch', name: 'LOTUS Royal Child', rate: 300 },
      { id: 'lotus-royal-ad', name: 'LOTUS Royal Adult', rate: 600 },
      { id: 'lotus-royal-alc', name: 'LOTUS Royal Adult + Alcohol', rate: 750 },
    ]
  },
  {
    id: 'DO-YACHT-OCEAN', name: 'OCEAN EMPRESS', capacity: 80, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Ocean+Empress',
    customPackageInfo: "Perfect for mid-sized corporate events and parties.",
    packages: [
      { id: 'ocean-child', name: 'OCEAN Child', rate: 120 },
      { id: 'ocean-adult', name: 'OCEAN Adult', rate: 200 },
      { id: 'ocean-ad-alc', name: 'OCEAN Adult + Alcohol', rate: 290 },
      { id: 'ocean-vip-ch', name: 'OCEAN VIP Child', rate: 180 },
      { id: 'ocean-vip-ad', name: 'OCEAN VIP Adult', rate: 320 },
      { id: 'ocean-vip-alc', name: 'OCEAN VIP Adult + Alcohol', rate: 450 },
    ]
  },
  {
    id: 'DO-YACHT-ALMANSOUR', name: 'AL MANSOUR DHOW', capacity: 60, status: 'Maintenance', imageUrl: 'https://placehold.co/600x400.png?text=Al+Mansour',
    customPackageInfo: "Traditional dhow experience. Currently under maintenance.",
    packages: [
      { id: 'almansour-child', name: 'AL MANSOUR Child', rate: 90 },
      { id: 'almansour-adult', name: 'AL MANSOUR Adult', rate: 150 },
      { id: 'almansour-vip-ch', name: 'AL MANSOUR VIP Child', rate: 130 },
      { id: 'almansour-vip-ad', name: 'AL MANSOUR VIP Adult', rate: 220 },
      { id: 'almansour-vip-alc', name: 'AL MANSOUR VIP Adult + Alcohol', rate: 300 },
    ]
  },
  {
    id: 'DO-YACHT-SIGHTSEE', name: 'SUPERYACHT SIGHTSEEING', capacity: 40, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Sightseeing',
    customPackageInfo: "Hourly sightseeing tours. Focus on views and comfort.",
    packages: [
      { id: 'sightsee-basic', name: 'Sightseeing Basic Pass', rate: 100 },
      { id: 'sightsee-std', name: 'Sightseeing Standard Pass', rate: 150 },
      { id: 'sightsee-prem', name: 'Sightseeing Premium Pass', rate: 200 },
      { id: 'sightsee-vip', name: 'Sightseeing VIP Pass', rate: 300 },
    ]
  },
];

const today = new Date();

export const placeholderLeads: Lead[] = [
  {
    id: 'DO-001',
    clientName: 'Tech Solutions Ltd',
    agent: 'DO-AGENT-001',
    yacht: 'DO-YACHT-LOTUS',
    status: 'Conformed',
    month: formatISO(parseISO('2024-07-15T14:00:00.000Z')),
    notes: 'Confirmed booking for Lotus Royale. VIP Adult package for 10 guests.',
    type: 'Corporate Event',
    transactionId: '202400001',
    modeOfPayment: 'Online',
    qty_vipAdultRate: 10, // Example: This would map to "LOTUS VIP Adult" rate (400) = 4000
    totalAmount: 4000,    // Assuming only this package for simplicity
    commissionPercentage: 10, // From agent DO-AGENT-001
    commissionAmount: 400,
    netAmount: 3600,
    paidAmount: 3600,
    balanceAmount: 0,
    createdAt: formatISO(parseISO('2024-06-15T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-07-01T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-002',
    clientName: 'Innovate Inc.',
    agent: 'DO-AGENT-002',
    yacht: 'DO-YACHT-SIGHTSEE',
    status: 'Upcoming',
    month: formatISO(parseISO('2024-07-25T14:30:00.000Z')),
    notes: 'Inquiry for Superyacht Sightseeing, 20 basic passes.',
    type: 'Private',
    transactionId: '202400002',
    modeOfPayment: 'Credit',
    qty_childRate: 20, // Example mapping to "Sightseeing Basic Pass" (100) = 2000
                       // This qty_childRate will need remapping in Lead form Phase 2
    totalAmount: 2000,
    commissionPercentage: 15,
    commissionAmount: 300,
    netAmount: 1700,
    paidAmount: 500,
    balanceAmount: 1200,
    createdAt: formatISO(parseISO('2024-06-20T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-07-05T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-001', clientName: 'Tech Solutions Ltd', amount: 3600, dueDate: format(addDays(today, 15), 'yyyy-MM-dd'), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-002', clientName: 'Innovate Inc.', amount: 1700, dueDate: format(addDays(today, 20), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
];
