// src/app/api/agents/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
// import { query } from '@/lib/db'; // You'll need to implement this

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Implement MySQL query to fetch agent by ID
    // Example: const agentData = await query('SELECT * FROM agents WHERE id = ?', [id]);
    // const agent = agentData[0] || null;
    const agent: Agent | null = null; // Placeholder

    if (agent) {
      return NextResponse.json(agent, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch agent ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch agent', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedAgentData = await request.json() as Partial<Agent>;

    // TODO: First, check if the agent exists
    // Example: const existingAgent = await query('SELECT * FROM agents WHERE id = ?', [id]);
    // if (existingAgent.length === 0) {
    //   return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    // }

    if (updatedAgentData.discount !== undefined) {
        updatedAgentData.discount = Number(updatedAgentData.discount);
    }

    // TODO: Check for email conflicts if email is being changed
    // if (updatedAgentData.email && updatedAgentData.email.toLowerCase() !== existingAgent[0].email.toLowerCase()) {
    //   const agentByEmail = await query('SELECT id FROM agents WHERE email = ? AND id != ?', [updatedAgentData.email, id]);
    //   if (agentByEmail.length > 0) {
    //     return NextResponse.json({ message: `Agent with email ${updatedAgentData.email} already exists.` }, { status: 409 });
    //   }
    // }
    
    // TODO: Implement MySQL query to update the agent
    // Construct SET clause dynamically based on provided fields
    // Example:
    // const fieldsToUpdate = [];
    // const valuesToUpdate = [];
    // Object.entries(updatedAgentData).forEach(([key, value]) => {
    //   if (key !== 'id') { // Don't update ID
    //     fieldsToUpdate.push(`${key} = ?`);
    //     valuesToUpdate.push(value);
    //   }
    // });
    // if (fieldsToUpdate.length === 0) {
    //   return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    // }
    // valuesToUpdate.push(id); // For the WHERE clause
    // const result = await query(`UPDATE agents SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, valuesToUpdate);
    // if (result.affectedRows === 0) { // Should not happen if existence check passed
    //    return NextResponse.json({ message: 'Agent not found during update' }, { status: 404 });
    // }
    // const updatedAgent = { ...existingAgent[0], ...updatedAgentData };

    const updatedAgent = { id, ...updatedAgentData }; // Placeholder
    return NextResponse.json(updatedAgent, { status: 200 });

  } catch (error) {
    console.error(`Failed to update agent ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to update agent', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Implement MySQL query to delete the agent
    // Example: const result = await query('DELETE FROM agents WHERE id = ?', [id]);
    // const wasDeleted = result.affectedRows > 0;
    const wasDeleted = true; // Placeholder
    
    if (!wasDeleted) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Agent deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete agent ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete agent', error: (error as Error).message }, { status: 500 });
  }
}
