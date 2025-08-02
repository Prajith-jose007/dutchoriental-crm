
// src/app/api/agents/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API GET /api/agents/${id}] Received request`);
    const agentDataDb: any[] = await query('SELECT * FROM agents WHERE id = ?', [id]);
    
    if (agentDataDb.length > 0) {
      const dbAgent = agentDataDb[0];
      const agent: Agent = {
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
      };
      console.log(`[API GET /api/agents/${id}] Agent found:`, agent);
      return NextResponse.json(agent, { status: 200 });
    } else {
      console.log(`[API GET /api/agents/${id}] Agent not found.`);
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API GET /api/agents/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to fetch agent', error: errorMessage }, { status: 500 });
  }
}

function buildUpdateSetClause(data: Partial<Omit<Agent, 'id'>>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Omit<Agent, 'id'>)[] = [
    'name', 'agency_code', 'address', 'phone_no', 'email', 
    'status', 'TRN_number', 'customer_type_id', 'discount', 'websiteUrl'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as any) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (key === 'discount') {
        valuesToUpdate.push(Number(value));
      } else if (value === '' && ['agency_code', 'address', 'phone_no', 'TRN_number', 'customer_type_id', 'websiteUrl'].includes(key) ) {
        valuesToUpdate.push(null); // Store empty optional strings as NULL
      }
      else {
        valuesToUpdate.push(value);
      }
    }
  });
  return { clause: fieldsToUpdate.join(', '), values: valuesToUpdate };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updatedAgentData = await request.json() as Partial<Agent>;
    console.log(`[API PUT /api/agents/${id}] Received updatedAgentData:`, updatedAgentData);

    const existingAgentResult: any = await query('SELECT email FROM agents WHERE id = ?', [id]);
    if (existingAgentResult.length === 0) {
      console.log(`[API PUT /api/agents/${id}] Agent not found for update.`);
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    const existingAgentEmail = existingAgentResult[0].email;

    if (updatedAgentData.email && updatedAgentData.email.toLowerCase() !== existingAgentEmail.toLowerCase()) {
      const agentByEmail: any = await query('SELECT id FROM agents WHERE email = ? AND id != ?', [updatedAgentData.email, id]);
      if (agentByEmail.length > 0) {
        console.warn(`[API PUT /api/agents/${id}] Email conflict: ${updatedAgentData.email} already exists.`);
        return NextResponse.json({ message: `Agent with email ${updatedAgentData.email} already exists.` }, { status: 409 });
      }
    }
    
    const { clause, values } = buildUpdateSetClause(updatedAgentData);
    if (clause.length === 0) {
      console.log(`[API PUT /api/agents/${id}] No valid fields to update.`);
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause
    
    console.log(`[API PUT /api/agents/${id}] SQL: UPDATE agents SET ${clause} WHERE id = ?`, 'Params:', values);
    const result: any = await query(`UPDATE agents SET ${clause} WHERE id = ?`, values);
    console.log(`[API PUT /api/agents/${id}] DB Update Result:`, result);
    
    if (result.affectedRows === 0) {
       console.warn(`[API PUT /api/agents/${id}] Agent not found during update or no changes made.`);
    }
    
    const finalUpdatedAgentQuery: any = await query('SELECT * FROM agents WHERE id = ?', [id]);
    if (finalUpdatedAgentQuery.length > 0) {
       const dbAgent = finalUpdatedAgentQuery[0];
       const finalAgent: Agent = {
          ...dbAgent,
          discount: parseFloat(dbAgent.discount || 0)
       };
       console.log(`[API PUT /api/agents/${id}] Successfully updated agent.`);
       return NextResponse.json(finalAgent, { status: 200 });
    }
    console.error(`[API PUT /api/agents/${id}] Agent updated, but failed to fetch confirmation.`);
    return NextResponse.json({ message: 'Agent updated, but failed to fetch confirmation.' }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API PUT /api/agents/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to update agent', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`[API DELETE /api/agents/${id}] Attempting to delete agent.`);
    const result: any = await query('DELETE FROM agents WHERE id = ?', [id]);
    console.log(`[API DELETE /api/agents/${id}] DB Delete Result:`, result);
    
    if (result.affectedRows === 0) {
      console.warn(`[API DELETE /api/agents/${id}] Agent not found for deletion.`);
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    console.log(`[API DELETE /api/agents/${id}] Successfully deleted agent.`);
    return NextResponse.json({ message: 'Agent deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API DELETE /api/agents/${params.id}] Error:`, error);
    return NextResponse.json({ message: 'Failed to delete agent', error: errorMessage }, { status: 500 });
  }
}
