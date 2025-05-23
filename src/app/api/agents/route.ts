
// src/app/api/agents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { placeholderAgents } from '@/lib/placeholder-data'; // Used for initial data if DB is empty

// In-memory store (replace with actual database calls)
let agents_db: Agent[] = [...placeholderAgents]; // Initialize with placeholder data

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database query: SELECT * FROM agents
    // For now, returning the in-memory store
    return NextResponse.json(agents_db, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ message: 'Failed to fetch agents', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgent = await request.json() as Agent;

    if (!newAgent.id || !newAgent.name || !newAgent.email || newAgent.discountRate === undefined) {
      return NextResponse.json({ message: 'Missing required agent fields' }, { status: 400 });
    }

    // TODO: Replace with actual database insert operation
    // For now, adding to our in-memory store
    const existingAgent = agents_db.find(a => a.id === newAgent.id);
    if (existingAgent) {
      return NextResponse.json({ message: `Agent with ID ${newAgent.id} already exists.` }, { status: 409 });
    }
    agents_db.push(newAgent);
    
    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json({ message: 'Failed to create agent', error: (error as Error).message }, { status: 500 });
  }
}

```