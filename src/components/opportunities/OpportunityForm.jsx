import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function OpportunityForm({ opportunity, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    opportunity_code: opportunity?.opportunity_code || `OPC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    opportunity_type: opportunity?.opportunity_type || 'private',
    lead_source: opportunity?.lead_source || 'website',
    stage: opportunity?.stage || 'new',
    client_id: opportunity?.client_id || '',
    agent_id: opportunity?.agent_id || '',
    agent_discount_percentage: opportunity?.agent_discount_percentage || 0,
    client_discount_percentage: opportunity?.client_discount_percentage || 0,
    yacht_id: opportunity?.yacht_id || '',
    package_name: opportunity?.package_name || '',
    adults: opportunity?.adults || 0,
    kids: opportunity?.kids || 0,
    vip_guests: opportunity?.vip_guests || 0,
    date_of_charter: opportunity?.date_of_charter || '',
    time_slot: opportunity?.time_slot || '',
    duration_hours: opportunity?.duration_hours || 2,
    route: opportunity?.route || '',
    base_price: opportunity?.base_price || 0,
    vip_cost: opportunity?.vip_cost || 0,
    alcohol_cost: opportunity?.alcohol_cost || 0,
    catering_cost: opportunity?.catering_cost || 0,
    extra_hour_cost: opportunity?.extra_hour_cost || 0,
    addons_total: opportunity?.addons_total || 0,
    vat_percentage: opportunity?.vat_percentage || 5,
    probability_percentage: opportunity?.probability_percentage || 50,
    advance_paid: opportunity?.advance_paid || 0,
    payment_method: opportunity?.payment_method || '',
    payment_due_date: opportunity?.payment_due_date || '',
    followup_date: opportunity?.followup_date || '',
    notes: opportunity?.notes || '',
    lost_reason: opportunity?.lost_reason || ''
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: yachts = [] } = useQuery({
    queryKey: ['yachts'],
    queryFn: () => base44.entities.Yacht.list()
  });

  useEffect(() => {
    const base = parseFloat(formData.base_price) || 0;
    const vipCost = parseFloat(formData.vip_cost) || 0;
    const alcoholCost = parseFloat(formData.alcohol_cost) || 0;
    const cateringCost = parseFloat(formData.catering_cost) || 0;
    const extraHourCost = parseFloat(formData.extra_hour_cost) || 0;
    const addons = parseFloat(formData.addons_total) || 0;
    
    const agentDisc = parseFloat(formData.agent_discount_percentage) || 0;
    const clientDisc = parseFloat(formData.client_discount_percentage) || 0;
    
    const totalBeforeDiscount = base + vipCost + alcoholCost + cateringCost + extraHourCost + addons;
    const agentDiscAmount = (totalBeforeDiscount * agentDisc) / 100;
    const clientDiscAmount = (totalBeforeDiscount * clientDisc) / 100;
    
    const subtotal = totalBeforeDiscount - agentDiscAmount - clientDiscAmount;
    const vatAmount = (subtotal * formData.vat_percentage) / 100;
    const total = subtotal + vatAmount;
    
    const advancePaid = parseFloat(formData.advance_paid) || 0;
    const balance = total - advancePaid;
    
    const probability = parseFloat(formData.probability_percentage) || 0;
    const expectedRevenue = (total * probability) / 100;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      vat_amount: vatAmount.toFixed(2),
      total_amount: total.toFixed(2),
      balance_amount: balance.toFixed(2),
      expected_revenue: expectedRevenue.toFixed(2)
    }));
  }, [
    formData.base_price, formData.vip_cost, formData.alcohol_cost, formData.catering_cost,
    formData.extra_hour_cost, formData.addons_total, formData.agent_discount_percentage,
    formData.client_discount_percentage, formData.vat_percentage, formData.advance_paid,
    formData.probability_percentage
  ]);

  useEffect(() => {
    if (formData.agent_id) {
      const agent = agents.find(a => a.id === formData.agent_id);
      if (agent) {
        setFormData(prev => ({
          ...prev,
          agent_discount_percentage: agent.commission_percentage || 0
        }));
      }
    }
  }, [formData.agent_id, agents]);

  useEffect(() => {
    if (formData.client_id) {
      const client = clients.find(c => c.id === formData.client_id);
      if (client) {
        setFormData(prev => ({
          ...prev,
          client_discount_percentage: client.discount_percentage || 0
        }));
      }
    }
  }, [formData.client_id, clients]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      adults: parseInt(formData.adults) || 0,
      kids: parseInt(formData.kids) || 0,
      vip_guests: parseInt(formData.vip_guests) || 0,
      duration_hours: parseFloat(formData.duration_hours) || 0,
      base_price: parseFloat(formData.base_price) || 0,
      vip_cost: parseFloat(formData.vip_cost) || 0,
      alcohol_cost: parseFloat(formData.alcohol_cost) || 0,
      catering_cost: parseFloat(formData.catering_cost) || 0,
      extra_hour_cost: parseFloat(formData.extra_hour_cost) || 0,
      addons_total: parseFloat(formData.addons_total) || 0,
      agent_discount_percentage: parseFloat(formData.agent_discount_percentage) || 0,
      client_discount_percentage: parseFloat(formData.client_discount_percentage) || 0,
      vat_percentage: parseFloat(formData.vat_percentage) || 0,
      subtotal: parseFloat(formData.subtotal) || 0,
      vat_amount: parseFloat(formData.vat_amount) || 0,
      total_amount: parseFloat(formData.total_amount) || 0,
      expected_revenue: parseFloat(formData.expected_revenue) || 0,
      probability_percentage: parseFloat(formData.probability_percentage) || 0,
      advance_paid: parseFloat(formData.advance_paid) || 0,
      balance_amount: parseFloat(formData.balance_amount) || 0
    };
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Opportunity Code *</Label>
              <Input value={formData.opportunity_code} onChange={(e) => setFormData({...formData, opportunity_code: e.target.value})} required />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={formData.opportunity_type} onValueChange={(value) => setFormData({...formData, opportunity_type: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead Source *</Label>
              <Select value={formData.lead_source} onValueChange={(value) => setFormData({...formData, lead_source: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="repeat">Repeat Client</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.client_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agent (Optional)</Label>
              <Select value={formData.agent_id} onValueChange={(value) => setFormData({...formData, agent_id: value})}>
                <SelectTrigger><SelectValue placeholder="Direct booking" /></SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.agent_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stage *</Label>
              <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Probability %</Label>
              <Input type="number" step="1" value={formData.probability_percentage} onChange={(e) => setFormData({...formData, probability_percentage: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Charter Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Yacht *</Label>
              <Select value={formData.yacht_id} onValueChange={(value) => setFormData({...formData, yacht_id: value})}>
                <SelectTrigger><SelectValue placeholder="Select yacht" /></SelectTrigger>
                <SelectContent>
                  {yachts.map(yacht => (
                    <SelectItem key={yacht.id} value={yacht.id}>{yacht.yacht_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Package Name</Label>
              <Input value={formData.package_name} onChange={(e) => setFormData({...formData, package_name: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Adults</Label>
              <Input type="number" value={formData.adults} onChange={(e) => setFormData({...formData, adults: e.target.value})} />
            </div>
            <div>
              <Label>Kids</Label>
              <Input type="number" value={formData.kids} onChange={(e) => setFormData({...formData, kids: e.target.value})} />
            </div>
            <div>
              <Label>VIP Guests</Label>
              <Input type="number" value={formData.vip_guests} onChange={(e) => setFormData({...formData, vip_guests: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Date of Charter</Label>
              <Input type="date" value={formData.date_of_charter} onChange={(e) => setFormData({...formData, date_of_charter: e.target.value})} />
            </div>
            <div>
              <Label>Time Slot</Label>
              <Input type="time" value={formData.time_slot} onChange={(e) => setFormData({...formData, time_slot: e.target.value})} />
            </div>
            <div>
              <Label>Duration (Hours)</Label>
              <Input type="number" step="0.5" value={formData.duration_hours} onChange={(e) => setFormData({...formData, duration_hours: e.target.value})} />
            </div>
          </div>

          <div>
            <Label>Route/Destination</Label>
            <Input value={formData.route} onChange={(e) => setFormData({...formData, route: e.target.value})} placeholder="e.g., Dubai Marina to Atlantis" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Base Price</Label>
              <Input type="number" step="0.01" value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})} />
            </div>
            <div>
              <Label>VIP Cost</Label>
              <Input type="number" step="0.01" value={formData.vip_cost} onChange={(e) => setFormData({...formData, vip_cost: e.target.value})} />
            </div>
            <div>
              <Label>Alcohol Cost</Label>
              <Input type="number" step="0.01" value={formData.alcohol_cost} onChange={(e) => setFormData({...formData, alcohol_cost: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Catering Cost</Label>
              <Input type="number" step="0.01" value={formData.catering_cost} onChange={(e) => setFormData({...formData, catering_cost: e.target.value})} />
            </div>
            <div>
              <Label>Extra Hour Cost</Label>
              <Input type="number" step="0.01" value={formData.extra_hour_cost} onChange={(e) => setFormData({...formData, extra_hour_cost: e.target.value})} />
            </div>
            <div>
              <Label>Add-ons Total</Label>
              <Input type="number" step="0.01" value={formData.addons_total} onChange={(e) => setFormData({...formData, addons_total: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Agent Discount %</Label>
              <Input type="number" step="0.01" value={formData.agent_discount_percentage} onChange={(e) => setFormData({...formData, agent_discount_percentage: e.target.value})} />
            </div>
            <div>
              <Label>Client Discount %</Label>
              <Input type="number" step="0.01" value={formData.client_discount_percentage} onChange={(e) => setFormData({...formData, client_discount_percentage: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
            <div>
              <Label className="text-sm">Subtotal</Label>
              <div className="bg-white p-2 rounded font-bold flex items-center gap-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                {formData.subtotal}
              </div>
            </div>
            <div>
              <Label className="text-sm">VAT ({formData.vat_percentage}%)</Label>
              <div className="bg-white p-2 rounded flex items-center gap-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                {formData.vat_amount}
              </div>
            </div>
            <div>
              <Label className="text-sm">Total Amount</Label>
              <div className="bg-white p-2 rounded font-bold text-lg flex items-center gap-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-4 h-4 inline-block" />
                {formData.total_amount}
              </div>
            </div>
            <div>
              <Label className="text-sm">Expected Revenue</Label>
              <div className="bg-white p-2 rounded text-green-700 font-bold flex items-center gap-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                {formData.expected_revenue}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Advance Paid</Label>
              <Input type="number" step="0.01" value={formData.advance_paid} onChange={(e) => setFormData({...formData, advance_paid: e.target.value})} />
            </div>
            <div>
              <Label>Balance</Label>
              <div className="bg-gray-50 p-2 rounded font-bold flex items-center gap-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                {formData.balance_amount}
              </div>
            </div>
            <div>
              <Label>Payment Due Date</Label>
              <Input type="date" value={formData.payment_due_date} onChange={(e) => setFormData({...formData, payment_due_date: e.target.value})} />
            </div>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CRM & Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Follow-up Date</Label>
            <Input type="date" value={formData.followup_date} onChange={(e) => setFormData({...formData, followup_date: e.target.value})} />
          </div>

          {formData.stage === 'lost' && (
            <div>
              <Label>Lost Reason</Label>
              <Textarea value={formData.lost_reason} onChange={(e) => setFormData({...formData, lost_reason: e.target.value})} rows={3} />
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {opportunity ? 'Update' : 'Create'} Opportunity
        </Button>
      </div>
    </form>
  );
}