
// scripts/migrate-data.ts
import { query, closePool } from '../src/lib/db'; // Adjusted path
import {
  placeholderUsers,
  placeholderAgents,
  placeholderYachts,
  placeholderLeads,
  placeholderInvoices,
  placeholderOpportunities,
} from '../src/lib/placeholder-data'; // Adjusted path
import type { Agent, Lead, Yacht, Invoice, User, YachtPackageItem, LeadPackageQuantity, Opportunity } from '../src/lib/types';
import { formatISO, parseISO, isValid, format } from 'date-fns';
import { hash } from 'bcryptjs';
import 'dotenv/config'; // Ensures .env.local is loaded

const MYSQL_TABLE_NAMES = {
  users: 'users',
  agents: 'agents',
  yachts: 'yachts',
  leads: 'leads',
  invoices: 'invoices',
  opportunities: 'opportunities',
};

// --- Helper function to add column if it doesn't exist ---
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
    // The result from mysql2 is an array of rows. Access the first row.
    if (results && results.length > 0 && results[0].count === 0) {
      const alterTableSql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`;
      await query(alterTableSql);
      console.log(`Column ${columnName} added to table ${tableName} successfully.`);
    } else {
      console.log(`Column ${columnName} already exists in table ${tableName}.`);
    }
  } catch (error) {
    console.error(`Error adding column ${columnName} to table ${tableName}:`, (error as Error).message);
    // Don't re-throw here to allow migration to continue if column addition fails but table creation might succeed
  }
}


// --- Table Creation Functions ---
async function createUsersTable() {
  const tableName = MYSQL_TABLE_NAMES.users;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`email\` VARCHAR(191) NOT NULL UNIQUE,
      \`designation\` VARCHAR(255),
      \`avatarUrl\` VARCHAR(255),
      \`websiteUrl\` VARCHAR(255),
      \`status\` VARCHAR(50),
      \`password\` VARCHAR(255)
    );
  `;
  try {
    await query(createTableSql);
    console.log(`Table ${tableName} checked/created successfully.`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, (error as Error).message);
    throw error;
  }
}

async function createAgentsTable() {
  const tableName = MYSQL_TABLE_NAMES.agents;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`agency_code\` VARCHAR(255),
      \`address\` TEXT,
      \`phone_no\` VARCHAR(255),
      \`email\` VARCHAR(191) NOT NULL,
      \`status\` VARCHAR(50),
      \`TRN_number\` VARCHAR(255),
      \`customer_type_id\` VARCHAR(255),
      \`discount\` DECIMAL(5, 2) DEFAULT 0.00,
      \`websiteUrl\` VARCHAR(255)
    );
  `;
  try {
    await query(createTableSql);
    console.log(`Table ${tableName} checked/created successfully.`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, (error as Error).message);
    throw error;
  }
}

async function createYachtsTable() {
  const tableName = MYSQL_TABLE_NAMES.yachts;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`name\` VARCHAR(255) NOT NULL,
      \`imageUrl\` VARCHAR(255),
      \`capacity\` INT,
      \`status\` VARCHAR(50),
      \`category\` VARCHAR(255) DEFAULT 'Private Cruise'
    );
  `;
  try {
    await query(createTableSql);
    console.log(`Table ${tableName} checked/created successfully.`);
    // Ensure packages_json and customPackageInfo columns exist
    await addColumnIfNotExists(tableName, 'packages_json', 'TEXT DEFAULT NULL');
    await addColumnIfNotExists(tableName, 'customPackageInfo', 'TEXT');

  } catch (error) {
    console.error(`Error creating/altering table ${tableName}:`, (error as Error).message);
    throw error;
  }
}

