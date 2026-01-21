import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Coffee, Wine, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function POSOrders() {
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['posOrders'],
    queryFn: () => base44.entities.POSOrder.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.POSOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['posOrders']);
    }
  });

  const markAsCompleted = (order) => {
    updateMutation.mutate({
      id: order.id,
      data: { status: 'completed', completed_time: new Date().toLocaleTimeString() }
    });
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    served: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const orderTypeIcons = {
    restaurant: Coffee,
    bar: Wine
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">POS Orders</h1>
            <p className="text-gray-600">View all restaurant and bar orders</p>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Order #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Order Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const OrderIcon = orderTypeIcons[order.order_type];
                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <OrderIcon className="w-4 h-4" />
                            <span className="capitalize">{order.order_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{order.table_number || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{order.order_time}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">${order.total_amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {order.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(order.status === 'pending' || order.status === 'preparing' || order.status === 'served') && (
                            <Button
                              size="sm"
                              onClick={() => markAsCompleted(order)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {orders.length === 0 && (
              <div className="text-center py-20">
                <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
                <p className="text-gray-500">Orders from Restaurant and Bar POS will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}