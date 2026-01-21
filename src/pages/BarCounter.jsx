import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wine, Plus, Package, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BarCounter() {
  const [activeTab, setActiveTab] = useState("items");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    item_name: "",
    category: "soft_drink",
    unit_cost: "",
    selling_price: "",
    stock_qty: "",
    unit: "bottle",
    reorder_level: ""
  });
  const [usageFormData, setUsageFormData] = useState({
    booking_id: "",
    bar_item_id: "",
    qty_used: "",
    usage_date: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const { data: barItems = [] } = useQuery({
    queryKey: ['barItems'],
    queryFn: () => base44.entities.BarItem.list()
  });

  const { data: barUsage = [] } = useQuery({
    queryKey: ['barUsage'],
    queryFn: () => base44.entities.BarUsage.list('-created_date')
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list()
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.BarItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['barItems']);
      resetItemForm();
    }
  });

  const createUsageMutation = useMutation({
    mutationFn: (data) => base44.entities.BarUsage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['barUsage']);
      queryClient.invalidateQueries(['barItems']);
      resetUsageForm();
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BarItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['barItems']);
    }
  });

  const resetItemForm = () => {
    setItemFormData({
      item_name: "",
      category: "soft_drink",
      unit_cost: "",
      selling_price: "",
      stock_qty: "",
      unit: "bottle",
      reorder_level: ""
    });
    setIsItemDialogOpen(false);
  };

  const resetUsageForm = () => {
    setUsageFormData({
      booking_id: "",
      bar_item_id: "",
      qty_used: "",
      usage_date: new Date().toISOString().split('T')[0]
    });
    setIsUsageDialogOpen(false);
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...itemFormData,
      unit_cost: parseFloat(itemFormData.unit_cost),
      selling_price: parseFloat(itemFormData.selling_price),
      stock_qty: parseInt(itemFormData.stock_qty),
      reorder_level: itemFormData.reorder_level ? parseInt(itemFormData.reorder_level) : undefined
    };
    createItemMutation.mutate(data);
  };

  const handleUsageSubmit = (e) => {
    e.preventDefault();
    const item = barItems.find(i => i.id === usageFormData.bar_item_id);
    const qtyUsed = parseInt(usageFormData.qty_used);
    
    const data = {
      ...usageFormData,
      qty_used: qtyUsed,
      unit_cost: item.unit_cost,
      total_cost: item.unit_cost * qtyUsed
    };
    
    createUsageMutation.mutate(data);
    
    // Update stock
    const newStock = item.stock_qty - qtyUsed;
    updateStockMutation.mutate({
      id: item.id,
      data: { stock_qty: newStock }
    });
  };

  const lowStockItems = barItems.filter(item => 
    item.reorder_level && item.stock_qty <= item.reorder_level
  );

  const getItemName = (id) => barItems.find(i => i.id === id)?.item_name || 'N/A';
  const getBookingRef = (id) => bookings.find(b => b.id === id)?.booking_ref || 'N/A';

  const categoryColors = {
    alcohol: "bg-red-100 text-red-800",
    soft_drink: "bg-blue-100 text-blue-800",
    snacks: "bg-yellow-100 text-yellow-800",
    other: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bar Counter</h1>
            <p className="text-gray-600">Manage bar inventory and usage</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsUsageDialogOpen(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Record Usage
            </Button>
            <Button
              onClick={() => setIsItemDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">Low Stock Alert</p>
                  <p className="text-sm text-orange-700">
                    {lowStockItems.length} item(s) need reordering: {lowStockItems.map(i => i.item_name).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="items">Bar Items</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-all border-none">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.item_name}</CardTitle>
                      <Badge className={categoryColors[item.category]}>
                        {item.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600">Stock</span>
                        <span className={`font-bold ${
                          item.reorder_level && item.stock_qty <= item.reorder_level 
                            ? 'text-red-600' 
                            : 'text-blue-700'
                        }`}>
                          {item.stock_qty} {item.unit}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Cost</p>
                          <p className="font-semibold">${item.unit_cost}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Selling Price</p>
                          <p className="font-semibold text-green-600">${item.selling_price}</p>
                        </div>
                      </div>
                      {item.reorder_level && (
                        <div className="text-xs text-gray-500">
                          Reorder at: {item.reorder_level} {item.unit}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {barItems.length === 0 && (
              <div className="text-center py-20">
                <Wine className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No bar items yet</h3>
                <p className="text-gray-500">Add your first bar item</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="usage">
            <Card className="border-none shadow-lg">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Booking Ref</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {barUsage.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell>{usage.usage_date || 'N/A'}</TableCell>
                        <TableCell className="font-medium">
                          {getBookingRef(usage.booking_id)}
                        </TableCell>
                        <TableCell>{getItemName(usage.bar_item_id)}</TableCell>
                        <TableCell>{usage.qty_used}</TableCell>
                        <TableCell>${usage.unit_cost}</TableCell>
                        <TableCell className="font-semibold">${usage.total_cost}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {barUsage.length === 0 && (
                  <div className="text-center py-20">
                    <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No usage records</h3>
                    <p className="text-gray-500">Record bar item usage from bookings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Bar Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Input
                  value={itemFormData.item_name}
                  onChange={(e) => setItemFormData({...itemFormData, item_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={itemFormData.category} onValueChange={(value) => setItemFormData({...itemFormData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alcohol">Alcohol</SelectItem>
                      <SelectItem value="soft_drink">Soft Drink</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit *</Label>
                  <Input
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({...itemFormData, unit: e.target.value})}
                    placeholder="bottle, can, packet"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit Cost *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemFormData.unit_cost}
                    onChange={(e) => setItemFormData({...itemFormData, unit_cost: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Selling Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemFormData.selling_price}
                    onChange={(e) => setItemFormData({...itemFormData, selling_price: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stock Quantity *</Label>
                  <Input
                    type="number"
                    value={itemFormData.stock_qty}
                    onChange={(e) => setItemFormData({...itemFormData, stock_qty: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={itemFormData.reorder_level}
                    onChange={(e) => setItemFormData({...itemFormData, reorder_level: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetItemForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Add Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Bar Usage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUsageSubmit} className="space-y-4">
              <div>
                <Label>Booking *</Label>
                <Select value={usageFormData.booking_id} onValueChange={(value) => setUsageFormData({...usageFormData, booking_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.filter(b => b.status === 'confirmed').map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.booking_ref} - {booking.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bar Item *</Label>
                <Select value={usageFormData.bar_item_id} onValueChange={(value) => setUsageFormData({...usageFormData, bar_item_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {barItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.item_name} (Stock: {item.stock_qty})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity Used *</Label>
                <Input
                  type="number"
                  value={usageFormData.qty_used}
                  onChange={(e) => setUsageFormData({...usageFormData, qty_used: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={usageFormData.usage_date}
                  onChange={(e) => setUsageFormData({...usageFormData, usage_date: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetUsageForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Record Usage
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}