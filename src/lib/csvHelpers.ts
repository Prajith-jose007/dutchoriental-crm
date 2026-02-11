import type { Lead, Yacht, LeadPackageQuantity, PaymentConfirmationStatus, Agent } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, paymentConfirmationStatusOptions } from '@/lib/types';
import { formatISO, parseISO, isValid, parse } from 'date-fns';

const USER_ID_STORAGE_KEY = 'currentUserId';

export type ImportSource = 'DEFAULT' | 'MASTER' | 'RUZINN' | 'RAYNA' | 'GYG';

export const leadCsvHeaderMapping: Record<string, any> = {
    'id': 'id',
    'status': 'status',
    'date': 'month', 'eventdate': 'month', 'event_date': 'month', 'lead/event_date': 'month', 'travel_date': 'month', 'traveldate': 'month', 'travel_date_': 'month', 'travel date': 'month', 'booking_date': 'month', 'booking date': 'month',
    'yacht': 'yacht', 'service_nam': 'yacht', 'service_name': 'yacht', 'yachtname': 'yacht', 'option': 'yacht', 'service name': 'yacht',
    'event': 'yacht', // Added for Master CSV
    'inv': 'modeOfPayment', // Updated for Master CSV (User request)
    'comm %': 'commissionPercentage', // Added for Master CSV
    'comm': 'commissionAmount', // Added for Master CSV
    'net': 'netAmount', // Added for Master CSV
    'amt': 'totalAmount', // Added for Master CSV
    'rate': 'perTicketRate', // Added for Master CSV
    'agent': 'agent', 'agent_name': 'agent', 'company_na': 'agent', 'company_name': 'agent', 'companyname': 'agent', 'company na': 'agent',
    'client': 'clientName', 'client_name': 'clientName', 'customer_na': 'clientName', 'customer_name': 'clientName', 'customer': 'clientName', 'pax_name': 'clientName', 'paxname': 'clientName', 'customer name': 'clientName', 'pax name': 'clientName',
    'traveler\'s_fi': 'clientNameFirst', 'traveler\'s_first_name': 'clientNameFirst',
    'traveler\'s_la': 'clientNameLast', 'traveler\'s_last_name': 'clientNameLast',
    'payment_status': 'paymentConfirmationStatus', 'pay_status': 'paymentConfirmationStatus', 'payment_confirmation_status': 'paymentConfirmationStatus',
    'type': 'type', 'lead_type': 'type',
    'transaction_id': 'transactionId', 'transaction id': 'transactionId', 'ticketnumber': 'transactionId', 'ticket_number': 'transactionId', 'trn_number': 'transactionId', 'trn_no': 'transactionId', 'confirmation number': 'transactionId', 'confirmation_number': 'transactionId',
    'rt': 'transactionId', 'rt_number': 'transactionId', 'rt_no': 'transactionId', 'rt_ref': 'transactionId', // Added RT variants
    'booking_ref_no': 'bookingRefNo', 'booking ref no': 'bookingRefNo', 'booking_refno': 'bookingRefNo', 'booking_ref': 'bookingRefNo', 'booking_reff': 'bookingRefNo', 'ref_no.': 'bookingRefNo', 'ref_no': 'bookingRefNo', 'ref no.': 'bookingRefNo',
    'bookingrefno': 'bookingRefNo', 'booking refno': 'bookingRefNo', 'booking reff': 'bookingRefNo', 'bookingreff': 'bookingRefNo', 'booking  reff': 'bookingRefNo', 'book reff': 'bookingRefNo', 'book ref': 'bookingRefNo',
    'do_number': 'bookingRefNo', 'do number': 'bookingRefNo', 'do': 'bookingRefNo', 'portal_do_number': 'bookingRefNo',
    'booking_reference_no': 'bookingRefNo', 'booking_reference': 'bookingRefNo', 'booking reference': 'bookingRefNo',
    'reff': 'bookingRefNo',
    'payment_mode': 'modeOfPayment', 'mode_of_payment': 'modeOfPayment', 'transaction': 'modeOfPayment', 'mode': 'modeOfPayment', // Added mode
    'trn': 'transactionId', // User specific Ruzinn alias
    'ticketnumbe': 'transactionId', // Truncated header support
    'free': 'freeGuestCount', 'free_guests': 'freeGuestCount',
    'ch': 'pkg_child', 'child': 'pkg_child', 'child_qty': 'pkg_child',
    'ad': 'pkg_adult', 'adult': 'pkg_adult', 'adult_qty': 'pkg_adult',
    'no._of_pax': 'pkg_pax_complex', 'no.of_pax': 'pkg_pax_complex', 'pax': 'pkg_pax_complex', 'no. of pax': 'pkg_pax_complex', 'pax_count': 'pkg_pax_complex',
    'quantity': 'pkg_pax_complex', 'qty': 'pkg_pax_complex',
    'chd_top': 'pkg_child_top_deck', 'child_top_deck': 'pkg_child_top_deck', 'top child': 'pkg_child_top_deck', 'top -ch': 'pkg_child_top_deck',
    'adt_top': 'pkg_adult_top_deck', 'adult_top_deck': 'pkg_adult_top_deck', 'top adult': 'pkg_adult_top_deck', 'top ad': 'pkg_adult_top_deck', 'top  ad': 'pkg_adult_top_deck',
    'adt_top_alc': 'pkg_adult_top_deck_alc', 'adult_top_deck_alc': 'pkg_adult_top_deck_alc', 'top_alc': 'pkg_adult_top_deck_alc', 'top alc': 'pkg_adult_top_deck_alc', 'top_ad_alc': 'pkg_adult_top_deck_alc',
    'ad_alc': 'pkg_adult_alc', 'adult_alc': 'pkg_adult_alc', 'alc': 'pkg_adult_alc', 'alcoholic': 'pkg_adult_alc', 'ad alc': 'pkg_adult_alc',
    'vip_ch': 'pkg_vip_child', 'vip_child': 'pkg_vip_child', 'vip ch': 'pkg_vip_child',
    'vip_ad': 'pkg_vip_adult', 'vip_adult': 'pkg_vip_adult', 'vip ad': 'pkg_vip_adult',
    'vip_alc_pkg': 'pkg_vip_alc', 'vip_adult_alc': 'pkg_vip_alc', 'adult_vip_alc': 'pkg_vip_alc', 'vip ad alc': 'pkg_vip_alc', 'vip alc': 'pkg_vip_alc',
    'ryl_ch': 'pkg_royal_child', 'royal_child': 'pkg_royal_child', 'royal ch': 'pkg_royal_child', 'ryl ch': 'pkg_royal_child',
    'ryl_ad': 'pkg_royal_adult', 'royal_adult': 'pkg_royal_adult', 'royal ad': 'pkg_royal_adult', 'ryl ad': 'pkg_royal_adult',
    'ryl_alc': 'pkg_royal_alc', 'royal_alc': 'pkg_royal_alc', 'royal ad alc': 'pkg_royal_alc', 'ryl alc': 'pkg_royal_alc', 'royal alc': 'pkg_royal_alc',
    'basic': 'pkg_basic',
    'std': 'pkg_standard', 'standard': 'pkg_standard',
    'prem': 'pkg_premium', 'premium': 'pkg_premium',
    'vip': 'pkg_vip_adult', // Changed from pkg_vip to pkg_vip_adult as default
    'hrchtr': 'pkg_hour_charter', 'hour_charter': 'pkg_hour_charter',
    'package_details_(json)': 'package_quantities_json_string', 'package_details_json': 'package_quantities_json_string',
    'addon_pack': 'perTicketRate', 'addon': 'perTicketRate', 'per_ticket_rate': 'perTicketRate',
    'total_amt': 'totalAmount', 'total_amount': 'totalAmount',
    'discount_%': 'commissionPercentage', 'discount_rate': 'commissionPercentage', 'discount': 'commissionPercentage',
    'commission': 'commissionAmount', 'commission_amount': 'commissionAmount',
    'net_amt': 'netAmount', 'net_amount': 'netAmount',
    'paid': 'paidAmount', 'paid_amount': 'paidAmount', 'sales_amount(aed)': 'paidAmount', 'sales_amount_(aed)': 'paidAmount', 'sales_amount': 'paidAmount', 'salesamount(aed)': 'paidAmount', 'sales amour': 'paidAmount', 'sales_amour': 'paidAmount',
    'balance': 'balanceAmount', 'balance_amount': 'balanceAmount',
    'note': 'notes', 'remarks': 'notes',
    'created_by': 'ownerUserId', 'created by': 'ownerUserId', 'sales_person': 'ownerUserId', 'sales person': 'ownerUserId', 'owner': 'ownerUserId', 'added_by': 'ownerUserId', 'added by': 'ownerUserId',
    'modified_by': 'lastModifiedByUserId', 'modified by': 'lastModifiedByUserId', 'updated_by': 'lastModifiedByUserId', 'updated by': 'lastModifiedByUserId',
    'date_of_creation': 'createdAt', 'creation_date': 'createdAt', 'sales_date': 'createdAt', 'salesdate': 'createdAt', 'purchase_dat': 'createdAt',
    'date_of_modification': 'updatedAt', 'modification_date': 'updatedAt',
    'contactno': 'customerPhone', 'contact_no': 'customerPhone', 'phone': 'customerPhone', 'mobile': 'customerPhone',
    'email': 'customerEmail', 'customer_email': 'customerEmail', 'guest_email': 'customerEmail', 'client_email': 'customerEmail', 'contact_email': 'customerEmail',
    'scanned_on': 'checkInTime', 'scannedon': 'checkInTime',

    // New generic text capture for specific import logic
    'product_name': 'temp_package_text', 'product': 'temp_package_text', 'item': 'temp_package_text', 'package': 'temp_package_text',
    'item_name': 'temp_package_text', 'activity': 'temp_package_text', 'description': 'temp_package_text', 'ticket_name': 'temp_package_text',
    'package_type': 'temp_package_text', 'service': 'temp_package_text', 'ticket': 'temp_package_text',

    // Package SQL structure mappings (Directly map to pkg_ internal keys)
    'pkg_child': 'pkg_child', 'pkg_adult': 'pkg_adult', 'pkg_adult_alc': 'pkg_adult_alc',
    'pkg_child_top_deck': 'pkg_child_top_deck', 'pkg_adult_top_deck': 'pkg_adult_top_deck', 'pkg_adult_top_deck_alc': 'pkg_adult_top_deck_alc',
    'pkg_vip_child': 'pkg_vip_child', 'pkg_vip_adult': 'pkg_vip_adult', 'pkg_vip_alc': 'pkg_vip_alc',
    'pkg_royal_child': 'pkg_royal_child', 'pkg_royal_adult': 'pkg_royal_adult', 'pkg_royal_alc': 'pkg_royal_alc',
    'yacht_name': 'yacht', 'booking_ref_id': 'bookingRefNo', 'agency_name': 'agent', 'guest_name': 'clientName',
    'grand_total': 'paidAmount', 'total_amount_aed': 'totalAmount', 'booking_remarks': 'notes',

    // Ticketing System Specific Package Names (Direct Mappings)
    'food_&_soft_drinks': 'pkg_adult', 'food_and_soft_drinks': 'pkg_adult', 'food_&_soft_drinks_(adult)': 'pkg_adult',
    'food_&_soft_drinks_(child)': 'pkg_child', 'food_and_soft_drinks_(child)': 'pkg_child',
    'food_and_unlimited_alcoholic_drinks': 'pkg_adult_alc', 'food_&_unlimited_alcoholic_drinks': 'pkg_adult_alc', 'unlimited_alcoholic_drinks': 'pkg_adult_alc',
    'vip_soft': 'pkg_vip_adult', 'vip_soft_(adult)': 'pkg_vip_adult', 'vip_soft_(child)': 'pkg_vip_child',
    'vip_premium_alcoholic_drinks': 'pkg_vip_alc', 'vip_unlimited_alcoholic_drinks': 'pkg_vip_alc', 'vip_alcoholic': 'pkg_vip_alc', 'vip_alc': 'pkg_vip_alc',
    'food_&_drinks': 'pkg_adult', 'food_and_drinks': 'pkg_adult', 'food_&_drinks_(child)': 'pkg_child', 'food_and_drinks_(child)': 'pkg_child',
    'unlimited_soft_drinks': 'pkg_adult', 'soft_drinks_package': 'pkg_adult', 'soft_drinks_package_pp': 'pkg_adult',
    'unlimited_alcoholic': 'pkg_adult_alc', 'premium_alcoholic': 'pkg_vip_alc',
    'soft_drinks': 'pkg_adult', 'soft_drink': 'pkg_adult', 'drinks': 'pkg_adult',

    // Master File Specific Column Mappings
    'dhow_child_89(55_spl)': 'master_qty_dhow_child',
    'dhow_child_89_(55_spl)': 'master_qty_dhow_child', // Variation
    'dhow_food_99_(60_spl)': 'master_qty_dhow_food',
    'dhow_food_99(60_spl)': 'master_qty_dhow_food', // Variation
    'dhow_drinks_199': 'master_qty_dhow_alc',
    'dhow_vip_299': 'master_qty_dhow_vip',
    'oe_child_129': 'master_qty_oe_child',
    'oe_food_149': 'master_qty_oe_food',
    'oe_drinks_249': 'master_qty_oe_alc',
    'oe_vip_349': 'master_qty_oe_vip',
    'sunset_child_179': 'master_qty_sunset_child',
    'sunset_food_199': 'master_qty_sunset_food',
    'sunset_drinks_299': 'master_qty_sunset_alc',
    'lotus_new_child_249': 'master_qty_lotus_new_child',
    'lotus_new_food_299': 'master_qty_lotus_new_food',
    'lotus_new_drinks_399': 'master_qty_lotus_new_alc',
    'lotus_child_199': 'master_qty_lotus_child',
    'lotus_food_249': 'master_qty_lotus_food',
    'lotus_drinks_349': 'master_qty_lotus_alc',
    'vip_child_399': 'master_qty_vip_child',
    'vip_child_399_': 'master_qty_vip_child', // Potential trailing
    'vip_499': 'master_qty_vip_adult',
    'royale_child_799': 'master_qty_royale_child',
    'royale_adult_999': 'master_qty_royale_adult',
    'others_amt_(cake)': 'master_amt_cake',
    'others_amt(cake)': 'master_amt_cake', // Variation

    '1': 'pkg_adult', '2': 'pkg_child', '3': 'freeGuestCount',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertLeadCsvValue = (
    key: any,
    value: string,
    allYachts: Yacht[],
    agentMap: { [id: string]: string },
    userMap: { [id: string]: string },
    yachtMap: { [id: string]: string }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
    const trimmedValue = value ? String(value).trim() : '';
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(USER_ID_STORAGE_KEY) : null;

    if (key.startsWith('pkg_')) {
        const num = parseInt(trimmedValue, 10);
        return isNaN(num) || num < 0 ? 0 : num;
    }
    if (key === 'package_quantities_json_string') {
        if (!trimmedValue) return null;
        try {
            const parsedJson = JSON.parse(trimmedValue);
            if (Array.isArray(parsedJson)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return parsedJson.map((pq: any) => ({
                    packageId: String(pq.packageId || pq.packageld || ''),
                    packageName: String(pq.packageName || 'Unknown CSV Pkg'),
                    quantity: Number(pq.quantity || 0),
                    rate: Number(pq.rate || 0),
                })).filter((pq: LeadPackageQuantity) => pq.packageName);
            }
            return null;
        } catch (e) {
            console.warn(`[CSV Import Bookings] Could not parse package_quantities_json_string: \"${trimmedValue}\". Error:`, e);
            return null;
        }
    }

    if (trimmedValue === '' || value === null || value === undefined) {
        switch (key) {
            case 'totalAmount': case 'commissionPercentage': case 'commissionAmount':
            case 'netAmount': case 'paidAmount': case 'balanceAmount':
            case 'freeGuestCount': return 0;
            case 'perTicketRate': return null;
            case 'modeOfPayment': return 'CARD';
            case 'status': return 'Confirmed';
            case 'type': return 'Shared Cruise';
            case 'paymentConfirmationStatus': return 'CONFIRMED';
            case 'notes': case 'bookingRefNo': return '';
            case 'month': return formatISO(new Date());
            case 'createdAt': case 'updatedAt': return formatISO(new Date());
            case 'lastModifiedByUserId': return currentUserId || undefined;
            case 'ownerUserId': return currentUserId || undefined;
            default: return undefined;
        }
    }

    switch (key) {
        case 'agent':
        case 'ownerUserId':
        case 'lastModifiedByUserId':
            const mapToUse = key === 'agent' ? agentMap : userMap;
            const idByName = Object.keys(mapToUse).find(id => mapToUse[id]?.toLowerCase() === trimmedValue.toLowerCase());
            return idByName || trimmedValue;

        case 'yacht':
            // Special handling for ticketing system format: \"YACHT NAME - PACKAGE TYPE\"
            // Example: \"LOTUS ROYALE - FOOD AND SOFT DRINKS\"
            // User Example: \"Lotus Megayacht dinner cruise- Food only\"
            let yachtNameOnly = trimmedValue;

            // Handle known aliases first
            if (yachtNameOnly.toLowerCase().startsWith('lotus megayacht dinner cruise')) {
                yachtNameOnly = 'Lotus Royale' + (trimmedValue.substring('Lotus Megayacht dinner cruise'.length));
            } else if (yachtNameOnly.toLowerCase().startsWith('al mansour dinner')) {
                yachtNameOnly = 'AL MANSOUR' + (trimmedValue.substring('AL MANSOUR DINNER'.length));
            } else if (yachtNameOnly.toLowerCase().startsWith('ocean empress dinner')) {
                yachtNameOnly = 'OCEAN EMPRESS' + (trimmedValue.substring('OCEAN EMPRESS DINNER'.length));
            } else if (yachtNameOnly.toLowerCase().startsWith('ocean emporess')) {
                yachtNameOnly = 'OCEAN EMPRESS' + (trimmedValue.substring('OCEAN EMPORESS'.length));
            } else if (yachtNameOnly.toLowerCase().startsWith('oe top deck')) {
                yachtNameOnly = 'OCEAN EMPRESS' + (trimmedValue.substring('OE TOP DECK'.length));
            } else if (yachtNameOnly.toLowerCase().startsWith('ocean empress top deck')) {
                yachtNameOnly = 'OCEAN EMPRESS' + (trimmedValue.substring('OCEAN EMPRESS TOP DECK'.length));
            } else if (yachtNameOnly.toLowerCase().startsWith('calypso sunset')) {
                // If calypso exists in DB it will find it, otherwise it keeps the name
                yachtNameOnly = 'CALYPSO SUNSET' + (trimmedValue.substring('CALYPSO SUNSET'.length));
            } else if (yachtNameOnly.toLowerCase().includes('lotus royal') && yachtNameOnly.toLowerCase().includes('food and soft drinks')) {
                // Specific user request: "lotus royal FOOD AND SOFT DRINKS" -> Lotus Royale
                yachtNameOnly = 'Lotus Royale';
            }


            // Check if the value contains hyphen separator
            // Supports \" - \", \"- \", \" -\"
            if (yachtNameOnly.match(/\s*[-\u2013\u2014]\s*/)) {
                const parts = yachtNameOnly.split(/\s*[-\u2013\u2014]\s*/);
                yachtNameOnly = parts[0].trim();
                // If alias used, force Lotus Royale
                if (yachtNameOnly.toLowerCase() === 'lotus megayacht dinner cruise') yachtNameOnly = 'Lotus Royale';

                console.log(`[CSV Import] Parsed yacht from ticketing format: "${trimmedValue}" -> Yacht: "${yachtNameOnly}"`);
            }
            if (yachtNameOnly.includes('(')) {
                yachtNameOnly = yachtNameOnly.split('(')[0].trim();
            }

            // Try to find yacht by ID or name
            const yachtIdByName = Object.keys(yachtMap).find(id => yachtMap[id]?.toLowerCase() === yachtNameOnly.toLowerCase());
            return yachtIdByName || yachtNameOnly;

        case 'totalAmount': case 'commissionPercentage': case 'commissionAmount':
        case 'netAmount': case 'paidAmount': case 'balanceAmount':
        case 'freeGuestCount':
            // Robust parsing: Remove everything except numbers, decimal points, and minus signs
            const numFinancial = parseFloat(trimmedValue.replace(/[^0-9.-]+/g, ''));
            return isNaN(numFinancial) ? 0 : numFinancial;
        case 'perTicketRate':
            const numRate = parseFloat(trimmedValue.replace(/,/g, ''));
            return isNaN(numRate) ? null : numRate;

        case 'modeOfPayment':
            // Map 'Credit' and 'Online' to 'CARD' if they don't match exactly
            const lowerVal = trimmedValue.toLowerCase();
            if (lowerVal === 'credit' || lowerVal === 'online') return 'CARD';

            const foundMop = modeOfPaymentOptions.find(opt => opt.toLowerCase() === lowerVal);
            return foundMop || 'CARD';
        case 'status':
            const lowerTrimmedStatusValue = trimmedValue.toLowerCase();
            if (lowerTrimmedStatusValue === 'confirm') return 'Confirmed'; // Explicit mapping
            const foundStatus = leadStatusOptions.find(opt => opt.toLowerCase() === lowerTrimmedStatusValue);
            return foundStatus || 'Balance';
        case 'type':
            const foundType = leadTypeOptions.find(opt => opt.toLowerCase() === trimmedValue.toLowerCase());
            return foundType || 'Private Cruise';
        case 'paymentConfirmationStatus':
            const upperTrimmedPaymentStatus = trimmedValue.toUpperCase();
            if (paymentConfirmationStatusOptions.includes(upperTrimmedPaymentStatus as PaymentConfirmationStatus)) {
                return upperTrimmedPaymentStatus as PaymentConfirmationStatus;
            }
            if (upperTrimmedPaymentStatus === 'PAID') return 'CONFIRMED';
            if (upperTrimmedPaymentStatus === 'UNPAID') return 'UNCONFIRMED';
            return 'CONFIRMED';

        case 'bookingRefNo':
            if (!trimmedValue) return '';
            // Validation: Starts with DO and includes digits (e.g. DO010226133828)
            const bookingRefRegex = /^DO[0-9]+$/;
            if (!bookingRefRegex.test(trimmedValue)) {
                console.warn(`[CSV Import] Invalid bookingRefNo format: "${trimmedValue}". Expected ^DO[0-9]+$`);
            }
            return trimmedValue;

        case 'transactionId':
            if (!trimmedValue) return '';
            // Validation: Starts with RT and alphanumeric. Regex: ^RT[0-9A-Z]+$
            const transactionIdRegex = /^RT[0-9A-Z]+$/;
            if (!transactionIdRegex.test(trimmedValue)) {
                console.warn(`[CSV Import] Invalid transactionId format: "${trimmedValue}". Expected ^RT[0-9A-Z]+$`);
            }
            return trimmedValue;

        case 'customerPhone':
            if (['#ERROR!', '#REF!', 'nan', 'null'].includes(trimmedValue.toLowerCase())) return '';
            return trimmedValue; // Keep as text to preserve leading zeros, spaces

        case 'month':
        case 'createdAt':
        case 'updatedAt':
        case 'checkInTime':
            try {
                // 1. Try DD-MM-YYYY (User specific format: 01-02-2026)
                const dmyDashRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})/;
                if (dmyDashRegex.test(trimmedValue)) {
                    const parsed = parse(trimmedValue.substring(0, 10), 'dd-MM-yyyy', new Date());
                    if (isValid(parsed)) {
                        parsed.setHours(12, 0, 0, 0);
                        return formatISO(parsed);
                    }
                }

                // 2. Try DD/MM/YYYY
                const dmyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
                if (dmyRegex.test(trimmedValue)) {
                    const parsed = parse(trimmedValue.substring(0, 10), 'dd/MM/yyyy', new Date());
                    if (isValid(parsed)) {
                        // Force NOON to avoid timezone midnight shifting
                        parsed.setHours(12, 0, 0, 0);
                        return formatISO(parsed);
                    }
                }
            } catch { /* fall through */ }

            try {
                // 2. Try ISO parsing 
                const parsedISODate = parseISO(trimmedValue);
                if (isValid(parsedISODate)) {
                    parsedISODate.setHours(12, 0, 0, 0);
                    return formatISO(parsedISODate);
                }
            } catch { /* fall through */ }

            try {
                // 3. Try parsing 'dd-MM-yyyy' (e.g., \"30-01-2026\")
                const parsedDateDMY = parse(trimmedValue, 'dd-MM-yyyy', new Date());
                if (isValid(parsedDateDMY)) {
                    parsedDateDMY.setHours(12, 0, 0, 0);
                    return formatISO(parsedDateDMY);
                }
            } catch { /* fall through */ }

            try {
                // 4. Try parsing 'dd-MM-yyyy H:mm:ss' (e.g., \"06-01-2026 1:56:29\")
                const parsedDateDMYHMS = parse(trimmedValue, 'dd-MM-yyyy H:mm:ss', new Date());
                // If it has distinct time, we might keep it, but for 'month' (Booking Date) usually Date Only matters.
                // If the user says dates shift, it's safer to force noon for the primary date field.
                if (isValid(parsedDateDMYHMS)) {
                    // Only force noon if it looks like midnight or we are parsing 'month' specifically
                    if (key === 'month') parsedDateDMYHMS.setHours(12, 0, 0, 0);
                    return formatISO(parsedDateDMYHMS);
                }
            } catch { /* fall through */ }

            console.warn(`[CSV Import] Failed to parse date: \"${trimmedValue}\" for field \"${String(key)}\". Using default valid format.`);
            return formatISO(new Date());
        default:
            return trimmedValue;
    }
};