async function createLeadsTable() {
  const tableName = MYSQL_TABLE_NAMES.leads;
  // This initial CREATE statement is a fallback for brand new setups.
  // The crucial part for existing setups is the addColumnIfNotExists calls below.
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`clientName\` VARCHAR(255) NOT NULL,
      \`agent\` VARCHAR(255),
      \`yacht\` VARCHAR(255),
      \`status\` VARCHAR(50),
      \`month\` DATETIME, -- Stores the Lead/Event Date
      \`notes\` TEXT,
      \`type\` VARCHAR(255),
      \`totalAmount\` DECIMAL(10, 2) NOT NULL,
      \`commissionPercentage\` DECIMAL(5, 2) DEFAULT 0.00,
      \`commissionAmount\` DECIMAL(10, 2) DEFAULT 0.00,
      \`netAmount\` DECIMAL(10, 2) NOT NULL,
      \`paidAmount\` DECIMAL(10, 2) DEFAULT 0.00,
      \`balanceAmount\` DECIMAL(10, 2) DEFAULT 0.00,
      \`createdAt\` DATETIME,
      \`updatedAt\` DATETIME,
      \`lastModifiedByUserId\` VARCHAR(255),
      \`ownerUserId\` VARCHAR(255)
    );
  `;
  try {
    await query(createTableSql);
    console.log(`Table ${tableName} checked/created successfully.`);

    // --- THIS IS THE FIX ---
    // These functions will now check for each column and add it if it doesn't exist,
    // which is what's needed to fix your database schema without deleting the table.
    await addColumnIfNotExists(tableName, 'paymentConfirmationStatus', "VARCHAR(50) DEFAULT 'UNCONFIRMED'");
    await addColumnIfNotExists(tableName, 'transactionId', 'VARCHAR(255) DEFAULT NULL');
    await addColumnIfNotExists(tableName, 'modeOfPayment', "VARCHAR(50) DEFAULT 'Online'");
    await addColumnIfNotExists(tableName, 'package_quantities_json', 'TEXT DEFAULT NULL');
    await addColumnIfNotExists(tableName, 'freeGuestCount', 'INT DEFAULT 0');
    await addColumnIfNotExists(tableName, 'perTicketRate', 'DECIMAL(10, 2) DEFAULT NULL');
    await addColumnIfNotExists(tableName, 'bookingRefNo', 'VARCHAR(255) DEFAULT NULL');
    await addColumnIfNotExists(tableName, 'checkInStatus', "VARCHAR(50) DEFAULT 'Not Checked In'");
    await addColumnIfNotExists(tableName, 'checkInTime', 'DATETIME DEFAULT NULL');


  } catch (error) {
    console.error(`Error creating/altering table ${tableName}:`, (error as Error).message);
    throw error;
  }
}

async function createInvoicesTable() {
  const tableName = MYSQL_TABLE_NAMES.invoices;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      \`id\` VARCHAR(191) PRIMARY KEY,
      \`leadId\` VARCHAR(255),
      \`clientName\` VARCHAR(255),
      \`amount\` DECIMAL(10, 2),
      \`dueDate\` DATE,
      \`status\` VARCHAR(50),
      \`createdAt\` DATETIME
    );
  `;
  try {
    await query(createTableSql);
    console.log(`Table ${tableName} checked/created successfully.`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, (error as Error).message);
    throw error;
  }
}

async function createOpportunitiesTable() {
  const tableName = MYSQL_TABLE_NAMES.opportunities;
  const createTableSql = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`potentialCustomer\` VARCHAR(255) NOT NULL,
        \`estimatedClosingDate\` DATETIME,
        \`ownerUserId\` VARCHAR(191),
        \`yachtId\` VARCHAR(191),
        \`productType\` VARCHAR(255),
        \`pipelinePhase\` VARCHAR(255),
        \`priority\` VARCHAR(50),
        \`estimatedRevenue\` DECIMAL(12, 2) DEFAULT 0.00,
        \`meanExpectedValue\` DECIMAL(12, 2) DEFAULT 0.00,
        \`currentStatus\` VARCHAR(50),
        \`followUpUpdates\` TEXT,
        \`createdAt\` DATETIME,
        \`updatedAt\` DATETIME
      );
    `;
  try {
    await query(createTableSql);
    // Add new columns
    await addColumnIfNotExists(tableName, 'subject', 'VARCHAR(255) NOT NULL DEFAULT "New Opportunity"');
    await addColumnIfNotExists(tableName, 'location', 'VARCHAR(255)');
    await addColumnIfNotExists(tableName, 'reportType', 'VARCHAR(50)');
    await addColumnIfNotExists(tableName, 'tripReportStatus', 'VARCHAR(50)');
    console.log(`Table ${tableName} checked/created successfully.`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, (error as Error).message);
    throw error;
  }
}


