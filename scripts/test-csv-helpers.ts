
import { parseCsvLine, applyPackageTypeDetection, convertLeadCsvValue as convertCsvValue } from '../src/lib/csvHelpers';
import { assert } from 'console';

console.log("Running CSV Helper Tests...");

// TEST 1: parseCsvLine
console.log("Test 1: parseCsvLine");
const line = 'value1,"value 2, with comma",value3';
const parsed = parseCsvLine(line);
console.log("Parsed:", parsed);
if (parsed.length !== 3 || parsed[1] !== 'value 2, with comma') {
    console.error("❌ parseCsvLine Failed");
    process.exit(1);
}
console.log("✅ parseCsvLine Passed");

// TEST 2: applyPackageTypeDetection - VIP SOFT
console.log("Test 2: applyPackageTypeDetection (VIP SOFT)");
const rowVipSoft: any = { pkg_adult: 2, pkg_child: 1 };
applyPackageTypeDetection('My Yacht - VIP SOFT', rowVipSoft);
// Expect: pkg_adult -> removed, pkg_child -> removed, pkg_vip_adult -> 2, pkg_vip_child -> 1
if (rowVipSoft['pkg_adult'] !== undefined || rowVipSoft['pkg_vip_adult'] !== 2) {
    console.error("❌ applyPackageTypeDetection (VIP SOFT) Failed", rowVipSoft);
    process.exit(1);
}
console.log("✅ applyPackageTypeDetection (VIP SOFT) Passed");

// TEST 3: applyPackageTypeDetection - UNLIMITED ALCOHOLIC
console.log("Test 3: applyPackageTypeDetection (UNLIMITED ALCOHOLIC)");
const rowAlc: any = { pkg_adult: 4 };
applyPackageTypeDetection('My Yacht - UNLIMITED ALCOHOLIC DRINKS', rowAlc);
// Expect: pkg_adult -> removed, pkg_adult_alc -> 4
if (rowAlc['pkg_adult'] !== undefined || rowAlc['pkg_adult_alc'] !== 4) {
    console.error("❌ applyPackageTypeDetection (UNLIMITED ALCOHOLIC) Failed", rowAlc);
    process.exit(1);
}
console.log("✅ applyPackageTypeDetection (UNLIMITED ALCOHOLIC) Passed");

// TEST 4: convertCsvValue - Clean numbers
console.log("Test 4: convertCsvValue (Numeric)");
const val = convertCsvValue('paidAmount', '1,200.50', [], {}, {}, {});
if (val !== 1200.5) {
    console.error("❌ convertCsvValue (Numeric) Failed. Got:", val);
    process.exit(1);
}
console.log("✅ convertCsvValue (Numeric) Passed");

// TEST 5: applyPackageTypeDetection - Complex Pax Header
console.log("Test 5: Complex pax format '8 + 1 + 0' (GYG)");
const rowGYG: any = { pkg_pax_complex: '8 + 1 + 0' };
applyPackageTypeDetection('', rowGYG);
if (rowGYG.pkg_adult !== 8 || rowGYG.pkg_child !== 1) {
    console.error("❌ Complex pax format test failed", rowGYG);
    process.exit(1);
}
console.log("✅ Complex pax format Passed");

// TEST 6: applyPackageTypeDetection - Name split
console.log("Test 6: Split names");
const rowNames: any = { clientNameFirst: 'John', clientNameLast: 'Doe' };
applyPackageTypeDetection('', rowNames);
if (rowNames.clientName !== 'John Doe') {
    console.error("❌ Split names test failed", rowNames);
    process.exit(1);
}
console.log("✅ Split names Passed");

console.log("🎉 All Tests Passed!");
