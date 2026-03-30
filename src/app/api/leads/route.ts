
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, LeadPackageQuantity, PaymentConfirmationStatus, LeadType, ModeOfPayment } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid, getYear as getFullYear } from 'date-fns';
import { formatToMySQLDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface DbLead extends Omit<Lead, 'packageQuantities' | 'totalAmount' | 'commissionPercentage' | 'commissionAmount' | 'netAmount' | 'paidAmount' | 'balanceAmount' | 'freeGuestCount' | 'perTicketRate' | 'perTicketRateReason' | 'printReason' | 'payAtCounterAmount' | 'payAtCounterRemark' | 'checkInStatus' | 'checkInTime' | 'collectedAtCheckIn' | 'freeGuestDetails' | 'checkedInQuantities' | 'idVerified'> {
  package_quantities_json?: string;
  totalAmount: string | number;
  commissionPercentage: string | number;
  commissionAmount: string | number;
  netAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  freeGuestCount: string | number | null;
  perTicketRate?: string | number | null;
  perTicketRateReason?: string | null;
  printReason?: string | null;
  payAtCounterAmount?: string | number | null;
  payAtCounterRemark?: string | null;
  checkInStatus?: string;
  checkInTime?: string;
  free_guest_details_json?: string;
  collectedAtCheckIn?: string | number;
  idVerified?: number | boolean;
}

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

const mapDbLeadToLeadObject = (dbLead: DbLead): Lead => {
  let packageQuantities: LeadPackageQuantity[] = [];
  if (dbLead.package_quantities_json && typeof dbLead.package_quantities_json === 'string') {
    try {
      packageQuantities = JSON.parse(dbLead.package_quantities_json);
    } catch (e) {
      console.warn(`[API Helper] Failed to parse package_quantities_json for lead ${dbLead.id}`, e);
    }
  }

  let freeGuestDetails: any[] = [];
  if (dbLead.free_guest_details_json && typeof dbLead.free_guest_details_json === 'string') {
    try {
      freeGuestDetails = JSON.parse(dbLead.free_guest_details_json);
    } catch (e) {
      console.warn(`[API Helper] Failed to parse free_guest_details_json for lead ${dbLead.id}`, e);
    }
  }

  const parsedTotalAmount = parseFloat(String(dbLead.totalAmount || 0));
  const parsedCommissionPercentage = parseFloat(String(dbLead.commissionPercentage || 0));
  const parsedCommissionAmount = parseFloat(String(dbLead.commissionAmount || 0));
  const parsedNetAmount = parseFloat(String(dbLead.netAmount || 0));
  const parsedPaidAmount = parseFloat(String(dbLead.paidAmount || 0));
  const parsedBalanceAmount = parseFloat(String(dbLead.balanceAmount || 0));
  const parsedCollectedAtCheckIn = parseFloat(String(dbLead.collectedAtCheckIn || 0));
  const parsedFreeGuestCount = parseInt(String(dbLead.freeGuestCount || 0), 10);
  const parsedPerTicketRate = dbLead.perTicketRate !== null && dbLead.perTicketRate !== undefined ? parseFloat(String(dbLead.perTicketRate)) : undefined;
  const parsedPayAtCounterAmount = dbLead.payAtCounterAmount !== null && dbLead.payAtCounterAmount !== undefined ? parseFloat(String(dbLead.payAtCounterAmount)) : undefined;

  return {
    id: String(dbLead.id || ''),
    clientName: String(dbLead.clientName || ''),
    agent: String(dbLead.agent || ''),
    yacht: String(dbLead.yacht || ''),
    status: (dbLead.status || 'Balance') as LeadStatus,
    month: ensureISOFormat(dbLead.month)!,
    notes: dbLead.notes || undefined,
    type: (dbLead.type || 'Private Cruise') as LeadType,
    paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNCONFIRMED') as PaymentConfirmationStatus,
    transactionId: dbLead.transactionId || undefined,
    bookingRefNo: dbLead.bookingRefNo || undefined,
    modeOfPayment: (dbLead.modeOfPayment || 'CARD') as ModeOfPayment,
    packageQuantities,
    freeGuestCount: isNaN(parsedFreeGuestCount) ? 0 : parsedFreeGuestCount,
    perTicketRate: parsedPerTicketRate,
    perTicketRateReason: dbLead.perTicketRateReason || undefined,
    printReason: dbLead.printReason || undefined,
    payAtCounterAmount: parsedPayAtCounterAmount,
    payAtCounterRemark: dbLead.payAtCounterRemark || undefined,
    totalAmount: isNaN(parsedTotalAmount) ? 0 : parsedTotalAmount,
    commissionPercentage: isNaN(parsedCommissionPercentage) ? 0 : parsedCommissionPercentage,
    commissionAmount: isNaN(parsedCommissionAmount) ? 0 : parsedCommissionAmount,
    netAmount: isNaN(parsedNetAmount) ? 0 : parsedNetAmount,
    paidAmount: isNaN(parsedPaidAmount) ? 0 : parsedPaidAmount,
    balanceAmount: isNaN(parsedBalanceAmount) ? 0 : parsedBalanceAmount,
    collectedAtCheckIn: isNaN(parsedCollectedAtCheckIn) ? 0 : parsedCollectedAtCheckIn,
    createdAt: ensureISOFormat(dbLead.createdAt)!,
    updatedAt: ensureISOFormat(dbLead.updatedAt)!,
    lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined,
    ownerUserId: dbLead.ownerUserId || undefined,
    checkInStatus: (dbLead.checkInStatus as 'Checked In' | 'Not Checked In') || 'Not Checked In',
    checkInTime: ensureISOFormat(dbLead.checkInTime) || undefined,
    freeGuestDetails,

    // CRM Extension Fields
    customerPhone: dbLead.customerPhone || undefined,
    customerEmail: dbLead.customerEmail || undefined,
    nationality: dbLead.nationality || undefined,
    language: dbLead.language || undefined,
    source: dbLead.source as any,
    inquiryDate: ensureISOFormat(dbLead.inquiryDate) || undefined,
    yachtType: dbLead.yachtType as any,
    adultsCount: dbLead.adultsCount ? Number(dbLead.adultsCount) : 0,
    kidsCount: dbLead.kidsCount ? Number(dbLead.kidsCount) : 0,
    infantCount: dbLead.infantCount ? Number(dbLead.infantCount) : 0,
    infantDetails: dbLead.infantDetails || undefined,
    noShowCount: dbLead.noShowCount ? Number(dbLead.noShowCount) : 0,
    durationHours: dbLead.durationHours ? Number(dbLead.durationHours) : undefined,
    budgetRange: dbLead.budgetRange || undefined,
    occasion: dbLead.occasion as any,
    priority: dbLead.priority as any,
    nextFollowUpDate: ensureISOFormat(dbLead.nextFollowUpDate) || undefined,
    closingProbability: dbLead.closingProbability ? Number(dbLead.closingProbability) : 0,

    // Operation fields
    captainName: dbLead.captainName || undefined,
    crewDetails: dbLead.crewDetails || undefined,
    idVerified: Boolean(dbLead.idVerified),
    extraHoursUsed: dbLead.extraHoursUsed ? Number(dbLead.extraHoursUsed) : 0,
    extraCharges: dbLead.extraCharges ? Number(dbLead.extraCharges) : 0,
    customerSignatureUrl: dbLead.customerSignatureUrl || undefined,
    customAgentName: dbLead.customAgentName || undefined,
    customAgentPhone: dbLead.customAgentPhone || undefined,
  };
};

function generateNewLeadId(existingLeadIds: string[]): string {
  const prefix = "DO-";
  let maxNum = 100; // Force start from 101 if no existing leads >= 101
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
  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');

    let sql = 'SELECT * FROM leads ORDER BY createdAt DESC';
    const params: (number | string)[] = [];

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        sql += ` LIMIT ${limit}`;
        // params.push(limit); // Avoid parameterized LIMIT due to mysqld_stmt_execute error
      }
    }

    const leadsDataDb = await query<DbLead[]>(sql, params);
    const leads: Lead[] = leadsDataDb.map(mapDbLeadToLeadObject);
    return NextResponse.json(leads, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[API GET /api/leads] Error:', errorMessage);
    return NextResponse.json({ message: `Failed to fetch bookings: ${errorMessage}`, error: err }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { requestingUserId, ...newLeadData } = requestBody as Partial<Lead> & { requestingUserId: string; requestingUserRole: string };

    if (!newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht || !newLeadData.month) {
      return NextResponse.json({ message: 'Missing required fields (clientName, agent, yacht, event date).' }, { status: 400 });
    }

    let leadId = newLeadData.id;
    if (!leadId || leadId.startsWith('temp-') || leadId.startsWith('imported-')) {
      const currentLeadsFromDB = await query<DbLead[]>('SELECT id FROM leads WHERE id LIKE "DO-%"');
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
      const allCurrentLeads = await query<DbLead[]>('SELECT transactionId FROM leads WHERE transactionId LIKE ?', [`TRN-${leadYear}-%`]);
      finalTransactionId = generateNewLeadTransactionId(allCurrentLeads.map(l => ({ transactionId: l.transactionId } as Lead)), leadYear);
    }

    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, paymentConfirmationStatus, transactionId, bookingRefNo, modeOfPayment,
        package_quantities_json, freeGuestCount, perTicketRate, perTicketRateReason, printReason, payAtCounterAmount, payAtCounterRemark,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId, free_guest_details_json,
        customerPhone, customerEmail, nationality, language, source, customAgentName, customAgentPhone, inquiryDate, yachtType, adultsCount, kidsCount, infantCount, infantDetails, noShowCount,
        durationHours, budgetRange, occasion, priority, nextFollowUpDate, closingProbability,
        captainName, crewDetails, idVerified, extraHoursUsed, extraCharges, customerSignatureUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      leadId!,
      newLeadData.clientName,
      newLeadData.agent,
      newLeadData.yacht,
      newLeadData.status || 'Balance',
      formatToMySQLDateTime(formattedMonth),
      newLeadData.notes || null,
      newLeadData.type || 'Private Cruise',
      newLeadData.paymentConfirmationStatus || 'CONFIRMED',
      finalTransactionId,
      newLeadData.bookingRefNo || null,
      newLeadData.modeOfPayment || 'ONLINE',
      newLeadData.packageQuantities ? JSON.stringify(newLeadData.packageQuantities) : null,
      Number(newLeadData.freeGuestCount || 0),
      newLeadData.perTicketRate !== undefined && newLeadData.perTicketRate !== null ? Number(newLeadData.perTicketRate) : null,
      newLeadData.perTicketRateReason || null,
      newLeadData.printReason || null,
      newLeadData.payAtCounterAmount !== undefined && newLeadData.payAtCounterAmount !== null ? Number(newLeadData.payAtCounterAmount) : null,
      newLeadData.payAtCounterRemark || null,
      Number(newLeadData.totalAmount || 0),
      Number(newLeadData.commissionPercentage || 0),
      Number(newLeadData.commissionAmount || 0),
      Number(newLeadData.netAmount || 0),
      Number(newLeadData.paidAmount || 0),
      Number(newLeadData.balanceAmount || 0),
      formatToMySQLDateTime(newLeadData.createdAt) || formatToMySQLDateTime(now),
      formatToMySQLDateTime(now),
      requestingUserId,
      newLeadData.ownerUserId || requestingUserId,
      newLeadData.freeGuestDetails ? JSON.stringify(newLeadData.freeGuestDetails) : null,

      // CRM Extension Fields
      newLeadData.customerPhone || null,
      newLeadData.customerEmail || null,
      newLeadData.nationality || null,
      newLeadData.language || null,
      newLeadData.source || null,
      newLeadData.customAgentName || null,
      newLeadData.customAgentPhone || null,
      newLeadData.inquiryDate ? formatToMySQLDateTime(ensureISOFormat(newLeadData.inquiryDate)) : null,
      newLeadData.yachtType || null,
      Number(newLeadData.adultsCount || 0),
      Number(newLeadData.kidsCount || 0),
      Number(newLeadData.infantCount || 0),
      newLeadData.infantDetails || null,
      Number(newLeadData.noShowCount || 0),
      newLeadData.durationHours !== undefined ? Number(newLeadData.durationHours) : null,
      newLeadData.budgetRange || null,
      newLeadData.occasion || null,
      newLeadData.priority || null,
      formatToMySQLDateTime(newLeadData.nextFollowUpDate) || null,
      Number(newLeadData.closingProbability || 0),

      // Operation fields
      newLeadData.captainName || null,
      newLeadData.crewDetails || null,
      newLeadData.idVerified ? 1 : 0,
      Number(newLeadData.extraHoursUsed || 0),
      Number(newLeadData.extraCharges || 0),
      newLeadData.customerSignatureUrl || null,
    ];

    let attempt = 0;
    const maxRetries = 3;
    while (attempt < maxRetries) {
      try {
        await query(sql, params);
        break; // Success
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY' && (err.message.includes('transactionId') || err.message.includes('leads.transactionId_unique'))) {
          console.warn(`[API POST] Duplicate transactionId detected (${finalTransactionId}). Regenerating...`);
          // Regenerate Transaction ID
          const leadYear = getFullYear(parseISO(formattedMonth));
          // Re-fetch current max to ensure freshness
          const allCurrentLeads = await query<DbLead[]>('SELECT transactionId FROM leads WHERE transactionId LIKE ?', [`TRN-${leadYear}-%`]);
          finalTransactionId = generateNewLeadTransactionId(allCurrentLeads.map(l => ({ transactionId: l.transactionId } as Lead)), leadYear);
          // Update params
          params[9] = finalTransactionId;
          attempt++;
          if (attempt === maxRetries) throw new Error(`Failed to generate unique Transaction ID after ${maxRetries} attempts.`);
        } else if (err.code === 'ER_BAD_FIELD_ERROR') {
          console.error(`[API POST] Missing columns detected. Attempting auto-migration...`);
          try {
            const currentCols = await query<any[]>(`DESCRIBE leads`);
            const existingNames = currentCols.map(c => c.Field);

            const columnsToAdd = [
              { name: 'customAgentName', def: 'VARCHAR(255) NULL' },
              { name: 'customAgentPhone', def: 'VARCHAR(50) NULL' },
              { name: 'noShowCount', def: 'INT DEFAULT 0' },
              { name: 'infantCount', def: 'INT DEFAULT 0' },
              { name: 'infantDetails', def: 'TEXT NULL' },
              { name: 'printReason', def: 'TEXT NULL' },
              { name: 'payAtCounterAmount', def: 'DOUBLE NULL' },
              { name: 'payAtCounterRemark', def: 'TEXT NULL' }
            ];

            for (const col of columnsToAdd) {
              if (!existingNames.includes(col.name)) {
                await query(`ALTER TABLE leads ADD COLUMN ${col.name} ${col.def}`);
              }
            }

            console.log(`[API POST] Auto-migration successful. Retrying insert...`);
            attempt++;
            continue;
          } catch (migErr) {
            console.error(`[API POST] Auto-migration failed:`, migErr);
            throw err;
          }
        } else {
          throw err; // Re-throw other errors
        }
      }
    }

    const insertedLeadData = await query<any[]>('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (insertedLeadData.length > 0) {
      const finalLead = mapDbLeadToLeadObject(insertedLeadData[0]);
      return NextResponse.json(finalLead, { status: 201 });
    }

    throw new Error('Failed to insert booking or retrieve it after insertion.');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[API POST /api/leads] Error in POST handler:', errorMessage);
    return NextResponse.json({ message: `Failed to create booking: ${errorMessage}`, error: err }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ids, status: newStatus, paymentConfirmationStatus, checkInStatus, requestingUserId, requestingUserRole } = await request.json() as any;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || (!newStatus && !paymentConfirmationStatus && !checkInStatus) || !requestingUserId || !requestingUserRole) {
      return NextResponse.json({ message: 'Missing required fields for bulk update' }, { status: 400 });
    }

    let updatedCount = 0;
    let failedCount = 0;
    const updateErrors: { id: string, reason: string }[] = [];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (newStatus) { updateFields.push('status = ?'); updateValues.push(newStatus); }
    if (paymentConfirmationStatus) { updateFields.push('paymentConfirmationStatus = ?'); updateValues.push(paymentConfirmationStatus); }
    if (checkInStatus) { updateFields.push('checkInStatus = ?'); updateValues.push(checkInStatus); }

    updateFields.push('updatedAt = ?'); updateValues.push(formatToMySQLDateTime(new Date()));
    updateFields.push('lastModifiedByUserId = ?'); updateValues.push(requestingUserId);

    const updateSql = `UPDATE leads SET ${updateFields.join(', ')} WHERE id = ?`;

    for (const id of ids) {
      try {
        const existingLeadResults = await query<any[]>('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
        if (existingLeadResults.length === 0) {
          failedCount++;
          updateErrors.push({ id, reason: "Booking not found." });
          continue;
        }
        const { ownerUserId, status } = existingLeadResults[0];

        // All users are allowed to edit bookings
        const canUpdate = true;

        if (canUpdate) {
          const params = [...updateValues, id];
          const result = await query<any>(updateSql, params);
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
    return NextResponse.json({ message: `Failed to bulk update statuses: ${errorMessage}`, error: error }, { status: 500 });
  }
}
