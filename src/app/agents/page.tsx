
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AgentsTable } from './_components/AgentsTable';
import { AgentFormDialog } from './_components/AgentFormDialog';
import type { Agent } from '@/lib/types';
import { placeholderAgents as initialAgents } from '@/lib/placeholder-data';

export default function AgentsPage() {
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  useEffect(() => {
    setAgents(initialAgents);
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
    if (editingAgent) {
      setAgents(prevAgents => 
        prevAgents.map(a => a.id === submittedAgentData.id ? submittedAgentData : a)
      );
       const agentIndex = initialAgents.findIndex(a => a.id === submittedAgentData.id);
        if (agentIndex > -1) {
            initialAgents[agentIndex] = submittedAgentData;
        }
    } else {
      const newAgent = { ...submittedAgentData, id: `agent-${Date.now()}` };
      setAgents(prevAgents => [...prevAgents, newAgent]);
      initialAgents.push(newAgent);
    }
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
