import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Pencil, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function SharedBookings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    ticket_number: `TKT-${Date.now()}`,
    customer_name: '',
    booking_date: new Date().toISOString().split('T')[0],
    travel_date: '',
    yacht_id: '',
    yacht_type: 'shared',
    agent_id: '',
    booking_status: 'confirmed',
    payment_status: 'cash',
    guests: {
      adult: 0,
      child: 0,
      alcohol_adult: 0,
      top_deck_child: 0,
      top_deck_adult: 0,
      top_deck_adult_alcohol: 0,
      child_vip: 0,
      adult_vip: 0,
      adult_alcohol_vip: 0,
      royal_child: 0,
      royal_adult: 0,
      royal_adult_alcohol: 0
    },
    total_amount: '',
    agent_discount_percentage: '0',
    commission_amount: '0',
    net_amount: '',
    paid_amount: '0',
    balance: '',
    free_tickets: '0',
    additional_expenses: '0',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['sharedBookings'],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.list('-created_date');
      return allBookings.filter(b => b.cruise_type === 'shared');
    }
  });

  const { data: yachts = [] } = useQuery({
    queryKey: ['yachts'],
    queryFn: () => base44.entities.Yacht.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const selectedYacht = yachts.find(y => y.id === formData.yacht_id);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sharedBookings']);
      queryClient.invalidateQueries(['bookings']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sharedBookings']);
      queryClient.invalidateQueries(['bookings']);
      resetForm();
    }
  });

  // Auto-calculate total based on guest types and yacht pricing
  useEffect(() => {
    if (selectedYacht?.shared_packages) {
      const packages = selectedYacht.shared_packages;
      let calculatedTotal = 0;
      
      Object.keys(formData.guests).forEach(guestType => {
        const qty = parseInt(formData.guests[guestType]) || 0;
        const price = parseFloat(packages[guestType]) || 0;
        calculatedTotal += qty * price;
      });

      setFormData(prev => ({
        ...prev,
        total_amount: calculatedTotal.toFixed(2)
      }));
    }
  }, [formData.guests, selectedYacht]);

  // Auto-calculate commission, net and balance
  useEffect(() => {
    const total = parseFloat(formData.total_amount) || 0;
    const discountPercentage = parseFloat(formData.agent_discount_percentage) || 0;
    const paid = parseFloat(formData.paid_amount) || 0;

    const commissionAmount = (total * discountPercentage) / 100;
    const netAmount = total - commissionAmount;
    const balance = netAmount - paid;

    setFormData(prev => ({
      ...prev,
      commission_amount: commissionAmount.toFixed(2),
      net_amount: netAmount.toFixed(2),
      balance: balance.toFixed(2)
    }));
  }, [formData.total_amount, formData.agent_discount_percentage, formData.paid_amount]);

  const resetForm = () => {
    setFormData({
      ticket_number: `TKT-${Date.now()}`,
      customer_name: '',
      booking_date: new Date().toISOString().split('T')[0],
      travel_date: '',
      yacht_id: '',
      yacht_type: 'shared',
      agent_id: '',
      booking_status: 'confirmed',
      payment_status: 'cash',
      guests: {
        adult: 0,
        child: 0,
        alcohol_adult: 0,
        top_deck_child: 0,
        top_deck_adult: 0,
        top_deck_adult_alcohol: 0,
        child_vip: 0,
        adult_vip: 0,
        adult_alcohol_vip: 0,
        royal_child: 0,
        royal_adult: 0,
        royal_adult_alcohol: 0
      },
      total_amount: '',
      agent_discount_percentage: '0',
      commission_amount: '0',
      net_amount: '',
      paid_amount: '0',
      balance: '',
      free_tickets: '0',
      additional_expenses: '0',
      notes: ''
    });
    setEditingBooking(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const totalGuests = Object.values(formData.guests).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
    
    const data = {
      ticket_number: formData.ticket_number,
      customer_name: formData.customer_name,
      booking_date: formData.booking_date,
      travel_date: formData.travel_date,
      yacht_id: formData.yacht_id,
      cruise_type: formData.yacht_type,
      package_type: JSON.stringify(formData.guests),
      agent_id: formData.agent_id || null,
      status: formData.booking_status,
      payment_mode: formData.payment_status,
      number_of_people: totalGuests,
      total_amount: parseFloat(formData.total_amount) || 0,
      discount_percentage: parseFloat(formData.agent_discount_percentage) || 0,
      net_amount: parseFloat(formData.net_amount) || 0,
      paid_amount: parseFloat(formData.paid_amount) || 0,
      balance: parseFloat(formData.balance) || 0,
      free_tickets: parseInt(formData.free_tickets) || 0,
      other_charges: parseFloat(formData.additional_expenses) || 0,
      notes: formData.notes,
      payment_status: parseFloat(formData.balance) <= 0 ? 'paid' : parseFloat(formData.paid_amount) > 0 ? 'partial' : 'unpaid'
    };

    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleViewBooking = (booking) => {
    setViewingBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleDownloadReport = (booking) => {
    let guests = { adult: 0, child: 0, alcohol_adult: 0, top_deck_child: 0, top_deck_adult: 0, top_deck_adult_alcohol: 0, child_vip: 0, adult_vip: 0, adult_alcohol_vip: 0, royal_child: 0, royal_adult: 0, royal_adult_alcohol: 0 };
    try {
      if (booking.package_type) guests = JSON.parse(booking.package_type);
    } catch (e) {}

    const reportContent = `
SHARED BOOKING REPORT
=====================================================

Ticket Number: ${booking.ticket_number}
Booking Date: ${booking.booking_date}
Travel Date: ${booking.travel_date}

CLIENT INFORMATION
-----------------------------------------------------
Client Name: ${booking.customer_name}
Phone: ${booking.customer_phone || 'N/A'}
Email: ${booking.customer_email || 'N/A'}

BOOKING DETAILS
-----------------------------------------------------
Yacht: ${getYachtName(booking.yacht_id)}
Agent: ${getAgentName(booking.agent_id)}
Total Guests: ${booking.number_of_people}

GUEST BREAKDOWN
-----------------------------------------------------
Child: ${guests.child}
Adult: ${guests.adult}
Adult with Alcohol: ${guests.alcohol_adult}
Top Deck Child: ${guests.top_deck_child}
Top Deck Adult: ${guests.top_deck_adult}
Top Deck Adult with Alcohol: ${guests.top_deck_adult_alcohol}
VIP Child: ${guests.child_vip}
VIP Adult: ${guests.adult_vip}
VIP Adult with Alcohol: ${guests.adult_alcohol_vip}
Royal Child: ${guests.royal_child}
Royal Adult: ${guests.royal_adult}
Royal Adult with Alcohol: ${guests.royal_adult_alcohol}

PAYMENT DETAILS
-----------------------------------------------------
Total Amount: AED ${booking.total_amount}
Discount: ${booking.discount_percentage || 0}%
Free Tickets: ${booking.free_tickets || 0}
Additional Charges: AED ${booking.other_charges || 0}
Net Amount: AED ${booking.net_amount}
Paid Amount: AED ${booking.paid_amount}
Balance: AED ${booking.balance}
Payment Status: ${booking.payment_status || 'Unpaid'}
Payment Mode: ${booking.payment_mode || 'N/A'}

STATUS
-----------------------------------------------------
Booking Status: ${booking.status}

NOTES
-----------------------------------------------------
${booking.notes || 'No notes'}

SYSTEM INFORMATION
-----------------------------------------------------
Created By: ${booking.created_by}
Created Date: ${booking.created_date}
Updated Date: ${booking.updated_date}

=====================================================
Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking_report_${booking.ticket_number}.txt`;
    a.click();
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    
    let guestData = {
      adult: 0,
      child: 0,
      alcohol_adult: 0,
      top_deck_child: 0,
      top_deck_adult: 0,
      top_deck_adult_alcohol: 0,
      child_vip: 0,
      adult_vip: 0,
      adult_alcohol_vip: 0,
      royal_child: 0,
      royal_adult: 0,
      royal_adult_alcohol: 0
    };
    
    try {
      if (booking.package_type) {
        guestData = JSON.parse(booking.package_type);
      }
    } catch (e) {
      // If parsing fails, keep default
    }
    
    setFormData({
      ticket_number: booking.ticket_number || '',
      customer_name: booking.customer_name || '',
      booking_date: booking.booking_date || '',
      travel_date: booking.travel_date || '',
      yacht_id: booking.yacht_id || '',
      yacht_type: booking.cruise_type || 'shared',
      agent_id: booking.agent_id || '',
      booking_status: booking.status || 'confirmed',
      payment_status: booking.payment_mode || 'cash',
      guests: guestData,
      total_amount: (booking.total_amount || 0).toString(),
      agent_discount_percentage: (booking.discount_percentage || 0).toString(),
      commission_amount: (((booking.total_amount || 0) * (booking.discount_percentage || 0)) / 100).toFixed(2),
      net_amount: (booking.net_amount || 0).toString(),
      paid_amount: (booking.paid_amount || 0).toString(),
      balance: (booking.balance || 0).toString(),
      free_tickets: (booking.free_tickets || 0).toString(),
      additional_expenses: (booking.other_charges || 0).toString(),
      notes: booking.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleGuestChange = (guestType, value) => {
    setFormData({
      ...formData,
      guests: {
        ...formData.guests,
        [guestType]: value
      }
    });
  };

  const getYachtName = (id) => yachts.find(y => y.id === id)?.yacht_name || 'N/A';
  const getAgentName = (id) => agents.find(a => a.id === id)?.agent_name || 'Direct';

  const handleExport = () => {
    const csvContent = [
      ['Ticket', 'Client', 'Travel Date', 'Date of Booking', 'Yacht', 'Agent', 'Total Guest', 'Child', 'Adult', 'Adult Alc', 'Top Child', 'Top Adult', 'Top Alc Adult', 'VIP Child', 'VIP Adult', 'VIP Adult Alc', 'Royal Child', 'Royal Adult', 'Royal Adult Alc', 'Total', 'Rate', 'Free', 'Additional', 'Net', 'Discount', 'Commission', 'Balance', 'Paid', 'Notes', 'Update Date', 'User Details'],
      ...bookings.map(b => {
        let guests = { adult: 0, child: 0, alcohol_adult: 0, top_deck_child: 0, top_deck_adult: 0, top_deck_adult_alcohol: 0, child_vip: 0, adult_vip: 0, adult_alcohol_vip: 0, royal_child: 0, royal_adult: 0, royal_adult_alcohol: 0 };
        try {
          if (b.package_type) guests = JSON.parse(b.package_type);
        } catch (e) {}
        
        return [
          b.ticket_number || '',
          b.customer_name || '',
          b.travel_date || '',
          b.booking_date || '',
          getYachtName(b.yacht_id),
          getAgentName(b.agent_id),
          b.number_of_people || 0,
          guests.child || 0,
          guests.adult || 0,
          guests.alcohol_adult || 0,
          guests.top_deck_child || 0,
          guests.top_deck_adult || 0,
          guests.top_deck_adult_alcohol || 0,
          guests.child_vip || 0,
          guests.adult_vip || 0,
          guests.adult_alcohol_vip || 0,
          guests.royal_child || 0,
          guests.royal_adult || 0,
          guests.royal_adult_alcohol || 0,
          b.total_amount || 0,
          b.discount_percentage || 0,
          b.free_tickets || 0,
          b.other_charges || 0,
          b.net_amount || 0,
          b.discount_percentage || 0,
          b.discount_percentage || 0,
          b.balance || 0,
          b.paid_amount || 0,
          b.notes || '',
          b.updated_date || '',
          b.created_by || ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shared_bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split('\n').slice(1);
    
    for (const row of rows) {
      if (!row.trim()) continue;
      
      const cols = row.split(',');
      const [ticket_number, customer_name, travel_date, booking_date, yachtName, agentName, total_guests, child, adult, adult_alc, top_child, top_adult, top_alc_adult, vip_child, vip_adult, vip_adult_alc, royal_child, royal_adult, royal_adult_alc, total, rate, free, additional, net, discount, commission, balance, paid, notes] = cols;
      
      const yacht = yachts.find(y => y.yacht_name === yachtName?.trim());
      if (!yacht) continue;
      
      const agent = agents.find(a => a.agent_name === agentName?.trim());
      
      const guestData = {
        adult: parseInt(adult) || 0,
        child: parseInt(child) || 0,
        alcohol_adult: parseInt(adult_alc) || 0,
        top_deck_child: parseInt(top_child) || 0,
        top_deck_adult: parseInt(top_adult) || 0,
        top_deck_adult_alcohol: parseInt(top_alc_adult) || 0,
        child_vip: parseInt(vip_child) || 0,
        adult_vip: parseInt(vip_adult) || 0,
        adult_alcohol_vip: parseInt(vip_adult_alc) || 0,
        royal_child: parseInt(royal_child) || 0,
        royal_adult: parseInt(royal_adult) || 0,
        royal_adult_alcohol: parseInt(royal_adult_alc) || 0
      };

      const data = {
        ticket_number: ticket_number?.trim(),
        customer_name: customer_name?.trim(),
        travel_date: travel_date?.trim(),
        booking_date: booking_date?.trim() || new Date().toISOString().split('T')[0],
        yacht_id: yacht.id,
        agent_id: agent?.id || null,
        cruise_type: 'shared',
        package_type: JSON.stringify(guestData),
        number_of_people: parseInt(total_guests) || 0,
        total_amount: parseFloat(total) || 0,
        discount_percentage: parseFloat(discount) || 0,
        free_tickets: parseInt(free) || 0,
        other_charges: parseFloat(additional) || 0,
        net_amount: parseFloat(net) || 0,
        balance: parseFloat(balance) || 0,
        paid_amount: parseFloat(paid) || 0,
        status: 'confirmed',
        notes: notes?.trim() || '',
        payment_status: parseFloat(balance) <= 0 ? 'paid' : parseFloat(paid) > 0 ? 'partial' : 'unpaid'
      };

      await base44.entities.Booking.create(data);
    }
    
    queryClient.invalidateQueries(['sharedBookings']);
    e.target.value = '';
  };

  const statusColors = {
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700'
  };

  const guestCategories = [
    { key: 'adult', label: 'Adult' },
    { key: 'child', label: 'Child' },
    { key: 'alcohol_adult', label: 'Alcohol Adult' },
    { key: 'top_deck_child', label: 'Top Deck Child' },
    { key: 'top_deck_adult', label: 'Top Deck Adult' },
    { key: 'top_deck_adult_alcohol', label: 'Top Deck Adult (Alcohol)' },
    { key: 'child_vip', label: 'VIP Child' },
    { key: 'adult_vip', label: 'VIP Adult' },
    { key: 'adult_alcohol_vip', label: 'VIP Adult (Alcohol)' },
    { key: 'royal_child', label: 'Royal Child' },
    { key: 'royal_adult', label: 'Royal Adult' },
    { key: 'royal_adult_alcohol', label: 'Royal Adult (Alcohol)' }
  ];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared Bookings</h1>
            <p className="text-gray-600">Manage shared yacht bookings</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <label>
              <Button
                type="button"
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => document.getElementById('import-bookings-file').click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                id="import-bookings-file"
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Travel Date</TableHead>
                  <TableHead>Yacht</TableHead>
                  <TableHead className="text-center">Guests</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handleViewBooking(booking)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {booking.ticket_number}
                      </button>
                    </TableCell>
                    <TableCell>{booking.customer_name || 'N/A'}</TableCell>
                    <TableCell>{booking.travel_date || 'N/A'}</TableCell>
                    <TableCell>{getYachtName(booking.yacht_id)}</TableCell>
                    <TableCell className="text-center">{booking.number_of_people || 0}</TableCell>
                    <TableCell className="font-semibold text-right">
                      <span className="inline-flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3" />
                        {booking.total_amount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-right">
                      <span className="inline-flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3" />
                        {booking.net_amount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-right text-green-700">
                      <span className="inline-flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3" />
                        {booking.paid_amount || 0}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-right">
                      <span className="inline-flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3" />
                        {booking.balance || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
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
            {bookings.length === 0 && (
              <div className="text-center py-20">
                <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No shared bookings yet</h3>
                <p className="text-gray-500">Create your first shared booking</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBooking ? 'Edit Booking' : 'New Shared Booking'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Basic Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Ticket Number *</Label>
                      <Input
                        value={formData.ticket_number}
                        onChange={(e) => setFormData({...formData, ticket_number: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Client Name *</Label>
                      <Input
                        value={formData.customer_name}
                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Date of Booking *</Label>
                      <Input
                        type="date"
                        value={formData.booking_date}
                        onChange={(e) => setFormData({...formData, booking_date: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Travel Date *</Label>
                      <Input
                        type="date"
                        value={formData.travel_date}
                        onChange={(e) => setFormData({...formData, travel_date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label>Type of Yacht *</Label>
                      <Select value={formData.yacht_type} onValueChange={(value) => setFormData({...formData, yacht_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shared">Shared</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="sunset">Sunset</SelectItem>
                          <SelectItem value="new_year">New Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Agent</Label>
                      <Select value={formData.agent_id} onValueChange={(value) => setFormData({...formData, agent_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Direct booking" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.agent_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Yacht Selection */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Yacht Selection</h3>
                  <div>
                    <Label>Yacht *</Label>
                    <Select value={formData.yacht_id} onValueChange={(value) => setFormData({...formData, yacht_id: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yacht" />
                      </SelectTrigger>
                      <SelectContent>
                        {yachts.filter(y => y.cruise_type === 'shared').map((yacht) => (
                          <SelectItem key={yacht.id} value={yacht.id}>
                            {yacht.yacht_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Details with Packages */}
              {selectedYacht?.shared_packages && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold text-lg">Guest Details & Packages</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {guestCategories.map(category => {
                        const price = selectedYacht.shared_packages[category.key];
                        if (!price || price === 0) return null;
                        
                        return (
                          <div key={category.key} className="border rounded-lg p-3">
                            <Label className="text-sm">{category.label}</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                min="0"
                                value={formData.guests[category.key]}
                                onChange={(e) => handleGuestChange(category.key, e.target.value)}
                                placeholder="0"
                                className="w-20"
                              />
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                @ <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />{price}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pricing & Payment */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Pricing & Payment</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Total Amount (AED) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.total_amount}
                        readOnly
                        className="bg-gray-50 font-semibold"
                      />
                    </div>
                    <div>
                      <Label>Agent Discount (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.agent_discount_percentage}
                        onChange={(e) => setFormData({...formData, agent_discount_percentage: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">From selected agent</p>
                    </div>
                    <div>
                      <Label>Commission Amount (AED)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.commission_amount}
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Calculated value</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Net Amount (AED)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.net_amount}
                        readOnly
                        className="bg-blue-50 font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">Total - Commission</p>
                    </div>
                    <div>
                      <Label>Paid Amount (AED)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.paid_amount}
                        onChange={(e) => setFormData({...formData, paid_amount: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">Amount paid by client</p>
                    </div>
                    <div>
                      <Label>Balance Amount (AED)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        readOnly
                        className="bg-red-50 font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">Net Amount - Paid</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Free Tickets</Label>
                      <Input
                        type="number"
                        value={formData.free_tickets}
                        onChange={(e) => setFormData({...formData, free_tickets: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Additional Expenses (AED)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.additional_expenses}
                        onChange={(e) => setFormData({...formData, additional_expenses: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Payment Status *</Label>
                      <Select value={formData.payment_status} onValueChange={(value) => setFormData({...formData, payment_status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                          <SelectItem value="nomode">No Mode</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheques">Cheques</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Notes */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Status & Notes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Booking Status *</Label>
                      <Select value={formData.booking_status} onValueChange={(value) => setFormData({...formData, booking_status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingBooking ? 'Update' : 'Create'} Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Booking Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details - {viewingBooking?.ticket_number}</DialogTitle>
            </DialogHeader>
            {viewingBooking && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Client Name</Label>
                        <p className="font-semibold">{viewingBooking.customer_name}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Booking Date</Label>
                        <p className="font-semibold">{viewingBooking.booking_date}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Travel Date</Label>
                        <p className="font-semibold">{viewingBooking.travel_date}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Yacht</Label>
                        <p className="font-semibold">{getYachtName(viewingBooking.yacht_id)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Agent</Label>
                        <p className="font-semibold">{getAgentName(viewingBooking.agent_id)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Total Guests</Label>
                        <p className="font-semibold">{viewingBooking.number_of_people}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Guest Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {(() => {
                        let guests = { adult: 0, child: 0, alcohol_adult: 0, top_deck_child: 0, top_deck_adult: 0, top_deck_adult_alcohol: 0, child_vip: 0, adult_vip: 0, adult_alcohol_vip: 0, royal_child: 0, royal_adult: 0, royal_adult_alcohol: 0 };
                        try {
                          if (viewingBooking.package_type) guests = JSON.parse(viewingBooking.package_type);
                        } catch (e) {}

                        return Object.entries(guests).map(([key, value]) => {
                          if (value > 0) {
                            return (
                              <div key={key} className="border-l-4 border-blue-500 pl-3">
                                <Label className="text-xs text-gray-600">{key.replace(/_/g, ' ').toUpperCase()}</Label>
                                <p className="font-bold text-lg">{value}</p>
                              </div>
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Total Amount</Label>
                        <p className="font-semibold text-lg flex items-center gap-1">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-4 h-4" />
                          {viewingBooking.total_amount || 0}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Discount</Label>
                        <p className="font-semibold">{viewingBooking.discount_percentage || 0}%</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Free Tickets</Label>
                        <p className="font-semibold">{viewingBooking.free_tickets || 0}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Additional Charges</Label>
                        <p className="font-semibold flex items-center gap-1">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3" />
                          {viewingBooking.other_charges || 0}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Net Amount</Label>
                        <p className="font-semibold text-lg text-blue-700 flex items-center gap-1">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-4 h-4" />
                          {viewingBooking.net_amount}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Paid Amount</Label>
                        <p className="font-semibold text-green-700 flex items-center gap-1">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3" />
                          {viewingBooking.paid_amount}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Balance</Label>
                        <p className="font-semibold text-lg text-red-700 flex items-center gap-1">
                          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-4 h-4" />
                          {viewingBooking.balance}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Payment Mode</Label>
                        <p className="font-semibold capitalize">{viewingBooking.payment_mode || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {viewingBooking.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{viewingBooking.notes}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadReport(viewingBooking)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEdit(viewingBooking);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Booking
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
        </div>
        );
        }