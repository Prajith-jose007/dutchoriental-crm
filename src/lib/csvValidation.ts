import type { Agent, Yacht, LeadPackageQuantity } from './types';

export interface CSVValidationResult {
    isValid: boolean;
    calculatedTotal: number;
    csvPaidAmount: number;
    discountApplied: number;
    discountPercentage: number;
    agentName: string;
    yachtName: string;
    errors: string[];
    warnings: string[];
}

export interface CSVRowData {
    rowNumber: number;
    agentName: string;
    yachtId: string;
    packageQuantities?: LeadPackageQuantity[];
    paidAmount: number;
    totalAmount?: number;
    clientName?: string;
}

/**
 * Validates a CSV row by:
 * 1. Looking up the agent and their discount percentage
 * 2. Looking up the yacht and calculating costs based on packages
 * 3. Applying the agent discount
 * 4. Comparing with the paid amount from CSV
 */
export function validateCSVRow(
    rowData: CSVRowData,
    agents: Agent[],
    yachts: Yacht[]
): CSVValidationResult {
    const result: CSVValidationResult = {
        isValid: true,
        calculatedTotal: 0,
        csvPaidAmount: rowData.paidAmount,
        discountApplied: 0,
        discountPercentage: 0,
        agentName: rowData.agentName,
        yachtName: '',
        errors: [],
        warnings: [],
    };

    // Step 1: Find the agent
    let agent = agents.find(
        (a) =>
            a.id === rowData.agentName ||
            a.name.toLowerCase().trim() === rowData.agentName.toLowerCase().trim()
    );

    if (!agent) {
        // Validation-side Fuzzy Match Backup
        // Using same loose logic as csvHelpers
        const cleanCsvAgent = rowData.agentName.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/LLC|LLC|FZ|FZE/g, '');
        agent = agents.find(a => {
            const cleanDbAgent = a.name.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/LLC|LLC|FZ|FZE/g, '');
            return cleanDbAgent === cleanCsvAgent || cleanDbAgent.includes(cleanCsvAgent) || cleanCsvAgent.includes(cleanDbAgent);
        });
    }

    if (!agent) {
        // Special case for Direct Booking or if whitelisted
        if (rowData.agentName === 'Direct Booking' || rowData.agentName.toLowerCase() === 'direct booking') {
            // Treat as valid, 0 discount
            agent = {
                id: 'direct-booking',
                name: 'Direct Booking',
                discount: 0,
                status: 'Active',
                email: '',
                phone_no: '',
                address: '',
                agency_code: '',
                TRN_number: ''
            };
        } else {
            result.isValid = false;
            // result.errors.push(`Agent "${rowData.agentName}" not found in the system`);
            // Allow loose validation for now, just warn?
            // User requested VALIDATION, which implies strictness. But since import allows it, validation should too.
            // If we are here, even fuzzy match failed.
            result.errors.push(`Agent "${rowData.agentName}" not found in the system`);
            return result;
        }
    }

    result.agentName = agent.name;
    result.discountPercentage = agent.discount || 0;

    // Step 2: Find the yacht
    const yacht = yachts.find(
        (y) =>
            y.id === rowData.yachtId ||
            y.name.toLowerCase() === rowData.yachtId.toLowerCase()
    );

    if (!yacht) {
        result.isValid = false;
        result.errors.push(`Yacht "${rowData.yachtId}" not found in the system`);
        return result;
    }

    result.yachtName = yacht.name;

    // Step 3: Calculate the base cost from packages
    let baseTotal = 0;

    if (rowData.packageQuantities && rowData.packageQuantities.length > 0) {
        // Calculate from package quantities
        rowData.packageQuantities.forEach((pq) => {
            baseTotal += pq.quantity * pq.rate;
        });
    } else if (rowData.totalAmount !== undefined && rowData.totalAmount !== null) {
        // If no package quantities, use the provided total amount
        baseTotal = rowData.totalAmount;
    } else {
        result.warnings.push(
            'No package quantities or total amount provided. Using paid amount as base.'
        );
        baseTotal = rowData.paidAmount;
    }

    // Step 4: Apply agent discount
    const discountAmount = (baseTotal * result.discountPercentage) / 100;
    result.discountApplied = discountAmount;
    result.calculatedTotal = baseTotal - discountAmount;

    // Step 5: Compare calculated total with CSV paid amount
    const tolerance = 0.01; // Allow 1 cent difference for rounding
    const difference = Math.abs(result.calculatedTotal - rowData.paidAmount);

    if (difference > tolerance) {
        result.isValid = false;
        result.errors.push(
            `Payment mismatch: Expected ${result.calculatedTotal.toFixed(2)} (Base: ${baseTotal.toFixed(2)} - Discount: ${discountAmount.toFixed(2)}) but CSV shows ${rowData.paidAmount.toFixed(2)}. Difference: ${difference.toFixed(2)}`
        );
    }

    return result;
}

