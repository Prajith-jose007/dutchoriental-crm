// src/app/api/agents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
// import { query } from '@/lib/db'; // You'll need to implement this based on the example

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement MySQL query to fetch all agents
    // Example: const agentsData = await query('SELECT * FROM agents ORDER BY name ASC');
    // For now, returning an empty array as a placeholder
    const agents: Agent[] = []; // Replace with actual data from DB
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ message: 'Failed to fetch agents', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgentData = await request.json() as Omit<Agent, 'id'> & { id?: string };

    if (!newAgentData.id || !newAgentData.name || !newAgentData.email || newAgentData.discount === undefined) {
      return NextResponse.json({ message: 'Missing required agent fields (id, name, email, discount)' }, { status: 400 });
    }

    // TODO: Check if agent with this ID or email already exists in the database
    // Example: const existingAgent = await query('SELECT id FROM agents WHERE id = ? OR email = ?', [newAgentData.id, newAgentData.email]);
    // if (existingAgent.length > 0) {
    //   return NextResponse.json({ message: 'Agent with this ID or email already exists.' }, { status: 409 });
    // }
    
    const agentToStore: Agent = {
      id: newAgentData.id,
      name: newAgentData.name,
      agency_code: newAgentData.agency_code,
      address: newAgentData.address,
      phone_no: newAgentData.phone_no,
      email: newAgentData.email,
      status: newAgentData.status || 'Active',
      TRN_number: newAgentData.TRN_number,
      customer_type_id: newAgentData.customer_type_id,
      discount: Number(newAgentData.discount),
      websiteUrl: newAgentData.websiteUrl,
    };
    
    // TODO: Implement MySQL query to insert the new agent
    // Example:
    // const result = await query(
    //   'INSERT INTO agents (id, name, agency_code, address, phone_no, email, status, TRN_number, customer_type_id, discount, websiteUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    //   [agentToStore.id, agentToStore.name, agentToStore.agency_code, agentToStore.address, agentToStore.phone_no, agentToStore.email, agentToStore.status, agentToStore.TRN_number, agentToStore.customer_type_id, agentToStore.discount, agentToStore.websiteUrl]
    // );
    // if (result.affectedRows === 1) {
    //    return NextResponse.json(agentToStore, { status: 201 });
    // } else {
    //    throw new Error('Failed to insert agent into database');
    // }

    // Placeholder response
    return NextResponse.json(agentToStore, { status: 201 });

  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json({ message: 'Failed to create agent', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Agent IDs are required for bulk delete' }, { status: 400 });
    }

    // TODO: Implement MySQL query to delete multiple agents
    // Example:
    // const placeholders = ids.map(() => '?').join(','); // Creates ?,?,?
    // const result = await query(`DELETE FROM agents WHERE id IN (${placeholders})`, ids);
    // const deletedCount = result.affectedRows;
    const deletedCount = ids.length; // Placeholder

    if (deletedCount > 0) {
      return NextResponse.json({ message: `${deletedCount} agents deleted successfully. Requested: ${ids.length}.` }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'No matching agents found for deletion based on provided IDs.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to bulk delete agents:', error);
    return NextResponse.json({ message: 'Failed to bulk delete agents', error: (error as Error).message }, { status: 500 });
  }
}
