
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FinancialReports() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    report_period: "",
    month: "",
    year: new Date().getFullYear().toString(),
    total_income: "0",
    crm_income: "0",
    pos_income: "0",
    other_income: "0",
    total_expenses: "0",
    payroll_expenses: "0",
    purchase_expenses: "0",
    operational_expenses: "0",
    generated_date: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['financialReports'],
    queryFn: () => base44.entities.FinancialReport.list('-year')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['financialReports']);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      report_period: "",
      month: "",
      year: new Date().getFullYear().toString(),
      total_income: "0",
      crm_income: "0",
      pos_income: "0",
      other_income: "0",
      total_expenses: "0",
      payroll_expenses: "0",
      purchase_expenses: "0",
      operational_expenses: "0",
      generated_date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(false);
  };

  const calculateProfit = () => {
    const income = parseFloat(formData.total_income) || 0;
    const expenses = parseFloat(formData.total_expenses) || 0;
    return income - expenses;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const profit = calculateProfit();
    const data = {
      ...formData,
      report_period: `${formData.month} ${formData.year}`,
      year: parseInt(formData.year),
      total_income: parseFloat(formData.total_income),
      crm_income: parseFloat(formData.crm_income),
      pos_income: parseFloat(formData.pos_income),
      other_income: parseFloat(formData.other_income),
      total_expenses: parseFloat(formData.total_expenses),
      payroll_expenses: parseFloat(formData.payroll_expenses),
      purchase_expenses: parseFloat(formData.purchase_expenses),
      operational_expenses: parseFloat(formData.operational_expenses),
      profit: profit
    };
    createMutation.mutate(data);
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const profit = calculateProfit();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Reports</h1>
            <p className="text-gray-600">View monthly financial summaries</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Total Income (All Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-green-700 flex items-center gap-1">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-6 h-6 inline-block" />
                  {reports.reduce((sum, r) => sum + (r.total_income || 0), 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Total Expenses (All Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-8 h-8 text-red-600" />
                <span className="text-3xl font-bold text-red-700 flex items-center gap-1">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-6 h-6 inline-block" />
                  {reports.reduce((sum, r) => sum + (r.total_expenses || 0), 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Net Profit (All Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-700 flex items-center gap-1">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-6 h-6 inline-block" />
                  {reports.reduce((sum, r) => sum + (r.profit || 0), 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Period</TableHead>
                  <TableHead>Total Income</TableHead>
                  <TableHead>Total Expenses</TableHead>
                  <TableHead>Profit/Loss</TableHead>
                  <TableHead>Generated On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{report.report_period}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                        {report.total_income.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-red-600 font-semibold">
                        <TrendingDown className="w-4 h-4" />
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                        {report.total_expenses.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={report.profit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        <DollarSign className="w-3 h-3 mr-1" />
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block mr-1" />
                        {report.profit >= 0 ? '+' : ''}{report.profit.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.generated_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {reports.length === 0 && (
              <div className="text-center py-20">
                <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No reports yet</h3>
                <p className="text-gray-500">Generate your first financial report</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Financial Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Month *</Label>
                  <Select value={formData.month} onValueChange={(value) => setFormData({...formData, month: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year *</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-green-700">Income Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CRM Income</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.crm_income}
                      onChange={(e) => setFormData({...formData, crm_income: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>POS Income</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.pos_income}
                      onChange={(e) => setFormData({...formData, pos_income: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Other Income</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.other_income}
                      onChange={(e) => setFormData({...formData, other_income: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Total Income *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.total_income}
                      onChange={(e) => setFormData({...formData, total_income: e.target.value})}
                      required
                      className="font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-red-700">Expense Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payroll Expenses</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.payroll_expenses}
                      onChange={(e) => setFormData({...formData, payroll_expenses: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Purchase Expenses</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.purchase_expenses}
                      onChange={(e) => setFormData({...formData, purchase_expenses: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Operational Expenses</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.operational_expenses}
                      onChange={(e) => setFormData({...formData, operational_expenses: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Total Expenses *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.total_expenses}
                      onChange={(e) => setFormData({...formData, total_expenses: e.target.value})}
                      required
                      className="font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 bg-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Profit/Loss</p>
                  <p className={`text-4xl font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'} flex items-center justify-center gap-2`}>
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-8 h-8 inline-block" />
                    {profit.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Generate Report
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
