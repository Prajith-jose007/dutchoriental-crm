
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    try {
        const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, paymentConfirmationStatus, transactionId, bookingRefNo, modeOfPayment,
        package_quantities_json, freeGuestCount, perTicketRate, perTicketRateReason,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId, free_guest_details_json,
        customerPhone, customerEmail, nationality, language, source, customAgentName, customAgentPhone, inquiryDate, yachtType, adultsCount, kidsCount, noShowCount,
        durationHours, budgetRange, occasion, priority, nextFollowUpDate, closingProbability,
        captainName, crewDetails, idVerified, extraHoursUsed, extraCharges, customerSignatureUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = Array(51).fill(null);
        params[0] = "TEST-" + Date.now();
        params[1] = "Test Client";
        params[2] = "DIRECT";
        params[3] = "Lotus";
        params[4] = "Confirmed";
        params[5] = "2026-03-10 12:00:00";
        params[22] = "2026-03-10 12:00:00"; // createdAt
        params[23] = "2026-03-10 12:00:00"; // updatedAt
        params[24] = "admin";
        params[25] = "admin";

        // 33rd column is customAgentName (1-indexed)
        // 0:id, 1:clientName, ... 32:customAgentName
        params[32] = "Test Custom Agent";

        params[16] = 0; // totalAmount
        params[19] = 0; // netAmount
        params[20] = 0; // paidAmount
        params[21] = 0; // balanceAmount

        console.log("Running execute...");
        await connection.execute(sql, params);
        console.log("Execute successful!");

        // Cleanup
        await connection.query("DELETE FROM leads WHERE id LIKE 'TEST-%'");
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await connection.end();
    }
}

test();
