
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ClientsTable } from './_components/ClientsTable';
import { ClientFormDialog } from './_components/ClientFormDialog';
import type { Agent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

// This new page is a clone of the Agents page, repurposed for "Clients"
// It will serve as the foundation for the new Client Management feature
export default function ClientsPage() {
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Agent | null>(null);
  const [clients, setClients] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  
  const [clientMap, setClientMap] = useState<{[id: string]: string}>({});

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      // Fetching from agents, but this should be a dedicated client endpoint in the future.
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data: Agent[] = await response.json();
      setClients(data);
      
      const newClientMap: {[id: string]: string} = {};
      data.forEach(client => {
          newClientMap[client.id] = client.name;
      });
      setClientMap(newClientMap);
      
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ title: 'Error Fetching Clients', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
    fetchClients();
  }, []);

  const handleAddClientClick = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can add new clients.", variant: "destructive" });
      return;
    }
    setEditingClient(null);
    setIsClientDialogOpen(true);
  };

  const handleEditClientClick = (client: Agent) => {
    setEditingClient(client);
    setIsClientDialogOpen(true);
  };

  const handleClientFormSubmit = async (submittedClientData: Agent) => {
    try {
      let response;
      // The API endpoints for client will be different from agent in the future.
      if (editingClient) {
        response = await fetch(`/api/agents/${editingClient.id}`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedClientData),
        });
      } else {
        response = await fetch('/api/agents', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedClientData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save client');
      }

      toast({
        title: editingClient ? 'Client Updated' : 'Client Added',
        description: `${submittedClientData.name} has been saved.`,
      });

      fetchClients();
      setIsClientDialogOpen(false);
      setEditingClient(null);

    } catch (error) {
      console.error("Error saving client:", error);
      toast({ title: 'Error Saving Client', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can delete clients.", variant: "destructive" });
      return;
    }
    if (!confirm(`Are you sure you want to delete client ${clientId}?`)) return;

    try {
      const response = await fetch(`/api/agents/${clientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete client');
      }
      toast({ title: 'Client Deleted', description: `Client ${clientId} has been deleted.` });
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({ title: 'Error Deleting Client', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Client Management"
          description="Loading client data..."
          actions={<Skeleton className="h-10 w-32" />}
        />
        <Skeleton className="h-[300px] w-full mt-4" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Client Management"
        description="Manage your corporate clients, their organizational structure, and associated brands."
        actions={
          isAdmin && (
            <Button onClick={handleAddClientClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          )
        }
      />
      <ClientsTable
        clients={clients}
        clientMap={clientMap}
        onEditClient={handleEditClientClick}
        onDeleteClient={handleDeleteClient}
        isAdmin={isAdmin}
      />
      {isClientDialogOpen && (
        <ClientFormDialog
          isOpen={isClientDialogOpen}
          onOpenChange={setIsClientDialogOpen}
          client={editingClient}
          allClients={clients}
          onSubmitSuccess={handleClientFormSubmit}
        />
      )}
    </div>
  );
}
