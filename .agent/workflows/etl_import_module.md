---
description: ETL/Import Module Documentation and Implementation Plan
---

# ETL/Import Module for Booking System

This module handles the ingestion of two distinct CSV/Excel file formats ("Booking" and "Master") into the live bookings database. It includes data normalization, package inference, and upsert logic to prevent duplicates.

## 1. Mapping Document

### Input A (Booking File) Mapping
| Source Column | Destination Field | Transformation / Logic |
| :--- | :--- | :--- |
| `Company Name` | `agent` | Map to Agent Name. Fallback: Direct lookup. |
| `TicketNumber` | `transactionId` | Primary Key candidate. |
| `Booking RefNO` | `bookingRefNo` | Primary Key candidate. |
| `Transaction` | `modeOfPayment` | Normalize to 'CARD', 'CASH', etc. |
| `YachtName` | `yacht` | Map to Yacht Name (e.g., 'Lotus Royale'). |
| `Pax Name` | `clientName` | Client Name. |
| `Travel Date` | `month` | ISO Date (YYYY-MM-DD). |
| `Sales Amount(AED)` | `totalAmount` | Decimal currency. Used if Master data missing. |
| `Adult` | `pkg_adult` (derived) | Quantity for Adult package. |
| `Child` | `pkg_child` (derived) | Quantity for Child package. |

### Input B (Master File) Mapping
| Source Column | Destination Field | Transformation / Logic |
| :--- | :--- | :--- |
| `STATUS` | `status` | Map to 'Confirmed', 'Cancelled', etc. |
| `MONTH` / `DATE` | `month` | Combine/Parse to ISO Date. |
| `EVENT` | `yacht` | Map valid yacht names. |
| `Agent` | `agent` | Agent Name. |
| `TYPE` | `type` | 'Dinner Cruise', 'Private', etc. |
| `INV` | `bookingRefNo` / `transactionId` | Used for ID matching. |
| `CLIENT` | `clientName` | Client Name. |
| `DHOW ...` (various) | `packageQuantities` | Map specific columns to package counts (e.g. `DHOW CHILD` -> `pkg_child` on 'Al Mansour'). |
| `OE ...` (various) | `packageQuantities` | Map to 'Ocean Empress' packages. |
| `LOTUS ...` (various) | `packageQuantities` | Map to 'Lotus Royale' packages. |
| `VIP ...` / `Royale ...`| `packageQuantities` | Map to High-Tier packages. |
| `OTHERS AMT (Cake)` | `perTicketRate` / Addon | Mapped to Addon/Misc charges. |
| `TOTAL` | `totalAmount` | Priority over Input A. |
| `NET` | `netAmount` | Priority over Input A. |
| `PAID` | `paidAmount` | Priority over Input A. |
| `BALANCE` | `balanceAmount` | Priority over Input A. |
| `Remarks` | `notes` | Append to notes. |

## 2. Implementation Plan

1.  **Data Ingestion**:
    -   Implement `load_input_a(fileContent)` and `load_input_b(fileContent)` to parse raw CSV data.
    -   Utilize existing `csvHelpers.ts` logic for header normalization.

2.  **Transformation (`transform_row`)**:
    -   Normalize Dates: Convert all date strings to ISO-8601.
    -   Normalize Numbers: Strip currency symbols, commas, handle decimals.
    -   **Package Inference**:
        -   If Master columns (`DHOW CHILD`, etc.) are present, strictly use them.
        -   If Master is missing, fallback to `Adult`/`Child` columns from Input A.
        -   Map specific Master headers to internal `pkg_` keys (e.g., `LOTUS DRINKS` -> `pkg_adult_alc`).

3.  **Upsert Logic (`upsert_to_db`)**:
    -   Identify unique record by `bookingRefNo` OR `transactionId`.
    -   If record exists: Update fields (giving precedence to Master file for Financials).
    -   If new: Insert record.

4.  **Database / API**:
    -   Use the existing `/api/leads` endpoints.
    -   For "Module" requirement, create a standalone TypeScript library file `src/lib/etl-module.ts` that encapsulates this logic.

## 3. Database Schema (DDL Recommendation)

Existing strict SQL schema or `Lead` interface types:

```sql
CREATE TABLE bookings (
    id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50),
    event_date DATETIME, -- 'month' field
    yacht_id VARCHAR(255),
    agent_id VARCHAR(255),
    client_name VARCHAR(255),
    booking_ref_no VARCHAR(255) UNIQUE,
    transaction_id VARCHAR(255) UNIQUE,
    mode_of_payment VARCHAR(50),
    total_amount DECIMAL(10,2),
    net_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    balance_amount DECIMAL(10,2),
    notes TEXT,
    -- JSON or normalized relation for packages
    package_details JSON, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

For the current NoSQL/JSON-based setup in the code, we continue using the `Lead` interface.

