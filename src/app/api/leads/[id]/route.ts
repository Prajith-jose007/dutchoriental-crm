
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
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

function buildLeadUpdateSetClause(data: Partial<Lead>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  // Explicitly list all updatable fields from Lead type
  const allowedKeys: (keyof Lead)[] = [
    'clientName', 'agent', 'status', 'month', 'notes', 'yacht', 'type', 'invoiceId', 'modeOfPayment',
    'qty_childRate', 'qty_adultStandardRate', 'qty_adultStandardDrinksRate',
    'qty_vipChildRate', 'qty_vipAdultRate', 'qty_vipAdultDrinksRate',
    'qty_royalChildRate', 'qty_royalAdultRate', 'qty_royalDrinksRate',
    'othersAmtCake', 'totalAmount', 'commissionPercentage', 'commissionAmount',
    'netAmount', 'paidAmount', 'balanceAmount', 'updatedAt', 'lastModifiedByUserId', 'ownerUserId'
    // 'id' and 'createdAt' should generally not be updated
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Lead) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (['month', 'updatedAt'].includes(key)) {
        valuesToUpdate.push(ensureISOFormat(value as string) || null);
      } else if (typeof value === 'string' && value.trim() === '') {
        valuesToUpdate.push(null); // Treat empty strings as NULL for optional text fields
      } else if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(0); // Default NaN numbers to 0
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
    const leadDataDb: any = await query('SELECT * FROM leads WHERE id = ?', [id]);
    
    if (leadDataDb.length > 0) {
      const dbLead = leadDataDb[0];
      const lead: Lead = {
        ...dbLead,
        month: ensureISOFormat(dbLead.month) || new Date().toISOString(),
        createdAt: ensureISOFormat(dbLead.createdAt) || new Date().toISOString(),
        updatedAt: ensureISOFormat(dbLead.updatedAt) || new Date().toISOString(),
        dhowChildQty: Number(dbLead.dhowChildQty || 0),
        dhowAdultQty: Number(dbLead.dhowAdultQty || 0),
        // ... (ensure all numeric fields are correctly parsed)
        totalAmount: parseFloat(dbLead.totalAmount || 0),
        commissionPercentage: parseFloat(dbLead.commissionPercentage || 0),
        commissionAmount: parseFloat(dbLead.commissionAmount || 0),
        netAmount: parseFloat(dbLead.netAmount || 0),
        paidAmount: parseFloat(dbLead.paidAmount || 0),
        balanceAmount: parseFloat(dbLead.balanceAmount || 0),
      };
      return NextResponse.json(lead, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch lead', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedLeadData = await request.json() as Partial<Lead>;

    const existingLeadResult: any = await query('SELECT * FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    const existingLead = existingLeadResult[0];

    // Prepare data for update, ensuring 'updatedAt' is set
    const dataToUpdate: Partial<Lead> = {
      ...updatedLeadData,
      updatedAt: new Date().toISOString(),
    };
    if (dataToUpdate.month) {
        dataToUpdate.month = ensureISOFormat(dataToUpdate.month) || existingLead.month;
    }


    const { clause, values } = buildLeadUpdateSetClause(dataToUpdate);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause
    
    const result: any = await query(`UPDATE leads SET ${clause} WHERE id = ?`, values);
    
    if (result.affectedRows === 0) {
       return NextResponse.json({ message: 'Lead not found during update or no changes made' }, { status: 404 });
    }
    
    // Fetch the updated lead to return it
    const updatedLeadFromDb: any = await query('SELECT * FROM leads WHERE id = ?', [id]);
    const finalUpdatedLead: Lead = {
        ...updatedLeadFromDb[0],
        month: ensureISOFormat(updatedLeadFromDb[0].month) || new Date().toISOString(),
        createdAt: ensureISOFormat(updatedLeadFromDb[0].createdAt) || new Date().toISOString(),
        updatedAt: ensureISOFormat(updatedLeadFromDb[0].updatedAt) || new Date().toISOString(),
        // ... (ensure all numeric fields are correctly parsed)
        totalAmount: parseFloat(updatedLeadFromDb[0].totalAmount || 0),
    };
    return NextResponse.json(finalUpdatedLead, { status: 200 });

  } catch (error) {
    console.error(`Failed to update lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update lead', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const result: any = await query('DELETE FROM leads WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete lead', error: (error as Error).message }, { status: 500 });
  }
}
