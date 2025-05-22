
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AgentsTable } from './_components/AgentsTable';
import { AgentFormDialog } from './_components/AgentFormDialog';
import type { Agent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
// Placeholder data is no longer the primary source after API integration
// import { placeholderAgents as initialAgentsData } from '@/lib/placeholder-data';

export default function AgentsPage() {
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }
      const data = await response.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast({ title: 'Error Fetching Agents', description: (error as Error).message, variant: 'destructive' });
      setAgents([]); // Fallback to empty if API fails
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAddAgentClick = () => {
    setEditingAgent(null);
    setIsAgentDialogOpen(true);
  };

  const handleEditAgentClick = (agent: Agent) => {
    setEditingAgent(agent);
    setIsAgentDialogOpen(true);
  };

  const handleAgentFormSubmit = async (submittedAgentData: Agent) => {
    try {
      let response;
      if (editingAgent && submittedAgentData.id === editingAgent.id) {
        response = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedAgentData),
        });
      } else {
        // Check for duplicate ID before creating a new agent via API
        const existingAgent = agents.find(a => a.id === submittedAgentData.id);
        if (existingAgent && !editingAgent) {
             toast({
                title: 'Error Adding Agent',
                description: `Agent with ID ${submittedAgentData.id} already exists.`,
                variant: 'destructive',
            });
            return;
        }
        response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedAgentData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save agent: ${response.statusText}`);
      }
      
      toast({
        title: editingAgent ? 'Agent Updated' : 'Agent Added',
        description: `${submittedAgentData.name} has been saved.`,
      });
      
      fetchAgents(); // Re-fetch all agents
      setIsAgentDialogOpen(false);
      setEditingAgent(null);

    } catch (error) {
      console.error("Error saving agent:", error);
      toast({ title: 'Error Saving Agent', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm(`Are you sure you want to delete agent ${agentId}? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete agent: ${response.statusText}`);
      }
      toast({ title: 'Agent Deleted', description: `Agent ${agentId} has been deleted.` });
      fetchAgents(); // Re-fetch agents
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({ title: 'Error Deleting Agent', description: (error as Error).message, variant: 'destructive' });
    }
  };


  if (isLoading) {
    return <div className="container mx-auto py-2 text-center">Loading agents...</div>;
  }

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
      <AgentsTable agents={agents} onEditAgent={handleEditAgentClick} onDeleteAgent={handleDeleteAgent} />
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
