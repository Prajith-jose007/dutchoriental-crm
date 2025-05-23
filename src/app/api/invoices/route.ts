
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { placeholderInvoices } from '@/lib/placeholder-data'; // Used for initial data

// In-memory store (replace with actual database calls)
let invoices_db: Invoice[] = [...placeholderInvoices]; // Initialize with placeholder data

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query: SELECT * FROM invoices ORDER BY createdAt DESC
    const sortedInvoices = [...invoices_db].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json(sortedInvoices, { status: 200 });
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
    const newInvoice = await request.json() as Invoice;

    // Basic validation
    if (
      !newInvoice.id ||
      !newInvoice.leadId ||
      !newInvoice.clientName ||
      !newInvoice.amount ||
      !newInvoice.dueDate ||
      !newInvoice.status ||
      !newInvoice.createdAt
    ) {
      return NextResponse.json(
        { message: 'Missing required invoice fields' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database insert operation
    const existingInvoice = invoices_db.find(inv => inv.id === newInvoice.id);
    if (existingInvoice) {
      return NextResponse.json(
        { message: `Invoice with ID ${newInvoice.id} already exists.` },
        { status: 409 }
      );
    }

    invoices_db.push(newInvoice);
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { message: 'Failed to create invoice', error: (error as Error).message },
      { status: 500 }
    );
  }
}
