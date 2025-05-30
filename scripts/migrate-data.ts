
// scripts/migrate-data.ts
import { query } from '../src/lib/db'; // Adjusted path
import {
  placeholderUsers,
  placeholderAgents,
  placeholderYachts,
  placeholderLeads,
  placeholderInvoices,
} from '../src/lib/placeholder-data'; // Adjusted path
import type { Agent, Lead, Yacht, Invoice, User } from '../src/lib/types';
import { formatISO, parseISO, isValid, format } from 'date-fns';
import 'dotenv/config'; // Ensures .env.local is loaded

const MYSQL_TABLE_NAMES = {
  users: 'users',
  agents: 'agents',
  yachts: 'yachts',
  leads: 'leads',
  invoices: 'invoices',
};

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
      customPackageInfo TEXT,
      childRate DECIMAL(10, 2) DEFAULT 0.00,
      adultStandardRate DECIMAL(10, 2) DEFAULT 0.00,
      adultStandardDrinksRate DECIMAL(10, 2) DEFAULT 0.00,
      vipChildRate DECIMAL(10, 2) DEFAULT 0.00,
      vipAdultRate DECIMAL(10, 2) DEFAULT 0.00,
      vipAdultDrinksRate DECIMAL(10, 2) DEFAULT 0.00,
      royalChildRate DECIMAL(10, 2) DEFAULT 0.00,
      royalAdultRate DECIMAL(10, 2) DEFAULT 0.00,
      royalDrinksRate DECIMAL(10, 2) DEFAULT 0.00,
      otherChargeName VARCHAR(255),
      otherChargeRate DECIMAL(10, 2) DEFAULT 0.00
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

async function createLeadsTable() {
  const tableName = MYSQL_TABLE_NAMES.leads;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(191) PRIMARY KEY,
      clientName VARCHAR(255) NOT NULL,
      agent VARCHAR(255),
      yacht VARCHAR(255),
      status VARCHAR(50),
      month DATETIME,
      notes TEXT,
      type VARCHAR(255),
      transactionId VARCHAR(255),
      modeOfPayment VARCHAR(50),

      qty_childRate INT DEFAULT 0,
      qty_adultStandardRate INT DEFAULT 0,
      qty_adultStandardDrinksRate INT DEFAULT 0,
      qty_vipChildRate INT DEFAULT 0,
      qty_vipAdultRate INT DEFAULT 0,
      qty_vipAdultDrinksRate INT DEFAULT 0,
      qty_royalChildRate INT DEFAULT 0,
      qty_royalAdultRate INT DEFAULT 0,
      qty_royalDrinksRate INT DEFAULT 0,

      othersAmtCake INT DEFAULT 0,
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
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, (error as Error).message);
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
  await createUsersTable(); 
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
      console.error(`Error inserting user ${user.name} (ID: ${user.id}):`, (error as Error).message);
    }
  }
  console.log('User migration finished.');
}

async function migrateAgents() {
  console.log('Migrating Agents...');
  await createAgentsTable(); 
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
      console.error(`Error inserting agent ${agent.name} (ID: ${agent.id}):`, (error as Error).message);
    }
  }
  console.log('Agent migration finished.');
}

async function migrateYachts() {
  console.log('Migrating Yachts...');
  await createYachtsTable();
  for (const yacht of placeholderYachts) {
    const sql = `
      INSERT INTO ${MYSQL_TABLE_NAMES.yachts} (
        id, name, imageUrl, capacity, status, customPackageInfo,
        childRate, adultStandardRate, adultStandardDrinksRate,
        vipChildRate, vipAdultRate, vipAdultDrinksRate,
        royalChildRate, royalAdultRate, royalDrinksRate,
        otherChargeName, otherChargeRate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `; 
    try {
      await query(sql, [
        yacht.id,
        yacht.name,
        yacht.imageUrl || null,
        yacht.capacity,
        yacht.status,
        yacht.customPackageInfo || null,
        yacht.childRate || 0,
        yacht.adultStandardRate || 0,
        yacht.adultStandardDrinksRate || 0,
        yacht.vipChildRate || 0,
        yacht.vipAdultRate || 0,
        yacht.vipAdultDrinksRate || 0,
        yacht.royalChildRate || 0,
        yacht.royalAdultRate || 0,
        yacht.royalDrinksRate || 0,
        yacht.otherChargeName || null,
        yacht.otherChargeRate || 0,
      ]);
      console.log(`Inserted yacht: ${yacht.name} (ID: ${yacht.id})`);
    } catch (error) {
      console.error(`Error inserting yacht ${yacht.name} (ID: ${yacht.id}):`, (error as Error).message);
    }
  }
  console.log('Yacht migration finished.');
}

