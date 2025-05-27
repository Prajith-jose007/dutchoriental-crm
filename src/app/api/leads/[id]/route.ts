// src/app/api/leads/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead } from '@/lib/types';
// import { query } from '@/lib/db'; // You'll need to implement this

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Implement MySQL query to fetch lead by ID
    // Example: const leadData = await query('SELECT * FROM leads WHERE id = ?', [id]);
    // const lead = leadData[0] || null;
    const lead: Lead | null = null; // Placeholder

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
    // Type assertion for the request body
    const updatedLeadData = await request.json() as Partial<Omit<Lead, 'id' | 'createdAt'>> & { lastModifiedByUserId?: string; ownerUserId?: string; };


    // TODO: First, check if the lead exists
    // Example: const existingLeadResult = await query('SELECT * FROM leads WHERE id = ?', [id]);
    // if (existingLeadResult.length === 0) {
    //   return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    // }
    // const leadToUpdate = existingLeadResult[0];

    const now = new Date().toISOString();
    
    const updatedLead: Partial<Lead> = { // Use Partial<Lead> for the update payload
      ...updatedLeadData,
      updatedAt: now,
      // lastModifiedByUserId will come from updatedLeadData if client sends it
    };
    
    // Remove id and createdAt from updatedLead object as they should not be updated
    delete updatedLead.id; 
    delete updatedLead.createdAt;

    // TODO: Implement MySQL query to update the lead
    // Construct SET clause dynamically
    // Example:
    // const fieldsToUpdate = [];
    // const valuesToUpdate = [];
    // Object.entries(updatedLead).forEach(([key, value]) => {
    //    fieldsToUpdate.push(`${key} = ?`);
    //    valuesToUpdate.push(value);
    // });
    // if (fieldsToUpdate.length === 0) {
    //    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    // }
    // valuesToUpdate.push(id); // For the WHERE clause
    // const result = await query(`UPDATE leads SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, valuesToUpdate);
    // if (result.affectedRows === 0) {
    //    return NextResponse.json({ message: 'Lead not found during update or no changes made' }, { status: 404 });
    // }
    // const finalUpdatedLead = { ...leadToUpdate, ...updatedLead, id: id, createdAt: leadToUpdate.createdAt };

    // Placeholder response
    const finalUpdatedLead = { id, createdAt: "some-iso-string", ...updatedLead }; // Adjust placeholder as needed
    return NextResponse.json(finalUpdatedLead, { status: 200 });

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
    // TODO: Implement MySQL query to delete lead by ID
    // Example: const result = await query('DELETE FROM leads WHERE id = ?', [id]);
    // const wasDeleted = result.affectedRows > 0;
    const wasDeleted = true; // Placeholder
    
    if (!wasDeleted) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete lead ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete lead', error: (error as Error).message }, { status: 500 });
  }
}
