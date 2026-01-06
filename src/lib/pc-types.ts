
export type PCLeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Quoted' | 'Negotiation' | 'Confirmed' | 'Lost';
export type PCLeadPriority = 'Low' | 'Medium' | 'High';
export type PCQuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
export type PCBookingStatus = 'Tentative' | 'Confirmed' | 'Cancelled' | 'Completed' | 'No-show';
export type PCPaymentStatus = 'Pending' | 'Partial' | 'Paid';
export type PCYachtStatus = 'Available' | 'Booked' | 'Maintenance';
export type PCCustomerType = 'New' | 'Repeat' | 'VIP' | 'Corporate';

export interface PCLead {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    nationality?: string;
    language?: string;
    source?: string;
    inquiryDate: string; // ISO
    yachtType?: string;
    adultsCount: number;
    kidsCount: number;
    durationHours: number;
    preferredDate: string; // ISO
    budgetRange?: string;
    occasion?: string;
    assignedAgentId?: string;
    status: PCLeadStatus;
    priority: PCLeadPriority;
    nextFollowUpDate?: string; // ISO
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PCQuotation {
    id: string;
    leadId: string;
    yachtId: string;
    basePricePerHour: number;
    durationHours: number;
    subtotal: number;
    addons: {
        captainCrew?: 'Included' | 'Extra';
        fuelPolicy?: 'Included' | 'Limit' | 'Extra';
        foodBeverage?: number;
        bbqSetup?: number;
        liveDj?: number;
        decorations?: number;
        waterSports?: number;
        alcoholPackage?: number;
    };
    discountAmount: number;
    vatAmount: number;
    totalAmount: number;
    status: PCQuoteStatus;
    validUntil: string;
    createdAt: string;
    updatedAt: string;
}

export interface PCBooking {
    id: string;
    leadId: string;
    customerId: string;
    yachtId: string;
    tripDate: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    totalHours: number;
    location: string;
    guestsCount: number;
    status: PCBookingStatus;
    // Ops fields
    captainName?: string;
    crewDetails?: string;
    idVerified: boolean;
    checkInTime?: string;
    extraHoursUsed: number;
    extraCharges: number;
    customerSignature?: string; // Base64 or URL
    createdAt: string;
    updatedAt: string;
}

export interface PCPayment {
    id: string;
    bookingId: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    paymentMethod: string;
    transactionId?: string;
    status: PCPaymentStatus;
    paymentDate?: string;
    refundAmount: number;
    vatInvoicePdfUrl?: string;
    createdAt: string;
}

export interface PCYacht {
    id: string;
    name: string;
    category: string;
    capacity: number;
    cabinsCount: number;
    crewCount: number;
    location: string;
    pricePerHour: number;
    minHours: number;
    images: string[];
    amenities: string[];
    status: PCYachtStatus;
}

export interface PCCustomer {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    nationality?: string;
    language?: string;
    totalBookings: number;
    totalRevenue: number;
    lastBookingDate?: string;
    type: PCCustomerType;
    preferences: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PCTask {
    id: string;
    leadId?: string;
    bookingId?: string;
    type: 'Call' | 'WhatsApp' | 'Email';
    dueDate: string;
    assignedTo: string;
    status: 'Pending' | 'Completed';
    notes?: string;
    createdAt: string;
}

export interface PCAgent {
    id: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    commissionPercentage: number;
}

export interface PCPartner {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    commissionRate: number;
}
