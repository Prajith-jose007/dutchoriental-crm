
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
import { placeholderLeads } from '@/lib/placeholder-data'; // Used for initial data if DB is empty

// In-memory store (replace with actual database calls)
let leads_db_placeholder: Lead[] = [...placeholderLeads]; // Initialize with placeholder data

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query: SELECT * FROM leads ORDER BY createdAt DESC
    // For now, returning the in-memory store, sorted by createdAt for consistency
    const sortedLeads = [...leads_db_placeholder].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(sortedLeads, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return NextResponse.json({ message: 'Failed to fetch leads', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newLeadData = await request.json() as Omit<Lead, 'createdAt' | 'updatedAt'> & Partial<Pick<Lead, 'createdAt' | 'updatedAt' | 'lastModifiedByUserId'>>;

    if (!newLeadData.id || !newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht) {
      return NextResponse.json({ message: 'Missing required lead fields' }, { status: 400 });
    }

    // TODO: Replace with actual database insert operation
    const existingLead = leads_db_placeholder.find(l => l.id === newLeadData.id);
    if (existingLead) {
      return NextResponse.json({ message: `Lead with ID ${newLeadData.id} already exists.` }, { status: 409 });
    }

    const now = new Date().toISOString();
    const leadToStore: Lead = {
      ...newLeadData,
      // Ensure all package quantity fields have a default of 0 if not provided
      dhowChildQty: newLeadData.dhowChildQty ?? 0,
      dhowAdultQty: newLeadData.dhowAdultQty ?? 0,
      dhowVipQty: newLeadData.dhowVipQty ?? 0,
      dhowVipChildQty: newLeadData.dhowVipChildQty ?? 0,
      dhowVipAlcoholQty: newLeadData.dhowVipAlcoholQty ?? 0,
      oeChildQty: newLeadData.oeChildQty ?? 0,
      oeAdultQty: newLeadData.oeAdultQty ?? 0,
      oeVipQty: newLeadData.oeVipQty ?? 0,
      oeVipChildQty: newLeadData.oeVipChildQty ?? 0,
      oeVipAlcoholQty: newLeadData.oeVipAlcoholQty ?? 0,
      sunsetChildQty: newLeadData.sunsetChildQty ?? 0,
      sunsetAdultQty: newLeadData.sunsetAdultQty ?? 0,
      sunsetVipQty: newLeadData.sunsetVipQty ?? 0,
      sunsetVipChildQty: newLeadData.sunsetVipChildQty ?? 0,
      sunsetVipAlcoholQty: newLeadData.sunsetVipAlcoholQty ?? 0,
      lotusChildQty: newLeadData.lotusChildQty ?? 0,
      lotusAdultQty: newLeadData.lotusAdultQty ?? 0,
      lotusVipQty: newLeadData.lotusVipQty ?? 0,
      lotusVipChildQty: newLeadData.lotusVipChildQty ?? 0,
      lotusVipAlcoholQty: newLeadData.lotusVipAlcoholQty ?? 0,
      royalQty: newLeadData.royalQty ?? 0,
      othersAmtCake: newLeadData.othersAmtCake ?? 0,
      commissionAmount: newLeadData.commissionAmount ?? 0,
      createdAt: newLeadData.createdAt || now,
      updatedAt: now,
      lastModifiedByUserId: newLeadData.lastModifiedByUserId // Will be set by client
    };
    
    leads_db_placeholder.push(leadToStore);
    
    return NextResponse.json(leadToStore, { status: 201 });
  } catch (error) {
    console.error('Failed to create lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to create lead', error: errorMessage }, { status: 500 });
  }
}
