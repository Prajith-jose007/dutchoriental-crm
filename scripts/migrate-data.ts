
// scripts/migrate-data.ts
import { query } from '../src/lib/db';
import {
  placeholderAgents,
  placeholderLeads,
  placeholderYachts,
  placeholderInvoices,
  placeholderUsers,
} from '../src/lib/placeholder-data';
import type { Agent, Lead, Yacht, Invoice, User } from '../src/lib/types';
import { formatISO, parseISO, isValid } from 'date-fns';

// IMPORTANT:
// 1. This script will now ATTEMPT to create tables if they don't exist.
//    Review the CREATE TABLE statements below and adjust column types/lengths as needed for your production setup.
// 2. This script is NOT fully idempotent for data insertion. Running it multiple times
//    will attempt to insert duplicate data, which may fail if you have primary key constraints.
// 3. Passwords for users are inserted as-is from placeholder data. In a real system,
//    passwords MUST be hashed before storing. This is for placeholder migration only.

const MYSQL_TABLE_NAMES = {
  agents: 'agents',
  leads: 'leads',
  yachts: 'yachts',
  invoices: 'invoices',
  users: 'users',
};

async function createUsersTable() {
  const tableName = MYSQL_TABLE_NAMES.users;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
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
    // If table creation fails, we might not want to proceed with inserting data for it.
    throw error;
  }
}

async function createAgentsTable() {
  const tableName = MYSQL_TABLE_NAMES.agents;
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      agency_code VARCHAR(255),
      address TEXT,
      phone_no VARCHAR(255),
      email VARCHAR(255) NOT NULL,
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
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      imageUrl VARCHAR(255),
      capacity INT,
      status VARCHAR(50),
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
      otherChargeRate DECIMAL(10, 2) DEFAULT 0.00,
      customPackageInfo TEXT
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
      id VARCHAR(255) PRIMARY KEY,
      clientName VARCHAR(255) NOT NULL,
      agent VARCHAR(255),
      yacht VARCHAR(255),
      status VARCHAR(50),
      month DATETIME,
      notes TEXT,
      type VARCHAR(255),
      invoiceId VARCHAR(255),
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
      othersAmtCake DECIMAL(10, 2) DEFAULT 0.00,
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
      id VARCHAR(255) PRIMARY KEY,
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


async function migrateUsers() {
  await createUsersTable(); // Ensure table exists
  console.log('Migrating Users...');
  for (const user of placeholderUsers) {
    const sql = `INSERT INTO ${MYSQL_TABLE_NAMES.users} (id, name, email, designation, avatarUrl, websiteUrl, status, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
      await query(sql, [
        user.id,
        user.name,
        user.email,
        user.designation,
        user.avatarUrl || null,
        user.websiteUrl || null,
        user.status || 'Active',
        user.password || null, // Storing plaintext password - ONLY FOR DEMO/PLACEHOLDER DATA
      ]);
      console.log(`Inserted user: ${user.name} (ID: ${user.id})`);
    } catch (error) {
      console.error(`Error inserting user ${user.name} (ID: ${user.id}):`, (error as Error).message);
    }
  }
  console.log('User migration finished.');
}

async function migrateAgents() {
  await createAgentsTable(); // Ensure table exists
  console.log('Migrating Agents...');
  for (const agent of placeholderAgents) {
    const sql = `INSERT INTO ${MYSQL_TABLE_NAMES.agents} (id, name, agency_code, address, phone_no, email, status, TRN_number, customer_type_id, discount, websiteUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
  await createYachtsTable(); // Ensure table exists
  console.log('Migrating Yachts...');
  for (const yacht of placeholderYachts) {
    const sql = `
      INSERT INTO ${MYSQL_TABLE_NAMES.yachts} (
        id, name, imageUrl, capacity, status,
        childRate, adultStandardRate, adultStandardDrinksRate,
        vipChildRate, vipAdultRate, vipAdultDrinksRate,
        royalChildRate, royalAdultRate, royalDrinksRate,
        otherChargeName, otherChargeRate, customPackageInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    try {
      await query(sql, [
        yacht.id,
        yacht.name,
        yacht.imageUrl || null,
        yacht.capacity,
        yacht.status,
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
        yacht.customPackageInfo || null,
      ]);
      console.log(`Inserted yacht: ${yacht.name} (ID: ${yacht.id})`);
    } catch (error) {
      console.error(`Error inserting yacht ${yacht.name} (ID: ${yacht.id}):`, (error as Error).message);
    }
  }
  console.log('Yacht migration finished.');
}

async function migrateLeads() {
  await createLeadsTable(); // Ensure table exists
  console.log('Migrating Leads...');
  for (const lead of placeholderLeads) {
    const sql = `
      INSERT INTO ${MYSQL_TABLE_NAMES.leads} (
        id, clientName, agent, yacht, status, month, notes, type, invoiceId, modeOfPayment,
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
      const monthDate = lead.month && isValid(parseISO(lead.month)) ? formatISO(parseISO(lead.month)) : formatISO(new Date());
      const createdAtDate = lead.createdAt && isValid(parseISO(lead.createdAt)) ? formatISO(parseISO(lead.createdAt)) : formatISO(new Date());
      const updatedAtDate = lead.updatedAt && isValid(parseISO(lead.updatedAt)) ? formatISO(parseISO(lead.updatedAt)) : formatISO(new Date());

      await query(sql, [
        lead.id,
        lead.clientName,
        lead.agent, 
        lead.yacht, 
        lead.status,
        monthDate, // lead.month should be a full ISO date string
        lead.notes || null,
        lead.type,
        lead.invoiceId || null,
        lead.modeOfPayment,
        lead.qty_childRate || 0,
        lead.qty_adultStandardRate || 0,
        lead.qty_adultStandardDrinksRate || 0,
        lead.qty_vipChildRate || 0,
        lead.qty_vipAdultRate || 0,
        lead.qty_vipAdultDrinksRate || 0,
        lead.qty_royalChildRate || 0,
        lead.qty_royalAdultRate || 0,
        lead.qty_royalDrinksRate || 0,
        lead.othersAmtCake || 0,
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
  await createInvoicesTable(); // Ensure table exists
  console.log('Migrating Invoices...');
  for (const invoice of placeholderInvoices) {
    const sql = `INSERT INTO ${MYSQL_TABLE_NAMES.invoices} (id, leadId, clientName, amount, dueDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    try {
        const dueDateFormatted = invoice.dueDate && isValid(parseISO(invoice.dueDate)) ? formatISO(parseISO(invoice.dueDate)) : formatISO(new Date());
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
  // Consider the order of migration if there are foreign key constraints
  // For now, assuming no strict foreign key constraints that would block creation/insertion in this order.
  // If they exist, you might need to create all tables first, then insert.
  try {
    await migrateUsers();
    await migrateAgents();
    await migrateYachts();
    await migrateLeads(); 
    await migrateInvoices(); 
    console.log('Data migration complete! Make sure to close the DB connection if your db.ts doesn\'t do it automatically after a pool query.');
    // If your db.ts uses a pool that needs explicit closing for a script like this:
    // import pool from '../src/lib/db'; // if pool is exported directly
    // if (pool && typeof (pool as any).end === 'function') {
    //   await (pool as any).end();
    //   console.log('MySQL pool closed by script.');
    // }
  } catch (error) {
      console.error("A critical error occurred during table creation or migration process, aborting further steps:", (error as Error).message);
  }
}

main().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});

    