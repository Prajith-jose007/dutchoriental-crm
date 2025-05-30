
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment, LeadType, LeadPackageQuantity } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

const SIMULATED_CURRENT_USER_ID_API = 'DO-user-api'; // Placeholder

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

function buildLeadUpdateSetClause(data: Partial<Omit<Lead, 'id' | 'createdAt'>>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  
  const allowedKeys: (keyof Omit<Lead, 'id' | 'createdAt' | 'packageQuantities'> | 'package_quantities_json')[] = [
    'clientName', 'agent', 'yacht', 'status', 'month', 'notes', 'type', 'transactionId', 'modeOfPayment',
    'package_quantities_json', // Store serialized array here
    'totalAmount', 'commissionPercentage', 'commissionAmount',
    'netAmount', 'paidAmount', 'balanceAmount', 'updatedAt', 
    'lastModifiedByUserId', 'ownerUserId'
  ];

  const tempUpdatedData = { ...data } as any;
  if (data.packageQuantities) {
    tempUpdatedData.package_quantities_json = JSON.stringify(data.packageQuantities);
    delete tempUpdatedData.packageQuantities;
  }


  Object.entries(tempUpdatedData).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`); 
      if (['month', 'updatedAt'].includes(key)) {
        valuesToUpdate.push(ensureISOFormat(value as string) || null);
      } else if (typeof value === 'string' && value.trim() === '' && 
                 ['notes', 'transactionId', 'lastModifiedByUserId', 'ownerUserId', 'agent', 'yacht'].includes(key)) {
        valuesToUpdate.push(null); 
      } else if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(0);
      } else if (typeof value === 'number') {
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
    console.log(`[API GET /api/leads/${id}] Received request`);
    const leadDataDb: any[] = await query('SELECT * FROM leads WHERE id = ?', [id]);
    
    if (leadDataDb.length > 0) {
      const dbLead = leadDataDb[0];
      let packageQuantities: LeadPackageQuantity[] = [];
      if (dbLead.package_quantities_json && typeof dbLead.package_quantities_json === 'string') {
        try {
          const parsedPQs = JSON.parse(dbLead.package_quantities_json);
           if (Array.isArray(parsedPQs)) {
            packageQuantities = parsedPQs.map((pq: any) => ({
              packageId: String(pq.packageId || ''),
              packageName: String(pq.packageName || 'Unknown Package'),
              quantity: Number(pq.quantity || 0),
              rate: Number(pq.rate || 0),
            }));
          }
        } catch (e) {
          console.warn(`[API GET /api/leads/${id}] Failed to parse package_quantities_json`, e);
        }
      }

      const lead: Lead = {
        id: String(dbLead.id || ''),
        clientName: String(dbLead.clientName || ''),
        agent: String(dbLead.agent || ''),
        yacht: String(dbLead.yacht || ''),
        status: (dbLead.status || 'Upcoming') as LeadStatus,
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()),
        notes: dbLead.notes || undefined,
        type: (dbLead.type || 'Private Cruise') as LeadType,
        transactionId: dbLead.transactionId || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,
        
        packageQuantities: packageQuantities,

        totalAmount: parseFloat(dbLead.totalAmount || 0),
        commissionPercentage: parseFloat(dbLead.commissionPercentage || 0),
        commissionAmount: parseFloat(dbLead.commissionAmount || 0),
        netAmount: parseFloat(dbLead.netAmount || 0),
        paidAmount: parseFloat(dbLead.paidAmount || 0),
        balanceAmount: parseFloat(dbLead.balanceAmount || 0),

        createdAt: dbLead.createdAt ? ensureISOFormat(dbLead.createdAt)! : formatISO(new Date()),
        updatedAt: dbLead.updatedAt ? ensureISOFormat(dbLead.updatedAt)! : formatISO(new Date()),
        lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined,
        ownerUserId: dbLead.ownerUserId || undefined,
      };
      console.log(`[API GET /api/leads/${id}] Lead found:`, lead);
      return NextResponse.json(lead, { status: 200 });
    } else {
      console.log(`[API GET /api/leads/${id}] Lead not found.`);
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
    const updatedLeadDataFromClient = await request.json() as Partial<Lead>;
    console.log(`[API PUT /api/leads/${id}] Received updatedLeadData:`, JSON.stringify(updatedLeadDataFromClient, null, 2));

    const existingLeadResult: any[] = await query('SELECT ownerUserId, lastModifiedByUserId, month FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      console.log(`[API PUT /api/leads/${id}] Lead not found for update.`);
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    const existingLeadDbInfo = existingLeadResult[0];

    const dataToUpdate: Partial<Omit<Lead, 'id' | 'createdAt'>> = {
      ...updatedLeadDataFromClient,
      updatedAt: formatISO(new Date()), 
      lastModifiedByUserId: updatedLeadDataFromClient.lastModifiedByUserId || SIMULATED_CURRENT_USER_ID_API,
      ownerUserId: updatedLeadDataFromClient.ownerUserId || existingLeadDbInfo.ownerUserId, 
    };
    
    if (dataToUpdate.month && typeof dataToUpdate.month === 'string') { 
        dataToUpdate.month = ensureISOFormat(dataToUpdate.month) || existingLeadDbInfo.month;
    } else if (dataToUpdate.month instanceof Date) { 
        dataToUpdate.month = formatISO(dataToUpdate.month);
    }

    // Handle packageQuantities serialization for DB
    let packageQuantitiesJson: string | null = null;
    if (updatedLeadDataFromClient.packageQuantities) {
        packageQuantitiesJson = JSON.stringify(updatedLeadDataFromClient.packageQuantities);
    }
    // Create a version of dataToUpdate for buildLeadUpdateSetClause that includes package_quantities_json
    const dataForClause = { ...dataToUpdate, package_quantities_json: packageQuantitiesJson } as any;
    delete dataForClause.packageQuantities; // Remove the array version


    const { clause, values: updateValues } = buildLeadUpdateSetClause(dataForClause);

    if (clause.length === 0) {
       console.log(`[API PUT /api/leads/${id}] No valid fields to update.`);
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    updateValues.push(id); 
    
    console.log(`[API PUT /api/leads/${id}] Update clause:`, clause);
    console.log(`[API PUT /api/leads/${id}] Update values:`, JSON.stringify(updateValues, null, 2));

    const result: any = await query(`UPDATE leads SET ${clause} WHERE id = ?`, updateValues);
    console.log(`[API PUT /api/leads/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/leads/${id}] Lead not found during update or no changes made.`);
    }
    
    const updatedLeadFromDbResult: any[] = await query('SELECT * FROM leads WHERE id = ?', [id]);
    if (updatedLeadFromDbResult.length === 0) {
        console.error(`[API PUT /api/leads/${id}] Lead updated, but failed to fetch for confirmation.`);
        return NextResponse.json({ message: 'Lead updated, but failed to fetch confirmation.' }, { status: 500 });
    }
    const dbLead = updatedLeadFromDbResult[0];
    let pq: LeadPackageQuantity[] = [];
    if(dbLead.package_quantities_json) {
        try { pq = JSON.parse(dbLead.package_quantities_json); } catch(e){ console.warn("Error parsing PQ_JSON on fetch after update");}
    }
    const finalUpdatedLead: Lead = {
        id: String(dbLead.id || ''), clientName: String(dbLead.clientName || ''), agent: String(dbLead.agent || ''), yacht: String(dbLead.yacht || ''), 
        status: (dbLead.status || 'Upcoming') as LeadStatus,
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()), notes: dbLead.notes || undefined, type: (dbLead.type || 'Private Cruise') as LeadType, transactionId: dbLead.transactionId || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,
        packageQuantities: pq,
        totalAmount: parseFloat(dbLead.totalAmount || 0), commissionPercentage: parseFloat(dbLead.commissionPercentage || 0),
        commissionAmount: parseFloat(dbLead.commissionAmount || 0), netAmount: parseFloat(dbLead.netAmount || 0),
        paidAmount: parseFloat(dbLead.paidAmount || 0), balanceAmount: parseFloat(dbLead.balanceAmount || 0),
        createdAt: dbLead.createdAt ? ensureISOFormat(dbLead.createdAt)! : formatISO(new Date()),
        updatedAt: dbLead.updatedAt ? ensureISOFormat(dbLead.updatedAt)! : formatISO(new Date()),
        lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined, ownerUserId: dbLead.ownerUserId || undefined,
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
    console.log(`[API DELETE /api/leads/${id}] DB Delete Result:`, result);
    
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
