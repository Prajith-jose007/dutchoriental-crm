
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
    otherCharges: [
        { id: 'cake-service-01', name: "Cake Setup Fee", rate: 150 },
        { id: 'extra-hour-01', name: "Additional Hour", rate: 500 }
    ]
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
    otherCharges: [
        { id: 'decor-02', name: "Basic Decoration", rate: 250 }
    ]
  },
];

const today = new Date();

export const placeholderLeads: Lead[] = [
  {
    id: 'DO-lead1',
    clientName: 'Tech Corp',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht1',
    status: 'Conformed',
    month: formatISO(parseISO('2024-07-15T14:00:00.000Z')), // Primary Event Date
    notes: 'Confirmed booking, client very happy.',
    type: 'Dinner Cruise',
    transactionId: '202400001',
    modeOfPayment: 'Online',
    qty_adultStandardRate: 10, // Yacht1: 10 * 129 = 1290
    totalAmount: 1290,
    commissionPercentage: 10, // From agent DO-AGENT-001
    commissionAmount: 129,    // 10% of 1290
    netAmount: 1161,          // 1290 - 129
    paidAmount: 1161,
    balanceAmount: 0,
    createdAt: formatISO(parseISO('2024-06-15T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-07-01T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
  {
    id: 'DO-lead2',
    clientName: 'Innovate Ltd',
    agent: 'DO-AGENT-002',
    yacht: 'DO-yacht2',
    status: 'Upcoming',
    month: formatISO(parseISO('2024-07-25T14:30:00.000Z')),
    notes: 'Follow up next week.',
    type: 'Private',
    transactionId: '202400002',
    modeOfPayment: 'Credit',
    qty_adultStandardRate: 10, // Yacht2: 10 * 135 = 1350
    totalAmount: 1350,
    commissionPercentage: 15, // From agent DO-AGENT-002
    commissionAmount: 202.5,  // 15% of 1350
    netAmount: 1147.5,        // 1350 - 202.5
    paidAmount: 500,
    balanceAmount: 647.5,
    createdAt: formatISO(parseISO('2024-06-20T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-07-05T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-lead3',
    clientName: 'Solutions Inc',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht1',
    status: 'Conformed',
    month: formatISO(parseISO('2024-08-10T12:00:00.000Z')),
    notes: 'Birthday party setup requested.',
    type: 'Sunset Cruise',
    modeOfPayment: 'Cash/Card',
    qty_vipAdultRate: 10, // Yacht1: 10 * 189 = 1890
    othersAmtCake: 1,     // Corresponds to Yacht1's 'Cake Setup Fee' rate (150) for calculation
    totalAmount: 1890,    // Assuming othersAmtCake not included in this particular placeholder's initial total
    commissionPercentage: 10,
    commissionAmount: 189,
    netAmount: 1701,
    paidAmount: 1701,
    balanceAmount: 0,
    createdAt: formatISO(parseISO('2024-07-10T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-07-12T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  },
   {
    id: 'DO-lead4',
    clientName: 'Global Co',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht1',
    status: 'Upcoming',
    month: formatISO(parseISO('2024-08-20T18:00:00.000Z')),
    type: 'Private',
    modeOfPayment: 'Online',
    qty_vipAdultRate: 20, // Yacht1: 20 * 189 = 3780
    othersAmtCake: 0, // No custom charge qty for this example
    totalAmount: 3780,
    commissionPercentage: 10,
    commissionAmount: 378,
    netAmount: 3402,
    paidAmount: 0,
    balanceAmount: 3402,
    createdAt: formatISO(parseISO('2024-07-20T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-07-20T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user3',
    ownerUserId: 'DO-user3'
  },
  {
    id: 'DO-lead5',
    clientName: 'Celebrations LLC',
    agent: 'DO-AGENT-002',
    yacht: 'DO-yacht1',
    status: 'Balance',
    month: formatISO(parseISO('2024-09-05T16:00:00.000Z')),
    type: 'Dinner Cruise',
    modeOfPayment: 'Credit',
    qty_childRate: 10,        // Yacht1: 10 * 89 = 890
    qty_adultStandardRate: 10,// Yacht1: 10 * 129 = 1290
    totalAmount: 2180,        // 890 + 1290
    commissionPercentage: 15,
    commissionAmount: 327,
    netAmount: 1853,
    paidAmount: 1000,
    balanceAmount: 853,
    createdAt: formatISO(parseISO('2024-08-10T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-08-15T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user2',
    ownerUserId: 'DO-user2'
  },
  {
    id: 'DO-lead6',
    clientName: 'Old Ventures',
    agent: 'DO-AGENT-001',
    yacht: 'DO-yacht2', // Uses Ocean Voyager
    status: 'Closed',
    month: formatISO(parseISO('2024-05-05T16:00:00.000Z')),
    type: 'Private',
    modeOfPayment: 'Online',
    qty_vipAdultRate: 5, // Yacht2: 5 * 195 = 975
    totalAmount: 975,
    commissionPercentage: 10,
    commissionAmount: 97.5,
    netAmount: 877.5,
    paidAmount: 877.5,
    balanceAmount: 0,
    createdAt: formatISO(parseISO('2024-04-10T10:00:00.000Z')),
    updatedAt: formatISO(parseISO('2024-04-15T10:00:00.000Z')),
    lastModifiedByUserId: 'DO-user1',
    ownerUserId: 'DO-user1'
  }
];

export const placeholderInvoices: Invoice[] = [
  { id: 'DO-inv001', leadId: 'DO-lead1', clientName: 'Tech Corp', amount: 1161, dueDate: format(addDays(today, 15), 'yyyy-MM-dd'), status: 'Paid', createdAt: formatISO(subDays(today, 5)) },
  { id: 'DO-inv002', leadId: 'DO-lead2', clientName: 'Innovate Ltd', amount: 1147.5, dueDate: format(addDays(today, 20), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 3)) },
  { id: 'DO-inv003', leadId: 'DO-lead3', clientName: 'Solutions Inc', amount: 1701, dueDate: format(subDays(today, 5), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 10)) },
  { id: 'DO-inv004', leadId: 'DO-lead4', clientName: 'Global Co', amount: 3402, dueDate: format(addDays(today, 30), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 15))},
  { id: 'DO-inv005', leadId: 'DO-lead5', clientName: 'Celebrations LLC', amount: 1853, dueDate: format(addDays(today, 40), 'yyyy-MM-dd'), status: 'Pending', createdAt: formatISO(subDays(today, 20))},
];
