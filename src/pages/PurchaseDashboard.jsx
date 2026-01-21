
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Warehouse, ClipboardList, TrendingDown, ArrowUpRight, Package, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PurchaseDashboard() {
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list()
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => base44.entities.PurchaseOrder.list('-created_date')
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list()
  });

  const { data: stockMovements = [] } = useQuery({
    queryKey: ['stockMovements'],
    queryFn: () => base44.entities.StockMovement.list('-movement_date')
  });

  const activeVendors = vendors.filter(v => v.status === 'active').length;
  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending').length;
  const lowStockItems = inventory.filter(i => i.stock_qty <= (i.reorder_level || 0)).length;
  const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.stock_qty * i.unit_cost), 0);

  const stats = [
    {
      title: "Active Vendors",
      value: activeVendors,
      total: vendors.length,
      icon: ShoppingCart,
      bgColor: "from-blue-500 to-blue-600",
      link: "Vendors"
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      total: purchaseOrders.length,
      icon: ClipboardList,
      bgColor: "from-orange-500 to-orange-600",
      link: "PurchaseOrders"
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      icon: Warehouse,
      bgColor: "from-red-500 to-red-600",
      link: "Inventory"
    },
    {
      title: "Inventory Value",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {totalInventoryValue.toLocaleString()}
        </span>
      ),
      icon: TrendingDown,
      bgColor: "from-green-500 to-green-600",
      link: "Inventory"
    }
  ];

  const quickActions = [
    { title: "Add Vendor", url: "Vendors", icon: ShoppingCart, color: "blue" },
    { title: "Create PO", url: "PurchaseOrders", icon: ClipboardList, color: "green" },
    { title: "Manage Inventory", url: "Inventory", icon: Warehouse, color: "purple" },
    { title: "Stock Movement", url: "Inventory", icon: Package, color: "orange" }
  ];

  const categoryStats = inventory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Purchase & Inventory Dashboard
            </h1>
            <p className="text-gray-600">Procurement, Inventory Management & Stock Control</p>
          </div>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Link key={index} to={createPageUrl(stat.link)}>
              <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgColor} opacity-10 rounded-bl-full`} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bgColor}`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </div>
                      {stat.total && (
                        <p className="text-sm text-gray-500 mt-1">of {stat.total} total</p>
                      )}
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} to={createPageUrl(action.url)}>
                    <div className={`p-6 rounded-xl bg-gradient-to-br from-${action.color}-50 to-${action.color}-100 hover:shadow-md transition-all duration-200 cursor-pointer border border-${action.color}-200`}>
                      <action.icon className={`w-8 h-8 text-${action.color}-600 mb-3`} />
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.filter(i => i.stock_qty <= (i.reorder_level || 0)).slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Warehouse className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.item_name}</p>
                      <p className="text-sm text-gray-500">Stock: {item.stock_qty} {item.unit}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">
                      Low Stock
                    </Badge>
                  </div>
                ))}
                {lowStockItems === 0 && (
                  <p className="text-center text-gray-500 py-8">All items well stocked</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(categoryStats).map(([category, count], index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all text-center">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{count}</p>
                  <p className="text-sm text-gray-500">items</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockMovements.slice(0, 5).map((movement, index) => {
                const item = inventory.find(i => i.id === movement.item_id);
                return (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${movement.movement_type === 'in' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium text-gray-900">{item?.item_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{movement.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${movement.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-sm text-gray-500">{movement.movement_date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
