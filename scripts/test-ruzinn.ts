
// scripts/test-ruzinn.ts

console.log('--- Ruzinn Import Logic Test ---');

// Mock implementation of the updated parseCsvLine
function parseCsvLine(line: string, delimiter = ','): string[] {
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

// Test 1: Header detection
const headerLine = "Company Name\tTicketNumber\tBooking RefNO\tTransaction\tYachtName";
console.log(`\nTesting Header: "${headerLine.replace(/\t/g, '\\t')}"`);
const tabCount = (headerLine.match(/\t/g) || []).length;
const commaCount = (headerLine.match(/,/g) || []).length;
const delimiter = tabCount > commaCount ? '\t' : ',';
console.log(`Detected Delimiter: '${delimiter === '\t' ? '\\t' : ','}' (Expected: \\t)`);

const headers = parseCsvLine(headerLine, delimiter);
console.log('Parsed Headers:', headers);

if (headers.includes('TicketNumber') && headers.includes('YachtName')) {
    console.log('✅ Header Parsing: PASSED');
} else {
    console.error('❌ Header Parsing: FAILED');
}

// Test 2: Data Row Parsing & Yacht Splitting
const rowLine = "RATHIN LLC\tRT12345\tDO999\tOnline\tLOTUS ROYALE - FOOD AND SOFT DRINKS\tJohn Doe";
console.log(`\nTesting Row: "${rowLine.replace(/\t/g, '\\t')}"`);
const rowData = parseCsvLine(rowLine, delimiter);
const yachtRaw = rowData[4];
console.log(`Extracted Yacht Raw: "${yachtRaw}"`);

let yachtClean = yachtRaw;
let packageType = '';

if (yachtClean.match(/\s*[-\u2013\u2014]\s*/)) {
    const parts = yachtClean.split(/\s*[-\u2013\u2014]\s*/);
    yachtClean = parts[0].trim();
    if (parts.length > 1) packageType = parts[1].trim();
}

console.log(`Result -> Yacht: "${yachtClean}", Package: "${packageType}"`);

if (yachtClean === 'LOTUS ROYALE' && packageType === 'FOOD AND SOFT DRINKS') {
    console.log('✅ Yacht/Package Split: PASSED');
} else {
    console.error('❌ Yacht/Package Split: FAILED');
}

// Test 3: Other variations
const variations = [
    "OCEAN EMPRESS (VIP SOFT)",
    "CALYPSO SUNSET - FOOD & SOFT DRINKS",
    "OE TOP DECK \u2013 VIP" // En-dash
];

console.log('\nTesting Variations:');
variations.forEach(v => {
    let clean = v;
    let pkg = '';
    if (clean.match(/\s*[-\u2013\u2014]\s*/)) {
        const parts = clean.split(/\s*[-\u2013\u2014]\s*/);
        clean = parts[0].trim();
        pkg = parts[1]?.trim() || '';
    } else if (clean.includes('(')) {
        clean = clean.split('(')[0].trim();
        pkg = 'Detected via regex in real app';
    }
    console.log(`Input: "${v}" -> Yacht: "${clean}"`);
});

console.log('\n--- Test Complete ---');
