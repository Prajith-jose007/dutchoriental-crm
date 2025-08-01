
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { OpportunitiesTable } from './_components/OpportunitiesTable';
import { OpportunityFormDialog } from './_components/OpportunityFormDialog';
import type { Opportunity, User, Yacht } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';
const USER_ID_STORAGE_KEY = 'currentUserId';

export default function OpportunityPage() {
  const [isOpportunityDialogOpen, setIsOpportunityDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});
  const [yachtMap, setYachtMap] = useState<{ [id: string]: string }>({});
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const [oppsRes, usersRes, yachtsRes] = await Promise.all([
        fetch('/api/opportunities'),
        fetch('/api/users'),
        fetch('/api/yachts'),
      ]);

      if (!oppsRes.ok) throw new Error(`Failed to fetch opportunities: ${oppsRes.statusText}`);
      const oppsData = await oppsRes.json();
      setOpportunities(Array.isArray(oppsData) ? oppsData : []);
      
      if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      const usersData = await usersRes.json();
      if(Array.isArray(usersData)) {
          setUserMap(usersData.reduce((acc, user) => { acc[user.id] = user.name; return acc; }, {}));
      }

      if (!yachtsRes.ok) throw new Error(`Failed to fetch yachts: ${yachtsRes.statusText}`);
      const yachtsData = await yachtsRes.json();
      setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
      if(Array.isArray(yachtsData)) {
        setYachtMap(yachtsData.reduce((acc, yacht) => { acc[yacht.id] = yacht.name; return acc; }, {}));
      }

    } catch (error) {
      console.error("Error fetching opportunities page data:", error);
      toast({ title: 'Error Fetching Data', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setIsAdmin(role === 'admin');
    } catch (e) {
      console.error("Error accessing localStorage for user role:", e);
      setIsAdmin(false);
    }
    fetchPageData();
  }, []);

  const handleAddOpportunityClick = () => {
    setEditingOpportunity(null);
    setIsOpportunityDialogOpen(true);
  };

  const handleEditOpportunityClick = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setIsOpportunityDialogOpen(true);
  };

  const handleOpportunityFormSubmit = async (submittedOppData: Opportunity) => {
    const isNew = !editingOpportunity;
    try {
      let response;
      const payload = { ...submittedOppData };
      
      if (isNew) {
        response = await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/opportunities/${editingOpportunity?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to save opportunity`);
      }

      toast({
        title: isNew ? 'Opportunity Added' : 'Opportunity Updated',
        description: `Opportunity for ${payload.potentialCustomer} has been saved.`,
      });

      fetchPageData();
      setIsOpportunityDialogOpen(false);
      setEditingOpportunity(null);

    } catch (error) {
      console.error("Error saving opportunity:", error);
      toast({ title: 'Error Saving Opportunity', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm(`Are you sure you want to delete opportunity ${opportunityId}?`)) return;

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to delete opportunity');
      }
      toast({ title: 'Opportunity Deleted', description: `Opportunity ${opportunityId} has been deleted.` });
      fetchPageData();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast({ title: 'Error Deleting Opportunity', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Opportunity Management"
          description="Track and manage your sales opportunities from initial contact to closing."
          actions={
            <Skeleton className="h-10 w-48" />
          }
        />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Opportunity Management"
        description="Track and manage your sales opportunities from initial contact to closing."
        actions={
          <Button onClick={handleAddOpportunityClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Opportunity
          </Button>
        }
      />
      <OpportunitiesTable 
        opportunities={opportunities}
        onEditOpportunity={handleEditOpportunityClick}
        onDeleteOpportunity={handleDeleteOpportunity}
        userMap={userMap}
        yachtMap={yachtMap}
      />
      {isOpportunityDialogOpen && (
        <OpportunityFormDialog
          isOpen={isOpportunityDialogOpen}
          onOpenChange={setIsOpportunityDialogOpen}
          opportunity={editingOpportunity}
          onSubmitSuccess={handleOpportunityFormSubmit}
          allYachts={allYachts}
          userMap={userMap}
        />
      )}
    </div>
  );
}
