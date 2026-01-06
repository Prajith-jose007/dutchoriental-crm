# CSV Validation - Quick Reference Card

## 🚀 Quick Check: Is Your CSV Valid?

### Formula
```
Expected Total = (Package Costs) - (Agent Discount)
```

Must match `paid_amount` in CSV (±AED 0.01 tolerance)

---

## ✅ Validation Checklist

Before uploading CSV, verify:

- [ ] All agents exist in Agent Management
- [ ] All yachts exist in Yacht Management  
- [ ] Agent discount percentages are current
- [ ] Yacht package rates are up-to-date
- [ ] Decimal separator is `.` not `,`
- [ ] Column headers match expected format
- [ ] Tested with 5-10 sample rows first

---

## 📋 Required CSV Columns

| Column | Description | Example |
|--------|-------------|---------|
| `client_name` | Customer name | John Doe |
| `agent` | Agent ID or Name | AG-001 |
| `yacht` | Yacht ID or Name | YT-001 |
| `paid_amount` | Final amount paid | 850.00 |
| Package cols | ch, ad, vip_ad, etc. | 2, 4, 1 |

---

## 🎯 Quick Calculation Example

**Given:**
- Agent discount: 15%
- CHILD × 2 @ AED 100 = AED 200
- ADULT × 4 @ AED 150 = AED 600

**Calculate:**
```
Base:     200 + 600 = 800
Discount: 800 × 15% = 120
Expected: 800 - 120 = 680
```

**CSV must show:** `paid_amount: 680.00`

---

## 🔍 Reading Validation Results

### Console Messages

**✅ Valid:**
```
✅ [CSV Validation] Row 2 (John Doe): Payment validated successfully.
```

**❌ Invalid - Amount Mismatch:**
```
❌ Row 3: Payment mismatch: Expected 680.00 but CSV shows 800.00
```

**❌ Invalid - Agent Not Found:**
```
❌ Row 4: Agent "Unknown" not found in the system
```

---

## 🛠️ Quick Fixes

| Problem | Solution |
|---------|----------|
| "Agent not found" | Use exact agent name or ID from system |
| "Yacht not found" | Use exact yacht name or ID from system |
| "Payment mismatch" | Recalculate: (Base - Agent Discount) |
| All rows invalid | Check agent/yacht names match exactly |
| Decimal errors | Use `.` not `,` (e.g., `850.00` not `850,00`) |

---

## 📊 Package Column Names

| CSV Header | Package Name |
|------------|--------------|
| `ch` | CHILD |
| `ad` | ADULT |
| `vip_ad` | VIP ADULT |
| `chd_top` | CHILD TOP DECK |
| `adt_top` | ADULT TOP DECK |
| `ad_alc` | ADULT ALC |
| `basic` | BASIC |
| `std` | STANDARD |
| `prem` | PREMIUM |

---

## 🎓 Pro Tips

1. **Export first** - Export existing bookings to see correct format
2. **Agent IDs** - More reliable than agent names
3. **Console = Your Friend** - Always keep it open (F12)
4. **Test small** - Import 5 rows first, then scale up
5. **Pre-verify** - Check agents/yachts exist before importing

---

## 🔗 Full Documentation

- **Detailed Guide:** `/docs/CSV_VALIDATION_GUIDE.md`
- **Visual Flow:** `/docs/CSV_VALIDATION_FLOWCHART.md`
- **Full README:** `/docs/CSV_VALIDATION_README.md`
- **Sample CSV:** `/docs/sample_booking_import.csv`

---

## 🆘 Need Help?

1. Open browser console (F12)
2. Check validation messages
3. Review full documentation
4. Verify agents and yachts exist
5. Test with sample CSV file

---

**Remember:** Invalid rows are still imported, but flagged in notes. You can manually review and correct them after import.
