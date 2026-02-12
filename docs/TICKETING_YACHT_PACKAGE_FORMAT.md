# Ticketing System - Combined Yacht-Package Format Guide

## 📋 Overview

Your ticketing system exports the `YachtName` column in a special combined format:

```
YACHT NAME - PACKAGE TYPE
```

**Examples:**
- `LOTUS ROYALE - FOOD AND SOFT DRINKS`
- `AL MANSOUR DINNER - SOFT DRINKS`

The system automatically **parses** this format to extract:
1. **Yacht Name** (e.g., `LOTUS ROYALE`)
2. **Package Type** (e.g., `FOOD AND SOFT DRINKS`)

---

## 🎯 How It Works

### Step 1: Parsing the Combined Format

When the CSV contains:
```csv
YachtName: LOTUS ROYALE - FOOD AND SOFT DRINKS
```

The system automatically splits it:
- **Yacht**: `LOTUS ROYALE`
- **Package Info**: `FOOD AND SOFT DRINKS` (informational)

### Step 2: Matching Yacht in Database

The system looks up `LOTUS ROYALE` in your yachts database and retrieves:
- Yacht ID
- Package rates (ADULT, CHILD, VIP ADULT, etc.)

### Step 3: Using Adult/Child Quantities

The `Adult` and `Child` columns in your CSV specify quantities:
```csv
YachtName: LOTUS ROYALE - FOOD AND SOFT DRINKS
Adult: 4
Child: 2
```

This maps to:
- **ADULT package**: Quantity 4
- **CHILD package**: Quantity 2

---

## 📊 Complete Examples

### Example 1: Standard FOOD & SOFT DRINKS

**Your CSV:**
```csv
Company Name,YachtName,Adult,Child,Sales Amount(AED)
Super Charters,LOTUS ROYALE - FOOD AND SOFT DRINKS,4,2,720.00
```

**System Process:**
1. Parse: Yacht = `LOTUS ROYALE`, Package info = `FOOD AND SOFT DRINKS`
2. Look up `LOTUS ROYALE` yacht
3. Get rates:
   - ADULT: AED 150
   - CHILD: AED 100
4. Calculate:
   - Base: (4 × 150) + (2 × 100) = 800
   - Discount (10%): 80
   - Expected: 720
5. Compare with CSV Sales Amount: 720
6. ✅ VALID

---

---

### Example 3: VIP PACKAGES

**Your CSV:**
```csv
Company Name,YachtName,Adult,Child,Sales Amount(AED)
Elite Tours,LOTUS ROYALE - VIP SOFT,3,1,900.00
```

**System Process:**
1. Parse: Yacht = `LOTUS ROYALE`, Package = `VIP SOFT`
2. Look up `LOTUS ROYALE` yacht
3. Get VIP rates:
   - VIP ADULT: AED 250
   - VIP CHILD: AED 150
4. Calculate:
   - Base: (3 × 250) + (1 × 150) = 900
   - Discount (10%): 90
   - Expected: 810
5. Compare with CSV: 900
6. ❌ INVALID - Discount not applied

---

### Example 4: ALCOHOLIC PACKAGES

**Your CSV:**
```csv
Company Name,YachtName,Adult,Child,Sales Amount(AED)
Travel Pro,LOTUS ROYALE - FOOD AND UNLIMITED ALCOHOLIC DRINKS,4,0,800.00
```

**System Process:**
1. Parse: Yacht = `LOTUS ROYALE`, Package = `UNLIMITED ALCOHOLIC`
2. Look up `LOTUS ROYALE` yacht
3. Get ADULT ALC rate: AED 250
4. Calculate:
   - Base: 4 × 250 = 1000
   - Discount (20%): 200
   - Expected: 800
5. Compare with CSV: 800
6. ✅ VALID

---

## 🔍 Yacht Name Variations

Your ticketing system uses these yacht names:

| CSV Yacht Name | Full Name | Mapping |
|----------------|-----------|---------|
| LOTUS ROYALE | LOTUS ROYALE | Direct match |
| AL MANSOUR DINNER | AL MANSOUR DHOW | Maps to AL MANSOUR |

The system automatically finds the correct yacht even if names are abbreviated.

---

