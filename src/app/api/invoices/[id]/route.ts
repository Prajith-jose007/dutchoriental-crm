// src/app/api/invoices/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
// import { query } from '@/lib/db'; // You'll need to implement this

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Implement MySQL query to fetch invoice by ID
    // Example: const invoiceData = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    // const invoice = invoiceData[0] || null;
    const invoice: Invoice | null = null; // Placeholder

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
    const updatedInvoiceData = await request.json() as Partial<Omit<Invoice, 'id' | 'createdAt'>>;

    // TODO: First, check if the invoice exists
    // Example: const existingInvoiceResult = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    // if (existingInvoiceResult.length === 0) {
    //   return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    // }
    // const invoiceToUpdate = existingInvoiceResult[0];

    const invoicePayload: Partial<Invoice> = { ...updatedInvoiceData };
    if (invoicePayload.amount !== undefined) {
      invoicePayload.amount = Number(invoicePayload.amount);
    }
    // Remove id and createdAt from payload as they should not be updated this way
    delete invoicePayload.id;
    delete invoicePayload.createdAt;

    // TODO: Implement MySQL query to update the invoice
    // Example:
    // const fieldsToUpdate = [];
    // const valuesToUpdate = [];
    // Object.entries(invoicePayload).forEach(([key, value]) => {
    //    fieldsToUpdate.push(`${key} = ?`);
    //    valuesToUpdate.push(value);
    // });
    // if (fieldsToUpdate.length === 0) {
    //    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    // }
    // valuesToUpdate.push(id); // For the WHERE clause
    // const result = await query(`UPDATE invoices SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, valuesToUpdate);
    // if (result.affectedRows === 0) {
    //    return NextResponse.json({ message: 'Invoice not found during update or no changes made' }, { status: 404 });
    // }
    // const finalUpdatedInvoice = { ...invoiceToUpdate, ...invoicePayload, id };
    
    // Placeholder response
    const finalUpdatedInvoice = { id, createdAt: "some-iso-string", ...invoicePayload };
    return NextResponse.json(finalUpdatedInvoice, { status: 200 });

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
    // TODO: Implement MySQL query to delete invoice by ID
    // Example: const result = await query('DELETE FROM invoices WHERE id = ?', [id]);
    // const wasDeleted = result.affectedRows > 0;
    const wasDeleted = true; // Placeholder
    
    if (!wasDeleted) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete invoice ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete invoice', error: (error as Error).message }, { status: 500 });
  }
}
