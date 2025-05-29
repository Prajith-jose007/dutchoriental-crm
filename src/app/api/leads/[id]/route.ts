
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    if (isValid(dateString)) return formatISO(dateString);
    return null;
  }
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return formatISO(parsed);
    return dateString; 
  } catch {
    return dateString;
  }
};

function buildLeadUpdateSetClause(data: Partial<Lead>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Lead)[] = [
    'clientName', 'agent', 'yacht', 'status', 'month', 'notes', 'type', 'invoiceId', 'modeOfPayment',
    'qty_childRate', 'qty_adultStandardRate', 'qty_adultStandardDrinksRate',
    'qty_vipChildRate', 'qty_vipAdultRate', 'qty_vipAdultDrinksRate',
    'qty_royalChildRate', 'qty_royalAdultRate', 'qty_royalDrinksRate',
    'othersAmtCake', 
    'totalAmount', 'commissionPercentage', 'commissionAmount',
    'netAmount', 'paidAmount', 'balanceAmount', 'updatedAt', 
    'lastModifiedByUserId', 'ownerUserId'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Lead) && value !== undefined) {
      fieldsToUpdate.push(\`\`\${key}\`\` = ?); 
      if (['month', 'updatedAt', 'createdAt'].includes(key)) {
        valuesToUpdate.push(ensureISOFormat(value as string) || null);
      } else if (typeof value === 'string' && value.trim() === '' && 
                 ['notes', 'invoiceId', 'lastModifiedByUserId', 'ownerUserId'].includes(key)) {
        valuesToUpdate.push(null); 
      } else if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(0); 
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
    const leadDataDb: any[] = await query('SELECT * FROM leads WHERE id = ?', [id]);
    
    if (leadDataDb.length > 0) {
      const dbLead = leadDataDb[0];
      const lead: Lead = {
        id: dbLead.id,
        clientName: dbLead.clientName,
        agent: dbLead.agent,
        yacht: dbLead.yacht,
        status: dbLead.status as LeadStatus,
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : new Date().toISOString(),
        notes: dbLead.notes,
        type: dbLead.type,
        invoiceId: dbLead.invoiceId,
        modeOfPayment: dbLead.modeOfPayment as ModeOfPayment,
        qty_childRate: Number(dbLead.qty_childRate || 0),
        qty_adultStandardRate: Number(dbLead.qty_adultStandardRate || 0),
        qty_adultStandardDrinksRate: Number(dbLead.qty_adultStandardDrinksRate || 0),
        qty_vipChildRate: Number(dbLead.qty_vipChildRate || 0),
        qty_vipAdultRate: Number(dbLead.qty_vipAdultRate || 0),
        qty_vipAdultDrinksRate: Number(dbLead.qty_vipAdultDrinksRate || 0),
        qty_royalChildRate: Number(dbLead.qty_royalChildRate || 0),
        qty_royalAdultRate: Number(dbLead.qty_royalAdultRate || 0),
        qty_royalDrinksRate: Number(dbLead.qty_royalDrinksRate || 0),
        othersAmtCake: Number(dbLead.othersAmtCake || 0),
        totalAmount: parseFloat(dbLead.totalAmount || 0),
        commissionPercentage: parseFloat(dbLead.commissionPercentage || 0),
        commissionAmount: parseFloat(dbLead.commissionAmount || 0),
        netAmount: parseFloat(dbLead.netAmount || 0),
        paidAmount: parseFloat(dbLead.paidAmount || 0),
        balanceAmount: parseFloat(dbLead.balanceAmount || 0),
        createdAt: dbLead.createdAt ? ensureISOFormat(dbLead.createdAt)! : new Date().toISOString(),
        updatedAt: dbLead.updatedAt ? ensureISOFormat(dbLead.updatedAt)! : new Date().toISOString(),
        lastModifiedByUserId: dbLead.lastModifiedByUserId,
        ownerUserId: dbLead.ownerUserId,
      };
      return NextResponse.json(lead, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`[API GET /api/leads/${params.id}] Error:`, error);
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
    console.log(`[API PUT /api/leads/${id}] Received updatedLeadData:`, JSON.stringify(updatedLeadData, null, 2));

    const existingLeadResult: any[] = await query('SELECT * FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    const existingLead = existingLeadResult[0];

    const dataToUpdate: Partial<Lead> = {
      ...updatedLeadData,
      updatedAt: formatISO(new Date()), 
    };
    
    if (dataToUpdate.month && typeof dataToUpdate.month === 'string') { 
        dataToUpdate.month = ensureISOFormat(dataToUpdate.month) || existingLead.month;
    } else if (dataToUpdate.month instanceof Date) { 
        dataToUpdate.month = formatISO(dataToUpdate.month);
    }

    const { clause, values: updateValues } = buildLeadUpdateSetClause(dataToUpdate);

    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    updateValues.push(id); 
    
    console.log(`[API PUT /api/leads/${id}] Update clause:`, clause);
    console.log(`[API PUT /api/leads/${id}] Update values:`, JSON.stringify(updateValues, null, 2));

    const result: any = await query(\`UPDATE leads SET \${clause} WHERE id = ?\`, updateValues);
    
    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/leads/${id}] Lead not found during update or no changes made.`);
       return NextResponse.json({ message: 'Lead not found during update or no changes made' }, { status: 404 });
    }
    
    const updatedLeadFromDbResult: any[] = await query('SELECT * FROM leads WHERE id = ?', [id]);
    if (updatedLeadFromDbResult.length === 0) {
        console.error(`[API PUT /api/leads/${id}] Lead updated, but failed to fetch for confirmation.`);
        return NextResponse.json({ message: 'Lead updated, but failed to fetch confirmation.' }, { status: 500 });
    }
    const dbLead = updatedLeadFromDbResult[0];
    const finalUpdatedLead: Lead = {
        id: dbLead.id, clientName: dbLead.clientName, agent: dbLead.agent, yacht: dbLead.yacht, status: dbLead.status as LeadStatus,
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : new Date().toISOString(), notes: dbLead.notes, type: dbLead.type, invoiceId: dbLead.invoiceId,
        modeOfPayment: dbLead.modeOfPayment as ModeOfPayment,
        qty_childRate: Number(dbLead.qty_childRate || 0), qty_adultStandardRate: Number(dbLead.qty_adultStandardRate || 0),
        qty_adultStandardDrinksRate: Number(dbLead.qty_adultStandardDrinksRate || 0), qty_vipChildRate: Number(dbLead.qty_vipChildRate || 0),
        qty_vipAdultRate: Number(dbLead.qty_vipAdultRate || 0), qty_vipAdultDrinksRate: Number(dbLead.qty_vipAdultDrinksRate || 0),
        qty_royalChildRate: Number(dbLead.qty_royalChildRate || 0), qty_royalAdultRate: Number(dbLead.qty_royalAdultRate || 0),
        qty_royalDrinksRate: Number(dbLead.qty_royalDrinksRate || 0), othersAmtCake: Number(dbLead.othersAmtCake || 0),
        totalAmount: parseFloat(dbLead.totalAmount || 0), commissionPercentage: parseFloat(dbLead.commissionPercentage || 0),
        commissionAmount: parseFloat(dbLead.commissionAmount || 0), netAmount: parseFloat(dbLead.netAmount || 0),
        paidAmount: parseFloat(dbLead.paidAmount || 0), balanceAmount: parseFloat(dbLead.balanceAmount || 0),
        createdAt: dbLead.createdAt ? ensureISOFormat(dbLead.createdAt)! : new Date().toISOString(),
        updatedAt: dbLead.updatedAt ? ensureISOFormat(dbLead.updatedAt)! : new Date().toISOString(),
        lastModifiedByUserId: dbLead.lastModifiedByUserId, ownerUserId: dbLead.ownerUserId,
    };
    console.log(`[API PUT /api/leads/${id}] Successfully updated lead:`, finalUpdatedLead.id);
    return NextResponse.json(finalUpdatedLead, { status: 200 });

  } catch (error) {
    console.error(`[API PUT /api/leads/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to update lead', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API DELETE /api/leads/${id}] Attempting to delete lead.`);
    const result: any = await query('DELETE FROM leads WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      console.warn(`[API DELETE /api/leads/${id}] Lead not found for deletion.`);
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    console.log(`[API DELETE /api/leads/${id}] Successfully deleted lead.`);
    return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API DELETE /api/leads/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to delete lead', error: (error as Error).message }, { status: 500 });
  }
}
