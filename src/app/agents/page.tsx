
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AgentsTable } from './_components/AgentsTable';
import { AgentFormDialog } from './_components/AgentFormDialog';
import type { Agent } from '@/lib/types';
import { placeholderAgents as initialAgentsData } from '@/lib/placeholder-data';

const AGENTS_STORAGE_KEY = 'dutchOrientalCrmAgents';
let initialAgents: Agent[] = JSON.parse(JSON.stringify(initialAgentsData));

export default function AgentsPage() {
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const storedAgents = localStorage.getItem(AGENTS_STORAGE_KEY);
    let currentAgentsData: Agent[];
    if (storedAgents) {
      try {
        currentAgentsData = JSON.parse(storedAgents);
      } catch (error) {
        console.error("Error parsing agents from localStorage:", error);
        currentAgentsData = JSON.parse(JSON.stringify(initialAgentsData));
        localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(currentAgentsData));
      }
    } else {
      currentAgentsData = JSON.parse(JSON.stringify(initialAgentsData));
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(currentAgentsData));
    }
    initialAgents.length = 0;
    initialAgents.push(...currentAgentsData);
    setAgents(currentAgentsData);
  }, []);

  const handleAddAgentClick = () => {
    setEditingAgent(null);
    setIsAgentDialogOpen(true);
  };

  const handleEditAgentClick = (agent: Agent) => {
    setEditingAgent(agent);
    setIsAgentDialogOpen(true);
  };

  const handleAgentFormSubmit = (submittedAgentData: Agent) => {
    const agentIndex = initialAgents.findIndex(a => a.id === submittedAgentData.id);
    if (editingAgent && agentIndex > -1) {
        initialAgents[agentIndex] = submittedAgentData;
    } else if (!editingAgent && !initialAgents.some(a => a.id === submittedAgentData.id)) {
      initialAgents.push(submittedAgentData);
    } else if (!editingAgent) {
        // Handle case where trying to add a new agent with an existing ID
        // This shouldn't happen if Agent ID is managed correctly by the form
        console.error("Trying to add an agent with an existing ID or ID issue:", submittedAgentData.id);
        // Optionally show a toast message
        return;
    }
    
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(initialAgents));
    setAgents([...initialAgents]);
    setIsAgentDialogOpen(false);
    setEditingAgent(null);
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Agent Management"
        description="Manage your external sales agents and their details."
        actions={
          <Button onClick={handleAddAgentClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        }
      />
      <AgentsTable agents={agents} onEditAgent={handleEditAgentClick} />
      {isAgentDialogOpen && (
        <AgentFormDialog
          isOpen={isAgentDialogOpen}
          onOpenChange={setIsAgentDialogOpen}
          agent={editingAgent}
          onSubmitSuccess={handleAgentFormSubmit}
        />
      )}
    </div>
  );
}
