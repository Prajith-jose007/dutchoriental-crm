import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Edit, Trash2, Mail, Phone, Percent, DollarSign, Download, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Agents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    agent_name: "",
    email: "",
    phone: "",
    discount_limit: "",
    commission_percentage: "",
    status: "active"
  });

  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list('-created_date')
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Agent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Agent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
    }
  });

  const resetForm = () => {
    setFormData({
      agent_name: "",
      email: "",
      phone: "",
      discount_limit: "",
      commission_percentage: "",
      status: "active"
    });
    setEditingAgent(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      discount_limit: formData.discount_limit ? parseFloat(formData.discount_limit) : undefined,
      commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : undefined
    };
    
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      agent_name: agent.agent_name,
      email: agent.email || "",
      phone: agent.phone,
      discount_limit: agent.discount_limit?.toString() || "",
      commission_percentage: agent.commission_percentage?.toString() || "",
      status: agent.status
    });
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Agent Name', 'Email', 'Phone', 'Discount Limit', 'Commission %', 'Status'],
      ...agents.map(a => [
        a.agent_name,
        a.email || '',
        a.phone,
        a.discount_limit || 0,
        a.commission_percentage || 0,
        a.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const rows = text.split('\n').slice(1);
    
    const importData = rows.filter(row => row.trim()).map(row => {
      const [agent_name, email, phone, discount_limit, commission_percentage, status] = row.split(',');
      return {
        agent_name: agent_name?.trim(),
        email: email?.trim() || undefined,
        phone: phone?.trim(),
        discount_limit: parseFloat(discount_limit) || undefined,
        commission_percentage: parseFloat(commission_percentage) || undefined,
        status: status?.trim() || 'active'
      };
    });

    for (const data of importData) {
      if (data.agent_name && data.phone) {
        await base44.entities.Agent.create(data);
      }
    }
    
    queryClient.invalidateQueries(['agents']);
    e.target.value = '';
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Agents</h1>
            <p className="text-gray-600">Manage booking agents and commissions</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <label>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => document.getElementById('import-file').click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <input
                    id="import-file"
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </>
            )}
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Discount Limit</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium">{agent.agent_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {agent.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span>{agent.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{agent.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>{agent.discount_limit || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent className="w-4 h-4 text-gray-500" />
                        <span>{agent.commission_percentage || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(agent)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(agent.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {agents.length === 0 && (
              <div className="text-center py-20">
                <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No agents yet</h3>
                <p className="text-gray-500">Add your first agent</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Agent Name *</Label>
                <Input
                  value={formData.agent_name}
                  onChange={(e) => setFormData({...formData, agent_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Limit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_limit}
                    onChange={(e) => setFormData({...formData, discount_limit: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Commission %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({...formData, commission_percentage: e.target.value})}
                  />
                </div>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingAgent ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}