## 📁 Package Types Recognized

From your CSV data, these package types are recognized:

| Package Type in CSV | Maps To | Uses Columns |
|---------------------|---------|--------------|
| FOOD & SOFT DRINKS | ADULT + CHILD | Adult, Child |
| FOOD AND SOFT DRINKS | ADULT + CHILD | Adult, Child |
| FOOD AND UNLIMITED ALCOHOLIC DRINKS | ADULT ALC | Adult |
| SOFT DRINKS | ADULT + CHILD | Adult, Child |
| VIP SOFT | VIP ADULT + VIP CHILD | Adult, Child |
| VIP PREMIUM ALCOHOLIC DRINKS | VIP ALC | Adult |
| VIP UNLIMITED ALCOHOLIC DRINKS | VIP ALC | Adult |

---

## ✅ CSV Format Requirements

### Required Columns

| Column | Format | Example |
|--------|--------|---------|
| **Company Name** | Agent name | Super Charters Inc |
| **YachtName** | `YACHT - PACKAGE` | LOTUS ROYALE - FOOD AND SOFT DRINKS |
| **Adult** | Number | 4 |
| **Child** | Number (0 if none) | 2 |
| **Sales Amount(AED)** | Decimal | 720.00 |

### Optional Columns

| Column | Purpose |
|--------|---------|
| Pax Name | Client name |
| ContactNo | Phone number |
| Travel Date | Booking date |
| Remarks | Notes |
| Scanned On | Check-in time |

---

## 🎯 Validation Process

### What Gets Validated

1. ✅ **Company Name** → Agent exists and has discount
2. ✅ **Yacht Name** → Extracted from combined format
3. ✅ **Package Rates** → Retrieved from yacht's packages
4. ✅ **Calculation** → (Qty × Rate) - Agent Discount
5. ✅ **Comparison** → Expected vs Sales Amount

### Console Output Examples

**Valid Entry:**
```
[CSV Import] Parsed yacht from ticketing format: 
"LOTUS ROYALE - FOOD AND SOFT DRINKS" → Yacht: "LOTUS ROYALE"

✅ [CSV Validation] Row 2 (John Doe): Payment validated successfully.
Expected: 720.00, CSV: 720.00, Agent Discount: 10%
```

```

---

## 🛠️ Troubleshooting

### Problem: Yacht Not Found

**Error:**
```
❌ Yacht "LOTUS ROYALE" not found in the system
```

**Solutions:**
1. Check yacht exists in Yacht Management
2. Verify exact name match (case doesn't matter)
3. Check for typos in yacht name
4. Consider yacht name abbreviation mappings

### Problem: Wrong Package Rates

**Error:**
```
❌ Payment mismatch: Expected 800.00 but CSV shows 720.00
```

**Check:**
1. Yacht package rates are current
2. Package type is correctly identified
3. Adult/Child quantities are correct
4. Agent discount percentage is current

### Problem: Package Type Not Recognized

**Warning:**
```
⚠️ Package type "UNKNOWN PACKAGE" not mapped
```

**Solution:**
Contact support to add mapping for new package types

---

## 📋 Pre-Import Checklist

Before importing your ticketing system CSV:

- [ ] All company names (agents) exist in system
- [ ] All yacht names exist (even abbreviated versions)
- [ ] Agent discounts are up-to-date
- [ ] Yacht package rates match ticketing system
- [ ] Test with 5-10 sample rows first
- [ ] Browser console open (F12) to see results

---

## 🎓 Best Practices

1. **Export Regularly**: Keep ticketing data synced
2. **Verify Agents**: Ensure all company names are registered as agents
3. **Update Rates**: Keep yacht package rates current
4. **Check Console**: Always review validation messages
5. **Small Batches**: Test with small files first
6. **Fix Mismatches**: Address validation errors promptly

---

## 📞 Support

For issues with yacht-package parsing:
1. Check console logs for "Parsed yacht from ticketing format"
2. Verify the exact yacht name extracted
3. Confirm yacht exists in Yacht Management
4. Check package quantities (Adult/Child columns)
5. Review validation error messages

---

**The system is ready to handle your ticketing exports!** 🚀

Just upload your CSV and the yacht-package format will be automatically parsed and validated.
