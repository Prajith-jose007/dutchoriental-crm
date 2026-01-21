import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function PrivateBookings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    ticket_number: '',
    yacht_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    number_of_people: '',
    travel_date: '',
    booking_date: new Date().toISOString().split('T')[0],
    agent_id: '',
    free_tickets: '0',
    other_charges: '0',
    upgrade_from: '',
    upgrade_to: '',
    upgrade_cost: '0',
    upgrade_members: '',
    total_amount: '0',
    discount_percentage: '0',
    net_amount: '0',
    paid_amount: '0',
    balance: '0',
    status: 'confirmed',
    payment_status: 'unpaid',
    payment_mode: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['privateBookings'],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.list('-created_date');
      return allBookings.filter(b => b.cruise_type === 'private');
    }
  });

  const { data: yachts = [] } = useQuery({
    queryKey: ['yachts'],
    queryFn: async () => {
      const allYachts = await base44.entities.Yacht.list();
      return allYachts.filter(y => y.cruise_type === 'private');
    }
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['privateBookings']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['privateBookings']);
      resetForm();
    }
  });

  useEffect(() => {
    const total = parseFloat(formData.total_amount) || 0;
    const discountPct = parseFloat(formData.discount_percentage) || 0;
    const net = total - (total * discountPct / 100);
    const paid = parseFloat(formData.paid_amount) || 0;
    const bal = net - paid;
    
    setFormData(prev => ({
      ...prev,
      net_amount: net.toFixed(2),
      balance: bal.toFixed(2)
    }));
  }, [formData.total_amount, formData.discount_percentage, formData.paid_amount]);

  const resetForm = () => {
    setFormData({
      ticket_number: '',
      yacht_id: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      number_of_people: '',
      travel_date: '',
      booking_date: new Date().toISOString().split('T')[0],
      agent_id: '',
      free_tickets: '0',
      other_charges: '0',
      upgrade_from: '',
      upgrade_to: '',
      upgrade_cost: '0',
      upgrade_members: '',
      total_amount: '0',
      discount_percentage: '0',
      net_amount: '0',
      paid_amount: '0',
      balance: '0',
      status: 'confirmed',
      payment_status: 'unpaid',
      payment_mode: '',
      notes: ''
    });
    setEditingBooking(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      cruise_type: 'private',
      number_of_people: parseInt(formData.number_of_people) || 0,
      free_tickets: parseInt(formData.free_tickets) || 0,
      other_charges: parseFloat(formData.other_charges) || 0,
      upgrade_cost: parseFloat(formData.upgrade_cost) || 0,
      total_amount: parseFloat(formData.total_amount) || 0,
      discount_percentage: parseFloat(formData.discount_percentage) || 0,
      net_amount: parseFloat(formData.net_amount) || 0,
      paid_amount: parseFloat(formData.paid_amount) || 0,
      balance: parseFloat(formData.balance) || 0
    };

    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      ticket_number: booking.ticket_number,
      yacht_id: booking.yacht_id,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email || '',
      number_of_people: booking.number_of_people?.toString() || '',
      travel_date: booking.travel_date,
      booking_date: booking.booking_date,
      agent_id: booking.agent_id || '',
      free_tickets: booking.free_tickets?.toString() || '0',
      other_charges: booking.other_charges?.toString() || '0',
      upgrade_from: booking.upgrade_from || '',
      upgrade_to: booking.upgrade_to || '',
      upgrade_cost: booking.upgrade_cost?.toString() || '0',
      upgrade_members: booking.upgrade_members || '',
      total_amount: booking.total_amount?.toString() || '0',
      discount_percentage: booking.discount_percentage?.toString() || '0',
      net_amount: booking.net_amount?.toString() || '0',
      paid_amount: booking.paid_amount?.toString() || '0',
      balance: booking.balance?.toString() || '0',
      status: booking.status,
      payment_status: booking.payment_status,
      payment_mode: booking.payment_mode || '',
      notes: booking.notes || ''
    });
    setIsDialogOpen(true);
  };

  const getYachtName = (id) => yachts.find(y => y.id === id)?.yacht_name || 'N/A';

  const statusColors = {
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700'
  };

  const paymentStatusColors = {
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    unpaid: 'bg-red-100 text-red-700'
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Private Bookings</h1>
            <p className="text-gray-600">Manage private yacht bookings</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Yacht</TableHead>
                    <TableHead>Travel Date</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{booking.ticket_number}</TableCell>
                      <TableCell>{booking.customer_name}</TableCell>
                      <TableCell>{getYachtName(booking.yacht_id)}</TableCell>
                      <TableCell>{booking.travel_date}</TableCell>
                      <TableCell>{booking.number_of_people}</TableCell>
                      <TableCell className="font-semibold">${booking.net_amount}</TableCell>
                      <TableCell>${booking.paid_amount}</TableCell>
                      <TableCell className={booking.balance > 0 ? 'text-red-600 font-semibold' : ''}>
                        ${booking.balance}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[booking.payment_status]}>
                          {booking.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(booking)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {bookings.length === 0 && (
              <div className="text-center py-20">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No private bookings yet</h3>
                <p className="text-gray-500">Create your first private booking</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBooking ? 'Edit Booking' : 'New Private Booking'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Ticket Number *</Label>
                  <Input value={formData.ticket_number} onChange={(e) => setFormData({...formData, ticket_number: e.target.value})} required />
                </div>
                <div>
                  <Label>Yacht *</Label>
                  <Select value={formData.yacht_id} onValueChange={(value) => setFormData({...formData, yacht_id: value})}>
                    <SelectTrigger><SelectValue placeholder="Select yacht" /></SelectTrigger>
                    <SelectContent>
                      {yachts.map((yacht) => (
                        <SelectItem key={yacht.id} value={yacht.id}>{yacht.yacht_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of People *</Label>
                  <Input type="number" value={formData.number_of_people} onChange={(e) => setFormData({...formData, number_of_people: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} required />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.customer_email} onChange={(e) => setFormData({...formData, customer_email: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Travel Date *</Label>
                  <Input type="date" value={formData.travel_date} onChange={(e) => setFormData({...formData, travel_date: e.target.value})} required />
                </div>
                <div>
                  <Label>Booking Date</Label>
                  <Input type="date" value={formData.booking_date} onChange={(e) => setFormData({...formData, booking_date: e.target.value})} />
                </div>
                <div>
                  <Label>Agent (Optional)</Label>
                  <Select value={formData.agent_id} onValueChange={(value) => setFormData({...formData, agent_id: value})}>
                    <SelectTrigger><SelectValue placeholder="Direct" /></SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.agent_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Free Tickets</Label>
                  <Input type="number" value={formData.free_tickets} onChange={(e) => setFormData({...formData, free_tickets: e.target.value})} />
                </div>
                <div>
                  <Label>Other Charges</Label>
                  <Input type="number" step="0.01" value={formData.other_charges} onChange={(e) => setFormData({...formData, other_charges: e.target.value})} />
                </div>
                <div>
                  <Label>Total Amount *</Label>
                  <Input type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Discount %</Label>
                  <Input type="number" step="0.01" value={formData.discount_percentage} onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})} />
                </div>
                <div>
                  <Label>Net Amount</Label>
                  <Input type="number" step="0.01" value={formData.net_amount} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Paid Amount</Label>
                  <Input type="number" step="0.01" value={formData.paid_amount} onChange={(e) => setFormData({...formData, paid_amount: e.target.value})} />
                </div>
                <div>
                  <Label>Balance</Label>
                  <Input type="number" step="0.01" value={formData.balance} readOnly className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select value={formData.payment_status} onValueChange={(value) => setFormData({...formData, payment_status: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select value={formData.payment_mode} onValueChange={(value) => setFormData({...formData, payment_mode: value})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingBooking ? 'Update' : 'Create'} Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}