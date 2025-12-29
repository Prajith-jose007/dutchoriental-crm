
// src/app/api/invoices/[id]/route.ts
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

function buildInvoiceUpdateSetClause(data: Partial<Omit<Invoice, 'id' | 'createdAt'>>): { clause: string, values: unknown[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: unknown[] = [];
  const allowedKeys: (keyof Omit<Invoice, 'id' | 'createdAt'>)[] = [
    'leadId', 'clientName', 'amount', 'dueDate', 'status'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Omit<Invoice, 'id' | 'createdAt'>) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (key === 'dueDate' && typeof value === 'string') {
        const parsedClientDueDate = parseISO(value);
        if (isValid(parsedClientDueDate)) {
          valuesToUpdate.push(format(parsedClientDueDate, 'yyyy-MM-dd'));
        }
      } else if (key === 'amount') {
        valuesToUpdate.push(Number(value));
      } else if (value === '' && (key === 'leadId' || key === 'clientName')) {
        valuesToUpdate.push(null);
      } else {
        valuesToUpdate.push(value);
      }
    }
  });
  return { clause: fieldsToUpdate.join(', '), values: valuesToUpdate };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
  }

  try {
    const invoiceDataDb = (await query<Invoice[]>('SELECT * FROM invoices WHERE id = ?', [id]));

    if (invoiceDataDb.length > 0) {
      const dbInvoice = invoiceDataDb[0];
      const invoice: Invoice = {
        id: String(dbInvoice.id || ''),
        leadId: dbInvoice.leadId || '',
        clientName: dbInvoice.clientName || '',
        amount: Number(dbInvoice.amount || 0),
        dueDate: ensureISOFormat(dbInvoice.dueDate) || formatISO(new Date()),
        status: (dbInvoice.status || 'Pending') as Invoice['status'],
        createdAt: ensureISOFormat(dbInvoice.createdAt) || formatISO(new Date()),
      };
      return NextResponse.json(invoice, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API GET /api/invoices] Failed to fetch invoice:`, error);
    return NextResponse.json({ message: `Failed to fetch invoice: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Invoice ID is required for update' }, { status: 400 });
  }

  try {
    const updatedInvoiceData = await request.json() as Partial<Omit<Invoice, 'id' | 'createdAt'>>;

    const existingInvoiceResult = (await query<any[]>('SELECT id FROM invoices WHERE id = ?', [id]));
    if (existingInvoiceResult.length === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    const { clause, values } = buildInvoiceUpdateSetClause(updatedInvoiceData);
    if (clause.length === 0) {
      return NextResponse.json({ message: 'No valid fields to update or invalid date format provided.' }, { status: 400 });
    }
    values.push(id);

    await query(`UPDATE invoices SET ${clause} WHERE id = ?`, values);

    const updatedInvoiceFromDbResult = (await query<any[]>('SELECT * FROM invoices WHERE id = ?', [id]));
    if (updatedInvoiceFromDbResult.length > 0) {
      const dbInv = updatedInvoiceFromDbResult[0];
      const finalUpdatedInvoice: Invoice = {
        id: String(dbInv.id || ''),
        leadId: dbInv.leadId || '',
        clientName: dbInv.clientName || '',
        amount: parseFloat(dbInv.amount || 0),
        dueDate: ensureISOFormat(dbInv.dueDate) || formatISO(new Date()),
        status: (dbInv.status || 'Pending') as Invoice['status'],
        createdAt: ensureISOFormat(dbInv.createdAt) || formatISO(new Date()),
      };
      return NextResponse.json(finalUpdatedInvoice, { status: 200 });
    }
    return NextResponse.json({ message: 'Invoice updated, but failed to fetch confirmation.' }, { status: 500 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API PUT /api/invoices] Failed to update invoice:`, error);
    return NextResponse.json({ message: `Failed to update invoice: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Invoice ID is required for deletion' }, { status: 400 });
  }

  try {
    const result = (await query<any>('DELETE FROM invoices WHERE id = ?', [id]));

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API DELETE /api/invoices] Failed to delete invoice:`, error);
    return NextResponse.json({ message: `Failed to delete invoice: ${errorMessage}` }, { status: 500 });
  }
}
