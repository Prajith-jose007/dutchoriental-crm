import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, Plus, Minus, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RestaurantPOS() {
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    table_number: "",
    payment_method: "cash"
  });

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['posCategories'],
    queryFn: () => base44.entities.POSCategory.list()
  });

  const { data: items = [] } = useQuery({
    queryKey: ['posItems'],
    queryFn: () => base44.entities.POSItem.list()
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => base44.entities.POSOrder.create(data),
    onSuccess: (order) => {
      cart.forEach(item => {
        base44.entities.POSOrderItem.create({
          order_id: order.id,
          item_id: item.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        });
      });
      queryClient.invalidateQueries(['posOrders']);
      setCart([]);
      setIsCheckoutOpen(false);
      setOrderDetails({ table_number: "", payment_method: "cash" });
    }
  });

  const restaurantCategories = categories.filter(c => c.type === 'restaurant' || c.type === 'both');
  const restaurantItems = items.filter(item => {
    const category = categories.find(c => c.id === item.category_id);
    return category && (category.type === 'restaurant' || category.type === 'both');
  });

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    const subtotal = calculateTotal();
    const orderData = {
      order_number: `REST${Date.now()}`,
      order_type: "restaurant",
      table_number: orderDetails.table_number,
      subtotal: subtotal,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: subtotal,
      payment_method: orderDetails.payment_method,
      status: "pending",
      order_time: new Date().toLocaleTimeString()
    };
    createOrderMutation.mutate(orderData);
  };

  const getCategoryName = (id) => categories.find(c => c.id === id)?.category_name || 'N/A';

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant POS</h1>
            <p className="text-gray-600">Point of Sale for restaurant orders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Cart Items</p>
              <p className="text-2xl font-bold text-blue-700">{cart.length}</p>
            </div>
            <Button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:shadow-lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Checkout (${calculateTotal().toFixed(2)})
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg mb-6">
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {restaurantItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-blue-500"
                      onClick={() => item.available && addToCart(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col h-full">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{item.item_name}</h3>
                            <Badge variant="outline" className="text-xs mb-2">
                              {getCategoryName(item.category_id)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-lg font-bold text-green-600">${item.price}</span>
                            {!item.available && (
                              <Badge className="bg-red-100 text-red-800">Out</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {restaurantItems.length === 0 && (
                  <div className="text-center py-10">
                    <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No menu items available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-none shadow-lg sticky top-4">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Current Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Cart is empty</p>
                  </div>
                ) : (
                  <div>
                    <div className="max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="p-4 border-b hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.item_name}</h4>
                              <p className="text-sm text-gray-600">${item.price} each</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <span className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 border-t-2">
                      <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Table Number *</Label>
                <Input
                  value={orderDetails.table_number}
                  onChange={(e) => setOrderDetails({...orderDetails, table_number: e.target.value})}
                  placeholder="e.g., T1, T2"
                />
              </div>
              <div>
                <Label>Payment Method *</Label>
                <Select value={orderDetails.payment_method} onValueChange={(value) => setOrderDetails({...orderDetails, payment_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-700">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!orderDetails.table_number}
                >
                  Confirm Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}