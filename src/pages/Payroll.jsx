import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Plus, DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Payroll() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    month: "",
    year: new Date().getFullYear().toString(),
    basic_salary: "",
    allowance: "0",
    accommodation_allowance: "0",
    sales_commission: "0",
    bar_commission: "0",
    overtime_amount: "0",
    deductions: "0",
    advance_salary: "0",
    absent_deduction: "0",
    payment_status: "pending",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => base44.entities.Payroll.list('-created_date')
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Payroll.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payroll.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrolls']);
    }
  });

  const resetForm = () => {
    setFormData({
      employee_id: "",
      month: "",
      year: new Date().getFullYear().toString(),
      basic_salary: "",
      allowance: "0",
      accommodation_allowance: "0",
      sales_commission: "0",
      bar_commission: "0",
      overtime_amount: "0",
      deductions: "0",
      advance_salary: "0",
      absent_deduction: "0",
      payment_status: "pending",
      notes: ""
    });
    setIsDialogOpen(false);
  };

  const calculateTotals = () => {
    const earnings = parseFloat(formData.basic_salary || 0) +
      parseFloat(formData.allowance || 0) +
      parseFloat(formData.accommodation_allowance || 0) +
      parseFloat(formData.sales_commission || 0) +
      parseFloat(formData.bar_commission || 0) +
      parseFloat(formData.overtime_amount || 0);

    const totalDeductions = parseFloat(formData.deductions || 0) +
      parseFloat(formData.advance_salary || 0) +
      parseFloat(formData.absent_deduction || 0);

    return {
      total_earnings: earnings,
      total_deductions: totalDeductions,
      net_salary: earnings - totalDeductions
    };
  };

  const handleEmployeeChange = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setFormData({
        ...formData,
        employee_id: employeeId,
        basic_salary: employee.basic_salary.toString(),
        allowance: employee.allowance?.toString() || "0",
        accommodation_allowance: employee.accommodation_allowance?.toString() || "0",
        sales_commission: employee.sales_commission?.toString() || "0",
        bar_commission: employee.bar_commission?.toString() || "0"
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totals = calculateTotals();
    const data = {
      ...formData,
      year: parseInt(formData.year),
      basic_salary: parseFloat(formData.basic_salary),
      allowance: parseFloat(formData.allowance),
      accommodation_allowance: parseFloat(formData.accommodation_allowance),
      sales_commission: parseFloat(formData.sales_commission),
      bar_commission: parseFloat(formData.bar_commission),
      overtime_amount: parseFloat(formData.overtime_amount),
      deductions: parseFloat(formData.deductions),
      advance_salary: parseFloat(formData.advance_salary),
      absent_deduction: parseFloat(formData.absent_deduction),
      total_earnings: totals.total_earnings,
      total_deductions: totals.total_deductions,
      net_salary: totals.net_salary
    };
    createMutation.mutate(data);
  };

  const markAsPaid = (payroll) => {
    updateMutation.mutate({
      id: payroll.id,
      data: { payment_status: 'paid', payment_date: new Date().toISOString().split('T')[0] }
    });
  };

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'N/A';

  const getEmployee = (id) => employees.find(e => e.id === id);

  const downloadSalarySlip = (payroll) => {
    const employee = getEmployee(payroll.employee_id);
    if (!employee) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Slip - ${employee.name}</title>
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1E40AF;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1E40AF;
            margin-bottom: 5px;
          }
          .slip-title {
            font-size: 22px;
            font-weight: bold;
            color: #374151;
          }
          .employee-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
            padding: 20px;
            background: #F3F4F6;
            border-radius: 8px;
          }
          .info-item {
            display: flex;
          }
          .info-label {
            font-weight: 600;
            color: #4B5563;
            min-width: 140px;
          }
          .info-value {
            color: #111827;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            padding: 10px 15px;
            margin-bottom: 15px;
            border-radius: 6px;
          }
          .earnings-title {
            background: #D1FAE5;
            color: #065F46;
          }
          .deductions-title {
            background: #FEE2E2;
            color: #991B1B;
          }
          .summary-title {
            background: #DBEAFE;
            color: #1E40AF;
          }
          .line-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            border-bottom: 1px solid #E5E7EB;
          }
          .line-item:last-child {
            border-bottom: none;
          }
          .line-label {
            color: #4B5563;
          }
          .line-value {
            font-weight: 600;
            color: #111827;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            padding: 15px;
            background: #F9FAFB;
            font-weight: bold;
            margin-top: 10px;
            border-radius: 6px;
          }
          .net-salary {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            background: #1E40AF;
            color: white;
            font-size: 20px;
            font-weight: bold;
            border-radius: 8px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">DutchOriental</div>
          <div class="slip-title">SALARY SLIP</div>
        </div>

        <div class="employee-info">
          <div class="info-item">
            <span class="info-label">Employee Name:</span>
            <span class="info-value">${employee.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Employee Code:</span>
            <span class="info-value">${employee.employee_code || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Designation:</span>
            <span class="info-value">${employee.designation}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Department:</span>
            <span class="info-value">${employee.department}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Pay Period:</span>
            <span class="info-value">${payroll.month} ${payroll.year}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Payment Date:</span>
            <span class="info-value">${payroll.payment_date || 'Pending'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title earnings-title">EARNINGS</div>
          <div class="line-item">
            <span class="line-label">Basic Salary</span>
            <span class="line-value">AED ${payroll.basic_salary.toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span class="line-label">Allowance</span>
            <span class="line-value">AED ${(payroll.allowance || 0).toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span class="line-label">Accommodation Allowance</span>
            <span class="line-value">AED ${(payroll.accommodation_allowance || 0).toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span class="line-label">Sales Commission</span>
            <span class="line-value">AED ${(payroll.sales_commission || 0).toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span class="line-label">Bar Commission</span>
            <span class="line-value">AED ${(payroll.bar_commission || 0).toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span class="line-label">Overtime Amount</span>
            <span class="line-value">AED ${(payroll.overtime_amount || 0).toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>TOTAL EARNINGS</span>
            <span>AED ${payroll.total_earnings.toFixed(2)}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title deductions-title">DEDUCTIONS</div>
          <div class="line-item">
            <span class="line-label">Other Deductions</span>
            <span class="line-value">AED ${(payroll.deductions || 0).toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span class="line-label">Advance Salary</span>
            <span class="line-value">AED ${(payroll.advance_salary || 0).toFixed(2)}</span>
          </div>
          <div class="line-item">
            <span class="line-label">Absent Deduction</span>
            <span class="line-value">AED ${(payroll.absent_deduction || 0).toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>TOTAL DEDUCTIONS</span>
            <span>AED ${payroll.total_deductions.toFixed(2)}</span>
          </div>
        </div>

        <div class="net-salary">
          <span>NET SALARY</span>
          <span>AED ${payroll.net_salary.toFixed(2)}</span>
        </div>

        ${payroll.notes ? `<div style="margin-top: 20px; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;"><strong>Notes:</strong> ${payroll.notes}</div>` : ''}

        <div class="footer">
          Generated on ${new Date().toLocaleString()}<br>
          This is a computer-generated document and does not require a signature.
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    hold: "bg-red-100 text-red-800"
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const totals = calculateTotals();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll</h1>
            <p className="text-gray-600">Manage employee payroll</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Payroll
          </Button>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => (
                    <TableRow key={payroll.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{getEmployeeName(payroll.employee_id)}</TableCell>
                      <TableCell>{payroll.month} {payroll.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-semibold flex items-center gap-1">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                            {payroll.total_earnings}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="font-semibold flex items-center gap-1">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-3 h-3 inline-block" />
                            {payroll.total_deductions}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-bold text-lg">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          <span className="flex items-center gap-1">
                            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-4 h-4 inline-block" />
                            {payroll.net_salary}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[payroll.payment_status]}>
                          {payroll.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadSalarySlip(payroll)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          {payroll.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => markAsPaid(payroll)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {payrolls.length === 0 && (
              <div className="text-center py-20">
                <CreditCard className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No payroll records</h3>
                <p className="text-gray-500">Generate your first payroll</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Payroll</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label>Employee *</Label>
                  <Select value={formData.employee_id} onValueChange={handleEmployeeChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(e => e.status === 'active').map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Month *</Label>
                  <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })} required>
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
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-green-700">Earnings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Basic Salary *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Allowance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.allowance}
                      onChange={(e) => setFormData({ ...formData, allowance: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Accommodation</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.accommodation_allowance}
                      onChange={(e) => setFormData({ ...formData, accommodation_allowance: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Sales Commission</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sales_commission}
                      onChange={(e) => setFormData({ ...formData, sales_commission: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Bar Commission</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.bar_commission}
                      onChange={(e) => setFormData({ ...formData, bar_commission: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Overtime Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.overtime_amount}
                      onChange={(e) => setFormData({ ...formData, overtime_amount: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-red-700">Deductions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Other Deductions</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.deductions}
                      onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Advance Salary</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.advance_salary}
                      onChange={(e) => setFormData({ ...formData, advance_salary: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Absent Deduction</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.absent_deduction}
                      onChange={(e) => setFormData({ ...formData, absent_deduction: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-700 flex items-center justify-center gap-1">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
                      {totals.total_earnings.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
                    <p className="text-2xl font-bold text-red-700 flex items-center justify-center gap-1">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-5 h-5 inline-block" />
                      {totals.total_deductions.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Net Salary</p>
                    <p className="text-3xl font-bold text-blue-700 flex items-center justify-center gap-1">
                      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6916e4a317df6f6f7ced1411/53f6fbda6_image.png" alt="AED" className="w-6 h-6 inline-block" />
                      {totals.net_salary.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Payment Status</Label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Generate Payroll
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}