export function parseCsvLine(line: string, delimiter = ','): string[] {
    const columns: string[] = [];
    let currentColumn = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentColumn += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            columns.push(currentColumn.trim());
            currentColumn = '';
        } else {
            currentColumn += char;
        }
    }
    columns.push(currentColumn.trim());
    return columns;
}



function applyMasterFileLogic(row: { [key: string]: any }) {
    // Force Shared Cruise type
    row.type = 'Shared Cruise';

    // 1. Check for Specific Master File Columns first
    // If we find counts in these columns, they dictate the yacht and package.

    let masterYachtFound = false;

    // Helper to process column
    const process = (key: string, targetYacht: string, targetPkgKey: string) => {
        const qty = Number(row[key]);
        if (!isNaN(qty) && qty > 0) {
            row.yacht = targetYacht;
            row[targetPkgKey] = (row[targetPkgKey] || 0) + qty;
            masterYachtFound = true;
        }
    };

    // Dhow
    process('master_qty_dhow_child', 'Al Mansour Dhow', 'pkg_child');
    process('master_qty_dhow_food', 'Al Mansour Dhow', 'pkg_adult');
    process('master_qty_dhow_alc', 'Al Mansour Dhow', 'pkg_adult_alc');
    process('master_qty_dhow_vip', 'Al Mansour Dhow', 'pkg_vip_adult');

    // Ocean Empress
    process('master_qty_oe_child', 'OCEAN EMPRESS', 'pkg_child');
    process('master_qty_oe_food', 'OCEAN EMPRESS', 'pkg_adult');
    process('master_qty_oe_alc', 'OCEAN EMPRESS', 'pkg_adult_alc');
    process('master_qty_oe_vip', 'OCEAN EMPRESS', 'pkg_vip_adult');

    // Calypso Sunset
    process('master_qty_sunset_child', 'Calypso Sunset', 'pkg_child');
    process('master_qty_sunset_food', 'Calypso Sunset', 'pkg_adult');
    process('master_qty_sunset_alc', 'Calypso Sunset', 'pkg_adult_alc');

    // Lotus (Old/New - treat as Lotus Royale)
    process('master_qty_lotus_child', 'Lotus Royale', 'pkg_child');
    process('master_qty_lotus_food', 'Lotus Royale', 'pkg_adult');
    process('master_qty_lotus_alc', 'Lotus Royale', 'pkg_adult_alc');

    process('master_qty_lotus_new_child', 'Lotus Royale', 'pkg_child');
    process('master_qty_lotus_new_food', 'Lotus Royale', 'pkg_adult');
    process('master_qty_lotus_new_alc', 'Lotus Royale', 'pkg_adult_alc');

    // High Tier Lotus/Royal
    process('master_qty_vip_child', 'Lotus Royale', 'pkg_vip_child');
    process('master_qty_vip_adult', 'Lotus Royale', 'pkg_vip_adult');
    process('master_qty_royale_child', 'Lotus Royale', 'pkg_royal_child');
    process('master_qty_royale_adult', 'Lotus Royale', 'pkg_royal_adult');


    if (masterYachtFound) {
        // Clear generic 'pkg_' if they were set from 'QTY' column to avoid double counting if QTY was a sum
        delete row.pkg_pax_complex;
        return;
    }

    // Fallback to legacy/generic parsing if no specific columns found (e.g. maybe separate sheet format)

    const rawString = (row.yacht && row.yacht !== 'Unknown Yacht') ? String(row.yacht) : (row.temp_package_text || '');
    const quantity = row.pkg_pax_complex || row.pkg_adult || 1;

    // Reset default quantities 
    Object.keys(row).forEach(k => { if (k.startsWith('pkg_')) row[k] = 0; });
    delete row.pkg_pax_complex;

    const lowerRaw = rawString.toLowerCase();

    if (lowerRaw.includes('dhow')) {
        row.yacht = 'Al Mansour Dhow';
        if (lowerRaw.includes('child')) row.pkg_child = quantity;
        else if (lowerRaw.includes('drinks') || lowerRaw.includes('alc')) row.pkg_adult_alc = quantity;
        else if (lowerRaw.includes('vip')) row.pkg_vip_adult = quantity;
        else row.pkg_adult = quantity; // Default Food/Adult
    }
    else if (lowerRaw.includes('oe ') || lowerRaw.startsWith('oe')) { // Ocean Empress
        row.yacht = 'OCEAN EMPRESS';
        if (lowerRaw.includes('child')) row.pkg_child = quantity;
        else if (lowerRaw.includes('drinks') || lowerRaw.includes('alc')) row.pkg_adult_alc = quantity;
        else row.pkg_adult = quantity;
    }
    else if (lowerRaw.includes('sunset')) {
        row.yacht = 'Calypso Sunset';
        if (lowerRaw.includes('child')) row.pkg_child = quantity;
        else if (lowerRaw.includes('drinks') || lowerRaw.includes('alc')) row.pkg_adult_alc = quantity;
        else row.pkg_adult = quantity;
    }
    else if (lowerRaw.includes('lotus')) {
        row.yacht = 'Lotus Royale';
        if (lowerRaw.includes('child')) row.pkg_child = quantity;
        else if (lowerRaw.includes('drinks') || lowerRaw.includes('alc')) row.pkg_adult_alc = quantity;
        else row.pkg_adult = quantity;
    }
    else if (lowerRaw.startsWith('vip') || lowerRaw.startsWith('royale')) {
        row.yacht = 'Lotus Royale';
        if (lowerRaw.includes('child')) {
            if (lowerRaw.includes('royale')) row.pkg_royal_child = quantity;
            else row.pkg_vip_child = quantity;
        } else if (lowerRaw.includes('alc') || lowerRaw.includes('alcohol')) {
            if (lowerRaw.includes('royale')) row.pkg_royal_alc = quantity;
            else row.pkg_vip_alc = quantity;
        } else {
            if (lowerRaw.includes('royale')) row.pkg_royal_adult = quantity;
            else row.pkg_vip_adult = quantity;
        }
        // Specific user request overrides: "Royale Adult 999 - royale adult alc"
        if (lowerRaw.includes('royale adult') || lowerRaw.includes('royale adult 999')) {
            row.pkg_royal_alc = quantity;
            row.pkg_royal_adult = 0;
        }
    }
}

