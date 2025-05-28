
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
// 1. Ensure your MySQL tables are created and column names match the object keys used below.
// 2. This script is NOT idempotent. Running it multiple times will attempt to insert duplicate data,
//    which will fail if you have primary key constraints (as you should).
// 3. Passwords for users are inserted as-is from placeholder data. In a real system,
//    passwords MUST be hashed before storing. This is for placeholder migration only.

const MYSQL_TABLE_NAMES = {
  agents: 'agents', // Change if your table name is different
  leads: 'leads',
  yachts: 'yachts',
  invoices: 'invoices',
  users: 'users',
};

async function migrateAgents() {
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
        lead.agent, // This is an Agent ID
        lead.yacht, // This is a Yacht ID
        lead.status,
        monthDate,
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

async function migrateUsers() {
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

async function main() {
  console.log('Starting data migration...');
  // Consider the order of migration if there are foreign key constraints
  await migrateUsers();
  await migrateAgents();
  await migrateYachts();
  await migrateLeads(); // Leads often depend on users, agents, yachts
  await migrateInvoices(); // Invoices often depend on leads
  console.log('Data migration complete! Make sure to close the DB connection if your db.ts doesn\'t do it automatically after a pool query.');
  // If your db.ts uses a pool that needs explicit closing for a script like this:
  // import pool from '../src/lib/db'; // if pool is exported directly
  // if (pool && typeof (pool as any).end === 'function') {
  //   await (pool as any).end();
  //   console.log('MySQL pool closed by script.');
  // }
}

main().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
