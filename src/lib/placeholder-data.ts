
import type { Lead, User, Yacht, Invoice, Agent, LeadType, ModeOfPayment, LeadStatus } from './types';
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

const today = new Date();

export const placeholderYachts: Yacht[] = [
  {
    id: 'DO-yacht1', name: 'The Sea Serpent', capacity: 50, status: 'Available', imageUrl: 'https://placehold.co/600x400.png?text=Sea+Serpent',
    customPackageInfo: "Weekend special: Includes free jet ski for 1 hour (Admin Note)",
    childRate: 89,
    adultStandardRate: 129,
    adultStandardDrinksRate: 159,
    vipChildRate: 139,
    vipAdultRate: 189,
    vipAdultDrinksRate: 249,
    royalChildRate: 200,
    royalAdultRate: 300,
    royalDrinksRate: 380,
    otherChargeName: "Cake Service",
    otherChargeRate: 150,
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
  },
  {
    id: 'DO-yacht3', name: 'Sunset Cruise Special', capacity: 40, status: 'Maintenance', imageUrl: 'https://placehold.co/600x400.png?text=Sunset+Special',
    customPackageInfo: "Currently under scheduled maintenance. Focus on sunset views.",
    childRate: 70,
    adultStandardRate: 100,
    adultStandardDrinksRate: 130,
    vipChildRate: 100,
    vipAdultRate: 150,
    vipAdultDrinksRate: 190,
  },
];


export const placeholderLeads: Lead[] = [
  {
    id: 'DO-001',
    clientName: 'Tech Corp',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht1',
    status: 'Conformed',
    month: formatISO(new Date('2024-07-15T14:00:00')),
    notes: 'Confirmed booking, client very happy.',
    type: 'Corporate Event',
    transactionId: 'DO-inv001',
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
    commissionAmount: 129,
    netAmount: 1161,
    paidAmount: 1290,
    balanceAmount: 0, // Net - Paid = 1161 - 1290 = -129. Should be 0 if fully paid against net
    createdAt: formatISO(subDays(today, 30)),
    updatedAt: formatISO(subDays(today, 15)),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-002',
    clientName: 'Innovate Ltd',
    agent: 'DO-AGENT-002',
    yacht: 'DO-yacht2',
    status: 'Upcoming',
    month: formatISO(new Date('2024-07-25T18:30:00')),
    notes: 'Follow up next week.',
    type: 'Private',
    transactionId: 'DO-inv002',
    modeOfPayment: 'Credit',
    qty_childRate: 0,
    qty_adultStandardRate: 10, // 10 * 135 = 1350
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
    balanceAmount: 647.5,
    createdAt: formatISO(subDays(today, 25)),
    updatedAt: formatISO(subDays(today, 10)),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-003',
    clientName: 'Solutions Inc',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht1',
    status: 'Conformed',
    month: formatISO(new Date('2024-08-10T16:00:00')),
    type: 'Dinner Cruise',
    modeOfPayment: 'Cash/Card',
    qty_adultStandardRate: 10, // 10 * 129 = 1290
    totalAmount: 1290,
    commissionPercentage: 10,
    commissionAmount: 129,
    netAmount: 1161,
    paidAmount: 1161,
    balanceAmount: 0,
    createdAt: formatISO(subDays(today, 15)),
    updatedAt: formatISO(subDays(today, 12)),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-004',
    clientName: 'Global Co',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht1',
    status: 'Upcoming',
    month: formatISO(new Date('2024-08-20T22:00:00')),
    type: 'Sunset Cruise',
    modeOfPayment: 'Online',
    qty_vipAdultRate: 20, // 20 * 189 = 3780
    othersAmtCake: 1, // 1 * 150 (Cake Service) = 150. Total = 3780 + 150 = 3930
    totalAmount: 3930,
    commissionPercentage: 10,
    commissionAmount: 393,
    netAmount: 3537,
    paidAmount: 0,
    balanceAmount: 3537,
    createdAt: formatISO(subDays(today, 5)),
    updatedAt: formatISO(subDays(today, 5)),
    lastModifiedByUserId: 'DO-user3',
    ownerUserId: 'DO-user3'
  },
   {
    id: 'DO-005',
    clientName: 'Celebrations LLC',
    agent: 'DO-AGENT-002',
    yacht: 'DO-yacht1',
    status: 'Balance',
    month: formatISO(new Date('2024-09-05T20:00:00')),
    type: 'Private',
    modeOfPayment: 'Credit',
    qty_childRate: 10,        // 10 * 89 = 890
    qty_adultStandardRate: 10, // 10 * 129 = 1290. Total = 890 + 1290 = 2180
    totalAmount: 2180,
    commissionPercentage: 15,
    commissionAmount: 327,
    netAmount: 1853,
    paidAmount: 1000,
    balanceAmount: 853,
    createdAt: formatISO(subDays(today, 2)),
    updatedAt: formatISO(subDays(today, 1)),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-006',
    clientName: 'Old Ventures',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht2', // Ocean Voyager
    status: 'Closed',
    month: formatISO(new Date('2024-05-05T20:00:00')),
    type: 'Private',
    modeOfPayment: 'Online',
    qty_vipAdultRate: 5, // 5 * 195 = 975
    totalAmount: 975,
    commissionPercentage: 10,
    commissionAmount: 97.5,
    netAmount: 877.5,
    paidAmount: 877.5,
    balanceAmount: 0,
    createdAt: formatISO(subDays(today, 60)),
    updatedAt: formatISO(subDays(today, 55)),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-001', clientName: 'Tech Corp', amount: 1290, dueDate: format(addDays(parseISO(placeholderLeads[0].month), 15), 'yyyy-MM-dd'), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-002', clientName: 'Innovate Ltd', amount: 1350, dueDate: format(addDays(parseISO(placeholderLeads[1].month), 20), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
  { id: 'DO-inv003', leadId: 'DO-003', clientName: 'Solutions Inc', amount: 1290, dueDate: format(addDays(parseISO(placeholderLeads[2].month), 5), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 10)) },
  { id: 'DO-inv004', leadId: 'DO-004', clientName: 'Global Co', amount: 3880, dueDate: format(addDays(parseISO(placeholderLeads[3].month), 10), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 2)) },
  { id: 'DO-inv005', leadId: 'DO-005', clientName: 'Celebrations LLC', amount: 2180, dueDate: format(addDays(parseISO(placeholderLeads[4].month), 5), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 1)) },
];
