# CSV Import Validation System

## 🎯 Feature Overview

This system automatically validates CSV imports by:
1. **Looking up the agent** from the CSV and retrieving their discount percentage
2. **Identifying the yacht** and its package rates
3. **Calculating the expected cost**: `(Package Costs) - (Agent Discount) = Expected Total`
4. **Comparing** the calculated total with the `paid_amount` from the CSV
5. **Reporting** validation results in the console and booking notes

---

## 📋 Quick Start

### 1. Prepare Your CSV

Your CSV must include these columns:
- **agent** or **agent_name**: The agent ID or name (must exist in your system)
- **yacht** or **yacht_name**: The yacht ID or name (must exist in your system)
- **paid** or **paid_amount**: The total amount the customer paid
- **Package columns**: e.g., `ch` (child), `ad` (adult), `vip_ad` (VIP adult), etc.

### 2. Upload CSV

1. Go to **Bookings** page
2. Click **Import CSV** button
3. Select your CSV file
4. Wait for processing

### 3. Check Results

Open the browser console (F12) to see validation results:
- ✅ **Green checkmarks**: Valid entries
- ❌ **Red X marks**: Invalid entries with reasons

---

## 📊 Example: How Validation Works

### Example CSV Row:
```csv
client_name,agent,yacht,ch,ad,vip_ad,paid_amount
John Doe,Travel Pro,LOTUS,2,4,1,850.00
```

### System Process:

**Step 1: Look up Agent**
```
Agent Name: "Travel Pro"
Agent Discount: 15%
```

**Step 2: Look up Yacht & Packages**
```
Yacht: "LOTUS MEGA YACHT"
Package Rates:
- CHILD: AED 100
- ADULT: AED 150  
- VIP ADULT: AED 200
```

**Step 3: Calculate Base Cost**
```
CHILD:     2 × AED 100 = AED 200
ADULT:     4 × AED 150 = AED 600
VIP ADULT: 1 × AED 200 = AED 200
─────────────────────────────────
BASE TOTAL:            = AED 1,000
```

**Step 4: Apply Agent Discount**
```
Base Cost:        AED 1,000.00
Agent Discount:   15%
Discount Amount:  AED 150.00
─────────────────────────────────
EXPECTED TOTAL:   AED 850.00
```

**Step 5: Compare with CSV**
```
Expected Total:  AED 850.00
CSV Paid Amount: AED 850.00
Difference:      AED 0.00
─────────────────────────────────
✅ VALIDATION PASSED!
```

---

## ⚙️ Configuration

### Option 1: Skip Invalid Rows

By default, invalid rows are imported with a warning in the notes.

**To skip invalid rows entirely:**

1. Open `/src/app/bookings/page.tsx`
2. Find the validation section (around line 890)
3. Uncomment these lines:

```typescript
if (!validationResult.isValid) {
  skippedCount++;
  continue;
}
```

### Option 2: Adjust Tolerance

Default tolerance is ±AED 0.01 (1 cent).

**To change:**

1. Open `/src/lib/csvValidation.ts`
2. Find line ~96
3. Modify:

```typescript
const tolerance = 0.01; // Change to your preferred value
```

---

## 🔍 Understanding Validation Results

### ✅ Valid Entry

**Console Output:**
```
✅ [CSV Validation] Row 2 (John Doe): Payment validated successfully. 
Expected: 850.00, CSV: 850.00, Agent Discount: 15%
```

**Result:** Booking imported normally

---

### ❌ Invalid Entry - Payment Mismatch

**Console Output:**
```
❌ Row 3 (Jane Smith): INVALID - Payment mismatch: 
Expected 720.00 (Base: 800.00 - Discount: 80.00) 
but CSV shows 800.00. Difference: 80.00
```

**Result:** 
- Booking imported with warning
- Notes field will show: `[VALIDATION WARNING]: Payment mismatch...`

---

### ❌ Invalid Entry - Agent Not Found

**Console Output:**
```
❌ Row 4 (Bob Johnson): INVALID - Agent "Unknown Agent" not found in the system
```

**Result:**
- Booking imported with warning
- Check agent name/ID in CSV matches system records

---

### ❌ Invalid Entry - Yacht Not Found

**Console Output:**
```
❌ Row 5 (Alice Cooper): INVALID - Yacht "Unknown Yacht" not found in the system
```

**Result:**
- Booking imported with warning
- Verify yacht name/ID exists in yacht database

---

## 📁 Files Created/Modified

### New Files Created:

1. **`/src/lib/csvValidation.ts`**
   - Core validation logic
   - Functions: `validateCSVRow()`, `validateCSVBatch()`, `formatValidationResult()`

