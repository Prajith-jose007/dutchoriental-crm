import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users as UsersIcon, Shield, Edit, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function Users() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    designation: "",
    app_access: [],
    phone: "",
    department: "",
    status: "active"
  });
  const [createFormData, setCreateFormData] = useState({
    email: "",
    full_name: "",
    designation: "",
    department: "",
    app_access: [],
    phone: "",
    role: "user",
    password: ""
  });

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      resetForm();
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.User.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      resetCreateForm();
    }
  });

  const resetForm = () => {
    setFormData({
      designation: "",
      app_access: [],
      phone: "",
      department: "",
      status: "active"
    });
    setEditingUser(null);
    setIsDialogOpen(false);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      email: "",
      full_name: "",
      designation: "",
      department: "",
      app_access: [],
      phone: "",
      role: "user",
      password: ""
    });
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      designation: user.designation || "",
      app_access: user.app_access || [],
      phone: user.phone || "",
      department: user.department || "",
      status: user.status || "active"
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingUser.id,
      data: formData
    });
  };

  const toggleAppAccess = (module) => {
    const newAccess = formData.app_access.includes(module)
      ? formData.app_access.filter(m => m !== module)
      : [...formData.app_access, module];
    setFormData({ ...formData, app_access: newAccess });
  };

  const toggleCreateAppAccess = (module) => {
    const newAccess = createFormData.app_access.includes(module)
      ? createFormData.app_access.filter(m => m !== module)
      : [...createFormData.app_access, module];
    setCreateFormData({ ...createFormData, app_access: newAccess });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(createFormData);
  };

  const designationColors = {
    owner: "bg-purple-100 text-purple-800",
    manager: "bg-blue-100 text-blue-800",
    sales_manager: "bg-green-100 text-green-800",
    sales_executive: "bg-teal-100 text-teal-800",
    accountant: "bg-yellow-100 text-yellow-800",
    inventory_manager: "bg-orange-100 text-orange-800",
    hr_manager: "bg-pink-100 text-pink-800",
    pos_operator: "bg-indigo-100 text-indigo-800",
    operations_staff: "bg-gray-100 text-gray-800"
  };

  const roleColors = {
    admin: "bg-red-100 text-red-800",
    user: "bg-blue-100 text-blue-800"
  };

  const modules = [
    { id: "crm", label: "CRM" },
    { id: "purchase", label: "Purchase & Inventory" },
    { id: "hrms", label: "HRMS & Payroll" },
    { id: "pos", label: "POS System" },
    { id: "accounts", label: "Accounts" }
  ];

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage user access and permissions</p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          )}
        </div>

        {!isAdmin && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-900">Only administrators can manage users</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>App Access</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.designation ? (
                          <Badge className={designationColors[user.designation]}>
                            {user.designation.replace('_', ' ')}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{user.department || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.app_access?.length > 0 ? (
                            user.app_access.map((app) => (
                              <Badge key={app} variant="outline" className="text-xs">
                                {app.toUpperCase()}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No access</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {user.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-20">
                <UsersIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No users yet</h3>
                <p className="text-gray-500">Invite users through the platform</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User Access & Permissions</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900 mb-1">
                  <strong>User:</strong> {editingUser?.full_name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Email:</strong> {editingUser?.email}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>System Role:</strong> {editingUser?.role}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Designation *</Label>
                  <Select value={formData.designation} onValueChange={(value) => setFormData({ ...formData, designation: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales_manager">Sales Manager</SelectItem>
                      <SelectItem value="sales_executive">Sales Executive</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                      <SelectItem value="pos_operator">POS Operator</SelectItem>
                      <SelectItem value="operations_staff">Operations Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="accounts">Accounts</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <Label>Application Access *</Label>
                <Card className="mt-2">
                  <CardContent className="p-4 space-y-3">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={module.id}
                          checked={formData.app_access.includes(module.id)}
                          onCheckedChange={() => toggleAppAccess(module.id)}
                        />
                        <label
                          htmlFor={module.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {module.label}
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Update User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={createFormData.full_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  required
                  placeholder="Set initial password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Designation *</Label>
                  <Select value={createFormData.designation} onValueChange={(value) => setCreateFormData({ ...createFormData, designation: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="sales_manager">Sales Manager</SelectItem>
                      <SelectItem value="sales_executive">Sales Executive</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                      <SelectItem value="hr_manager">HR Manager</SelectItem>
                      <SelectItem value="pos_operator">POS Operator</SelectItem>
                      <SelectItem value="operations_staff">Operations Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={createFormData.department} onValueChange={(value) => setCreateFormData({ ...createFormData, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="accounts">Accounts</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div>
                  <Label>System Role *</Label>
                  <Select value={createFormData.role} onValueChange={(value) => setCreateFormData({ ...createFormData, role: value })} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Application Access *</Label>
                <Card className="mt-2">
                  <CardContent className="p-4 space-y-3">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`create-${module.id}`}
                          checked={createFormData.app_access.includes(module.id)}
                          onCheckedChange={() => toggleCreateAppAccess(module.id)}
                        />
                        <label
                          htmlFor={`create-${module.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {module.label}
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetCreateForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}