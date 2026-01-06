
import { query, closePool } from '../src/lib/db';
import 'dotenv/config';

async function runPcMigration() {
    console.log('Starting Private Charter Module Database Migration...');

    try {
        // 1. pc_agents
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_agents\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(100),
        \`phone\` VARCHAR(50),
        \`email\` VARCHAR(255),
        \`commissionPercentage\` DECIMAL(5,2) DEFAULT 0,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_agents created.');

        // 2. pc_partners
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_partners\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`companyName\` VARCHAR(255) NOT NULL,
        \`contactPerson\` VARCHAR(255),
        \`phone\` VARCHAR(50),
        \`email\` VARCHAR(255),
        \`commissionRate\` DECIMAL(5,2) DEFAULT 0,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_partners created.');

        // 3. pc_yachts
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_yachts\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100),
        \`capacity\` INT DEFAULT 0,
        \`cabinsCount\` INT DEFAULT 0,
        \`crewCount\` INT DEFAULT 0,
        \`location\` VARCHAR(255),
        \`pricePerHour\` DECIMAL(10,2) DEFAULT 0,
        \`minHours\` INT DEFAULT 1,
        \`images_json\` TEXT,
        \`amenities_json\` TEXT,
        \`status\` VARCHAR(50) DEFAULT 'Available',
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_yachts created.');

        // 4. pc_customers
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_customers\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`firstName\` VARCHAR(100),
        \`lastName\` VARCHAR(100),
        \`phone\` VARCHAR(50),
        \`email\` VARCHAR(255),
        \`nationality\` VARCHAR(100),
        \`language\` VARCHAR(100),
        \`totalBookings\` INT DEFAULT 0,
        \`totalRevenue\` DECIMAL(15,2) DEFAULT 0,
        \`lastBookingDate\` DATETIME,
        \`type\` VARCHAR(50) DEFAULT 'New',
        \`preferences_json\` TEXT,
        \`notes\` TEXT,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_customers created.');

        // 5. pc_leads
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_leads\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`firstName\` VARCHAR(100),
        \`lastName\` VARCHAR(100),
        \`phone\` VARCHAR(50),
        \`email\` VARCHAR(255),
        \`nationality\` VARCHAR(100),
        \`language\` VARCHAR(100),
        \`source\` VARCHAR(100),
        \`inquiryDate\` DATETIME,
        \`yachtType\` VARCHAR(100),
        \`adultsCount\` INT DEFAULT 0,
        \`kidsCount\` INT DEFAULT 0,
        \`durationHours\` DECIMAL(5,2) DEFAULT 0,
        \`preferredDate\` DATETIME,
        \`budgetRange\` VARCHAR(100),
        \`occasion\` VARCHAR(100),
        \`assignedAgentId\` VARCHAR(191),
        \`status\` VARCHAR(50) DEFAULT 'New',
        \`priority\` VARCHAR(50) DEFAULT 'Medium',
        \`nextFollowUpDate\` DATETIME,
        \`notes\` TEXT,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_leads created.');

        // 6. pc_quotations
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_quotations\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`leadId\` VARCHAR(191),
        \`yachtId\` VARCHAR(191),
        \`basePricePerHour\` DECIMAL(10,2),
        \`durationHours\` DECIMAL(5,2),
        \`subtotal\` DECIMAL(10,2),
        \`addons_json\` TEXT,
        \`discountAmount\` DECIMAL(10,2) DEFAULT 0,
        \`vatAmount\` DECIMAL(10,2) DEFAULT 0,
        \`totalAmount\` DECIMAL(10,2),
        \`status\` VARCHAR(50) DEFAULT 'Draft',
        \`validUntil\` DATETIME,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_quotations created.');

        // 7. pc_bookings
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_bookings\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`leadId\` VARCHAR(191),
        \`customerId\` VARCHAR(191),
        \`yachtId\` VARCHAR(191),
        \`tripDate\` DATE,
        \`startTime\` TIME,
        \`endTime\` TIME,
        \`totalHours\` DECIMAL(5,2),
        \`location\` VARCHAR(255),
        \`guestsCount\` INT DEFAULT 0,
        \`status\` VARCHAR(50) DEFAULT 'Tentative',
        \`captainName\` VARCHAR(255),
        \`crewDetails\` TEXT,
        \`idVerified\` BOOLEAN DEFAULT FALSE,
        \`checkInTime\` DATETIME,
        \`extraHoursUsed\` DECIMAL(5,2) DEFAULT 0,
        \`extraCharges\` DECIMAL(10,2) DEFAULT 0,
        \`customerSignature\` TEXT,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_bookings created.');

        // 8. pc_payments
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_payments\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`bookingId\` VARCHAR(191),
        \`invoiceNumber\` VARCHAR(100),
        \`totalAmount\` DECIMAL(15,2),
        \`paidAmount\` DECIMAL(15,2) DEFAULT 0,
        \`balanceAmount\` DECIMAL(15,2),
        \`paymentMethod\` VARCHAR(50),
        \`transactionId\` VARCHAR(100),
        \`status\` VARCHAR(50) DEFAULT 'Pending',
        \`paymentDate\` DATETIME,
        \`refundAmount\` DECIMAL(15,2) DEFAULT 0,
        \`vatInvoicePdfUrl\` TEXT,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_payments created.');

        // 9. pc_tasks
        await query(`
      CREATE TABLE IF NOT EXISTS \`pc_tasks\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`leadId\` VARCHAR(191),
        \`bookingId\` VARCHAR(191),
        \`type\` VARCHAR(50),
        \`dueDate\` DATETIME,
        \`assignedTo\` VARCHAR(191),
        \`status\` VARCHAR(50) DEFAULT 'Pending',
        \`notes\` TEXT,
        \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Table pc_tasks created.');

        console.log('Private Charter Database Migration Completed Successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closePool();
    }
}

runPcMigration();