2. **`/docs/CSV_VALIDATION_GUIDE.md`**
   - Comprehensive user guide
   - Error messages and solutions
   - Best practices

3. **`/docs/CSV_VALIDATION_FLOWCHART.md`**
   - Visual flowcharts
   - Step-by-step process
   - Real-world examples

4. **`/docs/sample_booking_import.csv`**
   - Sample CSV file
   - Proper format demonstration

### Modified Files:

1. **`/src/app/bookings/page.tsx`**
   - Added import for validation functions
   - Integrated validation into CSV import process
   - Added logging and warning system

---

## 🧪 Testing the Feature

### Test Case 1: Valid Entry ✅

**Setup:**
1. Create agent "Test Agent" with 10% discount
2. Create yacht "TEST YACHT" with ADULT package @ AED 100

**CSV:**
```csv
client_name,agent,yacht,ad,paid_amount
Test Customer,Test Agent,TEST YACHT,10,900.00
```

**Expected Result:**
- Base: 10 × 100 = 1,000
- Discount: 1,000 × 10% = 100
- Expected: 900
- ✅ VALID (matches CSV paid_amount)

### Test Case 2: Wrong Discount ❌

**Same setup as above**

**CSV:**
```csv
client_name,agent,yacht,ad,paid_amount
Test Customer,Test Agent,TEST YACHT,10,1000.00
```

**Expected Result:**
- Expected: 900
- CSV Shows: 1,000
- ❌ INVALID - Difference: 100 (forgot to apply discount)

### Test Case 3: Agent Not Found ❌

**CSV:**
```csv
client_name,agent,yacht,ad,paid_amount
Test Customer,Nonexistent Agent,TEST YACHT,10,900.00
```

**Expected Result:**
- ❌ INVALID - Agent "Nonexistent Agent" not found

---

## 🐛 Troubleshooting

### Problem: All bookings show as invalid

**Possible Causes:**
1. Agent names don't match exactly
2. Yacht names don't match exactly
3. Package rates have changed

**Solutions:**
- Use **Agent ID** instead of name (more reliable)
- Use **Yacht ID** instead of name
- Verify package rates in Yacht Management
- Check for typos in CSV

### Problem: Decimal point errors

**Issue:** Using comma (`,`) as decimal separator

**Solution:** Use period (`.`) for decimals:
- ❌ Wrong: `1.234,56`
- ✅ Correct: `1234.56`

### Problem: Validation passes but amounts seem wrong

**Possible Causes:**
1. Agent discount was updated after CSV was prepared
2. Yacht package rates changed
3. Multiple packages with similar names

**Solutions:**
- Export current agents and check discount percentages
- Export current yacht packages and verify rates
- Use exact package names from system

---

## 📊 CSV Column Mapping

**Agent Columns:**
- `agent` → Agent ID or Name
- `agent_name` → Agent Name

**Yacht Columns:**
- `yacht` → Yacht ID or Name
- `yacht_name` → Yacht Name

**Package Columns:**
- `ch` → CHILD
- `ad` → ADULT
- `ad_alc` → ADULT ALC
- `vip_ch` → VIP CHILD
- `vip_ad` → VIP ADULT
- `vip_alc` → VIP ALC
- `basic` → BASIC (Superyacht)
- `std` → STANDARD (Superyacht)
- `prem` → PREMIUM (Superyacht)
- `vip` → VIP (Superyacht)
- `hrchtr` → HOUR CHARTER (Private)

**Amount Columns:**
- `total_amt` → Total Amount (before discount)
- `paid` → Paid Amount (after discount)
- `paid_amount` → Paid Amount (after discount)

---

## 🎓 Best Practices

1. **Always verify agents exist** before importing CSV
2. **Use Agent IDs** when possible (more reliable than names)
3. **Test with small files** first (5-10 rows)
4. **Keep console open** during import to see validation results
5. **Export then re-import** to learn the expected format
6. **Update agent discounts** before major imports
7. **Verify yacht package rates** are current

---

## 🔗 Related Documentation

- [CSV_VALIDATION_GUIDE.md](./docs/CSV_VALIDATION_GUIDE.md) - Detailed user guide
- [CSV_VALIDATION_FLOWCHART.md](./docs/CSV_VALIDATION_FLOWCHART.md) - Visual process flow
- [sample_booking_import.csv](./docs/sample_booking_import.csv) - Example CSV file

---

## 💡 Summary

The CSV validation system ensures data integrity by:

✅ **Automatically checking** that agent discounts are applied correctly  
✅ **Verifying** yacht costs match package rates  
✅ **Comparing** calculated totals with CSV amounts  
✅ **Logging** detailed results for review  
✅ **Flagging** mismatches with clear error messages  

This helps prevent pricing errors, missed discounts, and data inconsistencies in your booking imports!
