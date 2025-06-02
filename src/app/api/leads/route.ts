
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment, LeadType, LeadPackageQuantity, PaymentConfirmationStatus } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

const SIMULATED_CURRENT_USER_ID_API = 'DO-user-api'; // Placeholder for server-side user ID

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
              packageId: String(pq.packageId || ''),
              packageName: String(pq.packageName || 'Unknown Package'),
              quantity: Number(pq.quantity || 0),
              rate: Number(pq.rate || 0),
            }));
          }
        } catch (e) {
          console.warn(`[API GET /api/leads] Failed to parse package_quantities_json for lead ${dbLead.id}`, e);
        }
      }

      const leadTyped: Lead = {
        id: String(dbLead.id || ''),
        clientName: String(dbLead.clientName || ''),
        agent: String(dbLead.agent || ''),
        yacht: String(dbLead.yacht || ''),
        status: (dbLead.status || 'Balance') as LeadStatus,
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()),
        notes: dbLead.notes || undefined,
        type: (dbLead.type || 'Private Cruise') as LeadType,
        paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'CONFIRMED') as PaymentConfirmationStatus, // New field
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
      return leadTyped;
    });
    console.log('[API GET /api/leads] Mapped Leads Data Sample (first item):', leads.length > 0 ? leads[0] : 'No leads mapped');
    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/leads] Error:', error);
    return NextResponse.json({ message: 'Failed to fetch leads', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newLeadData = await request.json() as Lead; 
    console.log('[API POST /api/leads] Received newLeadData:', JSON.stringify(newLeadData, null, 2));

    if (!newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht || !newLeadData.month) {
      console.error('[API POST /api/leads] Validation Error: Missing required fields (clientName, agent, yacht, month/event date).');
      return NextResponse.json({ message: 'Missing required lead fields (clientName, agent, yacht, month/event date)' }, { status: 400 });
    }
    
    let leadId = newLeadData.id;
    if (!leadId) {
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

    const leadToStore = {
      id: leadId!,
      clientName: newLeadData.clientName,
      agent: newLeadData.agent,
      yacht: newLeadData.yacht,
      status: newLeadData.status || 'Balance',
      month: formattedMonth, 
      notes: newLeadData.notes || null,
      type: newLeadData.type || 'Private Cruise',
      paymentConfirmationStatus: newLeadData.paymentConfirmationStatus || 'CONFIRMED', // New field
      transactionId: newLeadData.transactionId || null,
      modeOfPayment: newLeadData.modeOfPayment || 'Online',
      
      package_quantities_json: packageQuantitiesJson,
      
      totalAmount: Number(newLeadData.totalAmount || 0),
      commissionPercentage: Number(newLeadData.commissionPercentage || 0),
      commissionAmount: Number(newLeadData.commissionAmount || 0),
      netAmount: Number(newLeadData.netAmount || 0),
      paidAmount: Number(newLeadData.paidAmount || 0),
      balanceAmount: Number(newLeadData.balanceAmount || 0), 

      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt,
      lastModifiedByUserId: newLeadData.lastModifiedByUserId || SIMULATED_CURRENT_USER_ID_API, 
      ownerUserId: newLeadData.ownerUserId || newLeadData.lastModifiedByUserId || SIMULATED_CURRENT_USER_ID_API, 
    };
    
    console.log('[API POST /api/leads] leadToStore (to be inserted):', JSON.stringify(leadToStore, null, 2));

    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, paymentConfirmationStatus, transactionId, modeOfPayment,
        package_quantities_json,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      leadToStore.id, leadToStore.clientName, leadToStore.agent, leadToStore.yacht, leadToStore.status, 
      leadToStore.month, leadToStore.notes, leadToStore.type, leadToStore.paymentConfirmationStatus, leadToStore.transactionId, leadToStore.modeOfPayment,
      leadToStore.package_quantities_json,
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
              if(Array.isArray(parsedPQs)) pq = parsedPQs;
            } catch(e){ console.warn("Error parsing PQ_JSON on fetch after insert for lead:", dbLead.id, e);}
        }
        const finalLead: Lead = { 
            id: String(dbLead.id || ''), clientName: String(dbLead.clientName || ''), agent: String(dbLead.agent || ''), yacht: String(dbLead.yacht || ''), 
            status: (dbLead.status || 'Balance') as LeadStatus,
            month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()), 
            notes: dbLead.notes || undefined, type: (dbLead.type || 'Private Cruise') as LeadType, 
            paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'CONFIRMED') as PaymentConfirmationStatus, // New field
            transactionId: dbLead.transactionId || undefined,
            modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,
            packageQuantities: pq,
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
        console.log('[API POST /api/leads] Successfully created lead and returning from DB:', finalLead.id);
        return NextResponse.json(finalLead, { status: 201 });
      }
      console.warn('[API POST /api/leads] Lead inserted, but failed to fetch for confirmation. Returning original payload with adaptations.');
      // Adapt leadToStore back to Lead type for response
      const responseLead: Lead = { ...leadToStore, packageQuantities: newLeadData.packageQuantities || [] };
      delete (responseLead as any).package_quantities_json;
      return NextResponse.json(responseLead, { status: 201 });
    } else {
      console.error('[API POST /api/leads] Database insert failed, affectedRows was not 1.');
      throw new Error('Failed to insert lead into database');
    }
  } catch (error) {
    console.error('[API POST /api/leads] Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during lead creation';
    return NextResponse.json({ message: 'Failed to create lead', error: errorMessage }, { status: 500 });
  }
}
