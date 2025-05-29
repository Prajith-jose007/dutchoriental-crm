
// src/app/api/agents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { query } from '@/lib/db'; // Assuming db.ts is in src/lib

const MYSQL_TABLE_NAMES = {
  agents: 'agents',
};

export async function GET(request: NextRequest) {
  try {
    const agentsData: any[] = await query(`SELECT * FROM ${MYSQL_TABLE_NAMES.agents} ORDER BY name ASC`);
    console.log('[API GET /api/agents] Raw DB Data:', agentsData.length > 0 ? agentsData[0] : 'No agents found');
    const agents: Agent[] = agentsData.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      agency_code: agent.agency_code,
      address: agent.address,
      phone_no: agent.phone_no,
      email: agent.email,
      status: agent.status || 'Active',
      TRN_number: agent.TRN_number,
      customer_type_id: agent.customer_type_id,
      discount: parseFloat(agent.discount || 0), 
      websiteUrl: agent.websiteUrl,
    }));
    console.log('[API GET /api/agents] Mapped Agents Data:', agents.length > 0 ? agents[0] : 'No agents mapped');
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/agents] Error fetching agents:', error);
    return NextResponse.json({ message: 'Failed to fetch agents', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgentData = await request.json() as Omit<Agent, 'id'> & { id?: string };
    console.log('[API POST /api/agents] Received newAgentData:', newAgentData);

    if (!newAgentData.id || !newAgentData.name || !newAgentData.email || newAgentData.discount === undefined) {
      console.error('[API POST /api/agents] Validation Error: Missing required fields.');
      return NextResponse.json({ message: 'Missing required agent fields (id, name, email, discount)' }, { status: 400 });
    }

    // Check if agent with this ID or email already exists
    const existingAgentCheck: any = await query(`SELECT id FROM ${MYSQL_TABLE_NAMES.agents} WHERE id = ? OR email = ?`, [newAgentData.id, newAgentData.email]);
    if (existingAgentCheck.length > 0) {
      console.warn(`[API POST /api/agents] Conflict: Agent with ID ${newAgentData.id} or email ${newAgentData.email} already exists.`);
      return NextResponse.json({ message: 'Agent with this ID or email already exists.' }, { status: 409 });
    }
    
    const agentToStore: Agent = {
      id: newAgentData.id,
      name: newAgentData.name,
      agency_code: newAgentData.agency_code || null,
      address: newAgentData.address || null,
      phone_no: newAgentData.phone_no || null,
      email: newAgentData.email,
      status: newAgentData.status || 'Active',
      TRN_number: newAgentData.TRN_number || null,
      customer_type_id: newAgentData.customer_type_id || null,
      discount: Number(newAgentData.discount),
      websiteUrl: newAgentData.websiteUrl || null,
    };
    
    console.log('[API POST /api/agents] Agent object to store:', agentToStore);
    const result: any = await query(
      `INSERT INTO ${MYSQL_TABLE_NAMES.agents} (id, name, agency_code, address, phone_no, email, status, TRN_number, customer_type_id, discount, websiteUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agentToStore.id, agentToStore.name, agentToStore.agency_code, agentToStore.address,
        agentToStore.phone_no, agentToStore.email, agentToStore.status, agentToStore.TRN_number,
        agentToStore.customer_type_id, agentToStore.discount, agentToStore.websiteUrl
      ]
    );
    console.log('[API POST /api/agents] DB Insert Result:', result);

    if (result.affectedRows === 1) {
       console.log(`[API POST /api/agents] Successfully created agent: ${agentToStore.id}`);
       return NextResponse.json(agentToStore, { status: 201 });
    } else {
       console.error('[API POST /api/agents] Database insert failed, affectedRows was not 1.');
       throw new Error('Failed to insert agent into database');
    }
  } catch (error) {
    console.error('[API POST /api/agents] Error creating agent:', error);
    return NextResponse.json({ message: 'Failed to create agent', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids: string[] };
    console.log('[API DELETE /api/agents] Received request to delete IDs:', ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.warn('[API DELETE /api/agents] Bad Request: Agent IDs are required.');
      return NextResponse.json({ message: 'Agent IDs are required for bulk delete' }, { status: 400 });
    }

    const result: any = await query(`DELETE FROM ${MYSQL_TABLE_NAMES.agents} WHERE id IN (?)`, [ids]);
    const deletedCount = result.affectedRows;
    console.log(`[API DELETE /api/agents] DB Delete Result: ${deletedCount} rows affected.`);

    if (deletedCount > 0) {
      return NextResponse.json({ message: `${deletedCount} agents deleted successfully. Requested: ${ids.length}.` }, { status: 200 });
    } else {
      console.warn('[API DELETE /api/agents] No matching agents found for deletion with provided IDs:', ids);
      return NextResponse.json({ message: 'No matching agents found for deletion based on provided IDs.' }, { status: 404 });
    }
  } catch (error) {
    console.error('[API DELETE /api/agents] Failed to bulk delete agents:', error);
    return NextResponse.json({ message: 'Failed to bulk delete agents', error: (error as Error).message }, { status: 500 });
  }
}
