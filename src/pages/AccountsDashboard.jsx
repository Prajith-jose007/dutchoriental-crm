
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, FileText, ArrowUpRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AccountsDashboard() {
  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => base44.entities.LedgerEntry.list('-transaction_date')
  });

  const { data: financialReports = [] } = useQuery({
    queryKey: ['financialReports'],
    queryFn: () => base44.entities.FinancialReport.list('-year')
  });

  const totalIncome = ledgerEntries
    .filter(e => e.entry_type === 'income')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalExpenses = ledgerEntries
    .filter(e => e.entry_type === 'expense')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netProfit = totalIncome - totalExpenses;

  const incomeByModule = ledgerEntries
    .filter(e => e.entry_type === 'income')
    .reduce((acc, e) => {
      acc[e.source_module] = (acc[e.source_module] || 0) + e.amount;
      return acc;
    }, {});

  const expensesByCategory = ledgerEntries
    .filter(e => e.entry_type === 'expense')
    .reduce((acc, e) => {
      const cat = e.category || 'Other';
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {});

  const stats = [
    {
      title: "Total Income",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {totalIncome.toLocaleString()}
        </span>
      ),
      icon: TrendingUp,
      bgColor: "from-green-500 to-green-600",
      link: "Ledger"
    },
    {
      title: "Total Expenses",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {totalExpenses.toLocaleString()}
        </span>
      ),
      icon: TrendingDown,
      bgColor: "from-red-500 to-red-600",
      link: "Ledger"
    },
    {
      title: "Net Profit/Loss",
      value: (
        <span className="flex items-center gap-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
          {netProfit.toLocaleString()}
        </span>
      ),
      icon: DollarSign,
      bgColor: netProfit >= 0 ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600",
      link: "Ledger"
    },
    {
      title: "Financial Reports",
      value: financialReports.length,
      icon: FileText,
      bgColor: "from-purple-500 to-purple-600",
      link: "FinancialReports"
    }
  ];

  const quickActions = [
    { title: "View Ledger", url: "Ledger", icon: DollarSign, color: "blue" },
    { title: "Generate Report", url: "FinancialReports", icon: FileText, color: "green" },
    { title: "Add Entry", url: "Ledger", icon: TrendingUp, color: "purple" },
    { title: "View Reports", url: "FinancialReports", icon: TrendingDown, color: "orange" }
  ];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Accounts Dashboard
            </h1>
            <p className="text-gray-600">Financial Management - Ledger, Reports & Analytics</p>
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
              <CardTitle className="text-xl font-bold">Income by Module</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(incomeByModule).map(([module, amount], index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-900 capitalize">{module}</span>
                    <span className="font-bold text-green-700 flex items-center gap-1">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                      {amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {Object.keys(incomeByModule).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No income recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(expensesByCategory).map(([category, amount], index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium text-gray-900">{category}</span>
                    <span className="font-bold text-red-700 flex items-center gap-1">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                      {amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {Object.keys(expensesByCategory).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No expenses recorded</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ledgerEntries.slice(0, 5).map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{entry.description}</p>
                      <p className="text-sm text-gray-500">{entry.transaction_date}</p>
                    </div>
                    <Badge className={entry.entry_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      <span className="flex items-center gap-1">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                        {entry.amount}
                      </span>
                    </Badge>
                  </div>
                ))}
                {ledgerEntries.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
