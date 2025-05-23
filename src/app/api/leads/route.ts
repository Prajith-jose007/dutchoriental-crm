
// src/app/api/leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
import { placeholderLeads } from '@/lib/placeholder-data'; // Used for initial data if DB is empty

// In-memory store (replace with actual database calls)
let leads_db_placeholder: Lead[] = [...placeholderLeads]; // Initialize with placeholder data

export async function GET(request: NextRequest) {
  try {
    // Filter for leads with valid createdAt dates before sorting
    const validLeads = leads_db_placeholder.filter(lead => {
      if (!lead.createdAt || typeof lead.createdAt !== 'string') {
        console.warn(`Lead with ID ${lead.id} has missing or invalid createdAt type. Excluding from sort.`);
        return false;
      }
      const date = new Date(lead.createdAt);
      const isValidDate = !isNaN(date.getTime());
      if (!isValidDate) {
        console.warn(`Lead with ID ${lead.id} has invalid createdAt value: ${lead.createdAt}. Excluding from sort.`);
      }
      return isValidDate;
    });

    const sortedLeads = [...validLeads].sort((a, b) => {
      // At this point, a.createdAt and b.createdAt are known to be valid date strings from valid Lead objects
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return NextResponse.json(sortedLeads, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json({ message: 'Failed to fetch leads from API', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newLeadData = await request.json() as Omit<Lead, 'createdAt' | 'updatedAt'> & Partial<Pick<Lead, 'createdAt' | 'updatedAt' | 'lastModifiedByUserId' | 'ownerUserId'>>;

    if (!newLeadData.id || !newLeadData.clientName || !newLeadData.agent || !newLeadData.yacht) {
      return NextResponse.json({ message: 'Missing required lead fields (id, clientName, agent, yacht)' }, { status: 400 });
    }

    // TODO: Replace with actual database insert operation
    const existingLead = leads_db_placeholder.find(l => l.id === newLeadData.id);
    if (existingLead) {
      return NextResponse.json({ message: `Lead with ID ${newLeadData.id} already exists.` }, { status: 409 });
    }

    const now = new Date().toISOString();
    
    // Validate or default createdAt
    let validCreatedAt = now;
    if (newLeadData.createdAt && typeof newLeadData.createdAt === 'string') {
        const parsedDate = new Date(newLeadData.createdAt);
        if (!isNaN(parsedDate.getTime())) {
            validCreatedAt = newLeadData.createdAt;
        } else {
            console.warn(`Invalid createdAt received for new lead ${newLeadData.id}: ${newLeadData.createdAt}. Defaulting to current time.`);
        }
    }


    const leadToStore: Lead = {
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
      ...newLeadData, 
      createdAt: validCreatedAt,
      updatedAt: now,
      lastModifiedByUserId: newLeadData.lastModifiedByUserId, 
      ownerUserId: newLeadData.ownerUserId || newLeadData.lastModifiedByUserId, 
    };
    
    leads_db_placeholder.push(leadToStore);
    
    return NextResponse.json(leadToStore, { status: 201 });
  } catch (error) {
    console.error('Failed to create lead in POST /api/leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to create lead', error: errorMessage }, { status: 500 });
  }
}

