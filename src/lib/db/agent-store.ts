
// src/lib/db/agent-store.ts
import type { Agent } from '@/lib/types';
import { placeholderAgents } from '@/lib/placeholder-data';

// Initialize with a deep copy to avoid mutating the original placeholderAgents if it's imported elsewhere.
let agents: Agent[] = JSON.parse(JSON.stringify(placeholderAgents));

export function getAllAgents(): Agent[] {
  return JSON.parse(JSON.stringify(agents)); // Return a deep copy to prevent external mutation issues
}

export function getAgentById(id: string): Agent | undefined {
  const agent = agents.find(agent => agent.id === id);
  return agent ? { ...agent } : undefined; // Return a copy
}

export function addAgent(newAgentData: Omit<Agent, 'id'> & { id?: string }): Agent {
  const newAgentId = newAgentData.id || `DO-agent${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
  
  if (agents.some(a => a.id === newAgentId)) {
    // This case should ideally be caught by the API route before calling this store function,
    // but as a safeguard:
    throw new Error(`Agent with ID ${newAgentId} already exists in store.`);
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
    customer_type_id: newAgentData.customer_type_id,
    discount: Number(newAgentData.discount), // Ensure discount is a number
    websiteUrl: newAgentData.websiteUrl,
  };
  agents.push(agentToStore);
  return { ...agentToStore }; // Return a copy
}

export function updateAgent(id: string, updatedData: Partial<Agent>): Agent | undefined {
  const agentIndex = agents.findIndex(agent => agent.id === id);
  if (agentIndex === -1) {
    return undefined;
  }
   // Ensure discount is handled as a number if present in updatedData
  if (updatedData.discount !== undefined) {
    updatedData.discount = Number(updatedData.discount);
  }
  agents[agentIndex] = { ...agents[agentIndex], ...updatedData, id }; // Ensure ID isn't overwritten if somehow passed in updatedData
  return { ...agents[agentIndex] }; // Return a copy
}

export function deleteAgentById(id: string): boolean {
  const initialLength = agents.length;
  agents = agents.filter(agent => agent.id !== id);
  return agents.length < initialLength; // True if an agent was deleted
}

export function deleteMultipleAgents(ids: string[]): number {
  const initialLength = agents.length;
  agents = agents.filter(agent => !ids.includes(agent.id));
  return initialLength - agents.length; // Number of agents actually deleted
}
