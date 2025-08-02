
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, format } from 'date-fns';

const ensureISOFormat = (dateSource?: string | Date, fieldName?: string): string | null => {
  if (!dateSource) return null;

  if (dateSource instanceof Date) {
    if (isValid(dateSource)) return formatISO(dateSource);
    return null;
  }

  if (typeof dateSource === 'string') {
    try {
      const parsedDate = parseISO(dateSource);
      if (isValid(parsedDate)) {
        return formatISO(parsedDate);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export async function GET(request: NextRequest) {
  try {
    const invoicesDataDb: any[] = await query('SELECT * FROM invoices ORDER BY createdAt DESC');
    
    const invoices: Invoice[] = invoicesDataDb.map(inv => ({
      id: String(inv.id || ''),
      leadId: inv.leadId || '',
      clientName: inv.clientName || '',
      amount: parseFloat(inv.amount || 0),
      dueDate: ensureISOFormat(inv.dueDate, 'dueDate') || formatISO(new Date()),
      status: (inv.status || 'Pending') as Invoice['status'],
      createdAt: ensureISOFormat(inv.createdAt, 'createdAt') || formatISO(new Date()),
    }));

    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/invoices] Failed to fetch invoices:', error);
    return NextResponse.json({ message: 'Failed to fetch invoices', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newInvoiceData = await request.json() as Omit<Invoice, 'createdAt'> & { createdAt?: string };

    if (!newInvoiceData.id || !newInvoiceData.leadId || !newInvoiceData.clientName || newInvoiceData.amount === undefined || !newInvoiceData.dueDate || !newInvoiceData.status) {
      return NextResponse.json({ message: 'Missing required invoice fields' }, { status: 400 });
    }

    const existingInvoice: any = await query('SELECT id FROM invoices WHERE id = ?', [newInvoiceData.id]);
    if (existingInvoice.length > 0) {
      return NextResponse.json({ message: `Invoice with ID ${newInvoiceData.id} already exists.` }, { status: 409 });
    }
    
    const now = new Date();
    let formattedDueDate: string;
    try {
        const parsedClientDueDate = parseISO(newInvoiceData.dueDate);
        if (!isValid(parsedClientDueDate)) throw new Error('Invalid client dueDate format');
        formattedDueDate = format(parsedClientDueDate, 'yyyy-MM-dd');
    } catch (e) {
        formattedDueDate = format(now, 'yyyy-MM-dd');
    }
    
    const formattedCreatedAt = ensureISOFormat(newInvoiceData.createdAt, 'createdAtPOST') || formatISO(now);

    const invoiceToStore: Invoice = {
      id: newInvoiceData.id, leadId: newInvoiceData.leadId, clientName: newInvoiceData.clientName,
      amount: Number(newInvoiceData.amount), dueDate: formattedDueDate, status: newInvoiceData.status,
      createdAt: formattedCreatedAt,
    };
    
    const result: any = await query(
      'INSERT INTO invoices (id, leadId, clientName, amount, dueDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        invoiceToStore.id, invoiceToStore.leadId, invoiceToStore.clientName, invoiceToStore.amount,
        invoiceToStore.dueDate, invoiceToStore.status, invoiceToStore.createdAt
      ]
    );

    if (result.affectedRows === 1) {
      const createdInvoiceDb: any[] = await query('SELECT * FROM invoices WHERE id = ?', [invoiceToStore.id]);
      if (createdInvoiceDb.length > 0) {
          const dbInv = createdInvoiceDb[0];
          const finalInvoice: Invoice = {
              id: String(dbInv.id || ''), leadId: dbInv.leadId || '', clientName: dbInv.clientName || '',
              amount: parseFloat(dbInv.amount || 0),
              dueDate: ensureISOFormat(dbInv.dueDate, 'dueDatePOSTFetch') || formatISO(new Date()),
              status: (dbInv.status || 'Pending') as Invoice['status'],
              createdAt: ensureISOFormat(dbInv.createdAt, 'createdAtPOSTFetch') || formatISO(new Date()),
          };
          return NextResponse.json(finalInvoice, { status: 201 });
      }
    }
    throw new Error('Failed to insert invoice into database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API POST /api/invoices] Failed to create invoice:', error);
    return NextResponse.json({ message: 'Failed to create invoice', error: errorMessage }, { status: 500 });
  }
}