// --- Data Migration Functions ---
async function migrateUsers() {
  console.log('Migrating Users...');
  for (const user of placeholderUsers) {
    const sql = `
      INSERT INTO users (id, name, email, designation, avatarUrl, websiteUrl, status, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        email = VALUES(email), 
        designation = VALUES(designation), 
        avatarUrl = VALUES(avatarUrl), 
        websiteUrl = VALUES(websiteUrl), 
        status = VALUES(status),
        password = VALUES(password);
    `;
    try {
      const passwordToHash = user.password || '123456';
      const hashedPassword = await hash(passwordToHash, 10);

      await query(sql, [
        user.id,
        user.name,
        user.email,
        user.designation,
        user.avatarUrl || null,
        user.websiteUrl || null,
        user.status || 'Active',
        hashedPassword,
      ]);
      console.log(`Upserted user: ${user.name} (ID: ${user.id})`);
    } catch (error) {
      console.error(`Error upserting user ${user.name} (ID: ${user.id}):`, (error as Error).message);
    }
  }
  console.log('User migration finished.');
}

async function migrateAgents() {
  console.log('Migrating Agents...');
  for (const agent of placeholderAgents) {
    const sql = `
      INSERT INTO agents (id, name, agency_code, address, phone_no, email, status, TRN_number, customer_type_id, discount, websiteUrl) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        agency_code = VALUES(agency_code),
        address = VALUES(address),
        phone_no = VALUES(phone_no),
        email = VALUES(email),
        status = VALUES(status),
        TRN_number = VALUES(TRN_number),
        customer_type_id = VALUES(customer_type_id),
        discount = VALUES(discount),
        websiteUrl = VALUES(websiteUrl);
    `;
    try {
      await query(sql, [
        agent.id,
        agent.name,
        agent.agency_code || null,
        agent.address || null,
        agent.phone_no || null,
        agent.email,
        agent.status,
        agent.TRN_number || null,
        agent.customer_type_id || null,
        agent.discount,
        agent.websiteUrl || null,
      ]);
      console.log(`Upserted agent: ${agent.name} (ID: ${agent.id})`);
    } catch (error) {
      console.error(`Error upserting agent ${agent.name} (ID: ${agent.id}):`, (error as Error).message);
    }
  }
  console.log('Agent migration finished.');
}

async function migrateYachts() {
  console.log('Migrating Yachts...');
  for (const yacht of placeholderYachts) {
    const sql = `
      INSERT INTO ${MYSQL_TABLE_NAMES.yachts} (
        id, name, imageUrl, capacity, status, category, packages_json, customPackageInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        imageUrl = VALUES(imageUrl),
        capacity = VALUES(capacity),
        status = VALUES(status),
        category = VALUES(category),
        packages_json = VALUES(packages_json),
        customPackageInfo = VALUES(customPackageInfo);
    `;
    const packagesJson = yacht.packages ? JSON.stringify(yacht.packages) : null;
    try {
      await query(sql, [
        yacht.id,
        yacht.name,
        yacht.imageUrl || null,
        yacht.capacity,
        yacht.status,
        yacht.category,
        packagesJson,
        yacht.customPackageInfo || null,
      ]);
      console.log(`Upserted yacht: ${yacht.name} (ID: ${yacht.id})`);
    } catch (error) {
      console.error(`Error upserting yacht ${yacht.name} (ID: ${yacht.id}):`, (error as Error).message);
    }
  }
  console.log('Yacht migration finished.');
}

