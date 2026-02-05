import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SidebarCategory } from '@/hooks/useSidebarCategories';
import { SourceOptionsManager } from '@/components/settings/SourceOptionsManager';
import { CountryOptionsManager } from '@/components/settings/CountryOptionsManager';

const categoryTypeLabels = {
  leads: 'מתעניינים',
  past_clients: 'לקוחות עבר',
  did_not_continue: 'לא המשיכו',
};

export default function Settings() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    category_type: 'leads' as 'leads' | 'past_clients' | 'did_not_continue',
    year_value: '',
    display_label: '',
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['sidebar-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sidebar_categories')
        .select('*')
        .order('category_type')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SidebarCategory[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (category: typeof newCategory) => {
      // Get max sort order for this category type
      const existing = categories.filter(c => c.category_type === category.category_type);
      const maxOrder = existing.length > 0 ? Math.max(...existing.map(c => c.sort_order)) : 0;

      const { error } = await supabase.from('sidebar_categories').insert({
        category_type: category.category_type,
        year_value: category.year_value,
        display_label: category.display_label,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sidebar-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-categories-all'] });
      toast.success('הקטגוריה נוספה בהצלחה');
      setIsAddOpen(false);
      setNewCategory({ category_type: 'leads', year_value: '', display_label: '' });
    },
    onError: () => {
      toast.error('שגיאה בהוספת הקטגוריה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sidebar_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sidebar-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-categories-all'] });
      toast.success('הקטגוריה נמחקה');
    },
    onError: () => {
      toast.error('שגיאה במחיקת הקטגוריה');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder, categoryType }: { id: string; newOrder: number; categoryType: string }) => {
      const typeCategories = categories.filter(c => c.category_type === categoryType);
      const currentIndex = typeCategories.findIndex(c => c.id === id);
      const targetIndex = newOrder === -1 ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= typeCategories.length) return;
      
      const current = typeCategories[currentIndex];
      const target = typeCategories[targetIndex];
      
      // Swap sort orders
      await supabase.from('sidebar_categories').update({ sort_order: target.sort_order }).eq('id', current.id);
      await supabase.from('sidebar_categories').update({ sort_order: current.sort_order }).eq('id', target.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sidebar-categories'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-categories-all'] });
    },
    onError: () => {
      toast.error('שגיאה בשינוי הסדר');
    },
  });

  const handleAdd = () => {
    if (!newCategory.year_value || !newCategory.display_label) {
      toast.error('יש למלא את כל השדות');
      return;
    }
    addMutation.mutate(newCategory);
  };

  const handleMoveUp = (category: SidebarCategory) => {
    reorderMutation.mutate({ id: category.id, newOrder: -1, categoryType: category.category_type });
  };

  const handleMoveDown = (category: SidebarCategory) => {
    reorderMutation.mutate({ id: category.id, newOrder: 1, categoryType: category.category_type });
  };

  const groupedCategories = {
    leads: categories.filter(c => c.category_type === 'leads'),
    past_clients: categories.filter(c => c.category_type === 'past_clients'),
    did_not_continue: categories.filter(c => c.category_type === 'did_not_continue'),
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">הגדרות</h1>
            <p className="text-muted-foreground mt-1">ניהול קטגוריות סרגל הצד</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                הוסף קטגוריה
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוספת קטגוריה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>סוג קטגוריה</Label>
                  <Select 
                    value={newCategory.category_type} 
                    onValueChange={(v) => setNewCategory(prev => ({ ...prev, category_type: v as typeof prev.category_type }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">מתעניינים</SelectItem>
                      <SelectItem value="past_clients">לקוחות עבר</SelectItem>
                      <SelectItem value="did_not_continue">לא המשיכו</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ערך שנה (לניתוב)</Label>
                  <Input 
                    placeholder="לדוגמה: 28 או 2027"
                    value={newCategory.year_value}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, year_value: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>תווית תצוגה</Label>
                  <Input 
                    placeholder="לדוגמה: מתעניינים 28"
                    value={newCategory.display_label}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, display_label: e.target.value }))}
                  />
                </div>
                <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full">
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  הוסף
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(['leads', 'past_clients', 'did_not_continue'] as const).map((type) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle>{categoryTypeLabels[type]}</CardTitle>
              <CardDescription>ניהול שנים עבור {categoryTypeLabels[type]}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תווית</TableHead>
                    <TableHead>ערך שנה</TableHead>
                    <TableHead>סדר</TableHead>
                    <TableHead className="w-24">הזז</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedCategories[type].map((category, index) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.display_label}</TableCell>
                      <TableCell>{category.year_value}</TableCell>
                      <TableCell>{category.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(category)}
                            disabled={index === 0 || reorderMutation.isPending}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(category)}
                            disabled={index === groupedCategories[type].length - 1 || reorderMutation.isPending}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groupedCategories[type].length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        אין קטגוריות
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        <SourceOptionsManager />
      </div>
    </MainLayout>
  );
}
