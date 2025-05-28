
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

// Helper to ensure date strings are in a consistent format for DB
const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) return formatISO(dateString);
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return formatISO(parsed);
    return null;
  } catch {
    return null;
  }
};


export async function GET(request: NextRequest) {
  try {
    const leadsData: any[] = await query('SELECT * FROM leads ORDER BY createdAt DESC');
    const leads: Lead[] = leadsData.map(lead => ({
      ...lead,
      month: ensureISOFormat(lead.month) || new Date().toISOString(),
      createdAt: ensureISOFormat(lead.createdAt) || new Date().toISOString(),
      updatedAt: ensureISOFormat(lead.updatedAt) || new Date().toISOString(),
      // Ensure numeric fields are numbers
      dhowChildQty: Number(lead.dhowChildQty || 0),
      dhowAdultQty: Number(lead.dhowAdultQty || 0),
      dhowVipQty: Number(lead.dhowVipQty || 0),
      dhowVipChildQty: Number(lead.dhowVipChildQty || 0),
      dhowVipAlcoholQty: Number(lead.dhowVipAlcoholQty || 0),
      oeChildQty: Number(lead.oeChildQty || 0),
      oeAdultQty: Number(lead.oeAdultQty || 0),
      oeVipQty: Number(lead.oeVipQty || 0),
      oeVipChildQty: Number(lead.oeVipChildQty || 0),
      oeVipAlcoholQty: Number(lead.oeVipAlcoholQty || 0),
      sunsetChildQty: Number(lead.sunsetChildQty || 0),
      sunsetAdultQty: Number(lead.sunsetAdultQty || 0),
      sunsetVipQty: Number(lead.sunsetVipQty || 0),
      sunsetVipChildQty: Number(lead.sunsetVipChildQty || 0),
      sunsetVipAlcoholQty: Number(lead.sunsetVipAlcoholQty || 0),
      lotusChildQty: Number(lead.lotusChildQty || 0),
      lotusAdultQty: Number(lead.lotusAdultQty || 0),
      lotusVipQty: Number(lead.lotusVipQty || 0),
      lotusVipChildQty: Number(lead.lotusVipChildQty || 0),
      lotusVipAlcoholQty: Number(lead.lotusVipAlcoholQty || 0),
      royalQty: Number(lead.royalQty || 0),
      othersAmtCake: parseFloat(lead.othersAmtCake || 0),
      totalAmount: parseFloat(lead.totalAmount || 0),
      commissionPercentage: parseFloat(lead.commissionPercentage || 0),
      commissionAmount: parseFloat(lead.commissionAmount || 0),
      netAmount: parseFloat(lead.netAmount || 0),
      paidAmount: parseFloat(lead.paidAmount || 0),
      balanceAmount: parseFloat(lead.balanceAmount || 0),
    }));
    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json({ message: 'Failed to fetch leads from API', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newLeadData = await request.json() as Omit<Lead, 'createdAt' | 'updatedAt'> & 
      Partial<Pick<Lead, 'createdAt' | 'updatedAt' | 'lastModifiedByUserId' | 'ownerUserId'>>;

    if (!newLeadData.id || !newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht || !newLeadData.month) {
      return NextResponse.json({ message: 'Missing required lead fields (id, clientName, agent, yacht, month)' }, { status: 400 });
    }
    
    const existingLead: any = await query('SELECT id FROM leads WHERE id = ?', [newLeadData.id]);
    if (existingLead.length > 0) {
      return NextResponse.json({ message: `Lead with ID ${newLeadData.id} already exists.` }, { status: 409 });
    }

    const now = new Date();
    const formattedMonth = ensureISOFormat(newLeadData.month) || formatISO(now);
    const formattedCreatedAt = ensureISOFormat(newLeadData.createdAt) || formatISO(now);
    const formattedUpdatedAt = formatISO(now);
    
    const leadToStore: Lead = {
      id: newLeadData.id,
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
      return NextResponse.json(leadToStore, { status: 201 });
    } else {
      throw new Error('Failed to insert lead into database');
    }
  } catch (error) {
    console.error('Failed to create lead in POST /api/leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to create lead', error: errorMessage }, { status: 500 });
  }
}
