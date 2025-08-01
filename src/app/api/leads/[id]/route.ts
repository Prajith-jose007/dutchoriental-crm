
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment, LeadType, LeadPackageQuantity, PaymentConfirmationStatus, User } from '@/lib/types';
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

function buildLeadUpdateSetClause(data: Partial<Omit<Lead, 'id' | 'createdAt' | 'packageQuantities'>> & { package_quantities_json?: string | null }): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];

  const allowedKeys: (keyof Lead | 'package_quantities_json')[] = [
    'clientName', 'agent', 'yacht', 'status', 'month', 'notes', 'type', 
    'hoursOfBooking', 'catering',
    'paymentConfirmationStatus', 'transactionId', 'modeOfPayment',
    'package_quantities_json', 'freeGuestCount', 'perTicketRate',
    'totalAmount', 'commissionPercentage', 'commissionAmount',
    'netAmount', 'paidAmount', 'balanceAmount', 'updatedAt',
    'lastModifiedByUserId', 'ownerUserId'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (['month', 'updatedAt', 'createdAt'].includes(key)) {
        valuesToUpdate.push(ensureISOFormat(value as string) || null);
      } else if (typeof value === 'string' && value.trim() === '' &&
                 ['notes', 'transactionId', 'lastModifiedByUserId', 'ownerUserId', 'agent', 'yacht', 'catering'].includes(key)) {
        valuesToUpdate.push(null);
      } else if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(key === 'perTicketRate' ? null : 0);
      } else if (key === 'package_quantities_json') {
        valuesToUpdate.push(value);
      } else if (key === 'perTicketRate' && value === null) {
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
              packageId: String(pq.packageId || pq.packageld || ''), // Check for packageld as fallback
              packageName: String(pq.packageName || 'Unknown Package'),
              quantity: Number(pq.quantity || 0),
              rate: Number(pq.rate || 0),
            }));
          }
        } catch (e) {
          console.warn(`[API GET /api/leads/${id}] Failed to parse package_quantities_json`, e);
        }
      }
      
      const parsedTotalAmount = parseFloat(dbLead.totalAmount);
      const parsedCommissionPercentage = parseFloat(dbLead.commissionPercentage);
      const parsedCommissionAmount = parseFloat(dbLead.commissionAmount);
      const parsedNetAmount = parseFloat(dbLead.netAmount);
      const parsedPaidAmount = parseFloat(dbLead.paidAmount);
      const parsedBalanceAmount = parseFloat(dbLead.balanceAmount);
      const parsedFreeGuestCount = parseInt(dbLead.freeGuestCount, 10);
      const parsedPerTicketRate = dbLead.perTicketRate !== null && dbLead.perTicketRate !== undefined ? parseFloat(dbLead.perTicketRate) : undefined;

      const lead: Lead = {
        id: String(dbLead.id || ''),
        clientName: String(dbLead.clientName || ''),
        agent: String(dbLead.agent || ''),
        yacht: String(dbLead.yacht || ''),
        status: (dbLead.status || 'Balance') as LeadStatus, 
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()),
        notes: dbLead.notes || undefined,
        type: (dbLead.type || 'Private Cruise') as LeadType,
        hoursOfBooking: dbLead.hoursOfBooking,
        catering: dbLead.catering,
        paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNCONFIRMED') as PaymentConfirmationStatus,
        transactionId: dbLead.transactionId || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,

        packageQuantities: packageQuantities,
        freeGuestCount: isNaN(parsedFreeGuestCount) ? 0 : parsedFreeGuestCount,
        perTicketRate: parsedPerTicketRate,

        totalAmount: isNaN(parsedTotalAmount) ? 0 : parsedTotalAmount,
        commissionPercentage: isNaN(parsedCommissionPercentage) ? 0 : parsedCommissionPercentage,
        commissionAmount: isNaN(parsedCommissionAmount) ? 0 : parsedCommissionAmount,
        netAmount: isNaN(parsedNetAmount) ? 0 : parsedNetAmount,
        paidAmount: isNaN(parsedPaidAmount) ? 0 : parsedPaidAmount,
        balanceAmount: isNaN(parsedBalanceAmount) ? 0 : parsedBalanceAmount,

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
  } catch (err) {
    console.error(`[API GET /api/leads/${params.id}] Error:`, err);
    let errorMessage = 'Failed to fetch lead.';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    return NextResponse.json({ message: 'Failed to fetch lead', errorDetails: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole, ...updatedLeadDataFromClient } = requestBody as Lead & { requestingUserId: string; requestingUserRole: string };

    console.log(`[API PUT /api/leads/${id}] Received request. User: ${requestingUserId}, Role: ${requestingUserRole}`);
    console.log(`[API PUT /api/leads/${id}] updatedLeadData:`, JSON.stringify(updatedLeadDataFromClient, null, 2));

    const existingLeadResult: any[] = await query('SELECT ownerUserId, lastModifiedByUserId, month, createdAt, status FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      console.log(`[API PUT /api/leads/${id}] Lead not found for update.`);
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    const existingLeadDbInfo = existingLeadResult[0];

    if (existingLeadDbInfo.status === 'Closed' && requestingUserRole !== 'admin') {
        console.warn(`[API PUT /api/leads/${id}] Permission denied. User ${requestingUserId} (Role: ${requestingUserRole}) attempted to modify a Closed lead.`);
        return NextResponse.json({ message: 'Permission denied: Closed leads cannot be modified by non-administrators.' }, { status: 403 });
    }
    if (requestingUserRole !== 'admin' && existingLeadDbInfo.ownerUserId !== requestingUserId) {
      console.warn(`[API PUT /api/leads/${id}] Permission denied. User ${requestingUserId} is not owner or admin.`);
      return NextResponse.json({ message: 'Permission denied: You can only edit leads you own, or you must be an admin.' }, { status: 403 });
    }

    const dataToUpdate: Partial<Omit<Lead, 'id' | 'createdAt' | 'packageQuantities'>> & { package_quantities_json?: string | null } = {
      ...updatedLeadDataFromClient,
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: requestingUserId,
      ownerUserId: updatedLeadDataFromClient.ownerUserId || existingLeadDbInfo.ownerUserId,
      paymentConfirmationStatus: updatedLeadDataFromClient.paymentConfirmationStatus || 'UNCONFIRMED',
      status: updatedLeadDataFromClient.status || existingLeadDbInfo.status || 'Balance', 
      freeGuestCount: Number(updatedLeadDataFromClient.freeGuestCount || 0),
      perTicketRate: updatedLeadDataFromClient.perTicketRate !== undefined ? updatedLeadDataFromClient.perTicketRate : null,
    };

    delete (dataToUpdate as any).id;
    delete (dataToUpdate as any).createdAt;

    if (dataToUpdate.month && typeof dataToUpdate.month === 'string') {
        dataToUpdate.month = ensureISOFormat(dataToUpdate.month) || existingLeadDbInfo.month;
    } else if (dataToUpdate.month instanceof Date) {
        dataToUpdate.month = formatISO(dataToUpdate.month);
    }

    if (updatedLeadDataFromClient.packageQuantities) {
        dataToUpdate.package_quantities_json = JSON.stringify(updatedLeadDataFromClient.packageQuantities);
    } else if (updatedLeadDataFromClient.packageQuantities === null || updatedLeadDataFromClient.packageQuantities === undefined) {
        dataToUpdate.package_quantities_json = null;
    }
    delete (dataToUpdate as any).packageQuantities;

    const { clause, values: updateValues } = buildLeadUpdateSetClause(dataToUpdate);

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
    if(dbLead.package_quantities_json && typeof dbLead.package_quantities_json === 'string') {
        try {
            const parsedPQs = JSON.parse(dbLead.package_quantities_json);
            if(Array.isArray(parsedPQs)) pq = parsedPQs.map((item: any) => ({
                packageId: String(item.packageId || item.packageld || ''), // Check for packageld
                packageName: String(item.packageName || 'Unknown Package'),
                quantity: Number(item.quantity || 0),
                rate: Number(item.rate || 0),
              }));
        } catch(e){ console.warn("Error parsing PQ_JSON on fetch after update for lead:", dbLead.id, e);}
    }

    const parsedTotalAmount = parseFloat(dbLead.totalAmount);
    const parsedCommissionPercentage = parseFloat(dbLead.commissionPercentage);
    const parsedCommissionAmount = parseFloat(dbLead.commissionAmount);
    const parsedNetAmount = parseFloat(dbLead.netAmount);
    const parsedPaidAmount = parseFloat(dbLead.paidAmount);
    const parsedBalanceAmount = parseFloat(dbLead.balanceAmount);
    const parsedFreeGuestCount = parseInt(dbLead.freeGuestCount, 10);
    const parsedPerTicketRate = dbLead.perTicketRate !== null && dbLead.perTicketRate !== undefined ? parseFloat(dbLead.perTicketRate) : undefined;

    const finalUpdatedLead: Lead = {
        id: String(dbLead.id || ''), clientName: String(dbLead.clientName || ''), agent: String(dbLead.agent || ''), yacht: String(dbLead.yacht || ''),
        status: (dbLead.status || 'Balance') as LeadStatus,
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()), notes: dbLead.notes || undefined, type: (dbLead.type || 'Private Cruise') as LeadType,
        hoursOfBooking: dbLead.hoursOfBooking,
        catering: dbLead.catering,
        paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNCONFIRMED') as PaymentConfirmationStatus,
        transactionId: dbLead.transactionId || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,
        packageQuantities: pq,
        freeGuestCount: isNaN(parsedFreeGuestCount) ? 0 : parsedFreeGuestCount,
        perTicketRate: parsedPerTicketRate,
        totalAmount: isNaN(parsedTotalAmount) ? 0 : parsedTotalAmount, 
        commissionPercentage: isNaN(parsedCommissionPercentage) ? 0 : parsedCommissionPercentage,
        commissionAmount: isNaN(parsedCommissionAmount) ? 0 : parsedCommissionAmount, 
        netAmount: isNaN(parsedNetAmount) ? 0 : parsedNetAmount,
        paidAmount: isNaN(parsedPaidAmount) ? 0 : parsedPaidAmount, 
        balanceAmount: isNaN(parsedBalanceAmount) ? 0 : parsedBalanceAmount,
        createdAt: dbLead.createdAt ? ensureISOFormat(dbLead.createdAt)! : formatISO(new Date()),
        updatedAt: dbLead.updatedAt ? ensureISOFormat(dbLead.updatedAt)! : formatISO(new Date()),
        lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined, ownerUserId: dbLead.ownerUserId || undefined,
    };
    console.log(`[API PUT /api/leads/${id}] Successfully updated lead:`, finalUpdatedLead.id);
    return NextResponse.json(finalUpdatedLead, { status: 200 });

  } catch (err) {
    console.error(`[API PUT /api/leads/${params.id}] Error:`, err);
    let errorMessage = 'Failed to update lead.';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    return NextResponse.json({ message: 'Failed to update lead', errorDetails: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole } = requestBody as { requestingUserId: string; requestingUserRole: string };

    console.log(`[API DELETE /api/leads/${id}] Attempting to delete lead. User: ${requestingUserId}, Role: ${requestingUserRole}`);

    const existingLeadResult: any[] = await query('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      console.warn(`[API DELETE /api/leads/${id}] Lead not found for deletion.`);
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    const existingLeadDbInfo = existingLeadResult[0];

    if (existingLeadDbInfo.status === 'Closed' && requestingUserRole !== 'admin') {
      console.warn(`[API DELETE /api/leads/${id}] Permission denied. User ${requestingUserId} (Role: ${requestingUserRole}) attempted to delete a Closed lead.`);
      return NextResponse.json({ message: 'Permission denied: Closed leads cannot be deleted by non-administrators.' }, { status: 403 });
    }
    if (requestingUserRole !== 'admin' && existingLeadDbInfo.ownerUserId !== requestingUserId) {
        console.warn(`[API DELETE /api/leads/${id}] Permission denied. User ${requestingUserId} (Role: ${requestingUserRole}) attempted to delete lead not owned by them.`);
        return NextResponse.json({ message: 'Permission denied: You can only delete leads you own, or you must be an admin.' }, { status: 403 });
    }


    const result: any = await query('DELETE FROM leads WHERE id = ?', [id]);
    console.log(`[API DELETE /api/leads/${id}] DB Delete Result:`, result);

    if (result.affectedRows === 0) {
      console.warn(`[API DELETE /api/leads/${id}] Lead ID ${id} found in initial check but deletion affected 0 rows.`);
      return NextResponse.json({ message: 'Lead not found or already deleted' }, { status: 404 });
    }

    console.log(`[API DELETE /api/leads/${id}] Successfully deleted lead.`);
    return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 });
  } catch (err) {
    console.error(`[API DELETE /api/leads/${params.id}] Error:`, err);
    let errorMessage = 'Failed to delete lead.';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    return NextResponse.json({ message: 'Failed to delete lead', errorDetails: errorMessage }, { status: 500 });
  }
}
