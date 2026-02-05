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
import { useAllSourceOptions, SourceOption } from '@/hooks/useSourceOptions';

export function SourceOptionsManager() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  
  const { data: sources = [], isLoading } = useAllSourceOptions();

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = sources.length > 0 ? Math.max(...sources.map(s => s.sort_order)) : 0;
      const { error } = await supabase.from('source_options').insert({
        name,
        is_active: true,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-options'] });
      queryClient.invalidateQueries({ queryKey: ['source-options-all'] });
      toast.success('המקור נוסף בהצלחה');
      setIsAddOpen(false);
      setNewSourceName('');
    },
    onError: () => {
      toast.error('שגיאה בהוספת המקור');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('source_options')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-options'] });
      queryClient.invalidateQueries({ queryKey: ['source-options-all'] });
    },
    onError: () => {
      toast.error('שגיאה בעדכון המקור');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('source_options').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-options'] });
      queryClient.invalidateQueries({ queryKey: ['source-options-all'] });
      toast.success('המקור נמחק');
    },
    onError: () => {
      toast.error('שגיאה במחיקת המקור');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const currentIndex = sources.findIndex(s => s.id === id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= sources.length) return;
      
      const current = sources[currentIndex];
      const target = sources[targetIndex];
      
      await supabase.from('source_options').update({ sort_order: target.sort_order }).eq('id', current.id);
      await supabase.from('source_options').update({ sort_order: current.sort_order }).eq('id', target.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['source-options'] });
      queryClient.invalidateQueries({ queryKey: ['source-options-all'] });
    },
    onError: () => {
      toast.error('שגיאה בשינוי הסדר');
    },
  });

  const handleAdd = () => {
    if (!newSourceName.trim()) {
      toast.error('יש להזין שם מקור');
      return;
    }
    addMutation.mutate(newSourceName.trim());
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
          <CardTitle>מקורות הגעה</CardTitle>
          <CardDescription>ניהול רשימת מקורות הגעה עבור לידים וסטודנטים</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 ml-2" />
              הוסף מקור
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת מקור חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input 
                placeholder="שם המקור"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
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
              <TableHead>מקור</TableHead>
              <TableHead className="w-24">פעיל</TableHead>
              <TableHead className="w-24">הזז</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source, index) => (
              <TableRow key={source.id} className={!source.is_active ? 'opacity-50' : ''}>
                <TableCell>{source.name}</TableCell>
                <TableCell>
                  <Switch
                    checked={source.is_active}
                    onCheckedChange={(checked) => 
                      toggleActiveMutation.mutate({ id: source.id, isActive: checked })
                    }
                    disabled={toggleActiveMutation.isPending}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reorderMutation.mutate({ id: source.id, direction: 'up' })}
                      disabled={index === 0 || reorderMutation.isPending}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reorderMutation.mutate({ id: source.id, direction: 'down' })}
                      disabled={index === sources.length - 1 || reorderMutation.isPending}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(source.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sources.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  אין מקורות
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-4">
          💡 מקורות לא פעילים לא יופיעו ברשימת הבחירה, אבל יישארו מוצגים על רשומות קיימות
        </p>
      </CardContent>
    </Card>
  );
}
