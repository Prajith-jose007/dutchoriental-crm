
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
import { placeholderLeads as initialLeads } from '@/lib/placeholder-data';
let leads_db_placeholder: Lead[] = [...initialLeads]; 


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const lead = leads_db_placeholder.find(l => l.id === id);

    if (lead) {
      return NextResponse.json(lead, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch lead', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedLeadData = await request.json() as Partial<Omit<Lead, 'id' | 'createdAt'>> & { lastModifiedByUserId?: string; ownerUserId?: string; notes?: string; month?: string };

    const leadIndex = leads_db_placeholder.findIndex(l => l.id === id);
    if (leadIndex === -1) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const leadToUpdate = leads_db_placeholder[leadIndex];
    
    const updatedLead: Lead = {
      ...leadToUpdate, 
      ...updatedLeadData, 
      id: leadToUpdate.id, 
      createdAt: leadToUpdate.createdAt, 
      updatedAt: now, 
      month: updatedLeadData.month !== undefined ? updatedLeadData.month : leadToUpdate.month, // Ensure month is ISO string
      notes: updatedLeadData.notes !== undefined ? updatedLeadData.notes : leadToUpdate.notes,
    };
    
    leads_db_placeholder[leadIndex] = updatedLead;

    return NextResponse.json(updatedLead, { status: 200 });
  } catch (error) {
    console.error(`Failed to update lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update lead', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const leadIndex = leads_db_placeholder.findIndex(l => l.id === id);
    if (leadIndex === -1) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    leads_db_placeholder.splice(leadIndex, 1);

    return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete lead', error: (error as Error).message }, { status: 500 });
  }
}
