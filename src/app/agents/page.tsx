
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Download, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AgentsTable } from './_components/AgentsTable';
import { AgentFormDialog } from './_components/AgentFormDialog';
import type { Agent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

// Header mapping for CSV import (lowercase, underscore_separated keys)
const csvHeaderMapping: { [csvHeaderKey: string]: keyof Agent } = {
  'id': 'id',
  'name': 'name',
  'agency_code': 'agency_code',
  'agency code': 'agency_code',
  'address': 'address',
  'phone_no': 'phone_no',
  'phone no': 'phone_no',
  'phoneno': 'phone_no',
  'email': 'email',
  'status': 'status',
  'trn_number': 'TRN_number',
  'trn number': 'TRN_number',
  'customer_type_id': 'customer_type_id',
  'customer type id': 'customer_type_id',
  'discount': 'discount',
  'discount_rate': 'discount', // Alias for discount
  'discount rate': 'discount', // Alias for discount
  'websiteurl': 'websiteUrl',
  'website url': 'websiteUrl',
  'website_url': 'websiteUrl',
};


// Helper to convert CSV row values to correct Agent types
const convertAgentValue = (key: keyof Agent, value: string): any => {
  const trimmedValue = value ? String(value).trim() : '';

  if (trimmedValue === '' || value === null || value === undefined) {
    switch (key) {
      case 'discount': return 0;
      case 'status': return 'Active'; // Default status
      case 'agency_code':
      case 'address':
      case 'phone_no':
      case 'TRN_number':
      case 'customer_type_id':
      case 'websiteUrl':
        return undefined; // Optional fields can be undefined
      default: return ''; // For required strings like name, email
    }
  }

  switch (key) {
    case 'discount':
      const num = parseFloat(trimmedValue);
      return isNaN(num) || !isFinite(num) ? 0 : num;
    case 'status':
      const validStatuses: Agent['status'][] = ['Active', 'Non Active', 'Dead'];
      return validStatuses.includes(trimmedValue as Agent['status']) ? trimmedValue : 'Active';
    case 'TRN_number': // Ensure TRN_number is treated as a string
    case 'customer_type_id':
      return trimmedValue;
    default:
      return trimmedValue;
  }
};


export default function AgentsPage() {
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch agents: ${response.statusText}`);
      }
      const data = await response.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast({ title: 'Error Fetching Agents', description: (error as Error).message, variant: 'destructive' });
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error("Error accessing localStorage for user role:", error);
      setIsAdmin(false);
    }
    fetchAgents();
  }, []);


  const handleAddAgentClick = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can add agents.", variant: "destructive" });
      return;
    }
    setEditingAgent(null);
    setIsAgentDialogOpen(true);
  };

  const handleEditAgentClick = (agent: Agent) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can edit agents.", variant: "destructive" });
      return;
    }
    setEditingAgent(agent);
    setIsAgentDialogOpen(true);
  };

  const handleAgentFormSubmit = async (submittedAgentData: Agent) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "You do not have permission to save agent data.", variant: "destructive" });
      return;
    }
    try {
      let response;
      if (editingAgent && submittedAgentData.id === editingAgent.id) {
        response = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedAgentData),
        });
      } else {
        // Check against current agents fetched from API (state)
        const currentAgentsResponse = await fetch('/api/agents');
        if (!currentAgentsResponse.ok) throw new Error('Could not verify existing agents.');
        const currentAgents: Agent[] = await currentAgentsResponse.json();

        const existingAgentById = currentAgents.find(a => a.id === submittedAgentData.id);
        if (existingAgentById && !editingAgent) { // Only block if adding new, not if editing and ID hasn't changed
             toast({
                title: 'Error Adding Agent',
                description: `Agent with ID ${submittedAgentData.id} already exists.`,
                variant: 'destructive',
            });
            return;
        }
        const existingAgentByEmail = currentAgents.find(a => a.email.toLowerCase() === submittedAgentData.email.toLowerCase() && a.id !== submittedAgentData.id);
         if (existingAgentByEmail && (!editingAgent || (editingAgent && editingAgent.email.toLowerCase() !== submittedAgentData.email.toLowerCase()))) {
             toast({
                title: 'Error Saving Agent',
                description: `Agent with email ${submittedAgentData.email} already exists.`,
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

      fetchAgents();
      setIsAgentDialogOpen(false);
      setEditingAgent(null);

    } catch (error) {
      console.error("Error saving agent:", error);
      toast({ title: 'Error Saving Agent', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can delete agents.", variant: "destructive" });
      return;
    }
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
      fetchAgents();
      setSelectedAgentIds(prev => prev.filter(id => id !== agentId)); // Remove from selection
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({ title: 'Error Deleting Agent', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSelectAgent = (agentId: string, isSelected: boolean) => {
    if (!isAdmin) return;
    setSelectedAgentIds(prevSelected =>
      isSelected ? [...prevSelected, agentId] : prevSelected.filter(id => id !== agentId)
    );
  };

  const handleSelectAllAgents = (isSelected: boolean) => {
    if (!isAdmin) return;
    setSelectedAgentIds(isSelected ? agents.map(agent => agent.id) : []);
  };

  const handleDeleteSelectedAgents = async () => {
    if (!isAdmin || selectedAgentIds.length === 0) {
      toast({ title: "Action Denied", description: "No agents selected or insufficient permissions.", variant: "destructive" });
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedAgentIds.length} selected agents? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch('/api/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedAgentIds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete selected agents');
      }
      toast({ title: 'Agents Deleted', description: `${selectedAgentIds.length} agents have been deleted.` });
      fetchAgents();
      setSelectedAgentIds([]);
    } catch (error) {
      console.error("Error deleting selected agents:", error);
      toast({ title: 'Error Deleting Agents', description: (error as Error).message, variant: 'destructive' });
    }
  };


  const handleImportClick = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can import agents.", variant: "destructive" });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleCsvImport(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCsvImport = async (file: File) => {
    if (!isAdmin) {
        toast({ title: "Access Denied", description: "Only administrators can import agents.", variant: "destructive" });
        return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      if (!csvText) {
        toast({ title: 'Import Error', description: 'Could not read CSV file.', variant: 'destructive' });
        return;
      }
      try {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          toast({ title: 'Import Error', description: 'CSV must have a header and at least one data row.', variant: 'destructive' });
          return;
        }

        let headerLine = lines[0];
        if (headerLine.charCodeAt(0) === 0xFEFF) { // Remove BOM
            headerLine = headerLine.substring(1);
        }
        const fileHeaders = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        console.log("[CSV Import] Detected Normalized Headers:", fileHeaders);

        const newAgentsFromCsv: Agent[] = [];
        let skippedCount = 0;
        let successCount = 0;

        const currentAgentsResponse = await fetch('/api/agents');
        const currentAgents: Agent[] = await currentAgentsResponse.json();
        const existingAgentIds = new Set(currentAgents.map(a => a.id));
        const existingAgentEmails = new Set(currentAgents.map(a => a.email.toLowerCase()));

        for (let i = 1; i < lines.length; i++) {
          let data = lines[i].split(',');
          if (data.length !== fileHeaders.length) {
            console.warn(`[CSV Import] Skipping malformed CSV line ${i + 1}: Expected ${fileHeaders.length} columns, got ${data.length}. Line: "${lines[i]}"`);
            skippedCount++;
            continue;
          }

          const parsedRow = {} as Partial<Agent>;
          fileHeaders.forEach((fileHeader, index) => {
            const agentKey = csvHeaderMapping[fileHeader]; // Map to Agent type key
            if (agentKey) {
                parsedRow[agentKey] = convertAgentValue(agentKey, data[index]);
            } else {
                console.warn(`[CSV Import] Unknown header "${fileHeader}" in CSV row ${i+1}. Skipping this column.`);
            }
          });
           if (i === 1) console.log("[CSV Import] Processing Row 1 - Parsed (after mapping & convertValue):", parsedRow);

          let agentId = parsedRow.id && String(parsedRow.id).trim() !== '' ? String(parsedRow.id).trim() : `DO-agent-csv-${Date.now()}-${i}`;

          if (existingAgentIds.has(agentId) || newAgentsFromCsv.some(a => a.id === agentId)) {
            console.warn(`[CSV Import] Skipping agent with duplicate ID: ${agentId} from CSV row ${i+1}.`);
            skippedCount++;
            continue;
          }
          if (parsedRow.email && (existingAgentEmails.has(parsedRow.email.toLowerCase()) || newAgentsFromCsv.some(a => a.email!.toLowerCase() === parsedRow.email!.toLowerCase()))) {
            console.warn(`[CSV Import] Skipping agent with duplicate email: ${parsedRow.email} from CSV row ${i+1}.`);
            skippedCount++;
            continue;
          }


          const fullAgent: Agent = {
            id: agentId,
            name: parsedRow.name || 'N/A from CSV',
            agency_code: parsedRow.agency_code,
            address: parsedRow.address,
            phone_no: parsedRow.phone_no,
            email: parsedRow.email || `error${i}@example.com`,
            status: parsedRow.status || 'Active',
            TRN_number: parsedRow.TRN_number,
            customer_type_id: parsedRow.customer_type_id,
            discount: typeof parsedRow.discount === 'number' ? parsedRow.discount : 0,
            websiteUrl: parsedRow.websiteUrl,
          };
          if (i === 1) console.log("[CSV Import] Processing Row 1 - Agent to POST:", fullAgent);
           // Basic validation before adding
          if (!fullAgent.id || !fullAgent.name || !fullAgent.email || fullAgent.discount === undefined || !fullAgent.status) {
             console.warn(`[CSV Import] Skipping agent due to missing required fields (id, name, email, discount, status) at CSV row ${i+1}. Agent data:`, fullAgent);
             skippedCount++;
             continue;
          }

          newAgentsFromCsv.push(fullAgent);
          existingAgentIds.add(fullAgent.id);
          if(fullAgent.email) existingAgentEmails.add(fullAgent.email.toLowerCase());
        }

        if (newAgentsFromCsv.length > 0) {
          for (const agentToImport of newAgentsFromCsv) {
            try {
              const response = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agentToImport),
              });
              if (response.ok) {
                successCount++;
              } else {
                const errorData = await response.json();
                console.warn(`[CSV Import] API Error for agent ID ${agentToImport.id}: ${errorData.message || response.statusText}. Payload:`, agentToImport);
                skippedCount++;
              }
            } catch (apiError) {
                console.warn(`[CSV Import] Network/JS Error importing agent ${agentToImport.id}:`, apiError, "Payload:", agentToImport);
                skippedCount++;
            }
          }
          fetchAgents();
          setSelectedAgentIds([]); // Clear selection after import
          toast({ title: 'Import Processed', description: `${successCount} agents imported. ${skippedCount} rows skipped. Check console for details.` });
        } else {
          toast({ title: 'Import Complete', description: `No new agents were imported. ${skippedCount > 0 ? `${skippedCount} rows skipped. ` : ''}Check console for details.` });
        }
      } catch (error) {
        console.error("CSV Parsing Error:", error);
        toast({ title: 'Import Error', description: (error as Error).message, variant: 'destructive' });
      }
    };
    reader.onerror = () => {
        toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    }
    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can export agents.", variant: "destructive" });
      return;
    }
    if (agents.length === 0) {
      toast({ title: 'No Data', description: 'There are no agents to export.', variant: 'default' });
      return;
    }
    // Use the keys from csvHeaderMapping that map to Agent type for consistent export headers
    const exportHeaders: (keyof Agent)[] = [
        'id', 'name', 'agency_code', 'address', 'phone_no', 'email', 
        'status', 'TRN_number', 'customer_type_id', 'discount', 'websiteUrl'
    ];


    const escapeCsvCell = (cellData: any): string => {
      if (cellData === null || cellData === undefined) return '';
      let stringValue = String(cellData);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [
      exportHeaders.join(','), // Use the defined export headers
      ...agents.map(agent =>
        exportHeaders.map(header => escapeCsvCell(agent[header])).join(',')
      )
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'dutchoriental_agents_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: 'Agents have been exported to CSV.' });
    } else {
      toast({ title: 'Export Failed', description: 'Your browser does not support this feature.', variant: 'destructive' });
    }
  };


  if (isLoading && !isAdmin) { // Non-admin first load
    return <div className="container mx-auto py-2 text-center">Loading...</div>;
  }

  if (!isAdmin && !isLoading) { // Non-admin after loading, access denied
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Agent Management"
          description="Access Denied. This page is for administrators only."
        />
        <p className="text-destructive text-center py-10">
          You do not have permission to view or manage agent data.
        </p>
      </div>
    );
  }

  // Admin view
  if (isLoading) { // Admin still loading data
    return <div className="container mx-auto py-2 text-center">Loading agents...</div>;
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Agent Management"
        description="Manage your external sales agents and their details."
        actions={
          isAdmin && (
            <div className="flex items-center gap-2">
               {selectedAgentIds.length > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelectedAgents}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedAgentIds.length})
                </Button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button variant="outline" onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={handleCsvExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={handleAddAgentClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Agent
              </Button>
            </div>
          )
        }
      />
      <AgentsTable
        agents={agents}
        onEditAgent={handleEditAgentClick}
        onDeleteAgent={handleDeleteAgent}
        isAdmin={isAdmin}
        selectedAgentIds={selectedAgentIds}
        onSelectAgent={handleSelectAgent}
        onSelectAllAgents={handleSelectAllAgents}
      />
      {isAgentDialogOpen && isAdmin && (
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
