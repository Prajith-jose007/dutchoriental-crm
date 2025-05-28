
// src/app/api/invoices/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

// Helper to ensure date strings are in a consistent format for DB
const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) return formatISO(dateString);
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return formatISO(parsed);
    return null;
  } catch {
    return null;
  }
};

function buildInvoiceUpdateSetClause(data: Partial<Omit<Invoice, 'id' | 'createdAt'>>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Omit<Invoice, 'id' | 'createdAt'>)[] = [
    'leadId', 'clientName', 'amount', 'dueDate', 'status'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Omit<Invoice, 'id' | 'createdAt'>) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (key === 'dueDate') {
        valuesToUpdate.push(ensureISOFormat(value as string) || null);
      } else if (key === 'amount') {
        valuesToUpdate.push(Number(value));
      }
       else {
        valuesToUpdate.push(value);
      }
    }
  });
  return { clause: fieldsToUpdate.join(', '), values: valuesToUpdate };
}


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const invoiceDataDb: any = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    
    if (invoiceDataDb.length > 0) {
      const dbInvoice = invoiceDataDb[0];
      const invoice: Invoice = {
        ...dbInvoice,
        amount: parseFloat(dbInvoice.amount),
        dueDate: ensureISOFormat(dbInvoice.dueDate) || new Date().toISOString(),
        createdAt: ensureISOFormat(dbInvoice.createdAt) || new Date().toISOString(),
      };
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

    const existingInvoiceResult: any = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (existingInvoiceResult.length === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    const { clause, values } = buildInvoiceUpdateSetClause(updatedInvoiceData);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause
    
    const result: any = await query(`UPDATE invoices SET ${clause} WHERE id = ?`, values);
    
    if (result.affectedRows === 0) {
       return NextResponse.json({ message: 'Invoice not found during update or no changes made' }, { status: 404 });
    }
    
    const updatedInvoiceFromDb: any = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    const finalUpdatedInvoice: Invoice = {
        ...updatedInvoiceFromDb[0],
        amount: parseFloat(updatedInvoiceFromDb[0].amount),
        dueDate: ensureISOFormat(updatedInvoiceFromDb[0].dueDate) || new Date().toISOString(),
        createdAt: ensureISOFormat(updatedInvoiceFromDb[0].createdAt) || new Date().toISOString(),
    };
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
    const result: any = await query('DELETE FROM invoices WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete invoice ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete invoice', error: (error as Error).message }, { status: 500 });
  }
}
