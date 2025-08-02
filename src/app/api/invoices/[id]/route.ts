
// src/app/api/invoices/[id]/route.ts
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

function buildInvoiceUpdateSetClause(data: Partial<Omit<Invoice, 'id' | 'createdAt'>>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Omit<Invoice, 'id' | 'createdAt'>)[] = [
    'leadId', 'clientName', 'amount', 'dueDate', 'status'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (key === 'dueDate' && typeof value === 'string') {
        try {
          const parsedClientDueDate = parseISO(value);
          if (!isValid(parsedClientDueDate)) throw new Error('Invalid client dueDate format for update');
          valuesToUpdate.push(format(parsedClientDueDate, 'yyyy-MM-dd'));
        } catch (e) {
          fieldsToUpdate.pop(); 
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
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const invoiceDataDb: any = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    
    if (invoiceDataDb.length > 0) {
      const dbInvoice = invoiceDataDb[0];
      const invoice: Invoice = {
        id: String(dbInvoice.id || ''), leadId: dbInvoice.leadId || '', clientName: dbInvoice.clientName || '',
        amount: parseFloat(dbInvoice.amount || 0),
        dueDate: ensureISOFormat(dbInvoice.dueDate, 'dueDate') || formatISO(new Date()),
        status: (dbInvoice.status || 'Pending') as Invoice['status'],
        createdAt: ensureISOFormat(dbInvoice.createdAt, 'createdAt') || formatISO(new Date()),
      };
      return NextResponse.json(invoice, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API GET /api/invoices/${id}] Failed to fetch invoice:`, error);
    return NextResponse.json({ message: 'Failed to fetch invoice', error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const updatedInvoiceData = await request.json() as Partial<Omit<Invoice, 'id' | 'createdAt'>>;

    const existingInvoiceResult: any = await query('SELECT id FROM invoices WHERE id = ?', [id]);
    if (existingInvoiceResult.length === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    const { clause, values } = buildInvoiceUpdateSetClause(updatedInvoiceData);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update or invalid date format provided.' }, { status: 400 });
    }
    values.push(id); 
    
    const result: any = await query(`UPDATE invoices SET ${clause} WHERE id = ?`, values);
    
    const updatedInvoiceFromDbResult: any[] = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (updatedInvoiceFromDbResult.length > 0) {
        const dbInv = updatedInvoiceFromDbResult[0];
        const finalUpdatedInvoice: Invoice = {
            id: String(dbInv.id || ''), leadId: dbInv.leadId || '', clientName: dbInv.clientName || '',
            amount: parseFloat(dbInv.amount || 0),
            dueDate: ensureISOFormat(dbInv.dueDate, 'dueDatePUTFetch') || formatISO(new Date()),
            status: (dbInv.status || 'Pending') as Invoice['status'],
            createdAt: ensureISOFormat(dbInv.createdAt, 'createdAtPUTFetch') || formatISO(new Date()),
        };
        return NextResponse.json(finalUpdatedInvoice, { status: 200 });
    }
    return NextResponse.json({ message: 'Invoice updated, but failed to fetch confirmation.' }, { status: 500 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API PUT /api/invoices/${id}] Failed to update invoice:`, error);
    return NextResponse.json({ message: 'Failed to update invoice', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const result: any = await query('DELETE FROM invoices WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API DELETE /api/invoices/${id}] Failed to delete invoice:`, error);
    return NextResponse.json({ message: 'Failed to delete invoice', error: errorMessage }, { status: 500 });
  }
}
