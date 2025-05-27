
// src/app/api/agents/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Agent } from '@/lib/types';
import { 
  getAgentById, 
  updateAgent as updateAgentInStore, 
  deleteAgentById as deleteAgentFromStore,
  getAllAgents 
} from '@/lib/db/agent-store';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const agent = getAgentById(id);

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

    const agentToUpdate = getAgentById(id);
    if (!agentToUpdate) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    // Ensure discount is handled as a number
    if (updatedAgentData.discount !== undefined) {
        updatedAgentData.discount = Number(updatedAgentData.discount);
    }

    // Check if email is being changed and if it's already taken by another agent
    if (updatedAgentData.email && updatedAgentData.email.toLowerCase() !== agentToUpdate.email.toLowerCase()) {
        const allAgents = getAllAgents();
        const existingAgentByEmail = allAgents.find(a => a.id !== id && a.email.toLowerCase() === updatedAgentData.email!.toLowerCase());
        if (existingAgentByEmail) {
            return NextResponse.json({ message: `Agent with email ${updatedAgentData.email} already exists.` }, { status: 409 });
        }
    }
    
    const updatedAgent = updateAgentInStore(id, updatedAgentData);
    if (!updatedAgent) { // Should not happen if agentToUpdate was found, but defensive
        return NextResponse.json({ message: 'Agent not found during update' }, { status: 404 });
    }

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
    const wasDeleted = deleteAgentFromStore(id);
    
    if (!wasDeleted) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Agent deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete agent ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete agent', error: (error as Error).message }, { status: 500 });
  }
}
