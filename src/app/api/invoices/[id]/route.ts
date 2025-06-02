
// src/app/api/invoices/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, format } from 'date-fns';

const ensureISOFormat = (dateSource?: string | Date, fieldName?: string): string | null => {
  if (!dateSource) return null;

  if (dateSource instanceof Date) {
    if (isValid(dateSource)) return formatISO(dateSource);
    console.warn(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: Received invalid Date object:`, dateSource);
    return null;
  }

  if (typeof dateSource === 'string') {
    try {
      const parsedDate = parseISO(dateSource); 
      if (isValid(parsedDate)) {
        return formatISO(parsedDate); 
      } else {
        console.warn(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: Failed to parse date string "${dateSource}" using parseISO. Returning null.`);
        return null; 
      }
    } catch (e) {
      console.error(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: Exception parsing date string "${dateSource}". Error:`, (e as Error).message);
      return null; 
    }
  }

  console.warn(`[API Invoices ensureISOFormat - ${fieldName || 'unknown field'}]: dateSource is not a string or Date object. Value:`, dateSource);
  return null;
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
      if (key === 'dueDate' && typeof value === 'string') {
        try {
          const parsedClientDueDate = parseISO(value);
          if (!isValid(parsedClientDueDate)) throw new Error('Invalid client dueDate format for update');
          valuesToUpdate.push(format(parsedClientDueDate, 'yyyy-MM-dd'));
        } catch (e) {
          console.warn(`[API PUT /invoices] Invalid dueDate for update: ${value}. Skipping update for this field. Error: ${(e as Error).message}`);
          // Remove the field from update if parsing fails to prevent DB error
          fieldsToUpdate.pop(); 
        }
      } else if (key === 'amount') {
        valuesToUpdate.push(Number(value));
      } else if (value === '' && (key === 'leadId' || key === 'clientName')) {
        valuesToUpdate.push(null);
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
    console.log(`[API GET /api/invoices/${id}] Received request`);
    const invoiceDataDb: any = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    
    if (invoiceDataDb.length > 0) {
      const dbInvoice = invoiceDataDb[0];
      const parsedDueDate = dbInvoice.dueDate ? ensureISOFormat(dbInvoice.dueDate, 'dueDate') : null;
      const parsedCreatedAt = dbInvoice.createdAt ? ensureISOFormat(dbInvoice.createdAt, 'createdAt') : null;

      const invoice: Invoice = {
        id: String(dbInvoice.id || ''),
        leadId: dbInvoice.leadId || '',
        clientName: dbInvoice.clientName || '',
        amount: parseFloat(dbInvoice.amount || 0),
        dueDate: parsedDueDate || formatISO(new Date()),
        status: (dbInvoice.status || 'Pending') as Invoice['status'],
        createdAt: parsedCreatedAt || formatISO(new Date()),
      };
      console.log(`[API GET /api/invoices/${id}] Invoice found:`, invoice);
      return NextResponse.json(invoice, { status: 200 });
    } else {
      console.log(`[API GET /api/invoices/${id}] Invoice not found.`);
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`[API GET /api/invoices/${params.id}] Failed to fetch invoice:`, error);
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
    console.log(`[API PUT /api/invoices/${id}] Received updatedInvoiceData:`, updatedInvoiceData);


    const existingInvoiceResult: any = await query('SELECT id FROM invoices WHERE id = ?', [id]);
    if (existingInvoiceResult.length === 0) {
      console.log(`[API PUT /api/invoices/${id}] Invoice not found for update.`);
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    const { clause, values } = buildInvoiceUpdateSetClause(updatedInvoiceData);

    if (clause.length === 0) {
       console.log(`[API PUT /api/invoices/${id}] No valid fields to update or dueDate parsing failed.`);
       return NextResponse.json({ message: 'No valid fields to update or invalid date format provided.' }, { status: 400 });
    }
    values.push(id); 
    
    console.log(`[API PUT /api/invoices/${id}] SQL: UPDATE invoices SET ${clause} WHERE id = ?`, 'Params:', values);
    const result: any = await query(`UPDATE invoices SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/invoices/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/invoices/${id}] Invoice not found during update or no changes made.`);
    }
    
    const updatedInvoiceFromDbResult: any[] = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (updatedInvoiceFromDbResult.length > 0) {
        const dbInv = updatedInvoiceFromDbResult[0];
        const parsedDbDueDate = dbInv.dueDate ? ensureISOFormat(dbInv.dueDate, 'dueDatePUTFetch') : null;
        const parsedDbCreatedAt = dbInv.createdAt ? ensureISOFormat(dbInv.createdAt, 'createdAtPUTFetch') : null;

        const finalUpdatedInvoice: Invoice = {
            id: String(dbInv.id || ''),
            leadId: dbInv.leadId || '',
            clientName: dbInv.clientName || '',
            amount: parseFloat(dbInv.amount || 0),
            dueDate: parsedDbDueDate || formatISO(new Date()),
            status: (dbInv.status || 'Pending') as Invoice['status'],
            createdAt: parsedDbCreatedAt || formatISO(new Date()),
        };
        console.log(`[API PUT /api/invoices/${id}] Successfully updated invoice.`);
        return NextResponse.json(finalUpdatedInvoice, { status: 200 });
    }
    console.error(`[API PUT /api/invoices/${id}] Invoice updated, but failed to fetch confirmation.`);
    return NextResponse.json({ message: 'Invoice updated, but failed to fetch confirmation.' }, { status: 200 });


  } catch (error) {
    console.error(`[API PUT /api/invoices/${params.id}] Failed to update invoice:`, error);
    return NextResponse.json({ message: 'Failed to update invoice', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API DELETE /api/invoices/${id}] Attempting to delete invoice.`);
    const result: any = await query('DELETE FROM invoices WHERE id = ?', [id]);
    console.log(`[API DELETE /api/invoices/${id}] DB Delete Result:`, result);
    
    if (result.affectedRows === 0) {
      console.warn(`[API DELETE /api/invoices/${id}] Invoice not found for deletion.`);
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    console.log(`[API DELETE /api/invoices/${id}] Successfully deleted invoice.`);
    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /api/invoices/${params.id}] Failed to delete invoice:`, error);
    return NextResponse.json({ message: 'Failed to delete invoice', error: (error as Error).message }, { status: 500 });
  }
}

