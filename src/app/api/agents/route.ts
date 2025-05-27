
// src/app/api/agents/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { 
  getAllAgents, 
  addAgent as addAgentToStore, 
  getAgentById,
  deleteMultipleAgents as deleteMultipleAgentsFromStore 
} from '@/lib/db/agent-store';

export async function GET(request: NextRequest) {
  try {
    const agents = getAllAgents();
    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ message: 'Failed to fetch agents', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newAgentData = await request.json() as Omit<Agent, 'id'> & { id?: string };

    if (!newAgentData.name || !newAgentData.email || newAgentData.discount === undefined || !newAgentData.status) {
      return NextResponse.json({ message: 'Missing required agent fields (name, email, discount, status)' }, { status: 400 });
    }
    
    const newAgentId = newAgentData.id || `DO-agent${Date.now()}${Math.random().toString(36).substring(2, 5)}`;

    const existingAgentById = getAgentById(newAgentId);
    if (existingAgentById) {
      return NextResponse.json({ message: `Agent with ID ${newAgentId} already exists.` }, { status: 409 });
    }
    
    const allCurrentAgents = getAllAgents(); // Fetch all agents to check email
    const existingAgentByEmail = allCurrentAgents.find(a => a.email.toLowerCase() === newAgentData.email.toLowerCase());
    if (existingAgentByEmail) {
         return NextResponse.json({ message: `Agent with email ${newAgentData.email} already exists.` }, { status: 409 });
    }

    const agentToStore: Agent = {
        id: newAgentId, // Use the determined ID
        name: newAgentData.name,
        agency_code: newAgentData.agency_code,
        address: newAgentData.address,
        phone_no: newAgentData.phone_no,
        email: newAgentData.email,
        status: newAgentData.status,
        TRN_number: newAgentData.TRN_number,
        customer_type_id: newAgentData.customer_type_id,
        discount: Number(newAgentData.discount),
        websiteUrl: newAgentData.websiteUrl,
    };
    
    const storedAgent = addAgentToStore(agentToStore); // Use the store function
    
    return NextResponse.json(storedAgent, { status: 201 });
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

    const deletedCount = deleteMultipleAgentsFromStore(ids);
    
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
