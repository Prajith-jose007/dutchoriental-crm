
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, LeadPackageQuantity, PaymentConfirmationStatus } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, getYear as getFullYear } from 'date-fns';

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
        type: (dbLead.type || 'Private Cruise'),
        hoursOfBooking: dbLead.hoursOfBooking,
        catering: dbLead.catering,
        paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNCONFIRMED') as PaymentConfirmationStatus,
        transactionId: dbLead.transactionId || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'Online'),
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

function generateNewLeadId(existingLeadIds: string[]): string {
  const prefix = "DO-";
  let maxNum = 0;
  existingLeadIds.forEach(id => {
    if (id && id.startsWith(prefix)) {
      const numPart = parseInt(id.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

function generateNewLeadTransactionId(existingLeads: Lead[], forYear: number, currentMaxForYearInBatch: number = 0): string {
  const prefix = `TRN-${forYear}-`;
  let maxNumber = currentMaxForYearInBatch;

  existingLeads.forEach(lead => {
    if (lead.transactionId && lead.transactionId.startsWith(prefix)) {
      const numPartStr = lead.transactionId.substring(prefix.length); 
      const numPart = parseInt(numPartStr, 10);
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }
  });
  return `${prefix}${String(maxNumber + 1).padStart(5, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const leadsDataDb: any[] = await query('SELECT * FROM leads ORDER BY createdAt DESC');
    const leads: Lead[] = leadsDataDb.map(mapDbLeadToLeadObject);
    return NextResponse.json(leads, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[API GET /api/leads] Error:', errorMessage);
    return NextResponse.json({ message: `Failed to fetch bookings: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole, ...newLeadData } = requestBody as Partial<Lead> & { requestingUserId: string; requestingUserRole: string };

    if (!newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht || !newLeadData.month) {
      return NextResponse.json({ message: 'Missing required fields (clientName, agent, yacht, event date).' }, { status: 400 });
    }
    
    let leadId = newLeadData.id;
    if (!leadId || leadId.startsWith('temp-')) {
      const currentLeadsFromDB: any[] = await query('SELECT id FROM leads WHERE id LIKE "DO-%"');
      leadId = generateNewLeadId(currentLeadsFromDB.map(l => l.id as string));
    }

    const now = new Date();
    const formattedMonth = ensureISOFormat(newLeadData.month);
    if (!formattedMonth) {
      return NextResponse.json({ message: 'Invalid event date format.' }, { status: 400 });
    }

    let finalTransactionId = newLeadData.transactionId;
    if (!finalTransactionId || String(finalTransactionId).trim() === "" || finalTransactionId === "Pending Generation") {
      const leadYear = getFullYear(parseISO(formattedMonth));
      const allCurrentLeads: any[] = await query('SELECT transactionId FROM leads WHERE transactionId LIKE ?', [`TRN-${leadYear}-%`]);
      finalTransactionId = generateNewLeadTransactionId(allCurrentLeads.map(tid => ({transactionId: tid} as Lead)), leadYear);
    }

    const leadToStore = {
      id: leadId!,
      clientName: newLeadData.clientName,
      agent: newLeadData.agent,
      yacht: newLeadData.yacht,
      status: newLeadData.status || 'Balance', 
      month: formattedMonth,
      notes: newLeadData.notes || null,
      type: newLeadData.type || 'Private Cruise',
      hoursOfBooking: newLeadData.hoursOfBooking ?? null,
      catering: newLeadData.catering || null,
      paymentConfirmationStatus: newLeadData.paymentConfirmationStatus || 'UNCONFIRMED',
      transactionId: finalTransactionId,
      modeOfPayment: newLeadData.modeOfPayment || 'Online',
      package_quantities_json: newLeadData.packageQuantities ? JSON.stringify(newLeadData.packageQuantities) : null,
      freeGuestCount: Number(newLeadData.freeGuestCount || 0),
      perTicketRate: newLeadData.perTicketRate !== undefined && newLeadData.perTicketRate !== null ? Number(newLeadData.perTicketRate) : null,
      totalAmount: Number(newLeadData.totalAmount || 0),
      commissionPercentage: Number(newLeadData.commissionPercentage || 0),
      commissionAmount: Number(newLeadData.commissionAmount || 0),
      netAmount: Number(newLeadData.netAmount || 0),
      paidAmount: Number(newLeadData.paidAmount || 0),
      balanceAmount: Number(newLeadData.balanceAmount || 0),
      createdAt: ensureISOFormat(newLeadData.createdAt) || formatISO(now),
      updatedAt: formatISO(now),
      lastModifiedByUserId: requestingUserId,
      ownerUserId: newLeadData.ownerUserId || requestingUserId,
    };

    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, hoursOfBooking, catering, paymentConfirmationStatus, transactionId, modeOfPayment,
        package_quantities_json, freeGuestCount, perTicketRate,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = Object.values(leadToStore);
    
    await query(sql, params);

    const insertedLeadData: any[] = await query('SELECT * FROM leads WHERE id = ?', [leadToStore.id]);
    if (insertedLeadData.length > 0) {
      const finalLead = mapDbLeadToLeadObject(insertedLeadData[0]);
      return NextResponse.json(finalLead, { status: 201 });
    }
    
    throw new Error('Failed to insert booking or retrieve it after insertion.');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[API POST /api/leads] Error in POST handler:', errorMessage, (err as Error).stack);
    return NextResponse.json({ message: `Failed to create booking: ${errorMessage}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ids, status: newStatus, requestingUserId, requestingUserRole } = await request.json() as { ids: string[]; status: LeadStatus; requestingUserId: string; requestingUserRole: string };
    
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !newStatus || !requestingUserId || !requestingUserRole) {
      return NextResponse.json({ message: 'Missing required fields for bulk status update' }, { status: 400 });
    }

    let updatedCount = 0;
    let failedCount = 0;
    const updateErrors: { id: string, reason: string }[] = [];

    for (const id of ids) {
      try {
        const existingLeadResults: any[] = await query('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
        if (existingLeadResults.length === 0) {
          failedCount++;
          updateErrors.push({ id, reason: "Booking not found." });
          continue;
        }
        const { ownerUserId, status } = existingLeadResults[0];

        let canUpdate = false;
        if (requestingUserRole === 'admin') canUpdate = true;
        else if (ownerUserId === requestingUserId && !status.startsWith('Closed')) canUpdate = true;
        else {
          updateErrors.push({ id, reason: status.startsWith('Closed') ? "Non-admins cannot change Closed bookings." : "Permission denied: Not owner." });
        }

        if (canUpdate) {
          const updateSql = 'UPDATE leads SET status = ?, updatedAt = ?, lastModifiedByUserId = ? WHERE id = ?';
          const result: any = await query(updateSql, [newStatus, formatISO(new Date()), requestingUserId, id]);
          if (result.affectedRows > 0) updatedCount++;
          else {
            failedCount++;
            updateErrors.push({ id, reason: "Update query affected 0 rows." });
          }
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        updateErrors.push({ id, reason: (error as Error).message || "Unknown error during update." });
      }
    }

    if (updatedCount > 0) {
      return NextResponse.json({ 
        message: `${updatedCount} booking(s) updated. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
        updatedCount, failedCount, errors: failedCount > 0 ? updateErrors : undefined
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        message: `No bookings were updated. ${failedCount} failed due to errors or permissions.`,
        updatedCount, failedCount, errors: updateErrors
      }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API PATCH /api/leads] Failed to bulk update statuses:', errorMessage);
    return NextResponse.json({ message: `Failed to bulk update statuses: ${errorMessage}` }, { status: 500 });
  }
}
