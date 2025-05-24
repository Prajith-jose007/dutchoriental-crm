
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Download } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AgentsTable } from './_components/AgentsTable';
import { AgentFormDialog } from './_components/AgentFormDialog';
import type { Agent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
      case 'websiteUrl':
        return undefined; // Optional fields can be undefined
      default: return ''; // For required strings like name, email
    }
  }

  switch (key) {
    case 'discount':
      const num = parseFloat(trimmedValue);
      return isNaN(num) ? 0 : num;
    case 'status':
      const validStatuses: Agent['status'][] = ['Active', 'Non Active', 'Dead'];
      return validStatuses.includes(trimmedValue as Agent['status']) ? trimmedValue : 'Active';
    default:
      return trimmedValue;
  }
};


export default function AgentsPage() {
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAgents([]); 
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
        const existingAgentById = agents.find(a => a.id === submittedAgentData.id);
        if (existingAgentById && !editingAgent) { 
             toast({
                title: 'Error Adding Agent',
                description: `Agent with ID ${submittedAgentData.id} already exists.`,
                variant: 'destructive',
            });
            return; 
        }
        const existingAgentByEmail = agents.find(a => a.email.toLowerCase() === submittedAgentData.email.toLowerCase() && a.id !== submittedAgentData.id);
         if (existingAgentByEmail && !editingAgent) {
             toast({
                title: 'Error Adding Agent',
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
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({ title: 'Error Deleting Agent', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleImportClick = () => {
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
        const headers = headerLine.split(',').map(h => h.trim() as keyof Agent);
        
        const newAgentsFromCsv: Agent[] = [];
        let skippedCount = 0;
        let successCount = 0;
        
        const currentAgents = await (await fetch('/api/agents')).json() as Agent[];
        const existingAgentIds = new Set(currentAgents.map(a => a.id));
        const existingAgentEmails = new Set(currentAgents.map(a => a.email.toLowerCase()));

        for (let i = 1; i < lines.length; i++) {
          let data = lines[i].split(',');
          if (data.length !== headers.length) {
            console.warn(`Skipping malformed CSV line ${i + 1}: Expected ${headers.length} columns, got ${data.length}. Line: "${lines[i]}"`);
            skippedCount++;
            continue;
          }

          const parsedRow = {} as Partial<Agent>;
          headers.forEach((header, index) => {
            parsedRow[header] = convertAgentValue(header, data[index]);
          });

          let agentId = typeof parsedRow.id === 'string' && parsedRow.id.trim() !== '' ? parsedRow.id.trim() : `DO-agent-csv-${Date.now()}-${i}`;
          
          if (existingAgentIds.has(agentId) || newAgentsFromCsv.some(a => a.id === agentId)) {
            console.warn(`Skipping agent with duplicate ID: ${agentId} from CSV row ${i+1}.`);
            skippedCount++;
            continue;
          }
          if (parsedRow.email && (existingAgentEmails.has(parsedRow.email.toLowerCase()) || newAgentsFromCsv.some(a => a.email.toLowerCase() === parsedRow.email!.toLowerCase()))) {
            console.warn(`Skipping agent with duplicate email: ${parsedRow.email} from CSV row ${i+1}.`);
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
            discount: typeof parsedRow.discount === 'number' ? parsedRow.discount : 0,
            websiteUrl: parsedRow.websiteUrl,
          };
           // Basic validation before adding
          if (!fullAgent.name || !fullAgent.email || fullAgent.discount === undefined || !fullAgent.status) {
             console.warn(`Skipping agent due to missing required fields (name, email, discount, status) at CSV row ${i+1}. Agent data:`, fullAgent);
             skippedCount++;
             continue;
          }

          newAgentsFromCsv.push(fullAgent);
          existingAgentIds.add(fullAgent.id); // Add to set to prevent duplicates within the same batch
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
                console.warn(`Failed to import agent ${agentToImport.id} via API: ${errorData.message || response.statusText}`);
                skippedCount++;
              }
            } catch (apiError) {
                console.warn(`API error importing agent ${agentToImport.id}:`, apiError);
                skippedCount++;
            }
          }
          fetchAgents(); 
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
    if (agents.length === 0) {
      toast({ title: 'No Data', description: 'There are no agents to export.', variant: 'default' });
      return;
    }
    const headers: (keyof Agent)[] = ['id', 'name', 'agency_code', 'address', 'phone_no', 'email', 'status', 'TRN_number', 'discount', 'websiteUrl'];
    
    const escapeCsvCell = (cellData: any): string => {
      if (cellData === null || cellData === undefined) return '';
      let stringValue = String(cellData);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [
      headers.join(','),
      ...agents.map(agent =>
        headers.map(header => escapeCsvCell(agent[header])).join(',')
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


  if (isLoading) {
    return <div className="container mx-auto py-2 text-center">Loading agents...</div>;
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Agent Management"
        description="Manage your external sales agents and their details."
        actions={
          <div className="flex items-center gap-2">
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
