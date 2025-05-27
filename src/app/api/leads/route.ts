// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
import { formatISO } from 'date-fns';
// import { query } from '@/lib/db'; // You'll need to implement this

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query: SELECT * FROM leads ORDER BY createdAt DESC
    // Example: const leadsData = await query('SELECT * FROM leads ORDER BY createdAt DESC');
    // Ensure createdAt is a valid date string before using it in new Date() for sorting if done in JS
    const leads: Lead[] = []; // Replace with actual data from DB
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

    // TODO: Check if lead with this ID already exists in the database
    // Example: const existingLead = await query('SELECT id FROM leads WHERE id = ?', [newLeadData.id]);
    // if (existingLead.length > 0) {
    //   return NextResponse.json({ message: `Lead with ID ${newLeadData.id} already exists.` }, { status: 409 });
    // }

    const now = new Date().toISOString();
    
    let validCreatedAt = now;
    if (newLeadData.createdAt && typeof newLeadData.createdAt === 'string') {
        const parsedDate = new Date(newLeadData.createdAt); // parseISO is more robust for ISO strings
        if (!isNaN(parsedDate.getTime())) {
            validCreatedAt = newLeadData.createdAt; // Keep original if valid ISO
        } else {
            console.warn(`Invalid createdAt received for new lead ${newLeadData.id}: ${newLeadData.createdAt}. Defaulting to current time.`);
        }
    }
    
    const leadToStore: Lead = {
      id: newLeadData.id,
      clientName: newLeadData.clientName,
      agent: newLeadData.agent,
      status: newLeadData.status || 'Upcoming',
      month: newLeadData.month, // Ensure this is a valid ISO string from client or parsed correctly
      notes: newLeadData.notes,
      yacht: newLeadData.yacht,
      type: newLeadData.type || 'N/A',
      invoiceId: newLeadData.invoiceId,
      modeOfPayment: newLeadData.modeOfPayment || 'Online',
      
      qty_childRate: newLeadData.qty_childRate ?? 0,
      qty_adultStandardRate: newLeadData.qty_adultStandardRate ?? 0,
      qty_adultStandardDrinksRate: newLeadData.qty_adultStandardDrinksRate ?? 0,
      qty_vipChildRate: newLeadData.qty_vipChildRate ?? 0,
      qty_vipAdultRate: newLeadData.qty_vipAdultRate ?? 0,
      qty_vipAdultDrinksRate: newLeadData.qty_vipAdultDrinksRate ?? 0,
      qty_royalChildRate: newLeadData.qty_royalChildRate ?? 0,
      qty_royalAdultRate: newLeadData.qty_royalAdultRate ?? 0,
      qty_royalDrinksRate: newLeadData.qty_royalDrinksRate ?? 0,
      othersAmtCake: newLeadData.othersAmtCake ?? 0, // This should be qty_otherChargeRate based on current setup
      
      totalAmount: newLeadData.totalAmount || 0,
      commissionPercentage: newLeadData.commissionPercentage || 0,
      commissionAmount: newLeadData.commissionAmount || 0,
      netAmount: newLeadData.netAmount || 0,
      paidAmount: newLeadData.paidAmount || 0,
      balanceAmount: newLeadData.balanceAmount || 0,

      createdAt: validCreatedAt,
      updatedAt: now,
      lastModifiedByUserId: newLeadData.lastModifiedByUserId, 
      ownerUserId: newLeadData.ownerUserId || newLeadData.lastModifiedByUserId, 
    };
    
    // TODO: Implement MySQL query to insert leadToStore
    // Example: const result = await query('INSERT INTO leads SET ?', leadToStore);
    // if (result.affectedRows === 1) {
    //   return NextResponse.json(leadToStore, { status: 201 });
    // } else {
    //   throw new Error('Failed to insert lead into database');
    // }

    // Placeholder response
    return NextResponse.json(leadToStore, { status: 201 });

  } catch (error) {
    console.error('Failed to create lead in POST /api/leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to create lead', error: errorMessage }, { status: 500 });
  }
}
