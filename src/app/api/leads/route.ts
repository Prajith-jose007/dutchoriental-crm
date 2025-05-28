
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadStatus, ModeOfPayment } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

// Helper to ensure date strings are in a consistent format for DB or client
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
  } catch(e) {
    return dateString; 
  }
};

export async function GET(request: NextRequest) {
  try {
    const leadsData: any[] = await query('SELECT * FROM leads ORDER BY createdAt DESC');
    console.log('[API GET /api/leads] Raw DB Data:', leadsData);

    const leads: Lead[] = leadsData.map(dbLead => {
      const leadTyped: Lead = {
        id: dbLead.id,
        agent: dbLead.agent,
        status: dbLead.status as LeadStatus,
        month: ensureISOFormat(dbLead.month) || new Date().toISOString(),
        notes: dbLead.notes,
        yacht: dbLead.yacht,
        type: dbLead.type,
        invoiceId: dbLead.invoiceId,
        modeOfPayment: dbLead.modeOfPayment as ModeOfPayment,
        clientName: dbLead.clientName,

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

        createdAt: ensureISOFormat(dbLead.createdAt) || new Date().toISOString(),
        updatedAt: ensureISOFormat(dbLead.updatedAt) || new Date().toISOString(),
        lastModifiedByUserId: dbLead.lastModifiedByUserId,
        ownerUserId: dbLead.ownerUserId,
      };
      return leadTyped;
    });
    console.log('[API GET /api/leads] Mapped Leads Data:', leads);
    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json({ message: 'Failed to fetch leads from API', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newLeadData = await request.json() as Partial<Omit<Lead, 'createdAt' | 'updatedAt' | 'id'>> & { id?: string };

    if (!newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht || !newLeadData.month) {
      return NextResponse.json({ message: 'Missing required lead fields (clientName, agent, yacht, month)' }, { status: 400 });
    }
    
    const leadId = newLeadData.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    const now = new Date();
    
    // Ensure month is correctly formatted or defaulted
    let formattedMonth = newLeadData.month ? ensureISOFormat(newLeadData.month) : formatISO(now);
    if (!formattedMonth || !isValid(parseISO(formattedMonth))) {
        console.warn(`Invalid month provided for new lead ${leadId}, defaulting to now:`, newLeadData.month);
        formattedMonth = formatISO(now);
    }
    
    const formattedCreatedAt = newLeadData.createdAt && isValid(parseISO(newLeadData.createdAt)) ? ensureISOFormat(newLeadData.createdAt)! : formatISO(now);
    const formattedUpdatedAt = formatISO(now);
    
    const leadToStore: Lead = {
      id: leadId,
      clientName: newLeadData.clientName,
      agent: newLeadData.agent,
      status: newLeadData.status || 'Upcoming',
      month: formattedMonth,
      notes: newLeadData.notes || null,
      yacht: newLeadData.yacht,
      type: newLeadData.type || 'N/A',
      invoiceId: newLeadData.invoiceId || null,
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
      lastModifiedByUserId: newLeadData.lastModifiedByUserId || null, 
      ownerUserId: newLeadData.ownerUserId || newLeadData.lastModifiedByUserId || null, 
    };
    
    const sql = `
      INSERT INTO leads (
        id, clientName, agent, yacht, status, month, notes, type, invoiceId, modeOfPayment,
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
      leadToStore.month, leadToStore.notes, leadToStore.type, leadToStore.invoiceId, leadToStore.modeOfPayment,
      leadToStore.qty_childRate, leadToStore.qty_adultStandardRate, leadToStore.qty_adultStandardDrinksRate,
      leadToStore.qty_vipChildRate, leadToStore.qty_vipAdultRate, leadToStore.qty_vipAdultDrinksRate,
      leadToStore.qty_royalChildRate, leadToStore.qty_royalAdultRate, leadToStore.qty_royalDrinksRate,
      leadToStore.othersAmtCake,
      leadToStore.totalAmount, leadToStore.commissionPercentage, leadToStore.commissionAmount, leadToStore.netAmount,
      leadToStore.paidAmount, leadToStore.balanceAmount,
      leadToStore.createdAt, leadToStore.updatedAt, leadToStore.lastModifiedByUserId, leadToStore.ownerUserId
    ];

    const result: any = await query(sql, params);

    if (result.affectedRows === 1) {
      const finalLead: Lead = {
        ...leadToStore,
        month: ensureISOFormat(leadToStore.month)!,
        createdAt: ensureISOFormat(leadToStore.createdAt)!,
        updatedAt: ensureISOFormat(leadToStore.updatedAt)!,
      };
      return NextResponse.json(finalLead, { status: 201 });
    } else {
      throw new Error('Failed to insert lead into database');
    }
  } catch (error) {
    console.error('Failed to create lead in POST /api/leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to create lead', error: errorMessage }, { status: 500 });
  }
}
