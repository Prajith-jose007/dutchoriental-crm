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
import { UserCog, Plus, Edit, Trash2, Mail, Phone, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Employees() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    employee_code: `EMP${Date.now()}`,
    name: "",
    dob: "",
    visa_type: "",
    visa_status: "valid",
    visa_expiry: "",
    joining_date: "",
    designation: "",
    department: "operations",
    basic_salary: "",
    allowance: "0",
    accommodation_allowance: "0",
    sales_commission: "0",
    bar_commission: "0",
    paid_leaves: "21",
    overtime_rate: "0",
    phone: "",
    email: "",
    status: "active"
  });

  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    }
  });

  const resetForm = () => {
    setFormData({
      employee_code: `EMP${Date.now()}`,
      name: "",
      dob: "",
      visa_type: "",
      visa_status: "valid",
      visa_expiry: "",
      joining_date: "",
      designation: "",
      department: "operations",
      basic_salary: "",
      allowance: "0",
      accommodation_allowance: "0",
      sales_commission: "0",
      bar_commission: "0",
      paid_leaves: "21",
      overtime_rate: "0",
      phone: "",
      email: "",
      status: "active"
    });
    setEditingEmployee(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      basic_salary: parseFloat(formData.basic_salary),
      allowance: parseFloat(formData.allowance),
      accommodation_allowance: parseFloat(formData.accommodation_allowance),
      sales_commission: parseFloat(formData.sales_commission),
      bar_commission: parseFloat(formData.bar_commission),
      paid_leaves: parseInt(formData.paid_leaves),
      overtime_rate: parseFloat(formData.overtime_rate)
    };
    
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_code: employee.employee_code,
      name: employee.name,
      dob: employee.dob || "",
      visa_type: employee.visa_type || "",
      visa_status: employee.visa_status,
      visa_expiry: employee.visa_expiry || "",
      joining_date: employee.joining_date,
      designation: employee.designation,
      department: employee.department,
      basic_salary: employee.basic_salary.toString(),
      allowance: employee.allowance?.toString() || "0",
      accommodation_allowance: employee.accommodation_allowance?.toString() || "0",
      sales_commission: employee.sales_commission?.toString() || "0",
      bar_commission: employee.bar_commission?.toString() || "0",
      paid_leaves: employee.paid_leaves?.toString() || "21",
      overtime_rate: employee.overtime_rate?.toString() || "0",
      phone: employee.phone || "",
      email: employee.email || "",
      status: employee.status
    });
    setIsDialogOpen(true);
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    terminated: "bg-red-100 text-red-800"
  };

  const visaStatusColors = {
    valid: "bg-green-100 text-green-800",
    expired: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    not_applicable: "bg-gray-100 text-gray-800"
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employees</h1>
            <p className="text-gray-600">Manage employee information</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Visa Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-gray-500">{employee.employee_code}</p>
                            {employee.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {employee.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.designation}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {employee.department.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span>{employee.joining_date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-semibold">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span>{employee.basic_salary}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={visaStatusColors[employee.visa_status]}>
                          {employee.visa_status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[employee.status]}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(employee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {employees.length === 0 && (
              <div className="text-center py-20">
                <UserCog className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No employees yet</h3>
                <p className="text-gray-500">Add your first employee</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Code</Label>
                  <Input value={formData.employee_code} disabled />
                </div>
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Joining Date *</Label>
                  <Input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Designation *</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Visa Type</Label>
                  <Input
                    value={formData.visa_type}
                    onChange={(e) => setFormData({...formData, visa_type: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Visa Status</Label>
                  <Select value={formData.visa_status} onValueChange={(value) => setFormData({...formData, visa_status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="not_applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visa Expiry</Label>
                  <Input
                    type="date"
                    value={formData.visa_expiry}
                    onChange={(e) => setFormData({...formData, visa_expiry: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Salary & Benefits</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Basic Salary *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Allowance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.allowance}
                      onChange={(e) => setFormData({...formData, allowance: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Accommodation Allowance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.accommodation_allowance}
                      onChange={(e) => setFormData({...formData, accommodation_allowance: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label>Sales Commission</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sales_commission}
                      onChange={(e) => setFormData({...formData, sales_commission: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Bar Commission</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.bar_commission}
                      onChange={(e) => setFormData({...formData, bar_commission: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Paid Leaves (Days)</Label>
                    <Input
                      type="number"
                      value={formData.paid_leaves}
                      onChange={(e) => setFormData({...formData, paid_leaves: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Overtime Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({...formData, overtime_rate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingEmployee ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}