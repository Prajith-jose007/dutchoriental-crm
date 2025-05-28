
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
    const agentData: any = await query('SELECT * FROM agents WHERE id = ?', [id]);
    
    if (agentData.length > 0) {
      const agent: Agent = { ...agentData[0], discount: parseFloat(agentData[0].discount) };
      return NextResponse.json(agent, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to fetch agent ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch agent', error: (error as Error).message }, { status: 500 });
  }
}

function buildUpdateSetClause(data: Record<string, any>): { clause: string, values: any[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: any[] = [];
  const allowedKeys: (keyof Agent)[] = ['name', 'agency_code', 'address', 'phone_no', 'email', 'status', 'TRN_number', 'customer_type_id', 'discount', 'websiteUrl'];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Agent) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      // Ensure discount is a number if it's being updated
      valuesToUpdate.push(key === 'discount' ? Number(value) : (value === '' ? null : value));
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

    const existingAgentResult: any = await query('SELECT * FROM agents WHERE id = ?', [id]);
    if (existingAgentResult.length === 0) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    const existingAgent: Agent = { ...existingAgentResult[0], discount: parseFloat(existingAgentResult[0].discount) };


    if (updatedAgentData.email && updatedAgentData.email.toLowerCase() !== existingAgent.email.toLowerCase()) {
      const agentByEmail: any = await query('SELECT id FROM agents WHERE email = ? AND id != ?', [updatedAgentData.email, id]);
      if (agentByEmail.length > 0) {
        return NextResponse.json({ message: `Agent with email ${updatedAgentData.email} already exists.` }, { status: 409 });
      }
    }
    
    const { clause, values } = buildUpdateSetClause(updatedAgentData);
    if (clause.length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause
    
    const result: any = await query(`UPDATE agents SET ${clause} WHERE id = ?`, values);
    
    if (result.affectedRows === 0) {
       return NextResponse.json({ message: 'Agent not found during update or no changes made' }, { status: 404 });
    }
    
    const finalUpdatedAgent: Agent = { ...existingAgent, ...updatedAgentData };
     if (updatedAgentData.discount !== undefined) {
      finalUpdatedAgent.discount = Number(updatedAgentData.discount);
    }

    return NextResponse.json(finalUpdatedAgent, { status: 200 });

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
    const result: any = await query('DELETE FROM agents WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Agent deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete agent ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete agent', error: (error as Error).message }, { status: 500 });
  }
}
