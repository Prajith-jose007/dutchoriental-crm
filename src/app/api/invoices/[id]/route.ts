
// src/app/api/invoices/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { placeholderInvoices } from '@/lib/placeholder-data';

// In-memory store (should be consistent with /api/invoices/route.ts)
let invoices_db: Invoice[] = [...placeholderInvoices];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Replace with actual database query: SELECT * FROM invoices WHERE id = ?
    const invoice = invoices_db.find(inv => inv.id === id);

    if (invoice) {
      return NextResponse.json(invoice, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch invoice ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch invoice', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedInvoiceData = await request.json() as Partial<Invoice>;

    // TODO: Replace with actual database update operation
    const invoiceIndex = invoices_db.findIndex(inv => inv.id === id);
    if (invoiceIndex === -1) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
    invoices_db[invoiceIndex] = { ...invoices_db[invoiceIndex], ...updatedInvoiceData, id }; // Ensure ID isn't overwritten
    const updatedInvoice = invoices_db[invoiceIndex];

    return NextResponse.json(updatedInvoice, { status: 200 });
  } catch (error) {
    console.error(`Failed to update invoice ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update invoice', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Replace with actual database delete operation
    const invoiceIndex = invoices_db.findIndex(inv => inv.id === id);
    if (invoiceIndex === -1) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
    invoices_db.splice(invoiceIndex, 1);

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete invoice ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete invoice', error: (error as Error).message }, { status: 500 });
  }
}

```