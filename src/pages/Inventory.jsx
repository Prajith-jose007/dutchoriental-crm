
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
import { Warehouse, Plus, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("items");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    item_name: "",
    category: "food",
    stock_qty: "",
    unit: "",
    unit_cost: "",
    reorder_level: "",
    location: ""
  });
  const [movementFormData, setMovementFormData] = useState({
    item_id: "",
    movement_type: "in",
    quantity: "",
    reason: "purchase",
    movement_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['stockMovements'],
    queryFn: () => base44.entities.StockMovement.list('-created_date')
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventoryItems']);
      resetItemForm();
    }
  });

  const createMovementMutation = useMutation({
    mutationFn: (data) => base44.entities.StockMovement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stockMovements']);
      queryClient.invalidateQueries(['inventoryItems']);
      resetMovementForm();
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventoryItems']);
    }
  });

  const resetItemForm = () => {
    setItemFormData({
      item_name: "",
      category: "food",
      stock_qty: "",
      unit: "",
      unit_cost: "",
      reorder_level: "",
      location: ""
    });
    setIsItemDialogOpen(false);
  };

  const resetMovementForm = () => {
    setMovementFormData({
      item_id: "",
      movement_type: "in",
      quantity: "",
      reason: "purchase",
      movement_date: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setIsMovementDialogOpen(false);
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...itemFormData,
      stock_qty: parseFloat(itemFormData.stock_qty),
      unit_cost: parseFloat(itemFormData.unit_cost),
      reorder_level: itemFormData.reorder_level ? parseFloat(itemFormData.reorder_level) : undefined
    };
    createItemMutation.mutate(data);
  };

  const handleMovementSubmit = (e) => {
    e.preventDefault();
    const item = inventoryItems.find(i => i.id === movementFormData.item_id);
    const qty = parseFloat(movementFormData.quantity);
    
    createMovementMutation.mutate({
      ...movementFormData,
      quantity: qty
    });
    
    // Update stock
    const newStock = movementFormData.movement_type === 'in' 
      ? item.stock_qty + qty 
      : item.stock_qty - qty;
    
    updateStockMutation.mutate({
      id: item.id,
      data: { stock_qty: newStock }
    });
  };

  const lowStockItems = inventoryItems.filter(item => 
    item.reorder_level && item.stock_qty <= item.reorder_level
  );

  const getItemName = (id) => inventoryItems.find(i => i.id === id)?.item_name || 'N/A';

  const categoryColors = {
    food: "bg-green-100 text-green-800",
    beverage: "bg-blue-100 text-blue-800",
    supplies: "bg-purple-100 text-purple-800",
    maintenance: "bg-orange-100 text-orange-800",
    other: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory</h1>
            <p className="text-gray-600">Manage stock and inventory movements</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsMovementDialogOpen(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Stock Movement
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
            <TabsTrigger value="items">Inventory Items</TabsTrigger>
            <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventoryItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-all border-none">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.item_name}</CardTitle>
                      <Badge className={categoryColors[item.category]}>
                        {item.category}
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
                          <p className="text-xs text-gray-500">Unit Cost</p>
                          <p className="font-semibold flex items-center gap-1">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                            {item.unit_cost}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-semibold text-sm">{item.location || 'N/A'}</p>
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
            {inventoryItems.length === 0 && (
              <div className="text-center py-20">
                <Warehouse className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No inventory items yet</h3>
                <p className="text-gray-500">Add your first inventory item</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="movements">
            <Card className="border-none shadow-lg">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{movement.movement_date}</TableCell>
                        <TableCell className="font-medium">{getItemName(movement.item_id)}</TableCell>
                        <TableCell>
                          {movement.movement_type === 'in' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Stock In
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              Stock Out
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{movement.quantity}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{movement.reason.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{movement.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {movements.length === 0 && (
                  <div className="text-center py-20">
                    <TrendingUp className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No movements yet</h3>
                    <p className="text-gray-500">Record stock in/out movements</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
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
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit *</Label>
                  <Input
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({...itemFormData, unit: e.target.value})}
                    placeholder="kg, liter, pieces"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Stock Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemFormData.stock_qty}
                    onChange={(e) => setItemFormData({...itemFormData, stock_qty: e.target.value})}
                    required
                  />
                </div>
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
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={itemFormData.reorder_level}
                    onChange={(e) => setItemFormData({...itemFormData, reorder_level: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Storage Location</Label>
                <Input
                  value={itemFormData.location}
                  onChange={(e) => setItemFormData({...itemFormData, location: e.target.value})}
                />
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

        <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <Label>Item *</Label>
                <Select value={movementFormData.item_id} onValueChange={(value) => setMovementFormData({...movementFormData, item_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.item_name} (Stock: {item.stock_qty} {item.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Movement Type *</Label>
                  <Select value={movementFormData.movement_type} onValueChange={(value) => setMovementFormData({...movementFormData, movement_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={movementFormData.quantity}
                    onChange={(e) => setMovementFormData({...movementFormData, quantity: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Reason *</Label>
                <Select value={movementFormData.reason} onValueChange={(value) => setMovementFormData({...movementFormData, reason: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="pos_sale">POS Sale</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="wastage">Wastage</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={movementFormData.movement_date}
                  onChange={(e) => setMovementFormData({...movementFormData, movement_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={movementFormData.notes}
                  onChange={(e) => setMovementFormData({...movementFormData, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetMovementForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Record Movement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
