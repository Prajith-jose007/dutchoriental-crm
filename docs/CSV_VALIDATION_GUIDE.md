# CSV Import Validation Feature

## Overview

The system now validates CSV imports by checking:
1. **Agent Name** - Looks up the agent in the system
2. **Agent Discount** - Retrieves the discount percentage set for that agent
3. **Yacht Selection** - Identifies the yacht and its package rates
4. **Cost Calculation** - Calculates: `Base Cost - Agent Discount = Expected Total`
5. **Payment Validation** - Compares the expected total with the `paid_amount` in CSV

## How It Works

### Step-by-Step Process

When you upload a CSV file for bookings:

1. **Agent Lookup**
   - System reads the `agent` or `agent_name` column from CSV
   - Matches it with agents in the database (by ID or name)
   - Retrieves the agent's discount percentage (e.g., 10%)

2. **Yacht & Package Identification**
   - Reads the `yacht` or `yacht_name` column
   - Identifies package quantities (e.g., CHILD, ADULT, VIP ADULT, etc.)
   - Calculates base cost: `Sum of (quantity × rate)` for all packages

3. **Discount Application**
   - Applies agent discount: `Discount Amount = Base Cost × (Discount % / 100)`
   - Calculates expected total: `Expected Total = Base Cost - Discount Amount`

4. **Validation**
   - Compares `Expected Total` with `paid_amount` from CSV
   - If they match (within 1 cent tolerance) → ✅ **VALID**
   - If they don't match → ❌ **INVALID** - Validation warning added to booking notes

## CSV Format

### Required Columns

- `agent` or `agent_name` - Agent ID or Name
- `yacht` or `yacht_name` - Yacht ID or Name
- `paid` or `paid_amount` - The total amount paid
- Package quantities (varies by yacht type)

### Optional Columns

- `total_amount` or `total_amt` - Base amount before discount
- `discount_%` or `commission` - Can be provided but will be validated against agent's system discount

### Example CSV Format

```csv
client_name,agent,yacht,date,ch,ad,vip_ad,paid_amount,note
John Doe,AG-001,LOTUS,2026-01-15,2,4,0,500.00,Birthday celebration
Jane Smith,Travel Pro,DHOW CRUISE,2026-01-20,0,6,2,800.00,Corporate event
```

## Validation Results

### Success Case (✅ VALID)
```
✅ Row 2 (John Doe): VALID - Agent: Travel Agent Inc (10% discount), 
Yacht: LOTUS MEGA YACHT, Expected: 500.00, CSV: 500.00
```

Console Output:
```
✅ [CSV Validation] Row 2 (John Doe): Payment validated successfully. 
Expected: 500.00, CSV: 500.00, Agent Discount: 10%
```

### Failure Case (❌ INVALID)
```
❌ Row 3 (Jane Smith): INVALID - Payment mismatch: 
Expected 720.00 (Base: 800.00 - Discount: 80.00) 
but CSV shows 750.00. Difference: 30.00
```

Console Output:
```
⚠️ [CSV Validation Warning] Row 3 (Jane Smith): Payment mismatch: 
Expected 720.00 (Base: 800.00 - Discount: 80.00) but CSV shows 750.00
```

The booking will be imported, but a validation warning will be added to the notes field.

## Validation Logic

### Calculation Example

**Given:**
- Agent: "Travel Pro" with 10% discount
- Yacht: "LOTUS MEGA YACHT"
- Packages:
  - CHILD × 2 @ AED 100 = AED 200
  - ADULT × 4 @ AED 150 = AED 600
  - VIP ADULT × 2 @ AED 200 = AED 400

**Calculation:**
```
Base Cost = 200 + 600 + 400 = AED 1,200
Agent Discount = 1,200 × 10% = AED 120
Expected Total = 1,200 - 120 = AED 1,080
```

**Result:**
- If CSV shows `paid_amount: 1080.00` → ✅ **VALID**
- If CSV shows `paid_amount: 1200.00` → ❌ **INVALID** (missing discount)
- If CSV shows `paid_amount: 1050.00` → ❌ **INVALID** (incorrect amount)

## Error Messages

### Agent Not Found
```
❌ Agent "Unknown Agent" not found in the system
```
**Solution:** Make sure the agent name/ID in CSV matches exactly with an agent in the system.

### Yacht Not Found
```
❌ Yacht "Unknown Yacht" not found in the system
```
**Solution:** Verify the yacht name/ID exists in your yacht database.

### Payment Mismatch
```
❌ Payment mismatch: Expected 1080.00 but CSV shows 1200.00. Difference: 120.00
```
**Solution:** 
1. Check if the agent discount was applied correctly in your CSV
2. Verify the package rates are current
3. Recalculate: `(Package Costs - Agent Discount) = Expected Amount`

## Configuration Options

### Skip Invalid Rows (Optional)

By default, invalid rows are still imported with warnings added to notes.

To **skip invalid rows entirely**, modify `/src/app/bookings/page.tsx` around line 890:

```typescript
// Uncomment these lines to skip invalid rows:
if (!validationResult.isValid) {
  skippedCount++;
  continue;
}
```

### Adjust Tolerance (Optional)

The system allows a 1 cent difference for rounding. To adjust:

In `/src/lib/csvValidation.ts` around line 96:
```typescript
const tolerance = 0.01; // Change this value (in AED)
```

## Troubleshooting

### Issue: All rows showing as invalid

**Check:**
1. Agent names in CSV match system agents
2. Yacht names in CSV match system yachts
3. Package columns are correctly mapped
4. Decimal points are used correctly (use `.` not `,`)

### Issue: Validation shows wrong discount

**Check:**
1. Agent discount is correctly set in Agent Management
2. You're using the correct agent ID/name in CSV
3. Agent status is "Active"

### Issue: Package rates don't match

**Check:**
1. Yacht packages are up-to-date in Yacht Management
2. Package names in CSV match exactly (case-insensitive but spelling must match)
3. Multiple package columns are being read correctly

## Console Logging

The validation process logs detailed information to the browser console:

1. Open Developer Tools (F12)
2. Go to "Console" tab
3. Upload your CSV
4. Look for messages starting with:
   - `[CSV Validation]` - Success messages
   - `[CSV Validation Warning]` - Validation failures

## Best Practices

1. **Test with Small Files First** - Upload 5-10 rows to verify format
2. **Check Console Logs** - Review validation results before processing large batches
3. **Keep Agent Data Updated** - Ensure agent discounts are current
4. **Verify Package Rates** - Confirm yacht package rates before import
5. **Use Consistent Naming** - Agent and yacht names should match exactly

## Support

For issues or questions, check:
- Browser console for detailed error messages
- This documentation for common solutions
- Contact your system administrator
