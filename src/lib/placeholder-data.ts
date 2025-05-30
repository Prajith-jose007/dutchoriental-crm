
import type { Lead, User, Yacht, Invoice, Agent, LeadType, ModeOfPayment, LeadStatus, YachtPackageItem } from './types';
import { formatISO, parseISO, subDays, addDays, format } from 'date-fns';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Naufal', email: 'naufal@dutchoriental.com', designation: 'Acounts', avatarUrl: 'https://placehold.co/100x100.png?text=NS', status: 'Active' },
  { id: 'DO-user2', name: 'Bob Johnson', email: 'bob@dutchoriental.com', designation: 'Sales Agent', avatarUrl: 'https://placehold.co/100x100.png?text=BJ', status: 'Active' },
  { id: 'DO-user3', name: 'Carol White', email: 'carol@dutchoriental.com', designation: 'Admin', avatarUrl: 'https://placehold.co/100x100.png?text=CW', status: 'Active' },
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
    id: 'DO-yacht1', name: 'LOTUS ROYALE', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Lotus+Royale',
    customPackageInfo: "Luxury experience with fine dining options.",
    packages: [
      { id: 'lotus-child', name: 'CHILD', rate: 150 },
      { id: 'lotus-adult', name: 'ADULT', rate: 250 },
      { id: 'lotus-ad-alc', name: 'AD ALC', rate: 350 },
      { id: 'lotus-vip-ch', name: 'VIP CH', rate: 200 },
      { id: 'lotus-vip-ad', name: 'VIP AD', rate: 400 },
      { id: 'lotus-vip-ad-alc', name: 'VIP AD ALC', rate: 550 },
      { id: 'lotus-royal-ch', name: 'ROYAL CH', rate: 300 },
      { id: 'lotus-royal-ad', name: 'ROYAL AD', rate: 600 },
      { id: 'lotus-royal-alc', name: 'ROYAL ALC', rate: 750 },
    ],
  },
  {
    id: 'DO-yacht2', name: 'OCEAN EMPRESS', capacity: 100, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Ocean+Empress',
    customPackageInfo: "Ideal for large corporate events or parties.",
    packages: [
      { id: 'ocean-child', name: 'CHILD', rate: 120 },
      { id: 'ocean-adult', name: 'ADULT', rate: 200 },
      { id: 'ocean-ad-alc', name: 'AD ALC', rate: 300 },
      { id: 'ocean-vip-ch', name: 'VIP CH', rate: 180 },
      { id: 'ocean-vip-ad', name: 'VIP AD', rate: 350 },
      { id: 'ocean-vip-alc', name: 'VIP ALC', rate: 480 },
    ],
  },
  {
    id: 'DO-yacht3', name: 'AL MANSOUR', capacity: 40, status: 'Maintenance', imageUrl: 'https://placehold.co/600x400.png?text=Al+Mansour',
    customPackageInfo: "Traditional Dhow experience. Currently under scheduled maintenance.",
    packages: [
      { id: 'mansour-child', name: 'CHILD', rate: 80 },
      { id: 'mansour-adult', name: 'ADULT', rate: 150 },
      { id: 'mansour-vip-ch', name: 'VIP CH', rate: 120 },
      { id: 'mansour-vip-ad', name: 'VIP AD', rate: 250 },
      { id: 'mansour-vip-alc', name: 'VIP ALC', rate: 350 },
    ],
  },
  {
    id: 'DO-yacht4', name: 'SUPERYACHT SIGHTSEEING', capacity: 30, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Superyacht+Sightseeing',
    customPackageInfo: "Quick sightseeing tours around the landmarks.",
    packages: [
      { id: 'ss-basic', name: 'BASIC', rate: 100 },
      { id: 'ss-standard', name: 'STANDARD', rate: 150 },
      { id: 'ss-premium', name: 'PREMIUM', rate: 200 },
      { id: 'ss-vip', name: 'VIP', rate: 300 },
    ],
  }
];

const today = new Date();

export const placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1',
    clientName: 'Tech Corp Events',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht1', // LOTUS ROYALE
    status: 'Conformed',
    month: formatISO(new Date('2024-07-15T14:00:00')),
    notes: 'Confirmed booking for annual corporate gala.',
    type: 'Corporate Event',
    transactionId: 'TXN2024001',
    modeOfPayment: 'Online',
    
    // Quantities will be updated in Phase 2 to match dynamic packages.
    // For now, these old fields will likely result in 0 total amount until Phase 2.
    qty_childRate: 0,
    qty_adultStandardRate: 0, 
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 20, // Simulating 20 VIP AD on Lotus
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 0,

    totalAmount: 20 * 400, // Placeholder: 20 * 400 (Lotus VIP AD rate) = 8000
    commissionPercentage: 10,
    commissionAmount: 800,
    netAmount: 7200,
    paidAmount: 7200,
    balanceAmount: 0,

    createdAt: formatISO(subDays(today, 30)),
    updatedAt: formatISO(subDays(today, 15)),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead2',
    clientName: 'Innovate Ltd Meetup',
    agent: 'DO-AGENT-002',
    yacht: 'DO-yacht2', // OCEAN EMPRESS
    status: 'Upcoming',
    month: formatISO(new Date('2024-07-25T18:30:00')),
    notes: 'Follow up next week for final numbers.',
    type: 'Private',
    transactionId: 'TXN2024002',
    modeOfPayment: 'Credit',

    qty_childRate: 5, // Simulating 5 Child on Ocean Empress
    qty_adultStandardRate: 15, // Simulating 15 Adult on Ocean Empress
    qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0,
    qty_vipAdultRate: 0,
    qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0,
    qty_royalAdultRate: 0,
    qty_royalDrinksRate: 0,
    othersAmtCake: 0,
    
    totalAmount: (5 * 120) + (15 * 200), // (5*120) + (15*200) = 600 + 3000 = 3600
    commissionPercentage: 15,
    commissionAmount: 3600 * 0.15, // 540
    netAmount: 3600 - 540, // 3060
    paidAmount: 1000,
    balanceAmount: 2060,

    createdAt: formatISO(subDays(today, 25)),
    updatedAt: formatISO(subDays(today, 10)),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp Events', amount: 7200, dueDate: format(addDays(parseISO(placeholderLeads[0].month), 15), 'yyyy-MM-dd'), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd Meetup', amount: 3060, dueDate: format(addDays(parseISO(placeholderLeads[1].month), 20), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
];
