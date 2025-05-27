// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { formatISO } from 'date-fns';
// import { query } from '@/lib/db'; // You'll need to implement this

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query: SELECT * FROM invoices ORDER BY createdAt DESC
    // Example: const invoicesData = await query('SELECT * FROM invoices ORDER BY createdAt DESC');
    const invoices: Invoice[] = []; // Replace with actual data from DB
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
    const newInvoiceData = await request.json() as Omit<Invoice, 'createdAt'> & { createdAt?: string }; // Allow optional createdAt

    // Basic validation
    if (
      !newInvoiceData.id ||
      !newInvoiceData.leadId ||
      !newInvoiceData.clientName ||
      newInvoiceData.amount === undefined || // Check for undefined explicitly for numbers
      !newInvoiceData.dueDate ||
      !newInvoiceData.status
    ) {
      return NextResponse.json(
        { message: 'Missing required invoice fields (id, leadId, clientName, amount, dueDate, status)' },
        { status: 400 }
      );
    }

    // TODO: Check if invoice with this ID already exists in the database
    // Example: const existingInvoice = await query('SELECT id FROM invoices WHERE id = ?', [newInvoiceData.id]);
    // if (existingInvoice.length > 0) {
    //   return NextResponse.json(
    //     { message: `Invoice with ID ${newInvoiceData.id} already exists.` },
    //     { status: 409 }
    //   );
    // }
    
    const invoiceToStore: Invoice = {
      id: newInvoiceData.id,
      leadId: newInvoiceData.leadId,
      clientName: newInvoiceData.clientName,
      amount: Number(newInvoiceData.amount),
      dueDate: newInvoiceData.dueDate, // Ensure this is a valid ISO date string
      status: newInvoiceData.status,
      createdAt: newInvoiceData.createdAt || formatISO(new Date()), // Default to now if not provided
    };

    // TODO: Implement MySQL query to insert invoiceToStore
    // Example: const result = await query('INSERT INTO invoices SET ?', invoiceToStore);
    // if (result.affectedRows === 1) {
    //   return NextResponse.json(invoiceToStore, { status: 201 });
    // } else {
    //   throw new Error('Failed to insert invoice into database');
    // }

    // Placeholder response
    return NextResponse.json(invoiceToStore, { status: 201 });

  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { message: 'Failed to create invoice', error: (error as Error).message },
      { status: 500 }
    );
  }
}
