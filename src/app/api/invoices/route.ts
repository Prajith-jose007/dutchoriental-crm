
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, format } from 'date-fns';

const ensureISOFormat = (dateSource?: string | Date): string | null => {
  if (!dateSource) return null;
  if (dateSource instanceof Date) {
    return isValid(dateSource) ? formatISO(dateSource) : null;
  }
  if (typeof dateSource === 'string') {
    const parsedDate = parseISO(dateSource);
    return isValid(parsedDate) ? formatISO(parsedDate) : null;
  }
  return null;
};

export async function GET() {
  try {
    const invoicesDataDb = (await query('SELECT * FROM invoices ORDER BY createdAt DESC')) as Record<string, any>[];

    const invoices: Invoice[] = invoicesDataDb.map(inv => ({
      id: String(inv.id || ''),
      leadId: inv.leadId || '',
      clientName: inv.clientName || '',
      amount: parseFloat(inv.amount || 0),
      dueDate: ensureISOFormat(inv.dueDate) || formatISO(new Date()),
      status: (inv.status || 'Pending') as Invoice['status'],
      createdAt: ensureISOFormat(inv.createdAt) || formatISO(new Date()),
    }));

    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/invoices] Failed to fetch invoices:', error);
    return NextResponse.json({ message: `Failed to fetch invoices: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newInvoiceData = await request.json() as Omit<Invoice, 'createdAt'> & { createdAt?: string };

    if (!newInvoiceData.id || !newInvoiceData.leadId || !newInvoiceData.clientName || newInvoiceData.amount === undefined || !newInvoiceData.dueDate || !newInvoiceData.status) {
      return NextResponse.json({ message: 'Missing required invoice fields' }, { status: 400 });
    }

    const existingInvoice = (await query('SELECT id FROM invoices WHERE id = ?', [newInvoiceData.id])) as Record<string, any>[];
    if (existingInvoice.length > 0) {
      return NextResponse.json({ message: `An invoice for booking ID ${newInvoiceData.leadId} already exists with ID ${newInvoiceData.id}.` }, { status: 409 });
    }

    const now = new Date();
    const parsedClientDueDate = parseISO(newInvoiceData.dueDate);
    if (!isValid(parsedClientDueDate)) {
      return NextResponse.json({ message: 'Invalid due date format provided.' }, { status: 400 });
    }
    const formattedDueDate = format(parsedClientDueDate, 'yyyy-MM-dd');

    const formattedCreatedAt = ensureISOFormat(newInvoiceData.createdAt) || formatISO(now);

    const invoiceToStore: Invoice = {
      id: newInvoiceData.id,
      leadId: newInvoiceData.leadId,
      clientName: newInvoiceData.clientName,
      amount: Number(newInvoiceData.amount),
      dueDate: formattedDueDate,
      status: newInvoiceData.status,
      createdAt: formattedCreatedAt,
    };

    const result = (await query(
      'INSERT INTO invoices (id, leadId, clientName, amount, dueDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        invoiceToStore.id, invoiceToStore.leadId, invoiceToStore.clientName, invoiceToStore.amount,
        invoiceToStore.dueDate, invoiceToStore.status, invoiceToStore.createdAt
      ]
    )) as { affectedRows: number };

    if (result.affectedRows === 1) {
      const createdInvoiceDb = (await query('SELECT * FROM invoices WHERE id = ?', [invoiceToStore.id])) as Record<string, any>[];
      if (createdInvoiceDb.length > 0) {
        const dbInv = createdInvoiceDb[0];
        const finalInvoice: Invoice = {
          id: String(dbInv.id || ''), leadId: dbInv.leadId || '', clientName: dbInv.clientName || '',
          amount: parseFloat(dbInv.amount || 0),
          dueDate: ensureISOFormat(dbInv.dueDate) || formatISO(new Date()),
          status: (dbInv.status || 'Pending') as Invoice['status'],
          createdAt: ensureISOFormat(dbInv.createdAt) || formatISO(new Date()),
        };
        return NextResponse.json(finalInvoice, { status: 201 });
      }
    }
    throw new Error('Failed to insert invoice into database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API POST /api/invoices] Failed to create invoice:', error);
    return NextResponse.json({ message: `Failed to create invoice: ${errorMessage}` }, { status: 500 });
  }
}
