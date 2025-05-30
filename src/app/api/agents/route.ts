
// src/app/api/agents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/agents] Received request');
    const agentsDataDb: any[] = await query('SELECT * FROM agents ORDER BY name ASC');
    console.log('[API GET /api/agents] Raw DB Data (first item):', agentsDataDb.length > 0 ? agentsDataDb[0] : 'No agents found from DB');

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
      discount: parseFloat(dbAgent.discount || 0),
      websiteUrl: dbAgent.websiteUrl || undefined,
    }));

    console.log('[API GET /api/agents] Mapped Agents Data (first item):', agents.length > 0 ? agents[0] : 'No agents mapped');
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/agents] Error fetching agents:', error);
    return NextResponse.json({ message: 'Failed to fetch agents', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgentData = await request.json() as Omit<Agent, 'id'> & { id?: string }; // Allow ID to be optional for creation
    console.log('[API POST /api/agents] Received newAgentData:', newAgentData);

    if (!newAgentData.id || !newAgentData.name || !newAgentData.email || newAgentData.discount === undefined) {
      console.error('[API POST /api/agents] Validation Error: Missing required fields.');
      return NextResponse.json({ message: 'Missing required agent fields (id, name, email, discount)' }, { status: 400 });
    }

    const existingAgentCheck: any = await query('SELECT id FROM agents WHERE id = ? OR email = ?', [newAgentData.id, newAgentData.email]);
    if (existingAgentCheck.length > 0) {
      console.warn(`[API POST /api/agents] Conflict: Agent with ID ${newAgentData.id} or email ${newAgentData.email} already exists.`);
      return NextResponse.json({ message: 'Agent with this ID or email already exists.' }, { status: 409 });
    }
    
    const agentToStore: Agent = {
      id: newAgentData.id, // ID must be provided by client as per form logic
      name: newAgentData.name,
      agency_code: newAgentData.agency_code || null,
      address: newAgentData.address || null,
      phone_no: newAgentData.phone_no || null,
      email: newAgentData.email,
      status: newAgentData.status || 'Active',
      TRN_number: newAgentData.TRN_number || null,
      customer_type_id: newAgentData.customer_type_id || null,
      discount: Number(newAgentData.discount), // Ensure discount is a number
      websiteUrl: newAgentData.websiteUrl || null,
    };
    
    console.log('[API POST /api/agents] Agent object to store:', agentToStore);
    const result: any = await query(
      `INSERT INTO agents (id, name, agency_code, address, phone_no, email, status, TRN_number, customer_type_id, discount, websiteUrl) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agentToStore.id, agentToStore.name, agentToStore.agency_code, agentToStore.address,
        agentToStore.phone_no, agentToStore.email, agentToStore.status, agentToStore.TRN_number,
        agentToStore.customer_type_id, agentToStore.discount, agentToStore.websiteUrl
      ]
    );
    console.log('[API POST /api/agents] DB Insert Result:', result);

    if (result.affectedRows === 1) {
       console.log(`[API POST /api/agents] Successfully created agent: ${agentToStore.id}`);
       // Fetch and return the created agent to ensure consistency
       const createdAgentDb: any[] = await query('SELECT * FROM agents WHERE id = ?', [agentToStore.id]);
       if (createdAgentDb.length > 0) {
         const createdAgent: Agent = {
            ...createdAgentDb[0],
            discount: parseFloat(createdAgentDb[0].discount || 0)
         };
         return NextResponse.json(createdAgent, { status: 201 });
       }
       return NextResponse.json(agentToStore, { status: 201 }); // Fallback
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

    // Parameterized query for IN clause
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM agents WHERE id IN (${placeholders})`;
    
    console.log(`[API DELETE /api/agents] Executing SQL: ${sql} with IDs:`, ids);
    const result: any = await query(sql, ids);
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
