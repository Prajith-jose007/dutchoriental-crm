
import fs from 'fs';
import { parseCsvLine, leadCsvHeaderMapping, convertLeadCsvValue, applyPackageTypeDetection } from '../src/lib/csvHelpers';

const FILE_PATH = '/Users/prajithjose/Downloads/dailySalesReport.csv';

async function main() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        return;
    }

    const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return;

    const headerLine = lines[0];
    const delimiter = (headerLine.match(/\t/g) || []).length > (headerLine.match(/,/g) || []).length ? '\t' : ',';
    const headers = parseCsvLine(headerLine, delimiter).map(h => h.trim());

    // Find YachtName index
    const yachtNameIndex = headers.findIndex(h => h === 'YachtName');
    if (yachtNameIndex === -1) {
        console.error('Column "YachtName" not found in CSV.');
        return;
    }

    const uniqueYachtStrings = new Set<string>();

    console.log('--- Analyzing Unique Yacht/Package Strings in CSV ---');

    // Collect all unique yacht strings
    for (let i = 1; i < lines.length; i++) {
        const rowValues = parseCsvLine(lines[i], delimiter);
        if (rowValues[yachtNameIndex]) {
            uniqueYachtStrings.add(rowValues[yachtNameIndex].trim());
        }
    }

    // Test each unique string against the logic
    uniqueYachtStrings.forEach(rawYachtString => {
        const mockRow: any = { pkg_adult: 1, pkg_child: 0 }; // Simulate 1 adult

        applyPackageTypeDetection(rawYachtString, mockRow, 'RUZINN');

        // Check validation
        let detectedPackages = Object.keys(mockRow).filter(k => k.startsWith('pkg_') && mockRow[k] > 0);

        // Handle fallback to Adult if no specific found
        if (detectedPackages.length === 0) detectedPackages = ['(none/default)'];

        let status = 'OK';

        // Check for missed keywords
        const upper = rawYachtString.toUpperCase();
        if (detectedPackages.length === 1 && detectedPackages[0] === 'pkg_adult') {
            if (upper.includes('VIP') || upper.includes('ROYAL') || upper.includes('ALC') || upper.includes('TOP')) {
                status = 'FAIL (Missed Keyword)';
            }
        } else if (detectedPackages.length === 0 || detectedPackages[0] === '(none/default)') {
            status = 'FAIL (No Package)';
        }

        console.log(`[${status}] "${rawYachtString}" -> ${detectedPackages.join(', ')}`);
    });
}

main();
