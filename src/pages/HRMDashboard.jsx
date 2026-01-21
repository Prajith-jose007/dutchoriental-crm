
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Calendar, ClipboardList, CreditCard, ArrowUpRight, TrendingUp, Users, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HRMDashboard() {
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date')
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => base44.entities.Leave.list('-created_date')
  });

  const { data: payroll = [] } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => base44.entities.Payroll.list()
  });

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]);
  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const totalPayroll = payroll.reduce((sum, p) => sum + (p.net_salary || 0), 0);

  const stats = [
    {
      title: "Active Employees",
      value: activeEmployees,
      total: employees.length,
      icon: UserCog,
      bgColor: "from-blue-500 to-blue-600",
      link: "Employees"
    },
    {
      title: "Present Today",
      value: presentToday,
      total: activeEmployees,
      icon: ClipboardList,
      bgColor: "from-green-500 to-green-600",
      link: "Attendance"
    },
    {
      title: "Pending Leave Requests",
      value: pendingLeaves,
      icon: Calendar,
      bgColor: "from-orange-500 to-orange-600",
      link: "Leaves"
    },
    {
      title: "Total Payroll",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {totalPayroll.toLocaleString()}
        </span>
      ),
      icon: CreditCard,
      bgColor: "from-purple-500 to-purple-600",
      link: "Payroll"
    }
  ];

  const quickActions = [
    { title: "Add Employee", url: "Employees", icon: UserCog, color: "blue" },
    { title: "Mark Attendance", url: "Attendance", icon: ClipboardList, color: "green" },
    { title: "Process Payroll", url: "Payroll", icon: CreditCard, color: "purple" },
    { title: "Manage Leaves", url: "Leaves", icon: Calendar, color: "orange" }
  ];

  const departmentStats = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              HRM Dashboard
            </h1>
            <p className="text-gray-600">Human Resource Management - Employees, Attendance & Payroll</p>
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
              <CardTitle className="text-xl font-bold">Pending Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaves.filter(l => l.status === 'pending').slice(0, 5).map((leave, index) => {
                  const employee = employees.find(e => e.id === leave.employee_id);
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{employee?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{leave.leave_type} - {leave.total_days} days</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    </div>
                  );
                })}
                {pendingLeaves === 0 && (
                  <p className="text-center text-gray-500 py-8">No pending requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(departmentStats).map(([dept, count], index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 capitalize">{dept}</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{count}</p>
                  <p className="text-sm text-gray-500">employees</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
