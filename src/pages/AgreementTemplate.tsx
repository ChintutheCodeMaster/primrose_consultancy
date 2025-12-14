import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FileText, Save, Loader2, Eye } from "lucide-react";

interface AgreementTemplate {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
  updated_at: string;
}

export default function AgreementTemplate() {
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    const { data, error } = await supabase
      .from("agreement_templates")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את תבנית ההסכם",
        variant: "destructive",
      });
    } else if (data) {
      setTemplate(data);
      setEditedContent(data.content);
      setEditedName(data.name);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    const { error } = await supabase
      .from("agreement_templates")
      .update({
        content: editedContent,
        name: editedName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את השינויים",
        variant: "destructive",
      });
    } else {
      toast({
        title: "נשמר בהצלחה",
        description: "תבנית ההסכם עודכנה",
      });
      fetchTemplate();
    }
    setSaving(false);
  };

  const handlePreview = () => {
    // Open the agreement page in a new tab with a demo ID
    window.open("/agreement/demo", "_blank");
  };

  if (loading) {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">הסכם נוכחי</h1>
              <p className="text-sm text-muted-foreground">
                צפייה ועריכת תבנית ההסכם הפעילה
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              שמור שינויים
            </Button>
          </div>
        </div>

        {template ? (
          <Card>
            <CardHeader>
              <CardTitle>פרטי התבנית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">שם התבנית</Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="content">תוכן ההסכם</Label>
                <Textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  dir="rtl"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                עודכן לאחרונה: {new Date(template.updated_at).toLocaleDateString("he-IL")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">לא נמצאה תבנית הסכם פעילה</p>
              <p className="text-sm text-muted-foreground mt-2">
                תבנית ההסכם הנוכחית מוטמעת בקוד בעמוד Agreement.tsx
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
