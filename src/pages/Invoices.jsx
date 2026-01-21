
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
import { FileText, Plus, Download, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function Invoices() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: `INV${Date.now()}`,
    booking_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    amount: "",
    tax_amount: "0",
    discount_amount: "0",
    final_amount: "",
    status: "unpaid",
    payment_method: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date')
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
    }
  });

  const resetForm = () => {
    setFormData({
      invoice_number: `INV${Date.now()}`,
      booking_id: "",
      invoice_date: new Date().toISOString().split('T')[0],
      amount: "",
      tax_amount: "0",
      discount_amount: "0",
      final_amount: "",
      status: "unpaid",
      payment_method: "",
      notes: ""
    });
    setIsDialogOpen(false);
  };

  const handleBookingChange = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      const amount = booking.total_price;
      const tax = parseFloat(formData.tax_amount) || 0;
      const discount = parseFloat(formData.discount_amount) || 0;
      const final = amount + tax - discount;
      
      setFormData({
        ...formData,
        booking_id: bookingId,
        amount: amount.toString(),
        final_amount: final.toString()
      });
    }
  };

  const recalculateFinal = (field, value) => {
    const amount = field === 'amount' ? parseFloat(value) : parseFloat(formData.amount) || 0;
    const tax = field === 'tax_amount' ? parseFloat(value) : parseFloat(formData.tax_amount) || 0;
    const discount = field === 'discount_amount' ? parseFloat(value) : parseFloat(formData.discount_amount) || 0;
    const final = amount + tax - discount;
    
    setFormData({
      ...formData,
      [field]: value,
      final_amount: final.toString()
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      tax_amount: parseFloat(formData.tax_amount),
      discount_amount: parseFloat(formData.discount_amount),
      final_amount: parseFloat(formData.final_amount)
    };
    createMutation.mutate(data);
  };

  const markAsPaid = (invoice) => {
    updateMutation.mutate({
      id: invoice.id,
      data: { status: 'paid' }
    });
  };

  const getBookingDetails = (id) => {
    const booking = bookings.find(b => b.id === id);
    return booking ? `${booking.booking_ref} - ${booking.customer_name}` : 'N/A';
  };

  const statusColors = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-red-100 text-red-800",
    partial: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-gray-100 text-gray-800"
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.final_amount, 0);
  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.final_amount, 0);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices</h1>
            <p className="text-gray-600">Manage billing and invoices</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Total Paid</p>
                  <p className="text-3xl font-bold text-green-900 flex items-center gap-1">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-6 h-6 inline-block" />
                    {totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 mb-1">Total Unpaid</p>
                  <p className="text-3xl font-bold text-red-900 flex items-center gap-1">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-6 h-6 inline-block" />
                    {totalUnpaid.toLocaleString()}
                  </p>
                </div>
                <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Final Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.invoice_date}</TableCell>
                    <TableCell>{getBookingDetails(invoice.booking_id)}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                      {invoice.amount}
                    </TableCell>
                    <TableCell className="text-green-600 flex items-center gap-1">
                      +<img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                      {invoice.tax_amount}
                    </TableCell>
                    <TableCell className="font-bold text-lg flex items-center gap-1">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-4 h-4 inline-block" />
                      {invoice.final_amount}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {invoice.status === 'unpaid' && (
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(invoice)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {invoices.length === 0 && (
              <div className="text-center py-20">
                <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No invoices yet</h3>
                <p className="text-gray-500">Create your first invoice</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <Input value={formData.invoice_number} disabled />
                </div>
                <div>
                  <Label>Invoice Date *</Label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Booking *</Label>
                <Select value={formData.booking_id} onValueChange={handleBookingChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.booking_ref} - {booking.customer_name} - <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />{booking.total_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Base Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => recalculateFinal('amount', e.target.value)}
                    disabled
                  />
                </div>
                <div>
                  <Label>Tax Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => recalculateFinal('tax_amount', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => recalculateFinal('discount_amount', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Final Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.final_amount}
                  disabled
                  className="text-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
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

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Invoice
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
