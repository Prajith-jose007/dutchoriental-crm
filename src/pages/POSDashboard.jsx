
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Wine, FileText, DollarSign, ArrowUpRight, TrendingUp, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function POSDashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ['posOrders'],
    queryFn: () => base44.entities.POSOrder.list('-created_date')
  });

  const { data: items = [] } = useQuery({
    queryKey: ['posItems'],
    queryFn: () => base44.entities.POSItem.list()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['posCategories'],
    queryFn: () => base44.entities.POSCategory.list()
  });

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.order_date === today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const stats = [
    {
      title: "Today's Orders",
      value: todayOrders.length,
      icon: FileText,
      bgColor: "from-blue-500 to-blue-600",
      link: "POSOrders"
    },
    {
      title: "Today's Revenue",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {todayRevenue.toLocaleString()}
        </span>
      ),
      icon: DollarSign,
      bgColor: "from-green-500 to-green-600",
      link: "POSOrders"
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: Coffee,
      bgColor: "from-orange-500 to-orange-600",
      link: "POSOrders"
    },
    {
      title: "Total Revenue",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {totalRevenue.toLocaleString()}
        </span>
      ),
      icon: TrendingUp,
      bgColor: "from-purple-500 to-purple-600",
      link: "POSOrders"
    }
  ];

  const quickActions = [
    { title: "Restaurant POS", url: "RestaurantPOS", icon: Coffee, color: "blue" },
    { title: "Bar POS", url: "BarPOS", icon: Wine, color: "green" },
    { title: "View Orders", url: "POSOrders", icon: FileText, color: "purple" },
    { title: "Menu Items", url: "POSItems", icon: DollarSign, color: "orange" }
  ];

  const orderTypeStats = orders.reduce((acc, order) => {
    acc[order.order_type] = (acc[order.order_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              POS Dashboard
            </h1>
            <p className="text-gray-600">Point of Sale - Restaurant & Bar Operations</p>
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
              <CardTitle className="text-xl font-bold">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.order_type} - {order.order_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                        {order.total_amount}
                      </p>
                      <Badge className={
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Order Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(orderTypeStats).map(([type, count], index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all text-center">
                  <Coffee className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 capitalize">{type}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{count}</p>
                  <p className="text-sm text-gray-500">orders</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <DollarSign className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <p className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-8 h-8 inline-block" />
                {totalRevenue.toLocaleString()}
              </p>
              <p className="text-gray-500 mt-2">Total Sales Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
