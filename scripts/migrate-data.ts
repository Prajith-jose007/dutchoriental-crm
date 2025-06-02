
// scripts/migrate-data.ts
import { query } from '../src/lib/db'; // Adjusted path
import {
  placeholderUsers,
  placeholderAgents,
  placeholderYachts,
  placeholderLeads,
  placeholderInvoices,
} from '../src/lib/placeholder-data'; // Adjusted path
import type { Agent, Lead, Yacht, Invoice, User, YachtPackageItem, LeadPackageQuantity } from '../src/lib/types';
import { formatISO, parseISO, isValid, format } from 'date-fns';
import 'dotenv/config'; // Ensures .env.local is loaded

const MYSQL_TABLE_NAMES = {
  users: 'users',
  agents: 'agents',
  yachts: 'yachts',
  leads: 'leads',
  invoices: 'invoices',
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
    const [rows]: any = await query(checkColumnSql, [tableName, columnName]);
    if (rows[0].count === 0) {
      const alterTableSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`;
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
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      designation VARCHAR(255),
      avatarUrl VARCHAR(255),
      websiteUrl VARCHAR(255),
      status VARCHAR(50),
      password VARCHAR(255)
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
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      agency_code VARCHAR(255),
      address TEXT,
      phone_no VARCHAR(255),
      email VARCHAR(191) NOT NULL,
      status VARCHAR(50),
      TRN_number VARCHAR(255),
      customer_type_id VARCHAR(255),
      discount DECIMAL(5, 2) DEFAULT 0.00,
      websiteUrl VARCHAR(255)
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
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      imageUrl VARCHAR(255),
      capacity INT,
      status VARCHAR(50),
      category VARCHAR(255) DEFAULT 'Private Cruise',
      packages_json TEXT DEFAULT NULL,
      customPackageInfo TEXT
    );
  `;
  try {
    await query(createTableSql);
    console.log(`Table ${tableName} checked/created successfully.`);
    // Ensure packages_json and customPackageInfo columns exist
    await addColumnIfNotExists(tableName, 'packages_json', 'TEXT DEFAULT NULL');
    await addColumnIfNotExists(tableName, 'customPackageInfo', 'TEXT DEFAULT NULL');

  } catch (error) {
    console.error(`Error creating/altering table ${tableName}:`, (error as Error).message);
    throw error;
  }
}

async function createLeadsTable() {
  const tableName = MYSQL_TABLE_NAMES.leads;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(191) PRIMARY KEY,
      clientName VARCHAR(255) NOT NULL,
      agent VARCHAR(255),
      yacht VARCHAR(255),
      status VARCHAR(50),
      month DATETIME, -- Stores the Lead/Event Date
      notes TEXT,
      type VARCHAR(255),
      paymentConfirmationStatus VARCHAR(50) DEFAULT 'CONFIRMED',
      transactionId VARCHAR(255),
      modeOfPayment VARCHAR(50),
      package_quantities_json TEXT DEFAULT NULL,
      totalAmount DECIMAL(10, 2) NOT NULL,
      commissionPercentage DECIMAL(5, 2) DEFAULT 0.00,
      commissionAmount DECIMAL(10, 2) DEFAULT 0.00,
      netAmount DECIMAL(10, 2) NOT NULL,
      paidAmount DECIMAL(10, 2) DEFAULT 0.00,
      balanceAmount DECIMAL(10, 2) DEFAULT 0.00,
      createdAt DATETIME,
      updatedAt DATETIME,
      lastModifiedByUserId VARCHAR(255),
      ownerUserId VARCHAR(255)
    );
  `;
  try {
    await query(createTableSql);
    console.log(`Table ${tableName} checked/created successfully.`);
    
    // Ensure newer columns exist
    await addColumnIfNotExists(tableName, 'paymentConfirmationStatus', 'VARCHAR(50) DEFAULT \'CONFIRMED\'');
    await addColumnIfNotExists(tableName, 'transactionId', 'VARCHAR(255) DEFAULT NULL');
    await addColumnIfNotExists(tableName, 'modeOfPayment', 'VARCHAR(50) DEFAULT \'Online\'');
    await addColumnIfNotExists(tableName, 'package_quantities_json', 'TEXT DEFAULT NULL');

  } catch (error) {
    console.error(`Error creating/altering table ${tableName}:`, (error as Error).message);
    throw error;
  }
}

async function createInvoicesTable() {
  const tableName = MYSQL_TABLE_NAMES.invoices;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(191) PRIMARY KEY,
      leadId VARCHAR(255),
      clientName VARCHAR(255),
      amount DECIMAL(10, 2),
      dueDate DATE,
      status VARCHAR(50),
      createdAt DATETIME
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


// --- Data Migration Functions ---
async function migrateUsers() {
  console.log('Migrating Users...');
  for (const user of placeholderUsers) {
    const sql = 'INSERT INTO users (id, name, email, designation, avatarUrl, websiteUrl, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    try {
      await query(sql, [
        user.id,
        user.name,
        user.email,
        user.designation,
        user.avatarUrl || null,
        user.websiteUrl || null,
        user.status || 'Active',
        user.password || null, 
      ]);
      console.log(`Inserted user: ${user.name} (ID: ${user.id})`);
    } catch (error) {
      // Check if error is due to duplicate entry (error code ER_DUP_ENTRY for MySQL is 1062)
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).errno === 1062) {
        console.warn(`User ${user.name} (ID: ${user.id}) already exists. Skipping insertion.`);
      } else {
        console.error(`Error inserting user ${user.name} (ID: ${user.id}):`, (error as Error).message);
      }
    }
  }
  console.log('User migration finished.');
}

async function migrateAgents() {
  console.log('Migrating Agents...');
  for (const agent of placeholderAgents) {
    const sql = 'INSERT INTO agents (id, name, agency_code, address, phone_no, email, status, TRN_number, customer_type_id, discount, websiteUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
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
      console.log(`Inserted agent: ${agent.name} (ID: ${agent.id})`);
    } catch (error) {
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).errno === 1062) {
        console.warn(`Agent ${agent.name} (ID: ${agent.id}) already exists. Skipping insertion.`);
      } else {
        console.error(`Error inserting agent ${agent.name} (ID: ${agent.id}):`, (error as Error).message);
      }
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
      console.log(`Inserted yacht: ${yacht.name} (ID: ${yacht.id})`);
    } catch (error) {
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).errno === 1062) {
        console.warn(`Yacht ${yacht.name} (ID: ${yacht.id}) already exists. Skipping insertion.`);
      } else {
        console.error(`Error inserting yacht ${yacht.name} (ID: ${yacht.id}):`, (error as Error).message);
      }
    }
  }
  console.log('Yacht migration finished.');
}

async function migrateLeads() {
  console.log('Migrating Leads...');
  for (const lead of placeholderLeads) {
    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, paymentConfirmationStatus, transactionId, modeOfPayment,
        package_quantities_json,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;
    try {
      let monthDate = formatISO(new Date()); 
      if (lead.month) {
          try {
              const parsedMonth = parseISO(lead.month);
              if (isValid(parsedMonth)) {
                  monthDate = formatISO(parsedMonth);
              } else {
                  console.warn(`Invalid month date string for lead ${lead.id}: ${lead.month}. Using current date as fallback.`);
              }
          } catch(e) {
              console.warn(`Error parsing month date string for lead ${lead.id}: ${lead.month}. Using current date as fallback. Error: ${(e as Error).message}`);
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
        monthDate, // This is the Lead/Event Date
        lead.notes || null,
        lead.type,
        lead.paymentConfirmationStatus || 'CONFIRMED', 
        lead.transactionId || null,
        lead.modeOfPayment,
        packageQuantitiesJson,
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
      console.log(`Inserted lead: ${lead.clientName} (ID: ${lead.id})`);
    } catch (error) {
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).errno === 1062) {
        console.warn(`Lead ${lead.clientName} (ID: ${lead.id}) already exists. Skipping insertion.`);
      } else {
        console.error(`Error inserting lead ${lead.clientName} (ID: ${lead.id}):`, (error as Error).message);
      }
    }
  }
  console.log('Lead migration finished.');
}

async function migrateInvoices() {
  console.log('Migrating Invoices...');
  for (const invoice of placeholderInvoices) {
    const sql = 'INSERT INTO invoices (id, leadId, clientName, amount, dueDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)';
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
      console.log(`Inserted invoice: ${invoice.clientName} (ID: ${invoice.id})`);
    } catch (error) {
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).errno === 1062) {
        console.warn(`Invoice ${invoice.clientName} (ID: ${invoice.id}) already exists. Skipping insertion.`);
      } else {
        console.error(`Error inserting invoice ${invoice.clientName} (ID: ${invoice.id}):`, (error as Error).message);
      }
    }
  }
  console.log('Invoice migration finished.');
}

async function main() {
  console.log('Starting data migration with table creation checks...');
  try {
    // Create tables first to ensure they exist with the correct schema
    await createUsersTable();
    await createAgentsTable();
    await createYachtsTable();
    await createLeadsTable();
    await createInvoicesTable();
    
    // Then migrate data
    await migrateUsers();
    await migrateAgents();
    await migrateYachts();
    await migrateLeads();
    await migrateInvoices();
    console.log('Data migration complete! Make sure to close the DB connection if your db.ts doesn\'t do it automatically after a pool query.');
  } catch (error) {
      console.error("A critical error occurred during table creation or migration process, aborting further steps:", (error as Error).message);
  } finally {
    const dbModule = await import('../src/lib/db'); 
    if (dbModule.default && typeof (dbModule.default as any).end === 'function') { 
        try {
            await (dbModule.default as any).end();
            console.log('MySQL pool closed by script in finally block.');
        } catch (e) {
            console.error('Error closing pool in finally block:', e);
        }
    } else if (dbModule.default && typeof (dbModule.default as any).pool?.end === 'function') { 
        try {
            await (dbModule.default as any).pool.end();
            console.log('MySQL pool (nested) closed by script in finally block.');
        } catch (e) {
            console.error('Error closing nested pool in finally block:', e);
        }
    } else if (typeof (dbModule as any).end === 'function') { 
         try {
            await (dbModule as any).end();
            console.log('MySQL pool (direct export) closed by script in finally block.');
        } catch (e) {
            console.error('Error closing direct export pool in finally block:', e);
        }
    }
  }
}

main().catch(async err => {
  console.error('Migration script failed:', err);
  try {
    const dbModule = await import('../src/lib/db');
     if (dbModule.default && typeof (dbModule.default as any).end === 'function') {
        await (dbModule.default as any).end();
        console.log('MySQL pool closed due to script failure.');
    } else if (dbModule.default && typeof (dbModule.default as any).pool?.end === 'function') {
         await (dbModule.default as any).pool.end();
         console.log('MySQL pool (nested) closed due to script failure.');
    } else if (typeof (dbModule as any).end === 'function') {
        await (dbModule as any).end();
        console.log('MySQL pool (direct export) closed due to script failure.');
    }
  } catch (e) {
    console.error('Error closing pool after script failure:', e);
  }
  process.exit(1);
});

