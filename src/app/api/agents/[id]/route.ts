
// src/app/api/agents/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      console.warn('[API GET /api/agents/[id]] Agent ID is missing from params');
      return NextResponse.json({ message: 'Agent ID is required' }, { status: 400 });
    }
    console.log(`[API GET /api/agents/[id]] Fetching agent with ID: "${id}"`);

    const agentDataDb = (await query<Agent[]>('SELECT * FROM agents WHERE id = ?', [id]));

    if (agentDataDb.length > 0) {
      const dbAgent = agentDataDb[0];
      // Ensure numeric fields are correctly parsed, even though this model is simpler
      const agent: Agent = {
        ...dbAgent,
        discount: Number(dbAgent.discount || 0),
      };
      return NextResponse.json(agent, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API GET /api/agents] Error:`, error);
    return NextResponse.json({ message: `Failed to fetch agent: ${errorMessage}` }, { status: 500 });
  }
}

function buildUpdateSetClause(data: Partial<Omit<Agent, 'id'>>): { clause: string, values: unknown[] } {
  const fieldsToUpdate: string[] = [];
  const valuesToUpdate: unknown[] = [];
  const allowedKeys: (keyof Omit<Agent, 'id'>)[] = [
    'name', 'agency_code', 'address', 'phone_no', 'email',
    'status', 'TRN_number', 'customer_type_id', 'discount', 'websiteUrl'
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key as keyof Omit<Agent, 'id'>) && value !== undefined) {
      fieldsToUpdate.push(`${key} = ?`);
      if (key === 'discount') {
        valuesToUpdate.push(Number(value));
      } else if (value === '' && ['agency_code', 'address', 'phone_no', 'TRN_number', 'customer_type_id', 'websiteUrl'].includes(key)) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Agent ID is required for update' }, { status: 400 });
  }

  try {
    const updatedAgentData = await request.json() as Partial<Agent>;

    const existingAgentResult = (await query<any[]>('SELECT email FROM agents WHERE id = ?', [id]));
    if (existingAgentResult.length === 0) {
      console.warn(`[API PUT /api/agents/[id]] Agent not found for ID: "${id}"`);
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    const existingAgentEmail = existingAgentResult[0].email;

    if (updatedAgentData.email && updatedAgentData.email.toLowerCase() !== existingAgentEmail.toLowerCase()) {
      const agentByEmail = (await query<any[]>('SELECT id FROM agents WHERE email = ? AND id != ?', [updatedAgentData.email, id]));
      if (agentByEmail.length > 0) {
        return NextResponse.json({ message: `Agent with email ${updatedAgentData.email} already exists.` }, { status: 409 });
      }
    }

    const { clause, values } = buildUpdateSetClause(updatedAgentData);
    if (clause.length === 0) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id); // For the WHERE clause

    let attempt = 0;
    const maxRetries = 2;
    while (attempt < maxRetries) {
      try {
        await query(`UPDATE agents SET ${clause} WHERE id = ?`, values);
        break;
      } catch (err: any) {
        if (err.code === 'ER_BAD_FIELD_ERROR') {
          console.error(`[API PUT /api/agents] Missing columns detected. Attempting auto-migration...`);
          try {
            const currentCols = await query<any[]>(`DESCRIBE agents`);
            const existingNames = currentCols.map(c => c.Field);
            const columnsToAdd = [
              { name: 'customer_type_id', def: 'VARCHAR(255) NULL' },
              { name: 'websiteUrl', def: 'VARCHAR(255) NULL' },
              { name: 'discount', def: 'DECIMAL(5,2) DEFAULT 0.00' }
            ];
            for (const col of columnsToAdd) {
              if (!existingNames.includes(col.name)) {
                await query(`ALTER TABLE agents ADD COLUMN ${col.name} ${col.def}`);
              }
            }
            console.log(`[API PUT /api/agents] Auto-migration successful. Retrying update...`);
            attempt++;
            continue;
          } catch (migErr) {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    const finalUpdatedAgentQuery = (await query<any[]>('SELECT * FROM agents WHERE id = ?', [id]));
    if (finalUpdatedAgentQuery.length > 0) {
      const dbAgent = finalUpdatedAgentQuery[0];
      const finalAgent: Agent = {
        ...dbAgent,
        discount: parseFloat(dbAgent.discount || 0)
      } as Agent;
      return NextResponse.json(finalAgent, { status: 200 });
    }
    // This case should ideally not be reached if the update was successful
    return NextResponse.json({ message: 'Agent updated, but failed to fetch confirmation.' }, { status: 500 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API PUT /api/agents/${id}] Error:`, error);
    return NextResponse.json({ message: `Failed to update agent: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'Agent ID is required for deletion' }, { status: 400 });
  }

  try {
    const result = (await query<any>('DELETE FROM agents WHERE id = ?', [id]));

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Agent deleted successfully' }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[API DELETE /api/agents/${id}] Error:`, error);
    return NextResponse.json({ message: `Failed to delete agent: ${errorMessage}` }, { status: 500 });
  }
}
