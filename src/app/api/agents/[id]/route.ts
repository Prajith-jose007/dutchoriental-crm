
// src/app/api/agents/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';

// In-memory store (should be consistent with /api/agents/route.ts)
// In a real app, this would all interact with the same database.
// For simplicity, we re-declare and use the same placeholder source.
import { placeholderAgents } from '@/lib/placeholder-data';
let agents_db: Agent[] = [...placeholderAgents];


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // TODO: Replace with actual database query: SELECT * FROM agents WHERE id = ?
    const agent = agents_db.find(a => a.id === id);

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

    // TODO: Replace with actual database update operation
    const agentIndex = agents_db.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    agents_db[agentIndex] = { ...agents_db[agentIndex], ...updatedAgentData, id }; // Ensure ID isn't overwritten
    const updatedAgent = agents_db[agentIndex];

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
    // TODO: Replace with actual database delete operation
    const agentIndex = agents_db.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    agents_db.splice(agentIndex, 1);

    return NextResponse.json({ message: 'Agent deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete agent ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete agent', error: (error as Error).message }, { status: 500 });
  }
}

```