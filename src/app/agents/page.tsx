
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload, Download, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AgentsTable } from './_components/AgentsTable';
import { AgentFormDialog } from './_components/AgentFormDialog';
import type { Agent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { agentCsvHeaderMapping as csvHeaderMapping, convertAgentValue, parseCsvLine } from '@/lib/csvHelpers';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';




export default function AgentsPage() {
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canImportExport, setCanImportExport] = useState(false);
  const [canView, setCanView] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch agents: ${response.statusText}`);
      }
      const data: Agent[] = await response.json();

      const sortedData = (Array.isArray(data) ? data : []).sort((a, b) => {
        const numA = parseInt(a.id.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.id.replace(/[^0-9]/g, ''), 10);

        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.id.localeCompare(b.id);
      });

      setAgents(sortedData);

    } catch (error) {
      console.error("Error fetching agents:", error);
      toast({ title: 'Error Fetching Agents', description: (error as Error).message, variant: 'destructive' });
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY) || '';
      const r = role.toLowerCase();

      const isSuperAdmin = r === 'super admin';
      const isAdminRole = r === 'admin';
      const isManager = r === 'manager';
      const isSales = r === 'sales';
      const isAccounts = r === 'accounts';

      // Permissions
      setIsAdmin(isSuperAdmin || isAdminRole); // Keep for backend compat if needed, simplified

      setCanView(true); // Everyone can view agents list ideally, or restricts if needed
      setCanAdd(isSuperAdmin || isAdminRole || isManager);
      setCanEdit(isSuperAdmin || isAdminRole || isManager);
      setCanDelete(isSuperAdmin || isAdminRole);
      setCanImportExport(isSuperAdmin || isAdminRole);

    } catch (error) {
      console.error("Error accessing localStorage for user role:", error);
    }
    fetchAgents();
  }, [fetchAgents]);


  const handleAddAgentClick = () => {
    if (!canAdd) {
      toast({ title: "Access Denied", description: "You do not have permission to add agents.", variant: "destructive" });
      return;
    }
    setEditingAgent(null);
    setIsAgentDialogOpen(true);
  };

  const handleEditAgentClick = (agent: Agent) => {
    // Sales can view but not edit - handled by hiding button in table, but double check here
    if (!canEdit) {
      // Optional: Allow opening in readonly? For now, restriction logic:
      // If logic allows managers to edit, they pass here.
      // Sales shouldn't even see the edit button if table logic is correct.
    }
    setEditingAgent(agent);
    setIsAgentDialogOpen(true);
  };

  const handleAgentFormSubmit = async (submittedAgentData: Agent) => {
    if (!canEdit && !canAdd) { // Basic check
      toast({ title: "Access Denied", description: "You do not have permission to save agent data.", variant: "destructive" });
      return;
    }
    // Specific check for Edit v Add could be done here but permissions align

    try {
      let response;
      if (editingAgent && submittedAgentData.id === editingAgent.id) {
        if (!canEdit) {
          toast({ title: "Access Denied", description: "You cannot edit agents.", variant: "destructive" });
          return;
        }
        response = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedAgentData),
        });
      } else {
        if (!canAdd) {
          toast({ title: "Access Denied", description: "You cannot add agents.", variant: "destructive" });
          return;
        }
        // Check if agent with this ID already exists before POSTing
        const checkResponse = await fetch(`/api/agents/${submittedAgentData.id}`);
        if (checkResponse.ok && !editingAgent) {
          toast({
            title: 'Error Adding Agent',
            description: `Agent with ID ${submittedAgentData.id} already exists.`,
            variant: 'destructive',
          });
          return;
        }

        if (submittedAgentData.email) {
          const allAgentsResponse = await fetch('/api/agents');
          if (allAgentsResponse.ok) {
            const allAgentsData: Agent[] = await allAgentsResponse.json();
            const conflictingAgent = allAgentsData.find(
              (a) => a.email.toLowerCase() === submittedAgentData.email.toLowerCase() && a.id !== submittedAgentData.id
            );
            if (conflictingAgent) {
              toast({
                title: 'Error Saving Agent',
                description: `Agent with email ${submittedAgentData.email} already exists.`,
                variant: 'destructive',
              });
              return;
            }
          }
        }

        response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedAgentData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
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
    if (!canDelete) {
      toast({ title: "Access Denied", description: "Only authorized users can delete agents.", variant: "destructive" });
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
        const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to delete agent: ${response.statusText}`);
      }
      toast({ title: 'Agent Deleted', description: `Agent ${agentId} has been deleted.` });
      fetchAgents();
      setSelectedAgentIds(prev => prev.filter(id => id !== agentId));
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({ title: 'Error Deleting Agent', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSelectAgent = (agentId: string, isSelected: boolean) => {
    if (!canDelete) return; // Only allow selection if can delete (for bulk actions)
    setSelectedAgentIds(prevSelected =>
      isSelected ? [...prevSelected, agentId] : prevSelected.filter(id => id !== agentId)
    );
  };

  const handleSelectAllAgents = (isSelected: boolean) => {
    if (!canDelete) return;
    setSelectedAgentIds(isSelected ? agents.map(agent => agent.id) : []);
  };

  const handleDeleteSelectedAgents = async () => {
    if (!canDelete || selectedAgentIds.length === 0) {
      toast({ title: "Action Denied", description: "No agents selected or insufficient permissions.", variant: "destructive" });
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedAgentIds.length} selected agents? This action cannot be undone.`)) {
      return;
    }
    console.log("[Bulk Delete Agents] Selected IDs to delete:", selectedAgentIds);
    try {
      const response = await fetch('/api/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedAgentIds }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API Error ${response.status}: ${response.statusText}` }));
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
    if (!canImportExport) {
      toast({ title: "Access Denied", description: "Only administrators can import agents.", variant: "destructive" });
      return;
    }
    if (isImporting) return;
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
    if (!canImportExport) {
      toast({ title: "Access Denied", description: "Only administrators can import agents.", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    setSelectedAgentIds([]);
    toast({ title: 'Import Started', description: 'Processing CSV file... This may take a few moments.' });
    const startTime = Date.now();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      let successCount = 0;
      let skippedCount = 0;

      if (!csvText) {
        toast({ title: 'Import Error', description: 'Could not read CSV file.', variant: 'destructive' });
        setIsImporting(false);
        return;
      }
      try {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          toast({ title: 'Import Error', description: 'CSV must have a header and at least one data row.', variant: 'destructive' });
          setIsImporting(false);
          return;
        }

        let headerLine = lines[0];
        if (headerLine.charCodeAt(0) === 0xFEFF) {
          headerLine = headerLine.substring(1);
        }
        const fileHeaders = parseCsvLine(headerLine).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        console.log("[CSV Import Agents] Detected Headers:", fileHeaders);

        const newAgentsFromCsv: Agent[] = [];

        // Fetch current agents to determine next ID and check for existing IDs/emails
        const currentAgentsResponse = await fetch('/api/agents');
        const currentAgentsData: Agent[] = currentAgentsResponse.ok ? await currentAgentsResponse.json() : [];
        const allKnownAgentIds = new Set(currentAgentsData.map(a => a.id));
        const existingAgentEmails = new Set(currentAgentsData.map(a => a.email.toLowerCase()));

        let nextNumericSuffix = 1;
        const numericIdRegex = /^DO-([0-9]+)$/; // Match IDs like DO-1, DO-001, DO-1001
        let maxNumericId = 0;

        currentAgentsData.forEach(agent => {
          const match = agent.id.match(numericIdRegex);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > maxNumericId) {
              maxNumericId = num;
            }
          }
        });
        nextNumericSuffix = maxNumericId + 1;


        for (let i = 1; i < lines.length; i++) {
          const data = parseCsvLine(lines[i]);
          if (data.length !== fileHeaders.length) {
            console.warn(`[CSV Import Agents] Skipping malformed CSV line ${i + 1}: Expected ${fileHeaders.length} columns, got ${data.length}. Line: "${lines[i]}"`);
            skippedCount++;
            continue;
          }

          const parsedRow = {} as Partial<Agent>;
          fileHeaders.forEach((fileHeader, index) => {
            const agentKey = csvHeaderMapping[fileHeader];
            if (agentKey) {
              (parsedRow as any)[agentKey] = convertAgentValue(agentKey, data[index]);
            } else {
              console.warn(`[CSV Import Agents] Unknown header "${fileHeader}" in CSV row ${i + 1}. Skipping this column.`);
            }
          });

          let agentId = parsedRow.id && String(parsedRow.id).trim() !== '' ? String(parsedRow.id).trim() : '';

          if (!agentId) { // Generate ID if not provided
            let potentialId: string;
            do {
              potentialId = `DO-${nextNumericSuffix}`;
              nextNumericSuffix++;
            } while (allKnownAgentIds.has(potentialId) || newAgentsFromCsv.some(a => a.id === potentialId));
            agentId = potentialId;
          }


          if (allKnownAgentIds.has(agentId)) {
            skippedCount++;
            continue;
          }
          if (parsedRow.email && (existingAgentEmails.has(parsedRow.email.toLowerCase()) || newAgentsFromCsv.some(a => a.email!.toLowerCase() === parsedRow.email!.toLowerCase()))) {
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

          if (!fullAgent.id || !fullAgent.name || !fullAgent.email || fullAgent.discount === undefined || !fullAgent.status) {
            skippedCount++;
            continue;
          }

          newAgentsFromCsv.push(fullAgent);
          allKnownAgentIds.add(fullAgent.id);
          if (fullAgent.email) existingAgentEmails.add(fullAgent.email.toLowerCase());
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
                skippedCount++;
              }
            } catch (apiError) {
              skippedCount++;
            }
          }
        }
      } catch (error) {
        console.error("CSV Parsing Error:", error);
        toast({ title: 'Import Error', description: (error as Error).message, variant: 'destructive' });
      } finally {
        const endTime = Date.now();
        const durationInSeconds = ((endTime - startTime) / 1000).toFixed(2);
        if (successCount > 0 || skippedCount > 0) {
          fetchAgents();
        }
        toast({
          title: 'Import Processed',
          description: `${successCount} agents imported. ${skippedCount} rows skipped. Processed in ${durationInSeconds} seconds.`
        });
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
      setIsImporting(false);
    }
    reader.readAsText(file);
  };

  const handleCsvExport = () => {
    if (!canImportExport) {
      toast({ title: "Access Denied", description: "Only authorized users can export agents.", variant: "destructive" });
      return;
    }
    if (agents.length === 0) {
      toast({ title: 'No Data', description: 'There are no agents to export.', variant: 'default' });
      return;
    }

    const exportHeaders: (keyof Agent)[] = [
      'id', 'name', 'agency_code', 'address', 'phone_no', 'email',
      'status', 'TRN_number', 'customer_type_id', 'discount', 'websiteUrl'
    ];

    const escapeCsvCell = (cellData: string | number | boolean | null | undefined): string => {
      if (cellData === null || cellData === undefined) return '';
      const stringValue = String(cellData);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [
      exportHeaders.join(','),
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


  if (!canView && !isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Agent Management"
          description="Access Denied."
        />
        <p className="text-destructive text-center py-10">
          You do not have permission to view agent data.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Agent Management"
          description="Loading agent data..."
          actions={
            canAdd && (
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-28" />
              </div>
            )
          }
        />
        <Skeleton className="h-[300px] w-full mt-4" />
      </div>
    );
  }


  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Agent Management"
        description="Manage your external sales agents and their details."
        actions={
          <div className="flex items-center gap-2">
            {canDelete && selectedAgentIds.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelectedAgents} disabled={isImporting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedAgentIds.length})
              </Button>
            )}

            {canImportExport && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importing...' : 'Import CSV'}
                </Button>
                <Button variant="outline" onClick={handleCsvExport} disabled={isImporting}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </>
            )}

            {canAdd && (
              <Button onClick={handleAddAgentClick} disabled={isImporting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Agent
              </Button>
            )}
          </div>
        }
      />
      <AgentsTable
        agents={agents}
        onEditAgent={handleEditAgentClick}
        onDeleteAgent={handleDeleteAgent}
        isAdmin={isAdmin} // Retained 
        canEdit={canEdit}
        canDelete={canDelete}
        selectedAgentIds={selectedAgentIds}
        onSelectAgent={handleSelectAgent}
        onSelectAllAgents={handleSelectAllAgents}
      />
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


