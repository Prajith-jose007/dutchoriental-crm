import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, LayoutGrid, Filter, Search, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import OpportunityForm from "../components/opportunities/OpportunityForm";
import OpportunityPipeline from "../components/opportunities/OpportunityPipeline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Opportunity() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [viewMode, setViewMode] = useState('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingOpp, setConvertingOpp] = useState(null);

  const queryClient = useQueryClient();

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date')
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: yachts = [] } = useQuery({
    queryKey: ['yachts'],
    queryFn: () => base44.entities.Yacht.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const opp = await base44.entities.Opportunity.create(data);
      await base44.entities.OpportunityLog.create({
        opportunity_id: opp.id,
        message_type: 'note',
        message_content: `Opportunity created at stage: ${data.stage}`
      });
      return opp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, previousStage }) => {
      const opp = await base44.entities.Opportunity.update(id, data);
      if (previousStage !== data.stage) {
        await base44.entities.OpportunityLog.create({
          opportunity_id: id,
          message_type: 'stage_change',
          message_content: `Stage changed from ${previousStage} to ${data.stage}`,
          previous_stage: previousStage,
          new_stage: data.stage
        });
      }
      return opp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      resetForm();
    }
  });

  const convertToBookingMutation = useMutation({
    mutationFn: async (opportunity) => {
      const client = clients.find(c => c.id === opportunity.client_id);
      
      const bookingData = {
        ticket_number: `TKT-${Date.now()}`,
        yacht_id: opportunity.yacht_id,
        cruise_type: opportunity.opportunity_type === 'private' ? 'private' : 'shared',
        customer_name: client?.client_name || 'Unknown',
        customer_phone: client?.phone || '',
        customer_email: client?.email || '',
        number_of_people: (opportunity.adults || 0) + (opportunity.kids || 0),
        travel_date: opportunity.date_of_charter,
        booking_date: new Date().toISOString().split('T')[0],
        agent_id: opportunity.agent_id,
        other_charges: (opportunity.addons_total || 0),
        total_amount: opportunity.total_amount,
        discount_percentage: opportunity.agent_discount_percentage + opportunity.client_discount_percentage,
        net_amount: opportunity.total_amount,
        paid_amount: opportunity.advance_paid || 0,
        balance: opportunity.balance_amount || 0,
        status: 'confirmed',
        payment_status: opportunity.balance_amount > 0 ? 'partial' : 'paid',
        payment_mode: opportunity.payment_method,
        notes: `Converted from Opportunity: ${opportunity.opportunity_code}\n${opportunity.notes || ''}`
      };

      const booking = await base44.entities.Booking.create(bookingData);
      
      await base44.entities.Opportunity.update(opportunity.id, {
        stage: 'won',
        converted_booking_id: booking.id
      });

      await base44.entities.OpportunityLog.create({
        opportunity_id: opportunity.id,
        message_type: 'note',
        message_content: `Converted to Booking: ${booking.ticket_number}`
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['bookings']);
      setConvertDialogOpen(false);
      setConvertingOpp(null);
    }
  });

  const resetForm = () => {
    setEditingOpportunity(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (opp) => {
    setEditingOpportunity(opp);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data) => {
    if (editingOpportunity) {
      updateMutation.mutate({ 
        id: editingOpportunity.id, 
        data,
        previousStage: editingOpportunity.stage
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConvertToBooking = (opp) => {
    setConvertingOpp(opp);
    setConvertDialogOpen(true);
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.opportunity_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clients.find(c => c.id === opp.client_id)?.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || opp.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getClientName = (id) => clients.find(c => c.id === id)?.client_name || 'Unknown';
  const getYachtName = (id) => yachts.find(y => y.id === id)?.yacht_name || 'N/A';

  const stageColors = {
    new: 'bg-gray-100 text-gray-700',
    contacted: 'bg-blue-100 text-blue-700',
    quoted: 'bg-purple-100 text-purple-700',
    negotiation: 'bg-yellow-100 text-yellow-700',
    followup: 'bg-orange-100 text-orange-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700'
  };

  const totalValue = filteredOpportunities.reduce((sum, opp) => sum + (parseFloat(opp.total_amount) || 0), 0);
  const totalExpectedRevenue = filteredOpportunities.reduce((sum, opp) => sum + (parseFloat(opp.expected_revenue) || 0), 0);
  const wonCount = opportunities.filter(o => o.stage === 'won').length;
  const lostCount = opportunities.filter(o => o.stage === 'lost').length;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Opportunity Management</h1>
            <p className="text-gray-600">Track and manage charter opportunities</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Opportunity
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Total Opportunities</p>
              <p className="text-2xl font-bold">{filteredOpportunities.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-blue-600 flex items-center gap-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
                {totalValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Expected Revenue</p>
              <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
                {totalExpectedRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Won / Lost</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xl font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-5 h-5" /> {wonCount}
                </span>
                <span className="text-xl font-bold text-red-600 flex items-center gap-1">
                  <XCircle className="w-5 h-5" /> {lostCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by code or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'pipeline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('pipeline')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'pipeline' ? (
          <OpportunityPipeline
            opportunities={filteredOpportunities}
            clients={clients}
            yachts={yachts}
            onViewOpportunity={handleEdit}
          />
        ) : (
          <Card className="border-none shadow-lg">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="whitespace-nowrap">Code</TableHead>
                    <TableHead className="whitespace-nowrap">Client</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Yacht</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Total</TableHead>
                    <TableHead className="whitespace-nowrap">Expected</TableHead>
                    <TableHead className="whitespace-nowrap">Stage</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((opp) => (
                    <TableRow key={opp.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium whitespace-nowrap">{opp.opportunity_code}</TableCell>
                      <TableCell className="whitespace-nowrap">{getClientName(opp.client_id)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className="capitalize">{opp.opportunity_type}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{getYachtName(opp.yacht_id)}</TableCell>
                      <TableCell className="whitespace-nowrap">{opp.date_of_charter || 'Not set'}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                        {opp.total_amount}
                      </TableCell>
                      <TableCell className="text-green-600 font-semibold whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                          {opp.expected_revenue}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={stageColors[opp.stage]}>{opp.stage}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(opp)}>
                            Edit
                          </Button>
                          {opp.stage !== 'won' && opp.stage !== 'lost' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleConvertToBooking(opp)}
                            >
                              Convert
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOpportunity ? 'Edit Opportunity' : 'New Opportunity'}</DialogTitle>
            </DialogHeader>
            <OpportunityForm
              opportunity={editingOpportunity}
              onSubmit={handleSubmit}
              onCancel={resetForm}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert to Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to convert this opportunity to a confirmed booking?</p>
              {convertingOpp && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold">{convertingOpp.opportunity_code}</p>
                  <p className="text-sm text-gray-600">Client: {getClientName(convertingOpp.client_id)}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    Total: 
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                    {convertingOpp.total_amount}
                  </p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => convertToBookingMutation.mutate(convertingOpp)}
                >
                  Confirm Conversion
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}