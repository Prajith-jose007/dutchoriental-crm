
// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
// TODO: Implement your database connection logic (e.g., in /src/lib/db.ts)
// import { query } from '@/lib/db'; // Example import

// Dummy data store (replace with actual database calls)
// This should be the same store as in /api/leads/route.ts for consistency in this example
// In a real app, this would all interact with the same database.
let leads_db_placeholder: Lead[] = []; 


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Replace with actual database query
    // const result = await query('SELECT * FROM leads WHERE id = $1', [id]);
    // const lead = result.rows[0];

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
    const updatedLeadData = await request.json() as Partial<Lead>;

    // TODO: Replace with actual database update operation
    // const result = await query(
    //   'UPDATE leads SET clientName = $1, status = $2, ... WHERE id = $N RETURNING *',
    //   [updatedLeadData.clientName, updatedLeadData.status, ..., id]
    // );
    // const updatedLead = result.rows[0];

    const leadIndex = leads_db_placeholder.findIndex(l => l.id === id);
    if (leadIndex === -1) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    leads_db_placeholder[leadIndex] = { ...leads_db_placeholder[leadIndex], ...updatedLeadData, id }; // Ensure ID isn't overwritten if not in partial
    const updatedLead = leads_db_placeholder[leadIndex];

    if (updatedLead) {
      return NextResponse.json(updatedLead, { status: 200 });
    } else {
      // This case should ideally be caught by the findIndex check or DB operation
      return NextResponse.json({ message: 'Failed to update lead or lead not found' }, { status: 404 });
    }
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
    // await query('DELETE FROM leads WHERE id = $1', [id]);

    const leadIndex = leads_db_placeholder.findIndex(l => l.id === id);
    if (leadIndex === -1) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }
    leads_db_placeholder.splice(leadIndex, 1);

    return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Failed to delete lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete lead', error: (error as Error).message }, { status: 500 });
  }
}
