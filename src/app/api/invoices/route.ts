
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

// Helper to ensure date strings are in a consistent format for DB or client
const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    if (isValid(dateString)) return formatISO(dateString);
    return null;
  }
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return formatISO(parsed);
    return dateString; 
  } catch(e) {
    return dateString;
  }
};

export async function GET(request: NextRequest) {
  try {
    const invoicesData: any[] = await query('SELECT * FROM invoices ORDER BY createdAt DESC');
    console.log('[API GET /api/invoices] Raw DB Data:', invoicesData);
    const invoices: Invoice[] = invoicesData.map(inv => ({
        ...inv,
        amount: parseFloat(inv.amount || 0),
        dueDate: ensureISOFormat(inv.dueDate) || new Date().toISOString(),
        createdAt: ensureISOFormat(inv.createdAt) || new Date().toISOString(),
    }));
    console.log('[API GET /api/invoices] Mapped Invoices Data:', invoices);
    return NextResponse.json(invoices, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoices', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newInvoiceData = await request.json() as Omit<Invoice, 'createdAt'> & { createdAt?: string };

    if (
      !newInvoiceData.id ||
      !newInvoiceData.leadId ||
      !newInvoiceData.clientName ||
      newInvoiceData.amount === undefined ||
      !newInvoiceData.dueDate ||
      !newInvoiceData.status
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
    const formattedDueDate = ensureISOFormat(newInvoiceData.dueDate) || formatISO(now);
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
    
    const result: any = await query(
      'INSERT INTO invoices (id, leadId, clientName, amount, dueDate, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        invoiceToStore.id, invoiceToStore.leadId, invoiceToStore.clientName, invoiceToStore.amount,
        invoiceToStore.dueDate, invoiceToStore.status, invoiceToStore.createdAt
      ]
    );

    if (result.affectedRows === 1) {
      return NextResponse.json(invoiceToStore, { status: 201 });
    } else {
      throw new Error('Failed to insert invoice into database');
    }
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { message: 'Failed to create invoice', error: (error as Error).message },
      { status: 500 }
    );
  }
}
