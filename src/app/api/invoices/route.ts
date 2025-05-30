
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, format } from 'date-fns';

// Helper to ensure date strings are in a consistent format for DB or client
const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    if (isValid(dateString)) return formatISO(dateString);
    return null;
  }
  try {
    // Try parsing as ISO first
    const parsedISO = parseISO(dateString);
    if (isValid(parsedISO)) return formatISO(parsedISO);
    
    // If not ISO, try common formats like YYYY-MM-DD (often from DATE column)
    // For a DATE column, mysql2 might return a string like 'YYYY-MM-DD' or a Date obj at midnight UTC.
    // If it's already 'YYYY-MM-DD', parseISO will handle it.
    // If it's a Date object, formatISO handles it.
    // This is mostly a fallback if the string is not a full ISO.
    const parts = dateString.split(/[\/\-T ]/); // Split by common date/time delimiters
    if (parts.length >= 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const simpleDate = new Date(year, month -1, day);
            if (isValid(simpleDate)) return formatISO(simpleDate);
        }
    }
    return dateString; // Return original if cannot parse confidently
  } catch(e) {
    return dateString; // Return original on error
  }
};

export async function GET(request: NextRequest) {
  console.log('[API GET /api/invoices] Received request');
  try {
    const invoicesDataDb: any[] = await query('SELECT * FROM invoices ORDER BY createdAt DESC');
    console.log('[API GET /api/invoices] Raw DB Data (first item):', invoicesDataDb.length > 0 ? invoicesDataDb[0] : 'No invoices from DB');
    
    const invoices: Invoice[] = invoicesDataDb.map(inv => ({
      id: String(inv.id || ''),
      leadId: inv.leadId || '',
      clientName: inv.clientName || '',
      amount: parseFloat(inv.amount || 0),
      // For dueDate, which is DATE in DB, ensureISOFormat will convert to full ISO string
      dueDate: inv.dueDate ? ensureISOFormat(inv.dueDate)! : formatISO(new Date()),
      status: (inv.status || 'Pending') as Invoice['status'],
      createdAt: inv.createdAt ? ensureISOFormat(inv.createdAt)! : formatISO(new Date()),
    }));

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
    // dueDate from client is ISO string, format to YYYY-MM-DD for MySQL DATE column
    const formattedDueDate = newInvoiceData.dueDate ? format(parseISO(newInvoiceData.dueDate), 'yyyy-MM-dd') : format(now, 'yyyy-MM-dd');
    // createdAt from client is ISO string, or use current time. MySQL DATETIME column can take full ISO.
    const formattedCreatedAt = newInvoiceData.createdAt && isValid(parseISO(newInvoiceData.createdAt)) 
                               ? ensureISOFormat(newInvoiceData.createdAt)! 
                               : formatISO(now);

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
        invoiceToStore.dueDate, // YYYY-MM-DD format
        invoiceToStore.status, invoiceToStore.createdAt // Full ISO string
      ]
    );
    console.log('[API POST /api/invoices] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      // Fetch and return for consistency, ensure dueDate is also ISO formatted for client
      const createdInvoiceDb: any[] = await query('SELECT * FROM invoices WHERE id = ?', [invoiceToStore.id]);
      if (createdInvoiceDb.length > 0) {
          const dbInv = createdInvoiceDb[0];
          const finalInvoice: Invoice = {
              ...dbInv,
              amount: parseFloat(dbInv.amount || 0),
              dueDate: dbInv.dueDate ? ensureISOFormat(dbInv.dueDate)! : formatISO(new Date()),
              createdAt: dbInv.createdAt ? ensureISOFormat(dbInv.createdAt)! : formatISO(new Date()),
          };
          console.log('[API POST /api/invoices] Successfully created invoice:', finalInvoice.id);
          return NextResponse.json(finalInvoice, { status: 201 });
      }
      console.warn('[API POST /api/invoices] Invoice inserted, but failed to fetch for confirmation.');
      // Adjust invoiceToStore.dueDate to full ISO for client if returning this fallback
      invoiceToStore.dueDate = ensureISOFormat(invoiceToStore.dueDate)!;
      return NextResponse.json(invoiceToStore, { status: 201 });
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