async function migrateLeads() {
  console.log('Migrating Leads...');
  await createLeadsTable(); 
  for (const lead of placeholderLeads) {
    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, transactionId, modeOfPayment,
        qty_childRate, qty_adultStandardRate, qty_adultStandardDrinksRate,
        qty_vipChildRate, qty_vipAdultRate, qty_vipAdultDrinksRate,
        qty_royalChildRate, qty_royalAdultRate, qty_royalDrinksRate,
        othersAmtCake,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
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

      await query(sql, [
        lead.id,
        lead.clientName,
        lead.agent,
        lead.yacht,
        lead.status,
        monthDate,
        lead.notes || null,
        lead.type,
        lead.transactionId || null,
        lead.modeOfPayment,
        lead.qty_childRate ?? 0,
        lead.qty_adultStandardRate ?? 0,
        lead.qty_adultStandardDrinksRate ?? 0,
        lead.qty_vipChildRate ?? 0,
        lead.qty_vipAdultRate ?? 0,
        lead.qty_vipAdultDrinksRate ?? 0,
        lead.qty_royalChildRate ?? 0,
        lead.qty_royalAdultRate ?? 0,
        lead.qty_royalDrinksRate ?? 0,
        lead.othersAmtCake ?? 0, 
        lead.totalAmount,
        lead.commissionPercentage,
        lead.commissionAmount || 0,
        lead.netAmount,
        lead.paidAmount,
        lead.balanceAmount,
        createdAtDate,
        updatedAtDate,
        lead.lastModifiedByUserId || null,
        lead.ownerUserId || null,
      ]);
      console.log(`Inserted lead: ${lead.clientName} (ID: ${lead.id})`);
    } catch (error) {
      console.error(`Error inserting lead ${lead.clientName} (ID: ${lead.id}):`, (error as Error).message);
    }
  }
  console.log('Lead migration finished.');
}

async function migrateInvoices() {
  console.log('Migrating Invoices...');
  await createInvoicesTable(); 
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
      console.error(`Error inserting invoice ${invoice.clientName} (ID: ${invoice.id}):`, (error as Error).message);
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
    // Attempt to safely close the pool if your db.ts exports a pool or an end function
    // This is important for scripts to not hang
    const dbModule = await import('../src/lib/db'); 
    if (dbModule.default && typeof dbModule.default.end === 'function') {
        try {
            await dbModule.default.end();
            console.log('MySQL pool closed by script in finally block.');
        } catch (e) {
            console.error('Error closing pool in finally block:', e);
        }
    } else if (dbModule.default && typeof (dbModule.default as any).pool?.end === 'function') {
        // If the pool is nested (e.g., dbModule.default.pool.end)
        try {
            await (dbModule.default as any).pool.end();
            console.log('MySQL pool (nested) closed by script in finally block.');
        } catch (e) {
            console.error('Error closing nested pool in finally block:', e);
        }
    }
  }
}

main().catch(async err => {
  console.error('Migration script failed:', err);
  try {
    // Also attempt to close pool on script failure
    const dbModule = await import('../src/lib/db');
     if (dbModule.default && typeof dbModule.default.end === 'function') {
        await dbModule.default.end();
        console.log('MySQL pool closed due to script failure.');
    } else if (dbModule.default && typeof (dbModule.default as any).pool?.end === 'function') {
         await (dbModule.default as any).pool.end();
         console.log('MySQL pool (nested) closed due to script failure.');
    }
  } catch (e) {
    console.error('Error closing pool after script failure:', e);
  }
  process.exit(1);
});
