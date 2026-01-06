# Ticketing System CSV Import - Package Mapping Guide

## 📋 Overview

This guide shows how your ticketing system's package names are mapped to the booking system packages for validation and import.

---

## 🎯 Package Type Mappings

### 1. FOOD & SOFT DRINKS (Standard Packages)

**Your Ticketing System:**
- `FOOD & SOFT DRINKS` with Adult quantity
- `FOOD & SOFT DRINKS` with Child quantity

**Maps To:**
| Package Name | Quantity Column | → | Booking Package |
|--------------|----------------|---|-----------------|
| FOOD & SOFT DRINKS (Adult) | Adult or qty | → | **ADULT (AD)** |
| FOOD & SOFT DRINKS (Child) | Child or qty | → | **CHILD (CH)** |

**Example:**
```csv
Package: FOOD & SOFT DRINKS
Adult: 4
Child: 2
```
Imports as:
- ADULT: 4
- CHILD: 2

---

### 2. FOOD AND UNLIMITED ALCOHOLIC DRINKS

**Your Ticketing System:**
- `FOOD AND UNLIMITED ALCOHOLIC DRINKS`

**Maps To:**
| Package Name | → | Booking Package |
|--------------|---|-----------------|
| FOOD AND UNLIMITED ALCOHOLIC DRINKS | → | **ADULT ALC (AD ALC)** |
| UNLIMITED ALCOHOLIC DRINKS | → | **ADULT ALC (AD ALC)** |

**Example:**
```csv
Package: FOOD AND UNLIMITED ALCOHOLIC DRINKS
Quantity: 6
```
Imports as:
- ADULT ALC: 6

---

### 3. VIP SOFT

**Your Ticketing System:**
- `VIP SOFT` with Adult quantity
- `VIP SOFT` with Child quantity

**Maps To:**
| Package Name | Quantity Column | → | Booking Package |
|--------------|----------------|---|-----------------|
| VIP SOFT (Adult) | Adult or qty | → | **VIP ADULT (VIP AD)** |
| VIP SOFT (Child) | Child or qty | → | **VIP CHILD (VIP CH)** |

**Example:**
```csv
Package: VIP SOFT
Adult: 3
Child: 1
```
Imports as:
- VIP ADULT: 3
- VIP CHILD: 1

---

### 4. VIP PREMIUM ALCOHOLIC DRINKS

**Your Ticketing System:**
- `VIP PREMIUM ALCOHOLIC DRINKS`

**Maps To:**
| Package Name | → | Booking Package |
|--------------|---|-----------------|
| VIP PREMIUM ALCOHOLIC DRINKS | → | **VIP ALC (VIP ALC AD)** |

**Example:**
```csv
Package: VIP PREMIUM ALCOHOLIC DRINKS
Quantity: 2
```
Imports as:
- VIP ALC: 2

---

### 5. VIP UNLIMITED ALCOHOLIC DRINKS

**Your Ticketing System:**
- `VIP UNLIMITED ALCOHOLIC DRINKS`

**Maps To:**
| Package Name | → | Booking Package |
|--------------|---|-----------------|
| VIP UNLIMITED ALCOHOLIC DRINKS | → | **VIP ALC (VIP ALC AD)** |

**Example:**
```csv
Package: VIP UNLIMITED ALCOHOLIC DRINKS
Quantity: 4
```
Imports as:
- VIP ALC: 4

---

## 📊 Complete CSV Column Mapping

### Required Columns

| Your CSV Column | → | Booking Field | Used in Validation |
|-----------------|---|---------------|-------------------|
| **Company Name** | → | Agent | ✅ Yes (discount lookup) |
| **YachtName** | → | Yacht | ✅ Yes (rate lookup) |
| **Pax Name** | → | Client Name | |
| **Sales Amount(AED)** | → | Paid Amount | ✅ **Yes (compared with calculation)** |

### Package Quantity Columns

| Your CSV Column | → | Package Type |
|-----------------|---|--------------|
| Adult | → | ADULT (AD) or package-specific |
| Child | → | CHILD (CH) or package-specific |

### Additional Columns

| Your CSV Column | → | Booking Field |
|-----------------|---|---------------|
| ContactNo | → | Customer Phone |
| Travel Date | → | Event Date |
| TicketNumber | → | Transaction ID |
| Booking RefNO | → | Booking Reference |
| Sales Date | → | Created At |
| Scanned On | → | Check-in Time |
| Remarks | → | Notes |

### Ignored Columns

| Your CSV Column | Status |
|-----------------|--------|
| User | ❌ Ignored |
| Time | ❌ Ignored (can be merged with Travel Date if needed) |
| Order Id | ❌ Ignored |
| Transaction | ⚠️ Alternative to TicketNumber |

---

## 🔍 Validation Example with Package Types

### Example 1: FOOD & SOFT DRINKS

**CSV Data:**
```
Company Name: Super Charters Inc (10% discount)
YachtName: LOTUS MEGA YACHT
Package: FOOD & SOFT DRINKS
Adult: 4
Child: 2
Sales Amount(AED): 720.00
```