/**
 * Validates multiple CSV rows and returns a summary
 */
export interface CSVBatchValidationSummary {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    rowResults: Map<number, CSVValidationResult>;
    overallErrors: string[];
}

export function validateCSVBatch(
    rows: CSVRowData[],
    agents: Agent[],
    yachts: Yacht[]
): CSVBatchValidationSummary {
    const summary: CSVBatchValidationSummary = {
        totalRows: rows.length,
        validRows: 0,
        invalidRows: 0,
        rowResults: new Map(),
        overallErrors: [],
    };

    if (agents.length === 0) {
        summary.overallErrors.push('No agents found in the system');
    }

    if (yachts.length === 0) {
        summary.overallErrors.push('No yachts found in the system');
    }

    rows.forEach((row) => {
        const validationResult = validateCSVRow(row, agents, yachts);
        summary.rowResults.set(row.rowNumber, validationResult);

        if (validationResult.isValid) {
            summary.validRows++;
        } else {
            summary.invalidRows++;
        }
    });

    return summary;
}

/**
 * Formats validation result for display in console or UI
 */
export function formatValidationResult(
    rowNumber: number,
    result: CSVValidationResult,
    clientName?: string
): string {
    const prefix = clientName
        ? `Row ${rowNumber} (${clientName})`
        : `Row ${rowNumber}`;

    if (result.isValid) {
        return `✅ ${prefix}: VALID - Agent: ${result.agentName} (${result.discountPercentage}% discount), Yacht: ${result.yachtName}, Expected: ${result.calculatedTotal.toFixed(2)}, CSV: ${result.csvPaidAmount.toFixed(2)}`;
    } else {
        const errorMessages = result.errors.join('; ');
        return `❌ ${prefix}: INVALID - ${errorMessages}`;
    }
}

/**
 * Generates a detailed validation report
 */
export function generateValidationReport(
    summary: CSVBatchValidationSummary
): string {
    const lines: string[] = [];

    lines.push('=== CSV VALIDATION REPORT ===');
    lines.push(`Total Rows: ${summary.totalRows}`);
    lines.push(`Valid: ${summary.validRows}`);
    lines.push(`Invalid: ${summary.invalidRows}`);
    lines.push('');

    if (summary.overallErrors.length > 0) {
        lines.push('Overall Errors:');
        summary.overallErrors.forEach((error) => {
            lines.push(`  - ${error}`);
        });
        lines.push('');
    }

    if (summary.invalidRows > 0) {
        lines.push('Invalid Rows:');
        summary.rowResults.forEach((result, rowNumber) => {
            if (!result.isValid) {
                lines.push(`  Row ${rowNumber}:`);
                result.errors.forEach((error) => {
                    lines.push(`    - ${error}`);
                });
            }
        });
        lines.push('');
    }

    if (summary.validRows > 0) {
        lines.push('Sample Valid Rows (first 5):');
        let count = 0;
        summary.rowResults.forEach((result, rowNumber) => {
            if (result.isValid && count < 5) {
                lines.push(`  Row ${rowNumber}: Agent: ${result.agentName}, Yacht: ${result.yachtName}, Amount: ${result.calculatedTotal.toFixed(2)}`);
                count++;
            }
        });
    }

    lines.push('=== END REPORT ===');

    return lines.join('\n');
}