function applyRuzinnLogic(row: { [key: string]: any }, rawYachtString: string) {
    // rawYachtString comes from the original CSV column before any splitting.
    // e.g. "LOTUS ROYALE - FOOD AND SOFT DRINKS"
    const targetString = (rawYachtString || row.yacht || '').toUpperCase().trim();

    // 1. Quantities from columns 'Adult' and 'Child' (already mapped to pkg_adult/pkg_child)
    const adultQty = row.pkg_adult || 0;
    const childQty = row.pkg_child || 0;

    // Clear default generic keys so we can assign to specific buckets
    delete row.pkg_adult;
    delete row.pkg_child;

    // 2. Priority Classification Logic
    // Rules: VIP ALCOHOL > VIP SOFT > ROYALE > FOOD+UNLIMITED ALC > SOFT DRINKS > FOOD AND SOFT DRINKS > DEFAULT

    // Rule 5: VIP UNLIMITED ALCOHOLIC DRINKS
    if (targetString.includes("VIP UNLIMITED ALCOHOLIC DRINKS")) {
        row.pkg_vip_alc = adultQty;
        row.pkg_vip_child = childQty; // "Child if any -> VIP CH"
    }
    // Rule 4: VIP SOFT
    else if (targetString.includes("VIP SOFT")) {
        row.pkg_vip_adult = adultQty;
        row.pkg_vip_child = childQty;
    }
    // Rule 6: ROYALE STANDARD or Matches ROYALE + STANDARD
    else if (targetString.includes("ROYALE STANDARD") || (targetString.includes("ROYALE") && targetString.includes("STANDARD"))) {
        row.pkg_royal_adult = adultQty;
        row.pkg_royal_child = childQty;
    }
    // Rule 2: FOOD AND UNLIMITED ALCOHOLIC DRINKS
    else if (targetString.includes("FOOD AND UNLIMITED ALCOHOLIC DRINKS")) {
        row.pkg_adult_alc = adultQty;
        row.pkg_child = childQty; // "Treat as CH (no alcohol)"
    }
    // Rule 3: SOFT DRINKS (and not VIP and not ROYALE)
    // Note: SOFT DRINKS usually found in "FOOD AND SOFT DRINKS" too, so check ordering or exclusion.
    // Spec says: "If YachtName contains 'SOFT DRINKS' (and not VIP and not ROYALE)"
    // "FOOD AND SOFT DRINKS" matches this.
    // But explicitly checking Rule 1 specific "LOTUS ROYALE - FOOD AND SOFT DRINKS" first might be safer if that meant something special.
    // Actually Rule 1 says "Normal (no alcohol). Use Adult and Child counts".
    // Rule 3 says "Normal package... Adult -> AD, Child -> CH".
    // They are effectively the same mapping, just different text triggers.

    // Let's implement specific Rule 1 Check first just in case
    else if (targetString.includes("LOTUS ROYALE") && targetString.includes("FOOD AND SOFT DRINKS")) {
        row.pkg_adult = adultQty;
        row.pkg_child = childQty;
        if (!row.yacht || row.yacht === 'Unknown Yacht') row.yacht = 'Lotus Royale';
    }
    else if (targetString.includes("SOFT DRINKS") && !targetString.includes("VIP") && !targetString.includes("ROYALE")) {
        row.pkg_adult = adultQty;
        row.pkg_child = childQty;
    }
    // Catch-all: "FOOD AND SOFT DRINKS" without Lotus Royale (if any) -> Normal
    else if (targetString.includes("FOOD AND SOFT DRINKS")) {
        row.pkg_adult = adultQty;
        row.pkg_child = childQty;
    }
    // DEFAULT
    else {
        row.pkg_adult = adultQty;
        row.pkg_child = childQty;
    }

    // 3. Extract Base Yacht Name (if not already handled by convertLeadCsvValue)
    // Ruzinn format is "YACHT NAME - PACKAGE"
    if (targetString.includes(' - ')) {
        const parts = targetString.split(' - ');
        const baseName = parts[0].trim();
        // Update row.yacht only if it wasn't already mapped to an ID or cleaned
        // convertLeadCsvValue likely did this, but we force consistency here.
        // We use Title Case for display if we are setting it raw
        row.yacht = baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase();

        // Fix known casing for Lotus
        if (row.yacht.toUpperCase() === 'LOTUS ROYALE') row.yacht = 'Lotus Royale';
        if (row.yacht.toUpperCase() === 'OCEAN EMPRESS') row.yacht = 'OCEAN EMPRESS';
    }
}