**System Process:**
```
1. Look up "Super Charters Inc" → 10% discount
2. Look up "LOTUS MEGA YACHT" packages:
   - ADULT: AED 150
   - CHILD: AED 100
3. Calculate base:
   - Adult: 4 × 150 = 600
   - Child: 2 × 100 = 200
   - Base Total: 800
4. Apply discount:
   - 800 × 10% = 80
   - Expected: 800 - 80 = 720
5. Compare: 720 (expected) vs 720 (CSV)
✅ VALID!
```

---

### Example 2: VIP SOFT

**CSV Data:**
```
Company Name: Premium Tours (15% discount)
YachtName: DHOW CRUISE
Package: VIP SOFT
Adult: 3
Child: 1
Sales Amount(AED): 850.00
```

**System Process:**
```
1. Look up "Premium Tours" → 15% discount
2. Look up "DHOW CRUISE" packages:
   - VIP ADULT: AED 250
   - VIP CHILD: AED 150
3. Calculate base:
   - VIP Adult: 3 × 250 = 750
   - VIP Child: 1 × 150 = 150
   - Base Total: 900
4. Apply discount:
   - 900 × 15% = 135
   - Expected: 900 - 135 = 765
5. Compare: 765 (expected) vs 850 (CSV)
❌ INVALID - Difference: 85
```

---

### Example 3: VIP UNLIMITED ALCOHOLIC DRINKS

**CSV Data:**
```
Company Name: Travel Pro Agency (20% discount)
YachtName: OCEAN DREAM
Package: VIP UNLIMITED ALCOHOLIC DRINKS
Quantity: 4
Sales Amount(AED): 800.00
```

**System Process:**
```
1. Look up "Travel Pro Agency" → 20% discount
2. Look up "OCEAN DREAM" packages:
   - VIP ALC: AED 250
3. Calculate base:
   - VIP ALC: 4 × 250 = 1000
4. Apply discount:
   - 1000 × 20% = 200
   - Expected: 1000 - 200 = 800
5. Compare: 800 (expected) vs 800 (CSV)
✅ VALID!
```

---

## 📁 Sample CSV Format

### Format 1: Separate Adult/Child Columns
```csv
Company Name,YachtName,Pax Name,Travel Date,Adult,Child,Sales Amount(AED),Remarks
Super Charters Inc,LOTUS,John Doe,15/01/2026,4,2,720.00,FOOD & SOFT DRINKS
Premium Tours,DHOW CRUISE,Jane Smith,20/01/2026,6,0,850.00,VIP SOFT
```

### Format 2: With Package Name Column (if your system exports it)
```csv
Company Name,YachtName,Pax Name,Package Type,Adult,Child,Sales Amount(AED)
Travel Pro,LOTUS,Mike,FOOD & SOFT DRINKS,4,2,720.00
Elite Tours,DHOW,Sarah,VIP UNLIMITED ALCOHOLIC DRINKS,4,0,800.00
```

---

## 🛠️ Column Header Variations Supported

The system recognizes multiple formats of the same column:

### Package Names (Case Insensitive, Normalized)
- `FOOD & SOFT DRINKS` or `food_&_soft_drinks` or `food_and_soft_drinks`
- `VIP SOFT` or `vip_soft`
- `VIP PREMIUM ALCOHOLIC DRINKS` or `vip_premium_alcoholic_drinks`
- `VIP UNLIMITED ALCOHOLIC DRINKS` or `vip_unlimited_alcoholic_drinks`

### Standard Columns
- `Company Name` or `company_name` or `companyname`
- `YachtName` or `yacht_name` or `yachtname`
- `Pax Name` or `pax_name` or `paxname`
- `Sales Amount(AED)` or `sales_amount` or `salesamount`

---

## ✅ Import Checklist

Before importing your ticketing system CSV:

- [ ] All company names exist as **Agents** in the system
- [ ] All yacht names exist as **Yachts** in the system
- [ ] Agent **discount percentages** are up-to-date
- [ ] Yacht **package rates** match your ticketing system
- [ ] Package names are correctly mapped above
- [ ] Sales amounts include agent discount applied
- [ ] Test with 5-10 sample rows first

---

## 🎯 Quick Reference Table

| Ticketing Package | Booking Package | Validation Field |
|-------------------|-----------------|------------------|
| FOOD & SOFT DRINKS (Adult) | ADULT (AD) | ✅ Validated |
| FOOD & SOFT DRINKS (Child) | CHILD (CH) | ✅ Validated |
| FOOD AND UNLIMITED ALCOHOLIC DRINKS | ADULT ALC (AD ALC) | ✅ Validated |
| VIP SOFT (Adult) | VIP ADULT (VIP AD) | ✅ Validated |
| VIP SOFT (Child) | VIP CHILD (VIP CH) | ✅ Validated |
| VIP PREMIUM ALCOHOLIC DRINKS | VIP ALC (VIP ALC AD) | ✅ Validated |
| VIP UNLIMITED ALCOHOLIC DRINKS | VIP ALC (VIP ALC AD) | ✅ Validated |

---

## 📞 Support

If package types aren't mapping correctly:
1. Check the exact column name in your CSV
2. Verify it matches one of the supported variations
3. Check console logs for "Unknown header" warnings
4. Contact support with your CSV column names

---

**Ready to Import!** 🚀

Your ticketing system CSV will now import correctly with full validation of agent discounts and package costs.
