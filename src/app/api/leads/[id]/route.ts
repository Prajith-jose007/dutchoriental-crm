
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment, LeadType, LeadPackageQuantity, PaymentConfirmationStatus, User } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

const ensureISOFormat = (dateSource?: string | Date): string | null => {
  if (!dateSource) return null;
  if (dateSource instanceof Date) {
    return isValid(dateSource) ? formatISO(dateSource) : null;
  }
  try {
    const parsed = parseISO(dateSource);
    return isValid(parsed) ? formatISO(parsed) : dateSource;
  } catch {
    return dateSource;
  }
};

const mapDbLeadToLeadObject = (dbLead: any): Lead => {
    let packageQuantities: LeadPackageQuantity[] = [];
    if (dbLead.package_quantities_json && typeof dbLead.package_quantities_json === 'string') {
        try {
            packageQuantities = JSON.parse(dbLead.package_quantities_json);
        } catch (e) {
            console.warn(`[API Helper] Failed to parse package_quantities_json for lead ${dbLead.id}`, e);
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
    
    return {
        id: String(dbLead.id || ''),
        clientName: String(dbLead.clientName || ''),
        agent: String(dbLead.agent || ''),
        yacht: String(dbLead.yacht || ''),
        status: (dbLead.status || 'Balance') as LeadStatus,
        month: ensureISOFormat(dbLead.month)!,
        notes: dbLead.notes || undefined,
        type: (dbLead.type || 'Private Cruise') as LeadType,
        hoursOfBooking: dbLead.hoursOfBooking,
        catering: dbLead.catering,
        paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNCONFIRMED') as PaymentConfirmationStatus,
        transactionId: dbLead.transactionId || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,
        packageQuantities,
        freeGuestCount: isNaN(parsedFreeGuestCount) ? 0 : parsedFreeGuestCount,
        perTicketRate: parsedPerTicketRate,
        totalAmount: isNaN(parsedTotalAmount) ? 0 : parsedTotalAmount,
        commissionPercentage: isNaN(parsedCommissionPercentage) ? 0 : parsedCommissionPercentage,
        commissionAmount: isNaN(parsedCommissionAmount) ? 0 : parsedCommissionAmount,
        netAmount: isNaN(parsedNetAmount) ? 0 : parsedNetAmount,
        paidAmount: isNaN(parsedPaidAmount) ? 0 : parsedPaidAmount,
        balanceAmount: isNaN(parsedBalanceAmount) ? 0 : parsedBalanceAmount,
        createdAt: ensureISOFormat(dbLead.createdAt)!,
        updatedAt: ensureISOFormat(dbLead.updatedAt)!,
        lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined,
        ownerUserId: dbLead.ownerUserId || undefined,
    };
};

function buildLeadUpdateSetClause(data: Partial<Omit<Lead, 'id' | 'createdAt' | 'packageQuantities'>> & { package_quantities_json?: string | null }): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Lead | 'package_quantities_json')[] = [
    'clientName', 'agent', 'yacht', 'status', 'month', 'notes', 'type', 
    'hoursOfBooking', 'catering', 'paymentConfirmationStatus', 'transactionId', 'modeOfPayment',
    'package_quantities_json', 'freeGuestCount', 'perTicketRate',
    'totalAmount', 'commissionPercentage', 'commissionAmount', 'netAmount', 'paidAmount', 'balanceAmount', 
    'updatedAt', 'lastModifiedByUserId', 'ownerUserId'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (['month', 'updatedAt'].includes(key)) {
        valuesToUpdate.push(ensureISOFormat(value as string) || null);
      } else if (value === null && ['perTicketRate', 'hoursOfBooking', 'catering', 'notes', 'transactionId'].includes(key)) {
        valuesToUpdate.push(null);
      } else if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(key === 'perTicketRate' ? null : 0);
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
  if (!id) {
    return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const leadDataDb: any[] = await query('SELECT * FROM leads WHERE id = ?', [id]);

    if (leadDataDb.length > 0) {
      const lead = mapDbLeadToLeadObject(leadDataDb[0]);
      return NextResponse.json(lead, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[API GET /api/leads/${id}] Error:`, errorMessage);
    return NextResponse.json({ message: `Failed to fetch booking: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ message: 'Booking ID is required for update' }, { status: 400 });
  }

  try {
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole, ...updatedLeadDataFromClient } = requestBody as Lead & { requestingUserId: string; requestingUserRole: string };

    const existingLeadResult: any[] = await query('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    const { ownerUserId: existingOwner, status: existingStatus } = existingLeadResult[0];

    if (existingStatus.startsWith('Closed') && requestingUserRole !== 'admin') {
      return NextResponse.json({ message: 'Permission denied: Closed bookings cannot be modified by non-administrators.' }, { status: 403 });
    }
    if (requestingUserRole !== 'admin' && existingOwner !== requestingUserId) {
      return NextResponse.json({ message: 'Permission denied: You can only edit bookings you own, or you must be an admin.' }, { status: 403 });
    }

    const dataToUpdate: Partial<Omit<Lead, 'id' | 'createdAt' | 'packageQuantities'>> & { package_quantities_json?: string | null } = {
      ...updatedLeadDataFromClient,
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: requestingUserId,
    };

    if (updatedLeadDataFromClient.packageQuantities) {
        dataToUpdate.package_quantities_json = JSON.stringify(updatedLeadDataFromClient.packageQuantities);
    }
    delete (dataToUpdate as any).packageQuantities;

    const { clause, values: updateValues } = buildLeadUpdateSetClause(dataToUpdate);
    if (clause.length === 0) {
       return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    updateValues.push(id);

    await query(`UPDATE leads SET ${clause} WHERE id = ?`, updateValues);

    const updatedLeadFromDbResult: any[] = await query('SELECT * FROM leads WHERE id = ?', [id]);
    if (updatedLeadFromDbResult.length === 0) {
      return NextResponse.json({ message: 'Booking updated, but failed to fetch for confirmation.' }, { status: 500 });
    }
    
    const finalUpdatedLead = mapDbLeadToLeadObject(updatedLeadFromDbResult[0]);
    return NextResponse.json(finalUpdatedLead, { status: 200 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[API PUT /api/leads/${id}] Error:`, errorMessage);
    return NextResponse.json({ message: `Failed to update booking: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ message: 'Booking ID is required for deletion' }, { status: 400 });
  }

  try {
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole } = requestBody as { requestingUserId: string; requestingUserRole: string };
    
    if (!requestingUserId || !requestingUserRole) {
      return NextResponse.json({ message: 'User credentials are required for deletion.' }, { status: 401 });
    }

    const existingLeadResult: any[] = await query('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    const { ownerUserId: existingOwner, status: existingStatus } = existingLeadResult[0];

    if (existingStatus.startsWith('Closed') && requestingUserRole !== 'admin') {
      return NextResponse.json({ message: 'Permission denied: Closed bookings cannot be deleted by non-administrators.' }, { status: 403 });
    }
    if (requestingUserRole !== 'admin' && existingOwner !== requestingUserId) {
        return NextResponse.json({ message: 'Permission denied: You can only delete bookings you own, or you must be an admin.' }, { status: 403 });
    }

    const result: any = await query('DELETE FROM leads WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Booking not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[API DELETE /api/leads/${id}] Error:`, errorMessage);
    return NextResponse.json({ message: `Failed to delete booking: ${errorMessage}` }, { status: 500 });
  }
}
