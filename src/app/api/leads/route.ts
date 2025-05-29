
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment, LeadType } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';
import { placeholderLeads } from '@/lib/placeholder-data'; // For ID generation logic if DB is empty

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

export async function GET(request: NextRequest) {
  console.log('[API GET /api/leads] Received request');
  try {
    const leadsData: any[] = await query('SELECT * FROM leads ORDER BY createdAt DESC');
    console.log('[API GET /api/leads] Raw DB Data Sample (first item):', leadsData.length > 0 ? leadsData[0] : 'No leads found');

    const leads: Lead[] = leadsData.map(dbLead => {
      const leadTyped: Lead = {
        id: dbLead.id,
        clientName: dbLead.clientName || '',
        agent: dbLead.agent || '',
        yacht: dbLead.yacht || '',
        status: (dbLead.status || 'Upcoming') as LeadStatus,
        month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()), // Event Date
        notes: dbLead.notes || undefined,
        type: (dbLead.type || 'Private') as LeadType,
        transactionId: dbLead.transactionId || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,
        
        qty_childRate: Number(dbLead.qty_childRate || 0),
        qty_adultStandardRate: Number(dbLead.qty_adultStandardRate || 0),
        qty_adultStandardDrinksRate: Number(dbLead.qty_adultStandardDrinksRate || 0),
        qty_vipChildRate: Number(dbLead.qty_vipChildRate || 0),
        qty_vipAdultRate: Number(dbLead.qty_vipAdultRate || 0),
        qty_vipAdultDrinksRate: Number(dbLead.qty_vipAdultDrinksRate || 0),
        qty_royalChildRate: Number(dbLead.qty_royalChildRate || 0),
        qty_royalAdultRate: Number(dbLead.qty_royalAdultRate || 0),
        qty_royalDrinksRate: Number(dbLead.qty_royalDrinksRate || 0),
        
        othersAmtCake: Number(dbLead.othersAmtCake || 0), // Quantity for custom charge

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

function generateNewLeadId(existingLeads: Lead[]): string {
  const prefix = "DO-";
  let maxNum = 0;
  existingLeads.forEach(lead => {
    if (lead.id && lead.id.startsWith(prefix)) {
      const numPart = parseInt(lead.id.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}


export async function POST(request: NextRequest) {
  try {
    const newLeadData = await request.json() as Partial<Lead>; // Use Partial<Lead> as not all fields might be sent
    console.log('[API POST /api/leads] Received newLeadData:', JSON.stringify(newLeadData, null, 2));

    // Basic validation for required fields
    if (!newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht || !newLeadData.month) {
      console.error('[API POST /api/leads] Validation Error: Missing required fields (clientName, agent, yacht, month/event date).');
      return NextResponse.json({ message: 'Missing required lead fields (clientName, agent, yacht, month/event date)' }, { status: 400 });
    }
    
    let leadId = newLeadData.id;
    if (!leadId) {
      const currentLeadsFromDB: any[] = await query('SELECT id FROM leads WHERE id LIKE "DO-%"');
      const existingLeadIds = currentLeadsFromDB.map(l => l.id as string);
      leadId = generateNewLeadId(existingLeadIds.map(id => ({id} as Lead)));
      console.log(`[API POST /api/leads] Generated new Lead ID: ${leadId}`);
    }


    const now = new Date();
    const formattedMonth = newLeadData.month ? ensureISOFormat(newLeadData.month) : formatISO(now);
    if (!formattedMonth || !isValid(parseISO(formattedMonth))) {
        console.warn(`[API POST /api/leads] Invalid month/event date provided for new lead ${leadId}, defaulting to now:`, newLeadData.month);
        return NextResponse.json({ message: 'Invalid month/event date format. Expected ISO string.' }, { status: 400 });
    }
    
    const formattedCreatedAt = newLeadData.createdAt && isValid(parseISO(newLeadData.createdAt)) ? ensureISOFormat(newLeadData.createdAt)! : formatISO(now);
    const formattedUpdatedAt = formatISO(now);
    
    const leadToStore: Lead = {
      id: leadId!,
      clientName: newLeadData.clientName, // Already validated
      agent: newLeadData.agent,           // Already validated
      yacht: newLeadData.yacht,           // Already validated
      status: newLeadData.status || 'Upcoming',
      month: formattedMonth, 
      notes: newLeadData.notes || null, // Use null for empty optional strings in DB
      type: newLeadData.type || 'Private',
      transactionId: newLeadData.transactionId || null,
      modeOfPayment: newLeadData.modeOfPayment || 'Online',
      
      qty_childRate: Number(newLeadData.qty_childRate || 0),
      qty_adultStandardRate: Number(newLeadData.qty_adultStandardRate || 0),
      qty_adultStandardDrinksRate: Number(newLeadData.qty_adultStandardDrinksRate || 0),
      qty_vipChildRate: Number(newLeadData.qty_vipChildRate || 0),
      qty_vipAdultRate: Number(newLeadData.qty_vipAdultRate || 0),
      qty_vipAdultDrinksRate: Number(newLeadData.qty_vipAdultDrinksRate || 0),
      qty_royalChildRate: Number(newLeadData.qty_royalChildRate || 0),
      qty_royalAdultRate: Number(newLeadData.qty_royalAdultRate || 0),
      qty_royalDrinksRate: Number(newLeadData.qty_royalDrinksRate || 0),
      
      othersAmtCake: Number(newLeadData.othersAmtCake || 0),
      
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
        id, clientName, agent, yacht, status, month, notes, type, transactionId, modeOfPayment,
        qty_childRate, qty_adultStandardRate, qty_adultStandardDrinksRate,
        qty_vipChildRate, qty_vipAdultRate, qty_vipAdultDrinksRate,
        qty_royalChildRate, qty_royalAdultRate, qty_royalDrinksRate,
        othersAmtCake,
        totalAmount, commissionPercentage, commissionAmount, netAmount,
        paidAmount, balanceAmount,
        createdAt, updatedAt, lastModifiedByUserId, ownerUserId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      leadToStore.id, leadToStore.clientName, leadToStore.agent, leadToStore.yacht, leadToStore.status, 
      leadToStore.month, leadToStore.notes, leadToStore.type, leadToStore.transactionId, leadToStore.modeOfPayment,
      leadToStore.qty_childRate, leadToStore.qty_adultStandardRate, leadToStore.qty_adultStandardDrinksRate,
      leadToStore.qty_vipChildRate, leadToStore.qty_vipAdultRate, leadToStore.qty_vipAdultDrinksRate,
      leadToStore.qty_royalChildRate, leadToStore.qty_royalAdultRate, leadToStore.qty_royalDrinksRate,
      leadToStore.othersAmtCake,
      leadToStore.totalAmount, leadToStore.commissionPercentage, leadToStore.commissionAmount, leadToStore.netAmount,
      leadToStore.paidAmount, leadToStore.balanceAmount,
      leadToStore.createdAt, leadToStore.updatedAt, leadToStore.lastModifiedByUserId, leadToStore.ownerUserId
    ];
    
    console.log('[API POST /api/leads] SQL Params:', JSON.stringify(params, null, 2));

    const result: any = await query(sql, params);
    console.log('[API POST /api/leads] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      // Fetch the inserted lead to return it, ensuring all fields are as stored
      const insertedLeadData: any[] = await query('SELECT * FROM leads WHERE id = ?', [leadToStore.id]);
      if (insertedLeadData.length > 0) {
        const dbLead = insertedLeadData[0];
        // Map dbLead to Lead type correctly (similar to GET handler)
        const finalLead: Lead = {
            id: dbLead.id, clientName: dbLead.clientName || '', agent: dbLead.agent || '', yacht: dbLead.yacht || '', 
            status: (dbLead.status || 'Upcoming') as LeadStatus,
            month: dbLead.month ? ensureISOFormat(dbLead.month)! : formatISO(new Date()), 
            notes: dbLead.notes || undefined, type: (dbLead.type || 'Private') as LeadType, 
            transactionId: dbLead.transactionId || undefined,
            modeOfPayment: (dbLead.modeOfPayment || 'Online') as ModeOfPayment,
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
            createdAt: dbLead.createdAt ? ensureISOFormat(dbLead.createdAt)! : formatISO(new Date()),
            updatedAt: dbLead.updatedAt ? ensureISOFormat(dbLead.updatedAt)! : formatISO(new Date()),
            lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined, 
            ownerUserId: dbLead.ownerUserId || undefined,
        };
        console.log('[API POST /api/leads] Successfully created lead and returning from DB:', finalLead.id);
        return NextResponse.json(finalLead, { status: 201 });
      }
      console.warn('[API POST /api/leads] Lead inserted, but failed to fetch for confirmation. Returning original payload.');
      return NextResponse.json(leadToStore, { status: 201 }); // Fallback
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