export function applyPackageTypeDetection(
    yachtNameFromCsv: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsedRow: { [key: string]: any },
    source: ImportSource = 'DEFAULT'
) {
    if (source === 'MASTER') {
        applyMasterFileLogic(parsedRow);
        return;
    }
    if (source === 'RUZINN') {
        applyRuzinnLogic(parsedRow, yachtNameFromCsv);
        return;
    }

    // Fallback: If yacht is missing (empty column) but we captured product text, use that
    // This fixes rows where 'Service Name' is empty but 'Product Name' contains the yacht info.
    if (!parsedRow.yacht && parsedRow.temp_package_text) {
        yachtNameFromCsv = parsedRow.temp_package_text; // Use full string for package detection

        // Extract clean yacht name from the product text
        let cleanName = yachtNameFromCsv;
        if (cleanName.match(/\s*[-\u2013\u2014]\s*/)) {
            cleanName = cleanName.split(/\s*[-\u2013\u2014]\s*/)[0].trim();
        }
        if (cleanName.includes('(')) {
            cleanName = cleanName.split('(')[0].trim();
        }
        // Basic alias handling (simplified from convertLeadCsvValue)
        const lowerClean = cleanName.toLowerCase();
        if (lowerClean.startsWith('lotus megayacht')) cleanName = 'Lotus Royale';
        else if (lowerClean.startsWith('ocean empress')) cleanName = 'OCEAN EMPRESS';
        else if (lowerClean.startsWith('al mansour')) cleanName = 'Al Mansour Dhow';
        else if (lowerClean.startsWith('calypso')) cleanName = 'Calypso Sunset';

        parsedRow.yacht = cleanName;
        console.log(`[CSV Import] Fallback yacht from product: "${yachtNameFromCsv}" -> "${cleanName}"`);
    }

    // Last Resort: If yacht is STILL missing but we have a valid ticket/reference, try to guess or default
    if (!parsedRow.yacht && (parsedRow.transactionId || parsedRow.bookingRefNo)) {
        const txt = (parsedRow.temp_package_text || '').toLowerCase();
        if (txt.includes('dhow') || txt.includes('creek')) parsedRow.yacht = 'Al Mansour Dhow';
        else if (txt.includes('ocean')) parsedRow.yacht = 'OCEAN EMPRESS';
        else if (txt.includes('sunset')) parsedRow.yacht = 'Calypso Sunset';
        else parsedRow.yacht = 'Lotus Royale'; // Default for Dutch Oriental

        console.log(`[CSV Import] Last resort yacht assignment: ${parsedRow.yacht}`);
    }

    let packageTypeFromYachtName = '';
    // Robust split using regex for " - ", "- ", " -"
    if (yachtNameFromCsv && yachtNameFromCsv.match(/\s*[-\u2013\u2014]\s*/)) {
        const parts = yachtNameFromCsv.split(/\s*[-\u2013\u2014]\s*/);
        if (parts.length > 1) packageTypeFromYachtName = parts[1].trim().toUpperCase();
    } else if (yachtNameFromCsv && yachtNameFromCsv.includes('(') && yachtNameFromCsv.includes(')')) {
        // Handle format like "Yacht Name (Package Type)"
        const match = yachtNameFromCsv.match(/\(([^)]+)\)/);
        if (match) packageTypeFromYachtName = match[1].trim().toUpperCase();
    } else if (yachtNameFromCsv && yachtNameFromCsv.toLowerCase().includes('food and soft drinks')) {
        // Specific user request: "lotus royal FOOD AND SOFT DRINKS" (no separator)
        packageTypeFromYachtName = 'FOOD AND SOFT DRINKS';
    }


    const adultQty = parsedRow.pkg_adult || 0;
    const childQty = parsedRow.pkg_child || 0;

    // Clear generic keys to prevent duplication when assigning to specific packages
    delete parsedRow.pkg_adult;
    delete parsedRow.pkg_child;

    const rawLower = yachtNameFromCsv ? yachtNameFromCsv.toLowerCase() : '';

    if (yachtNameFromCsv && /ocean\s*empo?ress\s*top/i.test(yachtNameFromCsv)) {
        if (adultQty > 0) {
            if (/alc|alcohol|drink/i.test(yachtNameFromCsv)) parsedRow.pkg_adult_top_deck_alc = adultQty;
            else parsedRow.pkg_adult_top_deck = adultQty;
        }
        if (childQty > 0) parsedRow.pkg_child_top_deck = childQty;
        parsedRow.yacht = 'OCEAN EMPRESS';
        return;
    }

    // 2. Fuzzy Top Deck Detection
    if (rawLower.includes('top') && (rawLower.includes('alc') || rawLower.includes('alcohol'))) {
        if (adultQty > 0) parsedRow.pkg_adult_top_deck_alc = adultQty;
        if (childQty > 0) parsedRow.pkg_child_top_deck = childQty;
        parsedRow.yacht = 'OCEAN EMPRESS';
        return;
    }
    if (rawLower.includes('top') && (rawLower.includes('ad') || rawLower.includes('adult'))) {
        if (adultQty > 0) parsedRow.pkg_adult_top_deck = adultQty;
        if (childQty > 0) parsedRow.pkg_child_top_deck = childQty;
        parsedRow.yacht = 'OCEAN EMPRESS';
        return;
    }
    if (rawLower.includes('top') && (rawLower.includes('ch') || rawLower.includes('child'))) {
        if (adultQty > 0) parsedRow.pkg_adult_top_deck = adultQty;
        if (childQty > 0) parsedRow.pkg_child_top_deck = childQty;
        parsedRow.yacht = 'OCEAN EMPRESS';
        return;
    }

    // 3. Standard Package Logic based on packageTypeFromYachtName
    if (packageTypeFromYachtName) {
        if (packageTypeFromYachtName.includes('VIP') && (packageTypeFromYachtName.includes('SOFT') || packageTypeFromYachtName.includes('DRINK') || packageTypeFromYachtName.includes('ONLY'))) {
            // VIP tickets with soft (Handle both if quantities map, defaulting Adult header to VIP Adult)
            if (adultQty > 0) parsedRow.pkg_vip_adult = adultQty;
            if (childQty > 0) parsedRow.pkg_vip_child = childQty;
        } else if (packageTypeFromYachtName === 'VIP' || packageTypeFromYachtName === 'VIP ALC' || packageTypeFromYachtName === 'VIP ALCOHOLIC') {
            // Just "VIP" implies VIP Alcohol
            if (adultQty > 0) parsedRow.pkg_vip_alc = adultQty;
            if (childQty > 0) parsedRow.pkg_vip_child = childQty;
        } else if (packageTypeFromYachtName.includes('VIP') && (packageTypeFromYachtName.includes('PREMIUM') || packageTypeFromYachtName.includes('UNLIMITED') || packageTypeFromYachtName.includes('ALC') || packageTypeFromYachtName.includes('ALCOHOLIC'))) {
            if (adultQty > 0) parsedRow.pkg_vip_alc = adultQty;
            if (childQty > 0) parsedRow.pkg_vip_child = childQty;
        } else if ((packageTypeFromYachtName.includes('UNLIMITED') || packageTypeFromYachtName.includes('PREMIUM')) && (packageTypeFromYachtName.includes('ALCOHOLIC') || packageTypeFromYachtName.includes('ALC'))) {
            if (adultQty > 0) parsedRow.pkg_adult_alc = adultQty;
        } else if (packageTypeFromYachtName.includes('FOOD') && (packageTypeFromYachtName.includes('BAR') || packageTypeFromYachtName.includes('ALC'))) {
            // "Food and bar" or "Food and alc"
            if (adultQty > 0) parsedRow.pkg_adult_alc = adultQty;
        } else if (packageTypeFromYachtName.includes('HARD') || packageTypeFromYachtName.includes('ALCOHOLIC') || packageTypeFromYachtName.includes('ALC')) {
            // Generic alcoholic package
            if (adultQty > 0) parsedRow.pkg_adult_alc = adultQty;
        } else if (packageTypeFromYachtName.includes('ROYAL')) {
            // Royal packages
            if (packageTypeFromYachtName.includes('ALCOHOL') || packageTypeFromYachtName.includes('ALC')) {
                if (adultQty > 0) parsedRow.pkg_royal_alc = adultQty;
            } else {
                if (adultQty > 0) parsedRow.pkg_royal_adult = adultQty;
                if (childQty > 0) parsedRow.pkg_royal_child = childQty;
            }
        } else if (yachtNameFromCsv.toUpperCase().includes('TOP DECK') || packageTypeFromYachtName.includes('TOP DECK')) {
            // Top Deck packages (Standard detection)
            if (adultQty > 0) {
                if (packageTypeFromYachtName.includes('ALC') || packageTypeFromYachtName.includes('ALCOHOL') || yachtNameFromCsv.toUpperCase().includes('ALC')) {
                    parsedRow.pkg_adult_top_deck_alc = adultQty;
                } else {
                    parsedRow.pkg_adult_top_deck = adultQty;
                }
            }
            if (childQty > 0) parsedRow.pkg_child_top_deck = childQty;
        } else if (packageTypeFromYachtName.includes('FOOD') || packageTypeFromYachtName.includes('SOFT') || packageTypeFromYachtName.includes('ONLY') || packageTypeFromYachtName.includes('STANDARD') || packageTypeFromYachtName.includes('REGULAR') || packageTypeFromYachtName.includes('DRINK')) {
            // "Food only", "Soft Drinks", "Standard", "Regular"
            if (adultQty > 0) parsedRow.pkg_adult = adultQty;
            if (childQty > 0) parsedRow.pkg_child = childQty;
        } else {
            // Fallback: Restore both if they existed
            if (adultQty > 0) parsedRow.pkg_adult = adultQty;
            if (childQty > 0) parsedRow.pkg_child = childQty;
        }
    } else {
        // Fallback if NO package type found: Restore both
        if (adultQty > 0) parsedRow.pkg_adult = adultQty;
        if (childQty > 0) parsedRow.pkg_child = childQty;
    }

    // Handle \"X + Y + Z\" passenger count format
    if (parsedRow.pkg_pax_complex) {
        const paxStr = String(parsedRow.pkg_pax_complex).trim();
        if (paxStr.includes('+')) {
            const parts = paxStr.split('+').map(p => parseInt(p.trim(), 10));
            if (parts.length >= 1 && !isNaN(parts[0])) parsedRow.pkg_adult = (parsedRow.pkg_adult || 0) + parts[0];
            if (parts.length >= 2 && !isNaN(parts[1])) parsedRow.pkg_child = (parsedRow.pkg_child || 0) + parts[1];
            // if parts.length >= 3, could be infant, usually map to free or ignore
        } else {
            // Fallback: if it's just a number
            const num = parseInt(paxStr, 10);
            if (!isNaN(num)) parsedRow.pkg_adult = (parsedRow.pkg_adult || 0) + num;
        }
        delete parsedRow.pkg_pax_complex;
    }

    // Handle split first/last names
    if (parsedRow.clientNameFirst || parsedRow.clientNameLast) {
        const first = String(parsedRow.clientNameFirst || '').trim();
        const last = String(parsedRow.clientNameLast || '').trim();
        parsedRow.clientName = `${first} ${last}`.trim() || parsedRow.clientName;
        delete parsedRow.clientNameFirst;
        delete parsedRow.clientNameLast;
    }
}

