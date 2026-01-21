import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Calendar, Users, Package, TrendingUp, DollarSign, ArrowUpRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function CRMDashboard() {
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

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list()
  });

  const activeYachts = yachts.filter(y => y.status === 'active').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || b.total_price || 0), 0);
  const activeAgents = agents.filter(a => a.status === 'active').length;

  const recentBookings = bookings.slice(0, 5);

  // Cruise type analytics
  const privateBookings = bookings.filter(b => b.cruise_type === 'private');
  const sharedBookings = bookings.filter(b => b.cruise_type === 'shared');
  
  const cruiseTypeData = [
    {
      name: 'Private',
      bookings: privateBookings.length,
      revenue: privateBookings.reduce((sum, b) => sum + (b.total_amount || b.total_price || 0), 0)
    },
    {
      name: 'Shared',
      bookings: sharedBookings.length,
      revenue: sharedBookings.reduce((sum, b) => sum + (b.total_amount || b.total_price || 0), 0)
    },
    {
      name: 'Sunset',
      bookings: opportunities.filter(o => o.opportunity_type === 'sunset').length,
      revenue: opportunities.filter(o => o.opportunity_type === 'sunset').reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
    }
  ];

  // Monthly trend data
  const monthlyData = {};
  bookings.forEach(booking => {
    const date = new Date(booking.travel_date || booking.booking_date);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { private: 0, shared: 0, sunset: 0 };
    }
    if (booking.cruise_type === 'private') monthlyData[monthYear].private += (booking.total_amount || booking.total_price || 0);
    if (booking.cruise_type === 'shared') monthlyData[monthYear].shared += (booking.total_amount || booking.total_price || 0);
  });

  const lineChartData = Object.keys(monthlyData).slice(-6).map(key => ({
    month: key,
    Private: monthlyData[key].private,
    Shared: monthlyData[key].shared,
    Sunset: monthlyData[key].sunset
  }));

  // Sales pipeline data
  const pipelineData = [
    { stage: 'New', count: opportunities.filter(o => o.stage === 'new').length },
    { stage: 'Contacted', count: opportunities.filter(o => o.stage === 'contacted').length },
    { stage: 'Quoted', count: opportunities.filter(o => o.stage === 'quoted').length },
    { stage: 'Negotiation', count: opportunities.filter(o => o.stage === 'negotiation').length },
    { stage: 'Won', count: opportunities.filter(o => o.stage === 'won').length }
  ];

  // Funnel-style data (conversion)
  const funnelData = [
    { name: 'Leads', value: opportunities.length, fill: '#3b82f6' },
    { name: 'Quoted', value: opportunities.filter(o => ['quoted', 'negotiation', 'followup', 'won'].includes(o.stage)).length, fill: '#10b981' },
    { name: 'Negotiation', value: opportunities.filter(o => ['negotiation', 'followup', 'won'].includes(o.stage)).length, fill: '#f59e0b' },
    { name: 'Won', value: opportunities.filter(o => o.stage === 'won').length, fill: '#22c55e' }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const stats = [
    {
      title: "Active Yachts",
      value: activeYachts,
      total: yachts.length,
      icon: Ship,
      bgColor: "from-blue-500 to-blue-600",
      link: "Yachts"
    },
    {
      title: "Confirmed Bookings",
      value: confirmedBookings,
      total: bookings.length,
      icon: Calendar,
      bgColor: "from-green-500 to-green-600",
      link: "Bookings"
    },
    {
      title: "Total Revenue",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {totalRevenue.toLocaleString()}
        </span>
      ),
      icon: DollarSign,
      bgColor: "from-purple-500 to-purple-600",
      link: "Invoices"
    },
    {
      title: "Active Agents",
      value: activeAgents,
      total: agents.length,
      icon: Users,
      bgColor: "from-orange-500 to-orange-600",
      link: "Agents"
    }
  ];

  const quickActions = [
    { title: "New Booking", url: "Bookings", icon: Calendar, color: "blue" },
    { title: "Add Yacht", url: "Yachts", icon: Ship, color: "green" },
    { title: "Manage Packages", url: "Packages", icon: Package, color: "purple" },
    { title: "View Invoices", url: "Invoices", icon: DollarSign, color: "orange" }
  ];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              CRM Dashboard
            </h1>
            <p className="text-gray-600">Customer Relationship Management - Yacht Bookings & Operations</p>
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

        {/* Sales Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Sales Trend - Line Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Private" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Shared" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Sunset" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Cruise Type Revenue - Bar Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cruiseTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                  <Bar dataKey="bookings" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sales Pipeline & Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Sales Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
              <CardTitle className="text-xl font-bold">Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{booking.customer_name}</p>
                      <p className="text-sm text-gray-500">{booking.booking_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                        {booking.total_amount || booking.total_price}
                      </p>
                      <Badge className={
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {recentBookings.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No bookings yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {yachts.slice(0, 6).map((yacht, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{yacht.yacht_name}</h3>
                    <Badge className={
                      yacht.status === 'active' ? 'bg-green-100 text-green-700' :
                      yacht.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {yacht.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{yacht.capacity} guests</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}