
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment, LeadType, LeadPackageQuantity, PaymentConfirmationStatus } from '@/lib/types';
import { query } from '@/lib/db';
import { format, formatISO, parseISO, isValid, getYear as getFullYear } from 'date-fns';

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
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}


export async function GET(request: NextRequest) {
  console.log('[API GET /api/leads] Received request');
  try {
    const leadsDataDb: any[] = await query('SELECT * FROM leads ORDER BY createdAt DESC');
    console.log('[API GET /api/leads] Raw DB Data Sample (first item):', leadsDataDb.length > 0 ? leadsDataDb[0] : 'No leads found');

    const leads: Lead[] = leadsDataDb.map(dbLead => {
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
          console.warn(`[API GET /api/leads] Failed to parse package_quantities_json for lead ${dbLead.id}`, e);
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


      const leadTyped: Lead = {
        id: String(dbLead.id || ''),
        clientName: String(dbLead.clientName || ''),
        agent: String(dbLead.agent || ''),
        yacht: String(dbLead.yacht || ''),
        status: (dbLead.status || 'Upcoming') as LeadStatus, 
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()),
        notes: dbLead.notes || undefined,
        type: (dbLead.type || 'Private Cruise') as LeadType,
        paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNPAID') as PaymentConfirmationStatus,
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
      return leadTyped;
    });
    console.log('[API GET /api/leads] Mapped Leads Data Sample (first item):', leads.length > 0 ? leads[0] : 'No leads mapped');
    return NextResponse.json(leads, { status: 200 });
  } catch (err) {
    console.error('[API GET /api/leads] Error:', err);
    let errorMessage = 'Failed to fetch leads.';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    return NextResponse.json({ message: 'Failed to fetch leads', errorDetails: errorMessage }, { status: 500 });
  }
}

