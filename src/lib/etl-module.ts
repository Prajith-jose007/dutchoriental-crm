import { Lead, LeadStatus, Yacht, Agent } from '@/lib/types';
import { parseCsvLine, convertLeadCsvValue, leadCsvHeaderMapping, applyPackageTypeDetection, ImportSource } from '@/lib/csvHelpers';

// Mock DB Driver / Type for demonstration
interface DbInterface {
    findBookingByRef(ref: string): Promise<Lead | null>;
    findBookingByTransId(tid: string): Promise<Lead | null>;
    upsertBooking(lead: Lead): Promise<void>;
}

export class ETLModule {
    private allYachts: Yacht[];
    private allAgents: Agent[];
    private agentMap: { [id: string]: string };
    private yachtMap: { [id: string]: string };
    private userMap: { [id: string]: string };

    constructor(
        yachts: Yacht[],
        agents: Agent[],
        users: { [id: string]: string }
    ) {
        this.allYachts = yachts;
        this.allAgents = agents;
        this.agentMap = agents.reduce((acc, a) => ({ ...acc, [a.id]: a.name }), {});
        this.yachtMap = yachts.reduce((acc, y) => ({ ...acc, [y.id]: y.name }), {});
        this.userMap = users;
    }

    /**
     * Load Input A (Booking File)
     * Header: Company Name, TicketNumber, Booking RefNO, Transaction, YachtName, Pax Name, Travel Date, Sales Amount(AED), Adult, Child
     */
    public load_input_a(csvContent: string): Partial<Lead>[] {
        return this.parse_csv_generic(csvContent, 'DEFAULT');
    }

    /**
     * Load Input B (Master File)
     * Header: STATUS, MONTH, DATE, EVENT, Agent, TYPE, INV, PACKAGE, CLIENT, FREE...
     */
    public load_input_b(csvContent: string): Partial<Lead>[] {
        return this.parse_csv_generic(csvContent, 'MASTER');
    }

    private parse_csv_generic(csvContent: string, source: ImportSource): Partial<Lead>[] {
        const lines = csvContent.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        let headerLine = lines[0];
        if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.substring(1);

        const delimiter = (headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length ? '\t' : ',';
        const headers = parseCsvLine(headerLine, delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

        const results: Partial<Lead>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const data = parseCsvLine(lines[i], delimiter);
            const row: any = {};

            // 1. Basic Mapping
            headers.forEach((h, idx) => {
                const mapKey = leadCsvHeaderMapping[h] || leadCsvHeaderMapping[h.toLowerCase()];
                if (mapKey) {
                    row[mapKey] = convertLeadCsvValue(mapKey, data[idx], this.allYachts, this.agentMap, this.userMap, this.yachtMap);
                }
            });

            // 2. Package Inference / Transformation
            // Capture raw yacht name for package logic
            let rawYacht = '';
            headers.forEach((h, idx) => {
                if (leadCsvHeaderMapping[h] === 'yacht') rawYacht = data[idx] || '';
            });

            applyPackageTypeDetection(rawYacht, row, source);

            // 3. Normalized "Row" to partial Lead
            results.push(row);
        }
        return results;
    }

    /**
     * Transform Row
     * Apply specific business rules for merging or cleaning a single row
     */
    public transform_row(row: Partial<Lead>): Partial<Lead> {
        // Validation/Transformation logic already largely handled in parse_csv (convertLeadCsvValue)
        // Add specific post-processing here if needed.

        // Example: Addon = OTHERS AMT (Cake)
        // This is handled in mapping 'others_amt_(cake)' -> 'master_amt_cake' -> ... logic?
        // Note: Logic for master_amt_cake mapping to numeric needs to be explicit if not in csvHelpers.
        // Assuming csvHelpers handles the basics, we enforce specific overrides here.

        return row;
    }

    /**
     * Upsert to DB
     * Merges incoming data with existing data to prevent duplicates.
     */
    public async upsert_to_db(incomingLeads: Partial<Lead>[], db: DbInterface) {
        let stats = { inserted: 0, updated: 0, failed: 0 };

        for (const lead of incomingLeads) {
            try {
                let existing: Lead | null = null;

                // Try finding by Booking Ref
                if (lead.bookingRefNo) {
                    existing = await db.findBookingByRef(lead.bookingRefNo);
                }
                // Try finding by Trans ID
                if (!existing && lead.transactionId) {
                    existing = await db.findBookingByTransId(lead.transactionId);
                }

                if (existing) {
                    // Update: Merge fields. 
                    // Rule 9: "Total Amt/Net/Paid/Bal" prefer Master (incoming if master)
                    // If 'lead' comes from Master file, it should overwrite.
                    // We assume 'lead' has the prioritized data if we just loaded it.

                    const merged = { ...existing, ...lead };

                    // Specific merge handling if needed (e.g. don't overwrite non-empty notes with empty)
                    if (existing.notes && lead.notes) merged.notes = existing.notes + '\n' + lead.notes;
                    else if (existing.notes) merged.notes = existing.notes; // keep existing if new is empty

                    await db.upsertBooking(merged as Lead);
                    stats.updated++;
                } else {
                    // Insert
                    await db.upsertBooking(lead as Lead);
                    stats.inserted++;
                }
            } catch (e) {
                console.error("Failed to upsert lead:", lead, e);
                stats.failed++;
            }
        }
        return stats;
    }
}