// ========== AGENT CSV HELPERS ==========

export const agentCsvHeaderMapping: { [csvHeaderKey: string]: keyof Agent } = {
    'id': 'id',
    'name': 'name',
    'agency_code': 'agency_code',
    'agency code': 'agency_code',
    'address': 'address',
    'phone_no': 'phone_no',
    'phone no': 'phone_no',
    'phoneno': 'phone_no',
    'email': 'email',
    'status': 'status',
    'trn_number': 'TRN_number',
    'trn number': 'TRN_number',
    'customer_type_id': 'customer_type_id',
    'customer type id': 'customer_type_id',
    'discount': 'discount',
    'discount_rate': 'discount',
    'discount rate': 'discount',
    'websiteurl': 'websiteUrl',
    'website url': 'websiteUrl',
    'website_url': 'websiteUrl',
};

export const convertAgentValue = <K extends keyof Agent>(key: K, value: string): Agent[K] => {
    const trimmedValue = value ? String(value).trim() : '';

    if (trimmedValue === '' || value === null || value === undefined) {
        if (key === 'discount') return 0 as Agent[K];
        if (key === 'status') return 'Active' as Agent[K];
        if (['agency_code', 'address', 'phone_no', 'TRN_number', 'customer_type_id', 'websiteUrl'].includes(key as string)) {
            return undefined as Agent[K];
        }
        return '' as Agent[K];
    }

    switch (key as string) {
        case 'discount':
            const num = parseFloat(trimmedValue);
            return (isNaN(num) || !isFinite(num) ? 0 : num) as Agent[K];
        case 'status':
            const validStatuses: Agent['status'][] = ['Active', 'Non Active', 'Dead'];
            return (validStatuses.includes(trimmedValue as Agent['status']) ? trimmedValue : 'Active') as Agent[K];
        default:
            return trimmedValue as Agent[K];
    }
};

export const normalizeYachtName = (rawName: string): string => {
    if (!rawName) return '';
    const upper = rawName.toUpperCase();
    const clean = upper.replace(/[,.-]/g, ' ').replace(/\s+/g, ' ').trim();

    if (clean === 'OE' || clean.includes('OCEAN EMPRESS') || clean.includes('OE TOP DECK') || clean.includes('OE DINNER')) {
        return 'Ocean Empress';
    }
    if (clean.includes('LOTUS')) {
        return 'Lotus Royale';
    }
    if (clean.includes('DESERT ROSE')) {
        return 'Desert Rose';
    }
    if (clean.includes('MANSOUR') || clean.includes('AL MANSOUR') || clean.includes('DHOW')) {
        return 'Al Mansour';
    }

    // Default: return Title Case of input 
    return rawName; // Or valid yacht ID if unmatched
};
