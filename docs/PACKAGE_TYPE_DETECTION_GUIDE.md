# Package Type Detection - Quick Reference

## 🎯 How Adult/Child Columns Are Mapped

The system **intelligently detects** the package type from your YachtName column and automatically maps Adult/Child quantities to the correct package types.

---

## 📊 Mapping Rules

### 1. VIP SOFT Packages
**Yacht Name Contains:** `"VIP"` AND `"SOFT"`

| CSV Columns | → | Booking Packages |
|-------------|---|------------------|
| Adult: 3 | → | **VIP ADULT: 3** |
| Child: 1 | → | **VIP CHILD: 1** |

- `LOTUS ROYALE - VIP SOFT`

---

### 2. VIP PREMIUM/UNLIMITED ALCOHOLIC
**Yacht Name Contains:** `"VIP"` AND (`"PREMIUM"` OR `"UNLIMITED"`) AND `"ALCOHOLIC"`

| CSV Columns | → | Booking Packages |
|-------------|---|------------------|
| Adult: 4 | → | **VIP ALC: 4** |
| Child: 0 | → | *(ignored)* |

**Examples:**
- `LOTUS ROYALE - VIP PREMIUM ALCOHOLIC DRINKS`

---

### 3. FOOD AND UNLIMITED ALCOHOLIC DRINKS
**Yacht Name Contains:** `"UNLIMITED"` AND `"ALCOHOLIC"` (but NOT `"VIP"`)

| CSV Columns | → | Booking Packages |
|-------------|---|------------------|
| Adult: 6 | → | **ADULT ALC: 6** |
| Child: 0 | → | *(ignored)* |

**Examples:**
- `LOTUS ROYALE - FOOD AND UNLIMITED ALCOHOLIC DRINKS`

---

### 4. FOOD & SOFT DRINKS (Standard)
**Yacht Name Contains:** `"FOOD"` OR `"SOFT"` (but NOT `"VIP"` or `"UNLIMITED ALCOHOLIC"`)

| CSV Columns | → | Booking Packages |
|-------------|---|------------------|
| Adult: 4 | → | **ADULT: 4** |
| Child: 2 | → | **CHILD: 2** |

**Examples:**
- `LOTUS ROYALE - FOOD AND SOFT DRINKS`
- `AL MANSOUR DINNER - SOFT DRINKS`

---

## 🔍 Detection Process

**Your CSV Row:**
```csv
YachtName: LOTUS ROYALE - VIP SOFT
Adult: 3
Child: 1
```

**System Process:**
```
1. Parse yacht name: "LOTUS ROYALE - VIP SOFT"
2. Extract package type: "VIP SOFT"
3. Detect keywords: "VIP" + "SOFT"
4. Match rule: VIP SOFT packages
5. Remap quantities:
   Adult (3) → VIP ADULT (3)
   Child (1) → VIP CHILD (1)
```

**Result in Console:**
```
[CSV Import] Detected package type from yacht: "VIP SOFT" (Adult: 3, Child: 1)
[CSV Import] Remapped to VIP SOFT: VIP ADULT=3, VIP CHILD=1
```

---

## ✅ Complete Examples

### Example 1: VIP SOFT with Children

**CSV:**
```csv
Company Name: Premium Tours
YachtName: LOTUS ROYALE - VIP SOFT  
Adult: 3
Child: 1
Sales Amount(AED): 900.00
```

**Imported As:**
- Yacht: LOTUS ROYALE
- VIP ADULT: 3
- VIP CHILD: 1
- Validation: 900.00

---

### Example 2: VIP UNLIMITED ALCOHOLIC

**CSV:**
```csv
Company Name: Elite Tours
YachtName: LOTUS ROYALE - VIP UNLIMITED ALCOHOLIC DRINKS
Adult: 4
Child: 0
Sales Amount(AED): 800.00
```

**Imported As:**
- Yacht: LOTUS ROYALE
- VIP ALC: 4
- Validation: 800.00

---

### Example 3: Standard FOOD & SOFT DRINKS

**CSV:**
```csv
Company Name: Super Charters
YachtName: LOTUS ROYALE - FOOD AND SOFT DRINKS
Adult: 4
Child: 2
Sales Amount(AED): 720.00
```

**Imported As:**
- Yacht: LOTUS ROYALE
- ADULT: 4
- CHILD: 2
- Validation: 720.00

---

### Example 4: FOOD AND UNLIMITED ALCOHOLIC

**CSV:**
```csv
Company Name: Travel Pro
YachtName: LOTUS ROYALE - FOOD AND UNLIMITED ALCOHOLIC DRINKS
Adult: 6
Child: 0
Sales Amount(AED): 1080.00
```

**Imported As:**
- Yacht: LOTUS ROYALE
- ADULT ALC: 6
- Validation: 1080.00

---

## 🎓 Console Logging

The system logs every package type detection:

**VIP SOFT:**
```
[CSV Import] Detected package type from yacht: "VIP SOFT" (Adult: 3, Child: 1)
[CSV Import] Remapped to VIP SOFT: VIP ADULT=3, VIP CHILD=1
```

**VIP PREMIUM ALCOHOLIC:**
```
[CSV Import] Detected package type from yacht: "VIP PREMIUM ALCOHOLIC DRINKS" (Adult: 4, Child: 0)
[CSV Import] Remapped to VIP ALCOHOLIC: VIP ALC=4
```

**Standard FOOD & SOFT DRINKS:**
```
[CSV Import] Detected package type from yacht: "FOOD AND SOFT DRINKS" (Adult: 4, Child: 2)
[CSV Import] Keeping as standard: ADULT=4, CHILD=2
```

---

## 🛠️ Decision Tree

```
Is yacht name format "YACHT - PACKAGE"?
│
├─ YES → Extract package type
│        │
│        ├─ Contains "VIP" + "SOFT"?
│        │  └─ YES → VIP ADULT + VIP CHILD ✅
│        │
│        ├─ Contains "VIP" + ("PREMIUM" or "UNLIMITED") + "ALCOHOLIC"?
│        │  └─ YES → VIP ALC ✅
│        │
│        ├─ Contains "UNLIMITED" + "ALCOHOLIC" (not VIP)?
│        │  └─ YES → ADULT ALC ✅
│        │
│        └─ Contains "FOOD" or "SOFT"?
│           └─ YES → ADULT + CHILD ✅
│
└─ NO → Use standard ADULT + CHILD ✅
```

---

## ⚠️ Important Notes

1. **Adult/Child columns** work differently based on package type
2. **VIP packages** automatically use VIP ADULT/CHILD rates
3. **Alcoholic packages** only use Adult quantity (Child is ignored)
4. **Package type** is detected from the yacht name, not a separate column
5. **Validation** uses the correct package rates for each type

---

## 🎯 Summary

**Your CSV format:**
```
YachtName = "YACHT NAME - PACKAGE TYPE"
Adult = number
Child = number
```

**System automatically:**
1. ✅ Extracts package type from yacht name
2. ✅ Maps Adult/Child to correct package fields
3. ✅ Uses correct rates for validation
4. ✅ Logs the detection process

**No manual mapping needed!** Just export from your ticketing system and import. 🚀
