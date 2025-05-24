
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
    const newAgentData = await request.json() as Omit<Agent, 'id'> & { id?: string };

    // Validate required fields
    if (!newAgentData.name || !newAgentData.email || newAgentData.discount === undefined || !newAgentData.status) {
      return NextResponse.json({ message: 'Missing required agent fields (name, email, discount, status)' }, { status: 400 });
    }
    
    const newAgentId = newAgentData.id || `DO-agent${Date.now()}${Math.random().toString(36).substring(2, 5)}`;


    // TODO: Replace with actual database insert operation
    // For now, adding to our in-memory store
    const existingAgentById = agents_db.find(a => a.id === newAgentId);
    if (existingAgentById) {
      return NextResponse.json({ message: `Agent with ID ${newAgentId} already exists.` }, { status: 409 });
    }
    // Check for duplicate email
    const existingAgentByEmail = agents_db.find(a => a.email.toLowerCase() === newAgentData.email.toLowerCase());
    if (existingAgentByEmail) {
         return NextResponse.json({ message: `Agent with email ${newAgentData.email} already exists.` }, { status: 409 });
    }


    const agentToStore: Agent = {
        id: newAgentId,
        name: newAgentData.name,
        agency_code: newAgentData.agency_code,
        address: newAgentData.address,
        phone_no: newAgentData.phone_no,
        email: newAgentData.email,
        status: newAgentData.status,
        TRN_number: newAgentData.TRN_number,
        discount: Number(newAgentData.discount), // Ensure discount is a number
        websiteUrl: newAgentData.websiteUrl,
    };
    
    agents_db.push(agentToStore);
    
    return NextResponse.json(agentToStore, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json({ message: 'Failed to create agent', error: (error as Error).message }, { status: 500 });
  }
}