function generateNewLeadTransactionId(existingLeads: Lead[], forYear: number, currentMaxForYearInBatch: number = 0): string {
  const prefix = `TRN-${forYear}`;
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
  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole, ...newLeadData } = requestBody as Lead & { requestingUserId: string; requestingUserRole: string };

    console.log('[API POST /api/leads] Received newLeadData:', JSON.stringify(newLeadData, null, 2));
    console.log(`[API POST /api/leads] Requesting User: ${requestingUserId}, Role: ${requestingUserRole}`);


    if (!newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht || !newLeadData.month) {
      console.error('[API POST /api/leads] Validation Error: Missing required fields (clientName, agent, yacht, month/event date).');
      return NextResponse.json({ message: 'Missing required lead fields (clientName, agent, yacht, month/event date)' }, { status: 400 });
    }

    let leadId = newLeadData.id;
    if (!leadId || leadId.startsWith('temp-')) {
      const currentLeadsFromDB: any[] = await query('SELECT id FROM leads WHERE id LIKE "DO-%"');
      const existingLeadIds = currentLeadsFromDB.map(l => l.id as string);
      leadId = generateNewLeadId(existingLeadIds);
      console.log(`[API POST /api/leads] Generated new Lead ID: ${leadId}`);
    }

    const now = new Date();
    const formattedMonth = newLeadData.month ? ensureISOFormat(newLeadData.month) : formatISO(now);
    if (!formattedMonth || !isValid(parseISO(formattedMonth))) {
        console.warn(`[API POST /api/leads] Invalid month/event date provided for new lead ${leadId}, value:`, newLeadData.month);
        return NextResponse.json({ message: 'Invalid month/event date format. Expected ISO string.' }, { status: 400 });
    }

    const formattedCreatedAt = newLeadData.createdAt && isValid(parseISO(newLeadData.createdAt)) ? ensureISOFormat(newLeadData.createdAt)! : formatISO(now);
    const formattedUpdatedAt = formatISO(now);

    const packageQuantitiesJson = newLeadData.packageQuantities ? JSON.stringify(newLeadData.packageQuantities) : null;

    let finalTransactionId = newLeadData.transactionId;
    if (!finalTransactionId || String(finalTransactionId).trim() === "" || finalTransactionId === "Pending Generation") {
      const leadYear = newLeadData.month ? getFullYear(parseISO(newLeadData.month)) : new Date().getFullYear();
      const allCurrentLeads: any[] = await query('SELECT transactionId FROM leads WHERE transactionId LIKE ?', [`TRN-${leadYear}%`]);
      const existingTransactionIdsForYear = allCurrentLeads.map(l => l.transactionId);
      finalTransactionId = generateNewLeadTransactionId(existingTransactionIdsForYear.map(tid => ({transactionId: tid} as Lead)), leadYear);
    }


    const leadToStore = {
      id: leadId!,
      clientName: newLeadData.clientName,
      agent: newLeadData.agent,
      yacht: newLeadData.yacht,
      status: newLeadData.status || 'Upcoming', 
      month: formattedMonth,
      notes: newLeadData.notes || null,
      type: newLeadData.type || 'Private Cruise',
      paymentConfirmationStatus: newLeadData.paymentConfirmationStatus || 'UNPAID',
      transactionId: finalTransactionId,
      modeOfPayment: newLeadData.modeOfPayment || 'Online',

      package_quantities_json: packageQuantitiesJson,
      freeGuestCount: Number(newLeadData.freeGuestCount || 0),
      perTicketRate: newLeadData.perTicketRate !== undefined && newLeadData.perTicketRate !== null ? Number(newLeadData.perTicketRate) : null,

      totalAmount: Number(newLeadData.totalAmount || 0),
      commissionPercentage: Number(newLeadData.commissionPercentage || 0),
      commissionAmount: Number(newLeadData.commissionAmount || 0),
      netAmount: Number(newLeadData.netAmount || 0),
      paidAmount: Number(newLeadData.paidAmount || 0),
      balanceAmount: Number(newLeadData.balanceAmount || 0),

      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt,
      lastModifiedByUserId: requestingUserId,
      ownerUserId: newLeadData.ownerUserId || requestingUserId,
    };

    console.log('[API POST /api/leads] leadToStore (to be inserted):', JSON.stringify(leadToStore, null, 2));

    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, paymentConfirmationStatus, transactionId, modeOfPayment,
        package_quantities_json, freeGuestCount, perTicketRate,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      leadToStore.id, leadToStore.clientName, leadToStore.agent, leadToStore.yacht, leadToStore.status,
      leadToStore.month, leadToStore.notes, leadToStore.type, leadToStore.paymentConfirmationStatus, leadToStore.transactionId, leadToStore.modeOfPayment,
      leadToStore.package_quantities_json, leadToStore.freeGuestCount, leadToStore.perTicketRate,
      leadToStore.totalAmount, leadToStore.commissionPercentage, leadToStore.commissionAmount, leadToStore.netAmount,
      leadToStore.paidAmount, leadToStore.balanceAmount,
      leadToStore.createdAt, leadToStore.updatedAt, leadToStore.lastModifiedByUserId, leadToStore.ownerUserId
    ];

    console.log('[API POST /api/leads] SQL Params:', JSON.stringify(params, null, 2));

    const result: any = await query(sql, params);
    console.log('[API POST /api/leads] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      const insertedLeadData: any[] = await query('SELECT * FROM leads WHERE id = ?', [leadToStore.id]);
      if (insertedLeadData.length > 0) {
        const dbLead = insertedLeadData[0];
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
            } catch(e){ console.warn("Error parsing PQ_JSON on fetch after insert for lead:", dbLead.id, e);}
        }
        const parsedTotalAmount = parseFloat(dbLead.totalAmount);
        const parsedCommissionPercentage = parseFloat(dbLead.commissionPercentage);
        const parsedCommissionAmount = parseFloat(dbLead.commissionAmount);
        const parsedNetAmount = parseFloat(dbLead.netAmount);
        const parsedPaidAmount = parseFloat(dbLead.paidAmount);
        const parsedBalanceAmount = parseFloat(dbLead.balanceAmount);
        const parsedFreeGuestCount = parseInt(dbLead.freeGuestCount, 10);
        const parsedPerTicketRate = dbLead.perTicketRate !== null && dbLead.perTicketRate !== undefined ? parseFloat(dbLead.perTicketRate) : undefined;

        const finalLead: Lead = {
            id: String(dbLead.id || ''), clientName: String(dbLead.clientName || ''), agent: String(dbLead.agent || ''), yacht: String(dbLead.yacht || ''),
            status: (dbLead.status || 'Upcoming') as LeadStatus,
            month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()),
            notes: dbLead.notes || undefined, type: (dbLead.type || 'Private Cruise') as LeadType,
            paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNPAID') as PaymentConfirmationStatus,
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
            lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined,
            ownerUserId: dbLead.ownerUserId || undefined,
        };
        console.log('[API POST /api/leads] Successfully created lead and returning from DB:', finalLead.id);
        return NextResponse.json(finalLead, { status: 201 });
      }
      console.warn('[API POST /api/leads] Lead inserted, but failed to fetch for confirmation. Returning original payload with adaptations.');
      const responseLead: Lead = { ...leadToStore, packageQuantities: newLeadData.packageQuantities || [] };
      delete (responseLead as any).package_quantities_json;
      return NextResponse.json(responseLead, { status: 201 });
    } else {
      console.error('[API POST /api/leads] Database insert failed, affectedRows was not 1.');
      throw new Error('Failed to insert lead into database');
    }
  } catch (err) {
    console.error('[API POST /api/leads] Error in POST handler:', err);
    let errorMessage = 'Failed to create lead.';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    return NextResponse.json({ message: 'Failed to create lead', errorDetails: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ids, status: newStatus, requestingUserId, requestingUserRole } = await request.json() as { ids: string[]; status: LeadStatus; requestingUserId: string; requestingUserRole: string };
    console.log(`[API PATCH /api/leads] Received request to update status for IDs:`, ids, "to new status:", newStatus, "by User:", requestingUserId, "Role:", requestingUserRole);

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !newStatus || !requestingUserId || !requestingUserRole) {
      return NextResponse.json({ message: 'Missing required fields for bulk status update (ids, status, requestingUserId, requestingUserRole)' }, { status: 400 });
    }

    let updatedCount = 0;
    let failedCount = 0;
    const updateErrors: { id: string, reason: string }[] = [];

    for (const id of ids) {
      try {
        const existingLeadResults: any[] = await query('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
        if (existingLeadResults.length === 0) {
          console.warn(`[API PATCH /api/leads] Lead ID ${id} not found for status update.`);
          failedCount++;
          updateErrors.push({ id, reason: "Lead not found." });
          continue;
        }
        const leadToUpdate = existingLeadResults[0];

        let canUpdate = false;
        if (requestingUserRole === 'admin') {
          canUpdate = true;
        } else { 
          if (leadToUpdate.ownerUserId === requestingUserId) {
            if (leadToUpdate.status === 'Closed') {
               console.warn(`[API PATCH /api/leads] Non-admin user ${requestingUserId} attempted to change status of Closed lead ${id}. Denied.`);
               updateErrors.push({ id, reason: "Non-admins cannot change the status of Closed leads." });
            } else {
              canUpdate = true;
            }
          } else {
            console.warn(`[API PATCH /api/leads] Non-admin user ${requestingUserId} attempted to change status of lead ${id} not owned by them. Denied.`);
            updateErrors.push({ id, reason: "Permission denied: Not owner." });
          }
        }

        if (canUpdate) {
          const updateSql = 'UPDATE leads SET status = ?, updatedAt = ?, lastModifiedByUserId = ? WHERE id = ?';
          const updateParams = [newStatus, formatISO(new Date()), requestingUserId, id];
          const result: any = await query(updateSql, updateParams);
          if (result.affectedRows > 0) {
            updatedCount++;
            console.log(`[API PATCH /api/leads] Successfully updated status for lead ID ${id} to ${newStatus}`);
          } else {
            console.warn(`[API PATCH /api/leads] Update for lead ID ${id} reported 0 affected rows, though lead was found.`);
            failedCount++;
            updateErrors.push({ id, reason: "Update query affected 0 rows." });
          }
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`[API PATCH /api/leads] Error processing lead ID ${id} for status update:`, error);
        failedCount++;
        updateErrors.push({ id, reason: (error as Error).message || "Unknown error during update." });
      }
    }

    if (updatedCount > 0) {
      return NextResponse.json({ 
        message: `${updatedCount} lead(s) status updated successfully. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
        updatedCount,
        failedCount,
        errors: failedCount > 0 ? updateErrors : undefined
      }, { status: 200 });
    } else if (failedCount > 0) {
      return NextResponse.json({ 
        message: `No leads were updated. ${failedCount} lead(s) failed due to errors or permissions.`,
        updatedCount,
        failedCount,
        errors: updateErrors
      }, { status: 400 });
    } else {
       return NextResponse.json({ message: 'No leads were found matching the provided IDs or no changes were necessary.' }, { status: 404 });
    }

  } catch (error) {
    console.error('[API PATCH /api/leads] Failed to bulk update lead statuses:', error);
    return NextResponse.json({ message: 'Failed to bulk update lead statuses', error: (error as Error).message }, { status: 500 });
  }
}

