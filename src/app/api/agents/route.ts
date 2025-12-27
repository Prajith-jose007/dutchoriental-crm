
// src/app/api/agents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const agentsDataDb = (await query<Agent[]>('SELECT * FROM agents ORDER BY name ASC'));

    const agents: Agent[] = agentsDataDb.map(dbAgent => ({
      id: String(dbAgent.id || ''),
      name: dbAgent.name || '',
      agency_code: dbAgent.agency_code || undefined,
      address: dbAgent.address || undefined,
      phone_no: dbAgent.phone_no || undefined,
      email: dbAgent.email || '',
      status: dbAgent.status || 'Active',
      TRN_number: dbAgent.TRN_number || undefined,
      customer_type_id: dbAgent.customer_type_id || undefined,
      discount: Number(dbAgent.discount || 0),
      websiteUrl: dbAgent.websiteUrl || undefined,
    }));

    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/agents] Error fetching agents:', error);
    return NextResponse.json({ message: `Failed to fetch agents: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgentData = await request.json() as Omit<Agent, 'id'> & { id?: string };

    if (!newAgentData.id || !newAgentData.name || !newAgentData.email || newAgentData.discount === undefined) {
      return NextResponse.json({ message: 'Missing required agent fields (id, name, email, discount)' }, { status: 400 });
    }

    const existingAgentCheck = (await query<Agent[]>('SELECT id FROM agents WHERE id = ? OR email = ?', [newAgentData.id, newAgentData.email]));
    if (existingAgentCheck.length > 0) {
      return NextResponse.json({ message: 'Agent with this ID or email already exists.' }, { status: 409 });
    }

    const agentToStore = {
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

    const result = (await query<{ affectedRows: number }>(
      `INSERT INTO agents (id, name, agency_code, address, phone_no, email, status, TRN_number, customer_type_id, discount, websiteUrl) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agentToStore.id, agentToStore.name, agentToStore.agency_code, agentToStore.address,
        agentToStore.phone_no, agentToStore.email, agentToStore.status, agentToStore.TRN_number,
        agentToStore.customer_type_id, agentToStore.discount, agentToStore.websiteUrl
      ]
    ));

    if (result.affectedRows === 1) {
      const createdAgentDb = (await query<Agent[]>('SELECT * FROM agents WHERE id = ?', [agentToStore.id]));
      if (createdAgentDb.length > 0) {
        const dbAgent = createdAgentDb[0];
        const createdAgent: Agent = {
          ...dbAgent,
          discount: Number(dbAgent.discount || 0)
        };
        return NextResponse.json(createdAgent, { status: 201 });
      }
    }
    throw new Error('Failed to insert agent into database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API POST /api/agents] Error creating agent:', error);
    return NextResponse.json({ message: `Failed to create agent: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'Agent IDs are required for bulk delete' }, { status: 400 });
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM agents WHERE id IN (${placeholders})`;

    const result = (await query<{ affectedRows: number }>(sql, ids));
    const deletedCount = result.affectedRows;

    if (deletedCount > 0) {
      return NextResponse.json({ message: `${deletedCount} agents deleted successfully.` }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'No matching agents found for deletion.' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API DELETE /api/agents] Failed to bulk delete agents:', error);
    return NextResponse.json({ message: `Failed to bulk delete agents: ${errorMessage}` }, { status: 500 });
  }
}
