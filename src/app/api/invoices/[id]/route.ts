
// src/app/api/invoices/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, format } from 'date-fns';

const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    if (isValid(dateString)) return formatISO(dateString);
    return null;
  }
  try {
    const parsedISO = parseISO(dateString);
    if (isValid(parsedISO)) return formatISO(parsedISO);
    
    const parts = dateString.split(/[\/\-T ]/);
    if (parts.length >= 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            const simpleDate = new Date(year, month -1, day);
            if (isValid(simpleDate)) return formatISO(simpleDate);
        }
    }
    return dateString;
  } catch {
    return dateString;
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
      if (key === 'dueDate' && value) {
        // Ensure dueDate is formatted as YYYY-MM-DD for MySQL DATE column
        valuesToUpdate.push(format(parseISO(value as string), 'yyyy-MM-dd'));
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
      const invoice: Invoice = {
        id: String(dbInvoice.id || ''),
        leadId: dbInvoice.leadId || '',
        clientName: dbInvoice.clientName || '',
        amount: parseFloat(dbInvoice.amount || 0),
        dueDate: dbInvoice.dueDate ? ensureISOFormat(dbInvoice.dueDate)! : formatISO(new Date()),
        status: (dbInvoice.status || 'Pending') as Invoice['status'],
        createdAt: dbInvoice.createdAt ? ensureISOFormat(dbInvoice.createdAt)! : formatISO(new Date()),
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
       console.log(`[API PUT /api/invoices/${id}] No valid fields to update.`);
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause
    
    console.log(`[API PUT /api/invoices/${id}] SQL: UPDATE invoices SET ${clause} WHERE id = ?`, 'Params:', values);
    const result: any = await query(`UPDATE invoices SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/invoices/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/invoices/${id}] Invoice not found during update or no changes made.`);
    }
    
    const updatedInvoiceFromDb: any[] = await query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (updatedInvoiceFromDb.length > 0) {
        const dbInv = updatedInvoiceFromDb[0];
        const finalUpdatedInvoice: Invoice = {
            id: String(dbInv.id || ''),
            leadId: dbInv.leadId || '',
            clientName: dbInv.clientName || '',
            amount: parseFloat(dbInv.amount || 0),
            dueDate: dbInv.dueDate ? ensureISOFormat(dbInv.dueDate)! : formatISO(new Date()),
            status: (dbInv.status || 'Pending') as Invoice['status'],
            createdAt: dbInv.createdAt ? ensureISOFormat(dbInv.createdAt)! : formatISO(new Date()),
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