async function migrateLeads() {
  console.log('Migrating Bookings (formerly Leads)...');
  for (const lead of placeholderLeads) {
    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, 
        paymentConfirmationStatus, transactionId, bookingRefNo, modeOfPayment,
        package_quantities_json, freeGuestCount, perTicketRate,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        clientName = VALUES(clientName),
        agent = VALUES(agent),
        yacht = VALUES(yacht),
        status = VALUES(status),
        month = VALUES(month),
        notes = VALUES(notes),
        type = VALUES(type),
        paymentConfirmationStatus = VALUES(paymentConfirmationStatus),
        transactionId = VALUES(transactionId),
        bookingRefNo = VALUES(bookingRefNo),
        modeOfPayment = VALUES(modeOfPayment),
        package_quantities_json = VALUES(package_quantities_json),
        freeGuestCount = VALUES(freeGuestCount),
        perTicketRate = VALUES(perTicketRate),
        totalAmount = VALUES(totalAmount),
        commissionPercentage = VALUES(commissionPercentage),
        commissionAmount = VALUES(commissionAmount),
        netAmount = VALUES(netAmount),
        paidAmount = VALUES(paidAmount),
        balanceAmount = VALUES(balanceAmount),
        createdAt = VALUES(createdAt),
        updatedAt = VALUES(updatedAt),
        lastModifiedByUserId = VALUES(lastModifiedByUserId),
        ownerUserId = VALUES(ownerUserId);
    `;
    try {
      let monthDate = formatISO(new Date());
      if (lead.month) {
        try {
          const parsedMonth = parseISO(lead.month);
          if (isValid(parsedMonth)) {
            monthDate = formatISO(parsedMonth);
          } else {
            console.warn(`Invalid month date string for booking ${lead.id}: ${lead.month}. Using current date as fallback.`);
          }
        } catch (e) {
          console.warn(`Error parsing month date string for booking ${lead.id}: ${lead.month}. Using current date as fallback. Error: ${(e as Error).message}`);
        }
      }

      const createdAtDate = lead.createdAt && isValid(parseISO(lead.createdAt)) ? formatISO(parseISO(lead.createdAt)) : formatISO(new Date());
      const updatedAtDate = lead.updatedAt && isValid(parseISO(lead.updatedAt)) ? formatISO(parseISO(lead.updatedAt)) : formatISO(new Date());
      const packageQuantitiesJson = lead.packageQuantities ? JSON.stringify(lead.packageQuantities) : null;

      await query(sql, [
        lead.id,
        lead.clientName,
        lead.agent,
        lead.yacht,
        lead.status,
        monthDate, // This is the Booking/Event Date
        lead.notes || null,
        lead.type,
        lead.paymentConfirmationStatus || 'UNCONFIRMED',
        lead.transactionId || null,
        lead.bookingRefNo || null,
        lead.modeOfPayment,
        packageQuantitiesJson,
        lead.freeGuestCount || 0,
        lead.perTicketRate !== undefined ? lead.perTicketRate : null, // New field
        lead.totalAmount,
        lead.commissionPercentage,
        lead.commissionAmount || 0,
        lead.netAmount,
        lead.paidAmount,
        lead.balanceAmount || 0,
        createdAtDate,
        updatedAtDate,
        lead.lastModifiedByUserId || null,
        lead.ownerUserId || null,
      ]);
      console.log(`Upserted booking: ${lead.clientName} (ID: ${lead.id})`);
    } catch (error) {
      console.error(`Error upserting booking ${lead.clientName} (ID: ${lead.id}):`, (error as Error).message);
    }
  }
  console.log('Booking migration finished.');
}

async function migrateInvoices() {
  console.log('Migrating Invoices...');
  for (const invoice of placeholderInvoices) {
    const sql = `
      INSERT INTO invoices (id, leadId, clientName, amount, dueDate, status, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        leadId = VALUES(leadId),
        clientName = VALUES(clientName),
        amount = VALUES(amount),
        dueDate = VALUES(dueDate),
        status = VALUES(status),
        createdAt = VALUES(createdAt);
    `;
    try {
      const dueDateFormatted = invoice.dueDate && isValid(parseISO(invoice.dueDate)) ? format(parseISO(invoice.dueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      const createdAtFormatted = invoice.createdAt && isValid(parseISO(invoice.createdAt)) ? formatISO(parseISO(invoice.createdAt)) : formatISO(new Date());
      await query(sql, [
        invoice.id,
        invoice.leadId,
        invoice.clientName,
        invoice.amount,
        dueDateFormatted,
        invoice.status,
        createdAtFormatted,
      ]);
      console.log(`Upserted invoice: ${invoice.clientName} (ID: ${invoice.id})`);
    } catch (error) {
      console.error(`Error upserting invoice ${invoice.clientName} (ID: ${invoice.id}):`, (error as Error).message);
    }
  }
  console.log('Invoice migration finished.');
}

async function migrateOpportunities() {
  console.log('Migrating Opportunities...');
  for (const opp of placeholderOpportunities) {
    const sql = `
        INSERT INTO opportunities (
          id, potentialCustomer, subject, estimatedClosingDate, ownerUserId, yachtId, productType, 
          pipelinePhase, priority, estimatedRevenue, meanExpectedValue, currentStatus, 
          followUpUpdates, createdAt, updatedAt, location, reportType, tripReportStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          potentialCustomer = VALUES(potentialCustomer),
          subject = VALUES(subject),
          estimatedClosingDate = VALUES(estimatedClosingDate),
          ownerUserId = VALUES(ownerUserId),
          yachtId = VALUES(yachtId),
          productType = VALUES(productType),
          pipelinePhase = VALUES(pipelinePhase),
          priority = VALUES(priority),
          estimatedRevenue = VALUES(estimatedRevenue),
          meanExpectedValue = VALUES(meanExpectedValue),
          currentStatus = VALUES(currentStatus),
          followUpUpdates = VALUES(followUpUpdates),
          createdAt = VALUES(createdAt),
          updatedAt = VALUES(updatedAt),
          location = VALUES(location),
          reportType = VALUES(reportType),
          tripReportStatus = VALUES(tripReportStatus);
      `;
    try {
      const estimatedClosingDate = opp.estimatedClosingDate && isValid(parseISO(opp.estimatedClosingDate)) ? formatISO(parseISO(opp.estimatedClosingDate)) : formatISO(new Date());
      const createdAt = opp.createdAt && isValid(parseISO(opp.createdAt)) ? formatISO(parseISO(opp.createdAt)) : formatISO(new Date());
      const updatedAt = opp.updatedAt && isValid(parseISO(opp.updatedAt)) ? formatISO(parseISO(opp.updatedAt)) : formatISO(new Date());

      await query(sql, [
        opp.id,
        opp.potentialCustomer,
        opp.subject,
        estimatedClosingDate,
        opp.ownerUserId,
        opp.yachtId,
        opp.productType,
        opp.pipelinePhase,
        opp.priority,
        opp.estimatedRevenue,
        opp.meanExpectedValue,
        opp.currentStatus,
        opp.followUpUpdates,
        createdAt,
        updatedAt,
        opp.location || null, // Ensure undefined is converted to null
        opp.reportType || null,
        opp.tripReportStatus || null
      ]);
      console.log(`Upserted opportunity: ${opp.potentialCustomer} (ID: ${opp.id})`);
    } catch (error) {
      console.error(`Error upserting opportunity ${opp.potentialCustomer} (ID: ${opp.id}):`, (error as Error).message);
    }
  }
  console.log('Opportunity migration finished.');
}

async function main() {
  const args = process.argv.slice(2); // Get arguments passed to the script
  const onlyArg = args.find(arg => arg.startsWith('--only='));
  const entityToMigrate = onlyArg ? onlyArg.split('=')[1] : null;

  console.log(`Starting data migration. Entity to migrate: ${entityToMigrate || 'all'}`);

  try {
    if (!entityToMigrate || entityToMigrate === 'all') {
      console.log('Running all migrations...');
      // Create all tables first
      await createUsersTable();
      await createAgentsTable();
      await createYachtsTable();
      await createLeadsTable();
      await createInvoicesTable();
      await createOpportunitiesTable();

      // Then migrate all data
      await migrateUsers();
      await migrateAgents();
      await migrateYachts();
      await migrateLeads();
      await migrateInvoices();
      await migrateOpportunities();
    } else if (entityToMigrate === 'users') {
      console.log('Running migration for: users');
      await createUsersTable();
      await migrateUsers();
    } else if (entityToMigrate === 'agents') {
      console.log('Running migration for: agents');
      await createAgentsTable();
      await migrateAgents();
    } else if (entityToMigrate === 'yachts') {
      console.log('Running migration for: yachts');
      await createYachtsTable();
      await migrateYachts();
    } else if (entityToMigrate === 'leads') {
      console.log('Running migration for: bookings (table name: leads)');
      await createLeadsTable();
      await migrateLeads();
    } else if (entityToMigrate === 'invoices') {
      console.log('Running migration for: invoices');
      await createInvoicesTable();
      await migrateInvoices();
    } else if (entityToMigrate === 'opportunities') {
      console.log('Running migration for: opportunities');
      await createOpportunitiesTable();
      await migrateOpportunities();
    } else {
      console.warn(`Unknown entity to migrate: "${entityToMigrate}". Running all migrations by default.`);
      // Default to all if entity is not recognized
      await createUsersTable();
      await createAgentsTable();
      await createYachtsTable();
      await createLeadsTable();
      await createInvoicesTable();
      await createOpportunitiesTable();
      await migrateUsers();
      await migrateAgents();
      await migrateYachts();
      await migrateLeads();
      await migrateInvoices();
      await migrateOpportunities();
    }

    console.log('Data migration tasks complete! Make sure to close the DB connection if your db.ts doesn\'t do it automatically after a pool query.');
  } catch (error) {
    console.error("A critical error occurred during table creation or migration process, aborting further steps:", (error as Error).message);
  } finally {
    await closePool();
  }
}

main().catch(async err => {
  console.error('Migration script failed:', err);
  try {
    await closePool();
  } catch (e) {
    console.error('Error closing pool after script failure:', e);
  }
  process.exit(1);
});

