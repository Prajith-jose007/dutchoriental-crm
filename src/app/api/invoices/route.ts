
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, format } from 'date-fns';

// Helper to ensure date strings are in a consistent ISO format for DB or client
const ensureISOFormat = (dateSource?: string | Date, fieldName?: string): string | null => {
  if (!dateSource) return null;

  if (dateSource instanceof Date) {
    if (isValid(dateSource)) return formatISO(dateSource);
    console.warn(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: Received invalid Date object:`, dateSource);
    return null;
  }

  if (typeof dateSource === 'string') {
    try {
      const parsedDate = parseISO(dateSource); // parseISO is robust for ISO 8601 and common SQL date/datetime strings
      if (isValid(parsedDate)) {
        return formatISO(parsedDate); // Return full ISO 8601 string
      } else {
        console.warn(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: Failed to parse date string "${dateSource}" using parseISO. Returning original string or null based on policy.`);
        // Depending on strictness, you might return dateSource or null.
        // For now, returning null if parseISO fails for a string that isn't a Date object.
        return null;
      }
    } catch (e) {
      console.error(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: Exception parsing date string "${dateSource}". Error:`, (e as Error).message);
      return null;
    }
  }

  console.warn(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: dateSource is not a string or Date object. Value:`, dateSource);
  return null;
};

export async function GET(request: NextRequest) {
  console.log('[API GET /api/invoices] Received request');
  try {
    const invoicesDataDb: any[] = await query('SELECT * FROM invoices ORDER BY createdAt DESC');
    console.log('[API GET /api/invoices] Raw DB Data (first item):', invoicesDataDb.length > 0 ? invoicesDataDb[0] : 'No invoices from DB');
    
    const invoices: Invoice[] = invoicesDataDb.map(inv => {
      const parsedDueDate = inv.dueDate ? ensureISOFormat(inv.dueDate, 'dueDate') : null;
      const parsedCreatedAt = inv.createdAt ? ensureISOFormat(inv.createdAt, 'createdAt') : null;

      return {
        id: String(inv.id || ''),
        leadId: inv.leadId || '',
        clientName: inv.clientName || '',
        amount: parseFloat(inv.amount || 0),
        dueDate: parsedDueDate || formatISO(new Date()), // Fallback to current date if parsing fails or raw is null
        status: (inv.status || 'Pending') as Invoice['status'],
        createdAt: parsedCreatedAt || formatISO(new Date()), // Fallback
      };
    });

    console.log('[API GET /api/invoices] Mapped Invoices Data (first item):', invoices.length > 0 ? invoices[0] : 'No invoices mapped');
    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/invoices] Failed to fetch invoices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoices', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newInvoiceData = await request.json() as Omit<Invoice, 'createdAt'> & { createdAt?: string };
    console.log('[API POST /api/invoices] Received newInvoiceData:', newInvoiceData);

    if (
      !newInvoiceData.id || !newInvoiceData.leadId || !newInvoiceData.clientName ||
      newInvoiceData.amount === undefined || !newInvoiceData.dueDate || !newInvoiceData.status
    ) {
      return NextResponse.json(
        { message: 'Missing required invoice fields (id, leadId, clientName, amount, dueDate, status)' },
        { status: 400 }
      );
    }

    const existingInvoice: any = await query('SELECT id FROM invoices WHERE id = ?', [newInvoiceData.id]);
    if (existingInvoice.length > 0) {
      return NextResponse.json(
        { message: `Invoice with ID ${newInvoiceData.id} already exists.` },
        { status: 409 }
      );
    }
    
    const now = new Date();
    let formattedDueDate: string;
    try {
        const parsedClientDueDate = parseISO(newInvoiceData.dueDate);
        if (!isValid(parsedClientDueDate)) throw new Error('Invalid client dueDate format');
        formattedDueDate = format(parsedClientDueDate, 'yyyy-MM-dd');
    } catch (e) {
        console.warn(`[API POST /api/invoices] Invalid dueDate from client: ${newInvoiceData.dueDate}. Defaulting. Error: ${(e as Error).message}`);
        formattedDueDate = format(now, 'yyyy-MM-dd');
    }
    
    let formattedCreatedAt: string;
    if (newInvoiceData.createdAt && isValid(parseISO(newInvoiceData.createdAt))) {
        formattedCreatedAt = ensureISOFormat(newInvoiceData.createdAt, 'createdAtPOST') || formatISO(now);
    } else {
        formattedCreatedAt = formatISO(now);
    }


    const invoiceToStore: Invoice = {
      id: newInvoiceData.id,
      leadId: newInvoiceData.leadId,
      clientName: newInvoiceData.clientName,
      amount: Number(newInvoiceData.amount),
      dueDate: formattedDueDate, // This will be 'YYYY-MM-DD' string for DB
      status: newInvoiceData.status,
      createdAt: formattedCreatedAt, // This will be full ISO string for DB
    };
    
    console.log('[API POST /api/invoices] Invoice object to store:', invoiceToStore);
    const result: any = await query(
      'INSERT INTO invoices (id, leadId, clientName, amount, dueDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        invoiceToStore.id, invoiceToStore.leadId, invoiceToStore.clientName, invoiceToStore.amount,
        invoiceToStore.dueDate, 
        invoiceToStore.status, invoiceToStore.createdAt
      ]
    );
    console.log('[API POST /api/invoices] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      const createdInvoiceDb: any[] = await query('SELECT * FROM invoices WHERE id = ?', [invoiceToStore.id]);
      if (createdInvoiceDb.length > 0) {
          const dbInv = createdInvoiceDb[0];
          const parsedDbDueDate = dbInv.dueDate ? ensureISOFormat(dbInv.dueDate, 'dueDatePOSTFetch') : null;
          const parsedDbCreatedAt = dbInv.createdAt ? ensureISOFormat(dbInv.createdAt, 'createdAtPOSTFetch') : null;

          const finalInvoice: Invoice = {
              id: String(dbInv.id || ''),
              leadId: dbInv.leadId || '',
              clientName: dbInv.clientName || '',
              amount: parseFloat(dbInv.amount || 0),
              dueDate: parsedDbDueDate || formatISO(new Date()),
              status: (dbInv.status || 'Pending') as Invoice['status'],
              createdAt: parsedDbCreatedAt || formatISO(new Date()),
          };
          console.log('[API POST /api/invoices] Successfully created invoice:', finalInvoice.id);
          return NextResponse.json(finalInvoice, { status: 201 });
      }
      console.warn('[API POST /api/invoices] Invoice inserted, but failed to fetch for confirmation.');
      const responseInvoice = { ...invoiceToStore, dueDate: ensureISOFormat(invoiceToStore.dueDate, 'dueDatePOSTFallback') || formatISO(new Date()) };
      return NextResponse.json(responseInvoice, { status: 201 });
    } else {
      throw new Error('Failed to insert invoice into database');
    }
  } catch (error) {
    console.error('[API POST /api/invoices] Failed to create invoice:', error);
    return NextResponse.json(
      { message: 'Failed to create invoice', error: (error as Error).message },
      { status: 500 }
    );
  }
}

