import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Plus, Edit, Trash2, Clock, DollarSign, Users, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Packages() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    yacht_id: "",
    package_name: "",
    package_type: "private",
    duration_hours: "",
    base_price: "",
    description: "",
    max_guests: ""
  });

  const queryClient = useQueryClient();

  const { data: packages = [] } = useQuery({
    queryKey: ['packages'],
    queryFn: () => base44.entities.Package.list('-created_date')
  });

  const { data: yachts = [] } = useQuery({
    queryKey: ['yachts'],
    queryFn: () => base44.entities.Yacht.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = currentUser?.role === 'admin';

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Package.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Package.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Package.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
    }
  });

  const resetForm = () => {
    setFormData({
      yacht_id: "",
      package_name: "",
      package_type: "private",
      duration_hours: "",
      base_price: "",
      description: "",
      max_guests: ""
    });
    setEditingPackage(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      duration_hours: parseFloat(formData.duration_hours),
      base_price: parseFloat(formData.base_price),
      max_guests: formData.max_guests ? parseInt(formData.max_guests) : undefined
    };
    
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      yacht_id: pkg.yacht_id,
      package_name: pkg.package_name,
      package_type: pkg.package_type,
      duration_hours: pkg.duration_hours.toString(),
      base_price: pkg.base_price.toString(),
      description: pkg.description || "",
      max_guests: pkg.max_guests?.toString() || ""
    });
    setIsDialogOpen(true);
  };

  const getYachtName = (yachtId) => {
    const yacht = yachts.find(y => y.id === yachtId);
    return yacht?.yacht_name || 'Unknown';
  };

  const typeColors = {
    private: "bg-purple-100 text-purple-800 border-purple-200",
    shared: "bg-blue-100 text-blue-800 border-blue-200",
    sunset: "bg-orange-100 text-orange-800 border-orange-200"
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Packages</h1>
            <p className="text-gray-600">Manage yacht packages and pricing</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Package
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="hover:shadow-xl transition-all duration-300 border-none">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">{pkg.package_name}</CardTitle>
                  <Badge className={`${typeColors[pkg.package_type]} border`}>
                    {pkg.package_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Ship className="w-4 h-4" />
                  <span>{getYachtName(pkg.yacht_id)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Price</span>
                    </div>
                    <span className="font-bold text-lg text-blue-700">${pkg.base_price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{pkg.duration_hours} hours</span>
                    </div>
                    {pkg.max_guests && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{pkg.max_guests} guests</span>
                      </div>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(pkg)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(pkg.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No packages yet</h3>
            <p className="text-gray-500">Create your first package</p>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Add New Package'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Yacht *</Label>
                <Select value={formData.yacht_id} onValueChange={(value) => setFormData({...formData, yacht_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select yacht" />
                  </SelectTrigger>
                  <SelectContent>
                    {yachts.map((yacht) => (
                      <SelectItem key={yacht.id} value={yacht.id}>
                        {yacht.yacht_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Package Name *</Label>
                <Input
                  value={formData.package_name}
                  onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Package Type *</Label>
                  <Select value={formData.package_type} onValueChange={(value) => setFormData({...formData, package_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="sunset">Sunset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (hours) *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Base Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    required
                    disabled={!isAdmin}
                  />
                  {!isAdmin && <p className="text-xs text-red-600 mt-1">Admin only</p>}
                </div>
                <div>
                  <Label>Max Guests</Label>
                  <Input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({...formData, max_guests: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingPackage ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}