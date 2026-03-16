
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment, LeadType, LeadPackageQuantity, PaymentConfirmationStatus } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';
import { formatToMySQLDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface DbLead extends Omit<Lead, 'packageQuantities' | 'totalAmount' | 'commissionPercentage' | 'commissionAmount' | 'netAmount' | 'paidAmount' | 'balanceAmount' | 'freeGuestCount' | 'perTicketRate' | 'perTicketRateReason' | 'printReason' | 'payAtCounterAmount' | 'payAtCounterRemark' | 'checkInStatus' | 'checkInTime' | 'idVerified' | 'freeGuestDetails' | 'checkedInQuantities' | 'collectedAtCheckIn'> {
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
  idVerified?: number | boolean;
  free_guest_details_json?: string;
  collectedAtCheckIn?: string | number;
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

function buildLeadUpdateSetClause(data: Partial<Omit<Lead, 'id' | 'createdAt' | 'packageQuantities'>> & { package_quantities_json?: string | null }): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Lead | 'package_quantities_json' | 'free_guest_details_json')[] = [
    'clientName', 'agent', 'yacht', 'status', 'month', 'notes', 'type',
    'paymentConfirmationStatus', 'transactionId', 'bookingRefNo', 'modeOfPayment',
    'package_quantities_json', 'freeGuestCount', 'perTicketRate', 'perTicketRateReason', 'printReason', 'payAtCounterAmount', 'payAtCounterRemark',
    'totalAmount', 'commissionPercentage', 'commissionAmount', 'netAmount', 'paidAmount', 'balanceAmount',
    'updatedAt', 'lastModifiedByUserId', 'ownerUserId',
    'customerPhone', 'customerEmail', 'nationality', 'language', 'source', 'inquiryDate', 'yachtType', 'adultsCount', 'kidsCount', 'infantCount', 'infantDetails', 'noShowCount',
    'durationHours', 'budgetRange', 'occasion', 'priority', 'nextFollowUpDate', 'closingProbability',
    'captainName', 'crewDetails', 'idVerified', 'extraHoursUsed', 'extraCharges', 'customerSignatureUrl',
    'checkInStatus', 'checkInTime', 'free_guest_details_json', 'collectedAtCheckIn',
    'customAgentName', 'customAgentPhone'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Lead | 'package_quantities_json') && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (['month', 'updatedAt', 'inquiryDate', 'nextFollowUpDate', 'checkInTime'].includes(key)) {
        valuesToUpdate.push(formatToMySQLDateTime(value as string) || null);
      } else if (value === null && ['perTicketRate', 'perTicketRateReason', 'printReason', 'payAtCounterAmount', 'payAtCounterRemark', 'notes', 'transactionId', 'bookingRefNo', 'customerPhone', 'customerEmail', 'nationality', 'language', 'source', 'inquiryDate', 'yachtType', 'durationHours', 'budgetRange', 'occasion', 'priority', 'nextFollowUpDate', 'captainName', 'crewDetails', 'customerSignatureUrl', 'checkInTime', 'free_guest_details_json', 'customAgentName', 'customAgentPhone'].includes(key)) {
        valuesToUpdate.push(null);
      } else if (value === undefined && ['perTicketRate', 'payAtCounterAmount'].includes(key)) {
        valuesToUpdate.push(null);
      } else if (typeof value === 'number' && isNaN(value)) {
        valuesToUpdate.push(key === 'perTicketRate' || key === 'payAtCounterAmount' ? null : 0);
      } else if (key === 'idVerified') {
        valuesToUpdate.push(value ? 1 : 0);
      } else if (key === 'free_guest_details_json' && value !== null) {
        valuesToUpdate.push(value);
      } else {
        valuesToUpdate.push(value);
      }
    }
  });
  return { clause: fieldsToUpdate.join(', '), values: valuesToUpdate };
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const leadDataDb = await query<DbLead[]>('SELECT * FROM leads WHERE id = ?', [id]);

    if (leadDataDb.length > 0) {
      const lead = mapDbLeadToLeadObject(leadDataDb[0]);
      return NextResponse.json(lead, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[API GET /api/leads] Error:`, errorMessage);
    return NextResponse.json({ message: `Failed to fetch booking: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Booking ID is required for update' }, { status: 400 });
  }

  try {
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole, ...updatedLeadDataFromClient } = requestBody as Lead & { requestingUserId: string; requestingUserRole: string };

    const existingLeadResult = await query<DbLead[]>('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    const { ownerUserId: existingOwner, status: existingStatus } = existingLeadResult[0];

    const userRoleLower = requestingUserRole?.toLowerCase() || '';
    const canEditAll = ['admin', 'super admin', 'system administrator', 'manager', 'accounts'].includes(userRoleLower);

    if (existingStatus.startsWith('Closed') && !canEditAll) {
      return NextResponse.json({ message: 'Permission denied: Closed bookings cannot be modified by unauthorized roles.' }, { status: 403 });
    }
    if (!canEditAll && existingOwner !== requestingUserId) {
      return NextResponse.json({ message: 'Permission denied: You can only edit bookings you own, or you must be an admin/manager/account.' }, { status: 403 });
    }

    const { packageQuantities, freeGuestDetails, ...leadFields } = updatedLeadDataFromClient;
    const dataToUpdate: Partial<Omit<Lead, 'id' | 'createdAt' | 'packageQuantities' | 'freeGuestDetails'>> & { package_quantities_json?: string | null, free_guest_details_json?: string | null } = {
      ...leadFields,
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: requestingUserId,
    };

    if (packageQuantities) {
      dataToUpdate.package_quantities_json = JSON.stringify(packageQuantities);
    }
    if (freeGuestDetails) {
      dataToUpdate.free_guest_details_json = JSON.stringify(freeGuestDetails);
    }

    if (dataToUpdate.perTicketRate === undefined) delete dataToUpdate.perTicketRate;
    if (dataToUpdate.payAtCounterAmount === undefined) delete dataToUpdate.payAtCounterAmount;
    if (dataToUpdate.notes === undefined) delete dataToUpdate.notes;

    const { clause, values: updateValues } = buildLeadUpdateSetClause(dataToUpdate);
    if (clause.length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    updateValues.push(id);

    let attempt = 0;
    const maxRetries = 2;
    while (attempt < maxRetries) {
      try {
        await query(`UPDATE leads SET ${clause} WHERE id = ?`, updateValues);
        break;
      } catch (err: any) {
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          console.error(`[API PUT] Missing columns detected. Attempting auto-migration...`);
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
            console.log(`[API PUT] Auto-migration successful. Retrying update...`);
            attempt++;
            continue;
          } catch (migErr) {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    const updatedLeadFromDbResult = await query<any[]>('SELECT * FROM leads WHERE id = ?', [id]);
    if (updatedLeadFromDbResult.length === 0) {
      return NextResponse.json({ message: 'Booking updated, but failed to fetch for confirmation.' }, { status: 500 });
    }

    const finalUpdatedLead = mapDbLeadToLeadObject(updatedLeadFromDbResult[0]);
    return NextResponse.json(finalUpdatedLead, { status: 200 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[API PUT /api/leads] Error:`, errorMessage);
    return NextResponse.json({ message: `Failed to update booking: ${errorMessage}`, error: err }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Booking ID is required for deletion' }, { status: 400 });
  }

  try {
    const requestBody = await request.json();
    const { requestingUserId, requestingUserRole } = requestBody as { requestingUserId: string; requestingUserRole: string };

    if (!requestingUserId || !requestingUserRole) {
      return NextResponse.json({ message: 'User credentials are required for deletion.' }, { status: 401 });
    }

    const existingLeadResult = await query<DbLead[]>('SELECT ownerUserId, status FROM leads WHERE id = ?', [id]);
    if (existingLeadResult.length === 0) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    const { ownerUserId: existingOwner, status: existingStatus } = existingLeadResult[0];

    const userRoleLower = requestingUserRole?.toLowerCase() || '';
    const isSuperOrAdmin = ['admin', 'super admin', 'system administrator'].includes(userRoleLower);

    if (existingStatus.startsWith('Closed') && !isSuperOrAdmin) {
      return NextResponse.json({ message: 'Permission denied: Closed bookings cannot be deleted by unauthorized roles.' }, { status: 403 });
    }
    if (!isSuperOrAdmin && existingOwner !== requestingUserId) {
      return NextResponse.json({ message: 'Permission denied: You can only delete bookings you own, or you must be an admin.' }, { status: 403 });
    }

    const result = await query<{ affectedRows: number }>('DELETE FROM leads WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Booking not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[API DELETE /api/leads] Error:`, errorMessage);
    return NextResponse.json({ message: `Failed to delete booking: ${errorMessage}` }, { status: 500 });
  }
}
