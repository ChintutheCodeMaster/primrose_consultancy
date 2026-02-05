import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAllCountryOptions, CountryOption } from '@/hooks/useCountryOptions';

export function CountryOptionsManager() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  
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
      toast.success('המדינה נוספה בהצלחה');
      setIsAddOpen(false);
      setNewCountryName('');
    },
    onError: () => {
      toast.error('שגיאה בהוספת המדינה');
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
      toast.error('שגיאה בעדכון המדינה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('country_options').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-options'] });
      queryClient.invalidateQueries({ queryKey: ['country-options-all'] });
      toast.success('המדינה נמחקה');
    },
    onError: () => {
      toast.error('שגיאה במחיקת המדינה');
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
      toast.error('שגיאה בשינוי הסדר');
    },
  });

  const handleAdd = () => {
    if (!newCountryName.trim()) {
      toast.error('יש להזין שם מדינה');
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
          <CardTitle>מדינות</CardTitle>
          <CardDescription>ניהול רשימת מדינות עבור לידים וסטודנטים</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" />
              הוסף מדינה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת מדינה חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input 
                placeholder="שם המדינה"
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
              />
              <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full">
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                הוסף
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מדינה</TableHead>
              <TableHead className="w-24">פעיל</TableHead>
              <TableHead className="w-24">הזז</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((country, index) => (
              <TableRow key={country.id} className={!country.is_active ? 'opacity-50' : ''}>
                <TableCell>{country.name}</TableCell>
                <TableCell>
                  <Switch
                    checked={country.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: country.id, isActive: checked })
                    }
                    disabled={toggleActiveMutation.isPending}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reorderMutation.mutate({ id: country.id, direction: 'up' })}
                      disabled={index === 0 || reorderMutation.isPending}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reorderMutation.mutate({ id: country.id, direction: 'down' })}
                      disabled={index === countries.length - 1 || reorderMutation.isPending}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(country.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {countries.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  אין מדינות
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-4">
          💡 מדינות לא פעילות לא יופיעו ברשימת הבחירה, אבל יישארו מוצגות על רשומות קיימות
        </p>
      </CardContent>
    </Card>
  );
}
