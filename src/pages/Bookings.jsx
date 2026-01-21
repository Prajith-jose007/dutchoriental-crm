import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, Edit, Eye, Ship, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function Bookings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    booking_ref: `BK${Date.now()}`,
    yacht_id: "",
    package_id: "",
    agent_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    booking_date: "",
    booking_time: "",
    number_of_people: "",
    base_price: "",
    discount_amount: "0",
    total_price: "",
    status: "confirmed",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date')
  });

  const { data: yachts = [] } = useQuery({
    queryKey: ['yachts'],
    queryFn: () => base44.entities.Yacht.list()
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['packages'],
    queryFn: () => base44.entities.Package.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      booking_ref: `BK${Date.now()}`,
      yacht_id: "",
      package_id: "",
      agent_id: "",
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      booking_date: "",
      booking_time: "",
      number_of_people: "",
      base_price: "",
      discount_amount: "0",
      total_price: "",
      status: "confirmed",
      notes: ""
    });
    setEditingBooking(null);
    setIsDialogOpen(false);
  };

  const handlePackageChange = (packageId) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setFormData({
        ...formData,
        package_id: packageId,
        yacht_id: pkg.yacht_id,
        base_price: pkg.base_price.toString(),
        total_price: (pkg.base_price - parseFloat(formData.discount_amount || 0)).toString()
      });
    }
  };

  const handleDiscountChange = (discount) => {
    const discountVal = parseFloat(discount) || 0;
    const basePrice = parseFloat(formData.base_price) || 0;
    setFormData({
      ...formData,
      discount_amount: discount,
      total_price: (basePrice - discountVal).toString()
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      number_of_people: parseInt(formData.number_of_people),
      base_price: parseFloat(formData.base_price),
      discount_amount: parseFloat(formData.discount_amount),
      total_price: parseFloat(formData.total_price)
    };
    
    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getYachtName = (id) => yachts.find(y => y.id === id)?.yacht_name || 'N/A';
  const getPackageName = (id) => packages.find(p => p.id === id)?.package_name || 'N/A';
  const getAgentName = (id) => agents.find(a => a.id === id)?.agent_name || 'Direct';

  const statusColors = {
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800"
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings</h1>
            <p className="text-gray-600">Manage yacht bookings</p>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Booking Ref</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Yacht</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{booking.booking_ref}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.customer_name}</p>
                        <p className="text-sm text-gray-500">{booking.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Ship className="w-4 h-4 text-blue-600" />
                        <span>{getYachtName(booking.yacht_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{booking.booking_date}</p>
                        <p className="text-sm text-gray-500">{booking.booking_time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{booking.number_of_people}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span>{booking.total_price}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewDialog(booking)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {bookings.length === 0 && (
              <div className="text-center py-20">
                <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No bookings yet</h3>
                <p className="text-gray-500">Create your first booking</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Booking Reference</Label>
                  <Input value={formData.booking_ref} disabled />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Package *</Label>
                  <Select value={formData.package_id} onValueChange={handlePackageChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.package_name} - ${pkg.base_price}
                        </SelectItem>
                      ))}
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) => setFormData({...formData, booking_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={formData.booking_time}
                    onChange={(e) => setFormData({...formData, booking_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Number of Guests *</Label>
                  <Input
                    type="number"
                    value={formData.number_of_people}
                    onChange={(e) => setFormData({...formData, number_of_people: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Base Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    disabled
                  />
                </div>
                <div>
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Total Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_price}
                    disabled
                  />
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

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {viewDialog && (
          <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Booking Reference</Label>
                    <p className="font-semibold">{viewDialog.booking_ref}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <Badge className={statusColors[viewDialog.status]}>
                      {viewDialog.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Customer</Label>
                    <p className="font-semibold">{viewDialog.customer_name}</p>
                    <p className="text-sm text-gray-600">{viewDialog.customer_phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Yacht</Label>
                    <p className="font-semibold">{getYachtName(viewDialog.yacht_id)}</p>
                    <p className="text-sm text-gray-600">{getPackageName(viewDialog.package_id)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500">Date</Label>
                    <p className="font-semibold">{viewDialog.booking_date}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Time</Label>
                    <p className="font-semibold">{viewDialog.booking_time}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Guests</Label>
                    <p className="font-semibold">{viewDialog.number_of_people}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label className="text-gray-500">Base Price</Label>
                    <p className="font-semibold">${viewDialog.base_price}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Discount</Label>
                    <p className="font-semibold text-red-600">-${viewDialog.discount_amount}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Total</Label>
                    <p className="font-bold text-lg text-blue-700">${viewDialog.total_price}</p>
                  </div>
                </div>
                {viewDialog.notes && (
                  <div>
                    <Label className="text-gray-500">Notes</Label>
                    <p className="text-sm">{viewDialog.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}