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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Trash2, Loader2, ChevronUp, ChevronDown, CalendarIcon, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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

        {/* Leads Year Transition Settings */}
        <LeadsYearSettings />

        <SourceOptionsManager />
        <CountryOptionsManager />
      </div>
    </MainLayout>
  );
}

function LeadsYearSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['leads-year-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_year_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { current_year?: string; next_year?: string; transition_date?: string }) => {
      if (!settings) return;
      const { error } = await supabase
        .from('leads_year_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-year-settings'] });
      toast.success('ההגדרות עודכנו בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בעדכון ההגדרות');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  const transitionDate = new Date(settings.transition_date + 'T00:00:00');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>מתעניינים מהאתר — הגדרת שנה</CardTitle>
        </div>
        <CardDescription>
          הגדרי לאיזו שנה ייכנסו מתעניינים חדשים מהאתר, ומתי לעבור לשנה הבאה
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Year */}
          <div className="space-y-2">
            <Label>שנה נוכחית (פניות נכנסות לכאן)</Label>
            <Input
              value={settings.current_year}
              onChange={(e) => updateMutation.mutate({ current_year: e.target.value })}
              placeholder="27"
              className="text-center text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">למשל: 27 = מתעניינים 27</p>
          </div>

          {/* Transition Date */}
          <div className="space-y-2">
            <Label>תאריך מעבר</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !settings.transition_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {format(transitionDate, 'dd/MM/yyyy', { locale: he })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transitionDate}
                  onSelect={(date) => {
                    if (date) {
                      updateMutation.mutate({ transition_date: format(date, 'yyyy-MM-dd') });
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">אחרי תאריך זה, פניות ייכנסו לשנה הבאה</p>
          </div>

          {/* Next Year */}
          <div className="space-y-2">
            <Label>שנה הבאה (אחרי תאריך המעבר)</Label>
            <Input
              value={settings.next_year}
              onChange={(e) => updateMutation.mutate({ next_year: e.target.value })}
              placeholder="28"
              className="text-center text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">למשל: 28 = מתעניינים 28</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          📌 כרגע פניות חדשות מהאתר נכנסות ל<strong className="text-foreground">מתעניינים {settings.current_year}</strong>.
          {' '}החל מ-{format(transitionDate, 'dd/MM/yyyy', { locale: he })} הן ייכנסו ל<strong className="text-foreground">מתעניינים {settings.next_year}</strong>.
        </div>
      </CardContent>
    </Card>
  );
}
