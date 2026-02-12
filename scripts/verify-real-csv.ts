
import fs from 'fs';
import path from 'path';
import { parseCsvLine, leadCsvHeaderMapping, convertLeadCsvValue, applyPackageTypeDetection } from '../src/lib/csvHelpers';

// Mock Data for context (empty for this verification as we care about parsing logic mostly)
const allYachts: any[] = [];
const agentMap: any = { 'Baseet Tourism': 'agent-123' }; // Parsing doesn't strictly depend on DB existence for package detection text
const userMap: any = {};
const yachtMap: any = {};

const FILE_PATH = '/Users/prajithjose/Downloads/dailySalesReport.csv';

async function main() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        return;
    }

    console.log(`Reading file: ${FILE_PATH}`);
    const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');

    if (lines.length < 2) {
        console.error('File is empty or has no data rows.');
        return;
    }

    const headerLine = lines[0];
    const delimiter = (headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length ? '\t' : ',';

    // Normalize headers same as the app does
    const headers = parseCsvLine(headerLine, delimiter).map(h => h.trim());
    console.log(`Detected Headers: ${headers.join(', ')}`);

    console.log(`\n--- Verifying First 5 Data Rows ---`);

    for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const line = lines[i];
        const rowValues = parseCsvLine(line, delimiter);
        const parsedRow: any = {};

        // 1. Basic Mapping
        headers.forEach((h, idx) => {
            const key = leadCsvHeaderMapping[h] || leadCsvHeaderMapping[h.toLowerCase()];
            if (key) {
                parsedRow[key] = convertLeadCsvValue(key, rowValues[idx], allYachts, agentMap, userMap, yachtMap);
            }
        });

        // 2. Capture Raw Yacht String for Logic
        let rawYachtString = '';
        headers.forEach((h, idx) => {
            // "YachtName" maps to "yacht" key, so we check if this header maps to yacht
            const key = leadCsvHeaderMapping[h] || leadCsvHeaderMapping[h.toLowerCase()];
            if (key === 'yacht') rawYachtString = rowValues[idx];
        });

        // 3. Apply Package Logic
        applyPackageTypeDetection(rawYachtString, parsedRow, 'RUZINN');

        // 4. Output Result
        console.log(`\nRow ${i}:`);
        console.log(`  Raw Yacht Column: "${rawYachtString}"`);
        console.log(`  Identified Yacht: "${parsedRow.yacht}"`);

        const packages = Object.keys(parsedRow).filter(k => k.startsWith('pkg_') && parsedRow[k] > 0);
        if (packages.length > 0) {
            console.log(`  Detected Packages:`);
            packages.forEach(k => console.log(`    - ${k}: ${parsedRow[k]}`));
        } else {
            console.log(`  WARNING: No packages detected (Adult/Child qty might be 0)`);
        }
    }
}

main();
