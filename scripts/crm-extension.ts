
// scripts/crm-extension.ts
import { query, closePool } from '../src/lib/db';
import 'dotenv/config';

async function addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string) {
  try {
    const checkColumnSql = `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?;
    `;
    const results: any[] = await query(checkColumnSql, [tableName, columnName]);
    if (results && results.length > 0 && results[0].count === 0) {
      const alterTableSql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`;
      await query(alterTableSql);
      console.log(`Column ${columnName} added to table ${tableName}.`);
    }
  } catch (error) {
    console.error(`Error adding column ${columnName} to ${tableName}:`, (error as Error).message);
  }
}

async function runExtension() {
  console.log('Starting CRM Structure Extension...');

  // 1. Extend Leads Table
  const leadsTable = 'leads';
  await addColumnIfNotExists(leadsTable, 'customerPhone', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'customerEmail', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'nationality', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'language', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'source', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'inquiryDate', 'DATETIME');
  await addColumnIfNotExists(leadsTable, 'yachtType', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'adultsCount', 'INT DEFAULT 0');
  await addColumnIfNotExists(leadsTable, 'kidsCount', 'INT DEFAULT 0');
  await addColumnIfNotExists(leadsTable, 'durationHours', 'DECIMAL(5,2)');
  await addColumnIfNotExists(leadsTable, 'budgetRange', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'occasion', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'priority', 'VARCHAR(50)');
  await addColumnIfNotExists(leadsTable, 'nextFollowUpDate', 'DATETIME');
  await addColumnIfNotExists(leadsTable, 'closingProbability', 'INT DEFAULT 0');

  // Operations fields
  await addColumnIfNotExists(leadsTable, 'captainName', 'VARCHAR(255)');
  await addColumnIfNotExists(leadsTable, 'crewDetails', 'TEXT');
  await addColumnIfNotExists(leadsTable, 'idVerified', 'BOOLEAN DEFAULT FALSE');
  await addColumnIfNotExists(leadsTable, 'extraHoursUsed', 'DECIMAL(5,2) DEFAULT 0');
  await addColumnIfNotExists(leadsTable, 'extraCharges', 'DECIMAL(10,2) DEFAULT 0');
  await addColumnIfNotExists(leadsTable, 'customerSignatureUrl', 'TEXT');

  // 2. Create Customers Table
  await query(`
    CREATE TABLE IF NOT EXISTS \`customers\` (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`fullName\` VARCHAR(255) NOT NULL,
      \`phone\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(255) NOT NULL,
      \`nationality\` VARCHAR(255),
      \`language\` VARCHAR(50),
      \`totalBookings\` INT DEFAULT 0,
      \`totalRevenue\` DECIMAL(15,2) DEFAULT 0,
      \`lastBookingDate\` DATETIME,
      \`customerType\` VARCHAR(50) DEFAULT 'New',
      \`preferences\` TEXT,
      \`notes\` TEXT,
      \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Table customers checked/created.');

  // 3. Create Quotations Table
  await query(`
    CREATE TABLE IF NOT EXISTS \`quotations\` (
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
      \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Table quotations checked/created.');

  // 4. Create Tasks Table
  await query(`
    CREATE TABLE IF NOT EXISTS \`tasks\` (
       \`id\` VARCHAR(191) PRIMARY KEY,
       \`leadId\` VARCHAR(191),
       \`bookingId\` VARCHAR(191),
       \`opportunityId\` VARCHAR(191),
       \`type\` VARCHAR(50),
       \`dueDate\` DATETIME,
       \`assignedTo\` VARCHAR(191),
       \`status\` VARCHAR(50) DEFAULT 'Pending',
       \`notes\` TEXT,
       \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await addColumnIfNotExists('tasks', 'opportunityId', 'VARCHAR(191)');
  console.log('Table tasks checked/updated.');

  // 5. Create Opportunities Table
  await query(`
    CREATE TABLE IF NOT EXISTS \`opportunities\` (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`potentialCustomer\` VARCHAR(255) NOT NULL,
      \`subject\` VARCHAR(255) NOT NULL,
      \`estimatedClosingDate\` DATETIME NOT NULL,
      \`ownerUserId\` VARCHAR(191) NOT NULL,
      \`yachtId\` VARCHAR(191) NOT NULL,
      \`productType\` VARCHAR(100) NOT NULL,
      \`pipelinePhase\` VARCHAR(100) NOT NULL,
      \`priority\` VARCHAR(50) NOT NULL,
      \`estimatedRevenue\` DECIMAL(15,2) DEFAULT 0,
      \`closingProbability\` INT DEFAULT 50,
      \`meanExpectedValue\` DECIMAL(15,2) DEFAULT 0,
      \`currentStatus\` VARCHAR(50) NOT NULL,
      \`followUpUpdates\` TEXT,
      \`location\` VARCHAR(255),
      \`reportType\` VARCHAR(50),
      \`tripReportStatus\` VARCHAR(50),
      \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Table opportunities checked/created.');

  // 6. Extend Yachts Table
  const yachtsTable = 'yachts';
  await addColumnIfNotExists(yachtsTable, 'category', 'VARCHAR(255)');
  await addColumnIfNotExists(yachtsTable, 'amenities_json', 'TEXT');
  await addColumnIfNotExists(yachtsTable, 'location', 'VARCHAR(255)');
  await addColumnIfNotExists(yachtsTable, 'minHours', 'INT DEFAULT 1');
  await addColumnIfNotExists(yachtsTable, 'pricePerHour', 'DECIMAL(10,2)');
  await addColumnIfNotExists(yachtsTable, 'cabinsCount', 'INT DEFAULT 0');
  await addColumnIfNotExists(yachtsTable, 'crewCount', 'INT DEFAULT 0');

  console.log('CRM Structure Extension Completed Successfully.');
  await closePool();
}

runExtension().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
