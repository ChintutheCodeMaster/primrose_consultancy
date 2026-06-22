import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAllCountryOptions, CountryOption } from '@/hooks/useCountryOptions';

export function CountryOptionsManager() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { data: countries = [], isLoading } = useAllCountryOptions();

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = countries.length > 0 ? Math.max(...countries.map(c => c.sort_order)) : 0;
      const { error } = await supabase.from('country_options').insert({
        name,
        is_active: true,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-options'] });
      queryClient.invalidateQueries({ queryKey: ['country-options-all'] });
      toast.success('Country added successfully');
      setIsAddOpen(false);
      setNewCountryName('');
    },
    onError: () => {
      toast.error('Error adding country');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('country_options')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-options'] });
      queryClient.invalidateQueries({ queryKey: ['country-options-all'] });
    },
    onError: () => {
      toast.error('Error updating country');
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('country_options')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-options'] });
      queryClient.invalidateQueries({ queryKey: ['country-options-all'] });
      toast.success('Country renamed');
      setEditingId(null);
      setEditingName('');
    },
    onError: () => {
      toast.error('Error renaming country');
    },
  });

  const startEdit = (country: CountryOption) => {
    setEditingId(country.id);
    setEditingName(country.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = () => {
    const trimmed = editingName.trim();
    if (!editingId || !trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    renameMutation.mutate({ id: editingId, name: trimmed });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('country_options').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-options'] });
      queryClient.invalidateQueries({ queryKey: ['country-options-all'] });
      toast.success('Country deleted');
    },
    onError: () => {
      toast.error('Error deleting country');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const currentIndex = countries.findIndex(c => c.id === id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= countries.length) return;
      
      const current = countries[currentIndex];
      const target = countries[targetIndex];
      
      await supabase.from('country_options').update({ sort_order: target.sort_order }).eq('id', current.id);
      await supabase.from('country_options').update({ sort_order: current.sort_order }).eq('id', target.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-options'] });
      queryClient.invalidateQueries({ queryKey: ['country-options-all'] });
    },
    onError: () => {
      toast.error('Error reordering');
    },
  });

  const handleAdd = () => {
    if (!newCountryName.trim()) {
      toast.error('Please enter a country name');
      return;
    }
    addMutation.mutate(newCountryName.trim());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Countries</CardTitle>
          <CardDescription>Manage the list of countries for Leads and Students</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Country
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Country</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input 
                placeholder="Country Name"
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
              />
              <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full">
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead className="w-24">Active</TableHead>
              <TableHead className="w-24">Move</TableHead>
              <TableHead className="w-16"></TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((country, index) => (
              <TableRow key={country.id} className={!country.is_active ? 'opacity-50' : ''}>
                <TableCell>
                  {editingId === country.id ? (
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      disabled={renameMutation.isPending}
                      className="h-8"
                    />
                  ) : (
                    country.name
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={country.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: country.id, isActive: checked })
                    }
                    disabled={toggleActiveMutation.isPending || editingId === country.id}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reorderMutation.mutate({ id: country.id, direction: 'up' })}
                      disabled={index === 0 || reorderMutation.isPending || editingId === country.id}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reorderMutation.mutate({ id: country.id, direction: 'down' })}
                      disabled={index === countries.length - 1 || reorderMutation.isPending || editingId === country.id}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {editingId === country.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={saveEdit}
                        disabled={renameMutation.isPending}
                        title="Save"
                      >
                        {renameMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-success" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelEdit}
                        disabled={renameMutation.isPending}
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(country)}
                      disabled={editingId !== null}
                      title="Rename"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(country.id)}
                    disabled={deleteMutation.isPending || editingId === country.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {countries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No countries
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-4">
          💡 Inactive countries will not appear in the selection list, but will remain visible on existing records.
        </p>
      </CardContent>
    </Card>
  );
}
