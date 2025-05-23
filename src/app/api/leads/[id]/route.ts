
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
// In a real app, this would all interact with the same database.
// For this example, placeholder data is managed in the main route file.
// This is a simplified mock.
import { placeholderLeads } from '@/lib/placeholder-data';
let leads_db_placeholder: Lead[] = [...placeholderLeads]; // Use the same instance or connect to DB


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Replace with actual database query
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
    const updatedLeadData = await request.json() as Partial<Omit<Lead, 'id' | 'createdAt'>> & { lastModifiedByUserId?: string; ownerUserId?: string };

    // TODO: Replace with actual database update operation
    const leadIndex = leads_db_placeholder.findIndex(l => l.id === id);
    if (leadIndex === -1) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const leadToUpdate = leads_db_placeholder[leadIndex];
    
    const updatedLead: Lead = {
      ...leadToUpdate,
      ...updatedLeadData,
      id: leadToUpdate.id, // Ensure ID is not changed
      createdAt: leadToUpdate.createdAt, // Ensure createdAt is not changed
      updatedAt: now,
      // lastModifiedByUserId and ownerUserId will come from updatedLeadData
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
    // TODO: Replace with actual database delete operation
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
