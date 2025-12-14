import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Eye,
  Check,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgreementTemplate {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const defaultContent = `מועמד יקר,

אנחנו מתרגשים להתחיל איתך תהליך של ליווי להגשה ללימודים בחו"ל! מדובר במסע מרגש ומשמעותי ותודה שבחרת בנו כדי שנהיה חלק ממנו.

חשוב מאוד שתקדיש את מלוא תשומת הלב בקריאת הפרטים המופיעים מטה, כדי שהתהליך יתנהל בצורה הכי מקצועית ונכונה.

אנחנו מתחייבים לרמה השירות הגבוהה ביותר, אשר כוללת ליווי של יועץ אישי ובנוסף, ללא עלות נוספת, מעבר של יועץ נוסף על החומרים שלך.

עמוד זה הינו טופס הזמנת עבודה של הלקוח (להלן: "הלקוח") עם נוגה שירותים אקדמיים (להלן: "נוגה").

* הנהלים והטופס מנוסחים בלשון זכר, אך מיועדים לנשים ולגברים כאחד

---

**פרטי תשלום ונהלים**

- עלות השירות תחול לפי המחיר שסוכם אל מול נציג נוגה.
- התשלום יתבצע באחת מהדרכים הבאות: כרטיס אשראי, העברה בנקאית, או Bit.
- התשלום על חבילה יתבצע מראש, אלא אם הוסכם על פריסה לתשלומים (עד 4 תשלומים).

**סיום התקשרות:**
- במידה ולקוח מעוניין להפסיק את ההתקשרות, תתבצע הערכה של שעות העבודה בהסכמה.
- הלקוח ונוגה רשאים להפסיק את ההתקשרות בהתראה של 24 שעות.

**הגבלת אחריות:**
- על המועמד לוודא מול המוסדות את התאריך הסופי להגשה ודרישות הקבלה.
- הלקוח מאשר כי האחריות על תהליך הקבלה חלה אך ורק עליו.
- עמידה בדדליין להגשת האפליקיישן היא אחריות של הלקוח.

**סודיות:**
- הלקוח מאשר לנוגה שימוש בחומרי אישור קבלה לצרכי שיווק (ללא פרטים אישיים).
- הלקוח מתחייב להימנע מכל פגיעה בשמה הטוב של נוגה.

במידה ויש נושאים שתרצו לשתף, פנו ל-info@nogaconsultancy.com`;

export default function AgreementTemplates() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgreementTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<AgreementTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: defaultContent,
    is_active: false,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["agreement-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agreement_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AgreementTemplate[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // If setting as active, deactivate others first
      if (data.is_active) {
        await supabase
          .from("agreement_templates")
          .update({ is_active: false })
          .eq("is_active", true);
      }
      
      const { error } = await supabase.from("agreement_templates").insert({
        name: data.name,
        content: data.content,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agreement-templates"] });
      toast.success("תבנית נוספה בהצלחה");
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => toast.error("שגיאה בהוספת תבנית"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      // If setting as active, deactivate others first
      if (data.is_active) {
        await supabase
          .from("agreement_templates")
          .update({ is_active: false })
          .neq("id", data.id);
      }

      const { error } = await supabase
        .from("agreement_templates")
        .update({
          name: data.name,
          content: data.content,
          is_active: data.is_active,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agreement-templates"] });
      toast.success("תבנית עודכנה בהצלחה");
      setEditingTemplate(null);
      resetForm();
    },
    onError: () => toast.error("שגיאה בעדכון תבנית"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agreement_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agreement-templates"] });
      toast.success("תבנית נמחקה בהצלחה");
    },
    onError: () => toast.error("שגיאה במחיקת תבנית"),
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: string) => {
      // Deactivate all first
      await supabase
        .from("agreement_templates")
        .update({ is_active: false })
        .eq("is_active", true);
      
      // Set the selected one as active
      const { error } = await supabase
        .from("agreement_templates")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agreement-templates"] });
      toast.success("התבנית הוגדרה כפעילה");
    },
    onError: () => toast.error("שגיאה בהגדרת תבנית פעילה"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      content: defaultContent,
      is_active: false,
    });
  };

  const openEdit = (template: AgreementTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      is_active: template.is_active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const duplicateTemplate = (template: AgreementTemplate) => {
    setFormData({
      name: `${template.name} (עותק)`,
      content: template.content,
      is_active: false,
    });
    setIsAddOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">טפסי תחילת תהליך</h1>
            <p className="text-muted-foreground mt-1">
              ניהול תבניות טפסי הסכם לסטודנטים
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            צור תבנית חדשה
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">טוען...</div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">אין תבניות טפסים</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                צור תבנית ראשונה כדי להתחיל
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4 ml-2" />
                צור תבנית
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`group ${template.is_active ? "ring-2 ring-primary" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    {template.is_active && (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        פעיל
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.content.substring(0, 150)}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    עודכן: {new Date(template.updated_at).toLocaleDateString("he-IL")}
                  </p>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      תצוגה
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => openEdit(template)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      עריכה
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateTemplate(template)}
                      title="שכפל"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {!template.is_active && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => setActiveMutation.mutate(template.id)}
                      >
                        הגדר כפעיל
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={isAddOpen || !!editingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddOpen(false);
              setEditingTemplate(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "עריכת תבנית" : "יצירת תבנית חדשה"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם התבנית *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="לדוגמה: הסכם תקני 2024"
                    required
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <Label htmlFor="is_active" className="cursor-pointer">
                    הגדר כתבנית פעילה
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">תוכן ההסכם *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="הזן את תוכן ההסכם כאן..."
                  rows={20}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ניתן להשתמש ב-Markdown לעיצוב: **מודגש**, *נטוי*, --- לקו מפריד
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTemplate ? "שמור שינויים" : "צור תבנית"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>תצוגה מקדימה: {previewTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="prose prose-sm max-w-none text-foreground">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {previewTemplate?.content}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
