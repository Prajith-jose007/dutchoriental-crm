
import type { Lead, User, Yacht, Invoice, Agent, LeadType, ModeOfPayment, LeadStatus } from './types';
import { formatISO, parseISO, subDays, addDays, format } from 'date-fns';

export const placeholderUsers: User[] = [
  { id: 'DO-user1', name: 'Naufal', email: 'naufal@dutchoriental.com', designation: 'Acounts', avatarUrl: 'https://placehold.co/100x100.png?text=AS', status: 'Active' },
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
    // No otherChargeName/Rate specified, will default to undefined/0
  },
];

const today = new Date();

export const placeholderLeads: Lead[] = [
  {
    id: 'DO-001',
    agent: 'DO-AGENT-001',
    status: 'Conformed',
    month: formatISO(parseISO('2024-07-15T14:00:00+04:00')),
    notes: 'Confirmed booking, client very happy.',
    yacht: 'DO-yacht1',
    type: 'Dinner Cruise' as LeadType,
    transactionId: '202400001',
    modeOfPayment: 'Online' as ModeOfPayment,
    qty_adultStandardRate: 10, // Uses yacht1.adultStandardRate (129)
    totalAmount: 1290,
    commissionPercentage: 10,
    commissionAmount: 129,
    netAmount: 1161,
    paidAmount: 1290,
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
    yacht: 'DO-yacht2',
    type: 'Private' as LeadType,
    transactionId: '202400002',
    modeOfPayment: 'Credit' as ModeOfPayment,
    qty_adultStandardRate: 10, // Uses yacht2.adultStandardRate (135)
    totalAmount: 1350,
    commissionPercentage: 15,
    commissionAmount: 202.5,
    netAmount: 1147.5,
    paidAmount: 500,
    balanceAmount: 647.5, // 1147.5 - 500
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
    yacht: 'DO-yacht1',
    type: 'Sunset Cruise' as LeadType,
    modeOfPayment: 'Cash/Card' as ModeOfPayment,
    qty_vipAdultRate: 10, // Uses yacht1.vipAdultRate (189)
    othersAmtCake: 1,     // Uses yacht1.otherChargeRate (150)
    totalAmount: 2040,    // (10 * 189) + (1 * 150)
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
   {
    id: 'DO-004',
    agent: 'DO-AGENT-001',
    status: 'Upcoming',
    month: formatISO(parseISO('2024-08-20T22:00:00+04:00')),
    yacht: 'DO-yacht1',
    type: 'Private' as LeadType,
    modeOfPayment: 'Online' as ModeOfPayment,
    qty_vipAdultRate: 20, // Uses yacht1.vipAdultRate (189) -> 3780
    othersAmtCake: 1,     // Uses yacht1.otherChargeRate (150) -> 150
    totalAmount: 3930,    // 3780 + 150
    commissionPercentage: 10,
    commissionAmount: 393,
    netAmount: 3537,
    paidAmount: 0,
    balanceAmount: 3537,
    createdAt: formatISO(parseISO('2024-07-20T14:00:00+04:00')),
    updatedAt: formatISO(parseISO('2024-07-20T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user3',
    ownerUserId: 'DO-user3'
  },
  {
    id: 'DO-005',
    agent: 'DO-AGENT-002',
    status: 'Balance',
    month: formatISO(parseISO('2024-09-05T20:00:00+04:00')),
    yacht: 'DO-yacht1',
    type: 'Dinner Cruise' as LeadType,
    modeOfPayment: 'Credit' as ModeOfPayment,
    qty_childRate: 10,        // Uses yacht1.childRate (89) -> 890
    qty_adultStandardRate: 10,// Uses yacht1.adultStandardRate (129) -> 1290
    totalAmount: 2180,         // 890 + 1290
    commissionPercentage: 15,
    commissionAmount: 327,
    netAmount: 1853,
    paidAmount: 1000,
    balanceAmount: 853,
    createdAt: formatISO(parseISO('2024-08-10T14:00:00+04:00')),
    updatedAt: formatISO(parseISO('2024-08-15T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-006',
    agent: 'DO-AGENT-001',
    status: 'Closed',
    month: formatISO(parseISO('2024-05-05T20:00:00+04:00')),
    yacht: 'DO-yacht2',
    type: 'Private' as LeadType,
    modeOfPayment: 'Online' as ModeOfPayment,
    qty_vipAdultRate: 5, // Uses yacht2.vipAdultRate (195)
    totalAmount: 975,
    commissionPercentage: 10,
    commissionAmount: 97.5,
    netAmount: 877.5,
    paidAmount: 975, // Overpaid or full payment of total
    balanceAmount: 0, // Assuming balance cannot be negative if paid=total
    createdAt: formatISO(parseISO('2024-04-10T14:00:00+04:00')),
    updatedAt: formatISO(parseISO('2024-04-15T14:00:00+04:00')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  }
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-001', clientName: 'Tech Corp', amount: 1290, dueDate: formatISO(addDays(today, 15)), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-002', clientName: 'Innovate Ltd', amount: 1350, dueDate: formatISO(addDays(today, 20)), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
  { id: 'DO-inv003', leadId: 'DO-003', clientName: 'Solutions Inc', amount: 1290, dueDate: formatISO(subDays(today, 5)), status: 'Pending', createdAt: formatISO(subDays(today, 10)) },
  { id: 'DO-inv004', leadId: 'DO-004', clientName: 'Global Co', amount: 3880, dueDate: formatISO(addDays(today, 30)), status: 'Pending', createdAt: formatISO(subDays(today, 15))},
  { id: 'DO-inv005', leadId: 'DO-005', clientName: 'Celebrations LLC', amount: 2180, dueDate: formatISO(addDays(today, 40)), status: 'Pending', createdAt: formatISO(subDays(today, 20))},
];
