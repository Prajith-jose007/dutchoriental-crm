import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ship, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Yachts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState(null);
  const [formData, setFormData] = useState({
    yacht_name: '',
    cruise_type: 'shared',
    capacity: '',
    description: '',
    status: 'active',
    private_price: '0',
    shared_packages: {
      adult: '0',
      child: '0',
      alcohol_adult: '0',
      top_deck_child: '0',
      top_deck_adult: '0',
      top_deck_adult_alcohol: '0',
      child_vip: '0',
      adult_vip: '0',
      adult_alcohol_vip: '0',
      royal_child: '0',
      royal_adult: '0',
      royal_adult_alcohol: '0'
    }
  });

  const queryClient = useQueryClient();

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
    mutationFn: (data) => base44.entities.Yacht.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['yachts']);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Yacht.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['yachts']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Yacht.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['yachts']);
    }
  });

  const resetForm = () => {
    setFormData({
      yacht_name: '',
      cruise_type: 'shared',
      capacity: '',
      description: '',
      status: 'active',
      private_price: '0',
      shared_packages: {
        adult: '0',
        child: '0',
        alcohol_adult: '0',
        top_deck_child: '0',
        top_deck_adult: '0',
        top_deck_adult_alcohol: '0',
        child_vip: '0',
        adult_vip: '0',
        adult_alcohol_vip: '0',
        royal_child: '0',
        royal_adult: '0',
        royal_adult_alcohol: '0'
      }
    });
    setEditingYacht(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      yacht_name: formData.yacht_name,
      cruise_type: formData.cruise_type,
      capacity: parseInt(formData.capacity),
      description: formData.description,
      status: formData.status,
      private_price: parseFloat(formData.private_price),
      shared_packages: {
        adult: parseFloat(formData.shared_packages.adult),
        child: parseFloat(formData.shared_packages.child),
        alcohol_adult: parseFloat(formData.shared_packages.alcohol_adult),
        top_deck_child: parseFloat(formData.shared_packages.top_deck_child),
        top_deck_adult: parseFloat(formData.shared_packages.top_deck_adult),
        top_deck_adult_alcohol: parseFloat(formData.shared_packages.top_deck_adult_alcohol),
        child_vip: parseFloat(formData.shared_packages.child_vip),
        adult_vip: parseFloat(formData.shared_packages.adult_vip),
        adult_alcohol_vip: parseFloat(formData.shared_packages.adult_alcohol_vip),
        royal_child: parseFloat(formData.shared_packages.royal_child),
        royal_adult: parseFloat(formData.shared_packages.royal_adult),
        royal_adult_alcohol: parseFloat(formData.shared_packages.royal_adult_alcohol)
      }
    };

    if (editingYacht) {
      updateMutation.mutate({ id: editingYacht.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (yacht) => {
    setEditingYacht(yacht);
    setFormData({
      yacht_name: yacht.yacht_name,
      cruise_type: yacht.cruise_type,
      capacity: yacht.capacity?.toString() || '',
      description: yacht.description || '',
      status: yacht.status,
      private_price: yacht.private_price?.toString() || '0',
      shared_packages: {
        adult: yacht.shared_packages?.adult?.toString() || '0',
        child: yacht.shared_packages?.child?.toString() || '0',
        alcohol_adult: yacht.shared_packages?.alcohol_adult?.toString() || '0',
        top_deck_child: yacht.shared_packages?.top_deck_child?.toString() || '0',
        top_deck_adult: yacht.shared_packages?.top_deck_adult?.toString() || '0',
        top_deck_adult_alcohol: yacht.shared_packages?.top_deck_adult_alcohol?.toString() || '0',
        child_vip: yacht.shared_packages?.child_vip?.toString() || '0',
        adult_vip: yacht.shared_packages?.adult_vip?.toString() || '0',
        adult_alcohol_vip: yacht.shared_packages?.adult_alcohol_vip?.toString() || '0',
        royal_child: yacht.shared_packages?.royal_child?.toString() || '0',
        royal_adult: yacht.shared_packages?.royal_adult?.toString() || '0',
        royal_adult_alcohol: yacht.shared_packages?.royal_adult_alcohol?.toString() || '0'
      }
    });
    setIsDialogOpen(true);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    maintenance: 'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yachts & Packages</h1>
            <p className="text-gray-600">Manage yacht fleet with integrated pricing</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Yacht
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {yachts.map((yacht) => (
            <Card key={yacht.id} className="border-none shadow-lg hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{yacht.yacht_name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-blue-100 text-blue-700 capitalize">
                        {yacht.cruise_type}
                      </Badge>
                      <Badge className={statusColors[yacht.status]}>
                        {yacht.status}
                      </Badge>
                    </div>
                  </div>
                  <Ship className="w-8 h-8 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{yacht.description || 'No description'}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-semibold">{yacht.capacity} guests</span>
                  </div>
                  {yacht.cruise_type === 'private' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Private Price:</span>
                      <span className="font-semibold">${yacht.private_price}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(yacht)}
                    className="flex-1"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(yacht.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {yachts.length === 0 && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-20 text-center">
              <Ship className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No yachts yet</h3>
              <p className="text-gray-500">Add your first yacht to get started</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingYacht ? 'Edit Yacht' : 'Add New Yacht'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Yacht Name *</Label>
                  <Input
                    value={formData.yacht_name}
                    onChange={(e) => setFormData({...formData, yacht_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Cruise Type *</Label>
                  <Select value={formData.cruise_type} onValueChange={(value) => setFormData({...formData, cruise_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Capacity *</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
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
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <Tabs defaultValue={formData.cruise_type} value={formData.cruise_type}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="shared">Shared Packages</TabsTrigger>
                  <TabsTrigger value="private">Private Pricing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="shared" className="space-y-4">
                  {!isAdmin && <p className="text-xs text-red-600 mb-2">Pricing fields are admin-only</p>}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Adult</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.adult}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, adult: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Child</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.child}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, child: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Alcohol Adult</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.alcohol_adult}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, alcohol_adult: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Top Deck Child</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.top_deck_child}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, top_deck_child: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Top Deck Adult</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.top_deck_adult}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, top_deck_adult: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Top Deck Adult Alcohol</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.top_deck_adult_alcohol}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, top_deck_adult_alcohol: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Child VIP</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.child_vip}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, child_vip: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Adult VIP</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.adult_vip}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, adult_vip: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Adult Alcohol VIP</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.adult_alcohol_vip}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, adult_alcohol_vip: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Royal Child</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.royal_child}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, royal_child: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Royal Adult</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.royal_adult}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, royal_adult: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Royal Adult Alcohol</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shared_packages.royal_adult_alcohol}
                        onChange={(e) => setFormData({
                          ...formData,
                          shared_packages: {...formData.shared_packages, royal_adult_alcohol: e.target.value}
                        })}
                        disabled={!isAdmin}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="private">
                  <div>
                    <Label>Private Cruise Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.private_price}
                      onChange={(e) => setFormData({...formData, private_price: e.target.value})}
                      disabled={!isAdmin}
                    />
                    {!isAdmin && <p className="text-xs text-red-600 mt-1">Admin only</p>}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingYacht ? 'Update' : 'Create'} Yacht
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}