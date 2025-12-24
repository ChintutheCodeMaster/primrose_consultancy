import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { FileText, Save, Loader2, Eye, Package, Clock, Edit3 } from "lucide-react";

type AgreementType = 'package' | 'hourly' | 'edit';

interface AgreementTemplate {
  id: string;
  name: string;
  content: string;
  type: AgreementType;
  is_active: boolean;
  updated_at: string;
}

const agreementTypeConfig: Record<AgreementType, { label: string; icon: typeof Package }> = {
  package: { label: 'חבילה', icon: Package },
  hourly: { label: 'שעתי', icon: Clock },
  edit: { label: 'לערוך', icon: Edit3 },
};

export default function AgreementTemplate() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [templates, setTemplates] = useState<Record<AgreementType, AgreementTemplate | null>>({
    package: null,
    hourly: null,
    edit: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AgreementType | null>(null);
  const [editedContent, setEditedContent] = useState<Record<AgreementType, string>>({
    package: '',
    hourly: '',
    edit: '',
  });
  const [editedName, setEditedName] = useState<Record<AgreementType, string>>({
    package: '',
    hourly: '',
    edit: '',
  });
  const [activeTab, setActiveTab] = useState<AgreementType>('package');

  useEffect(() => {
    document.title = 'תבניות הסכם | נוגה';
  }, []);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'package' || type === 'hourly' || type === 'edit') {
      setActiveTab(type);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("agreement_templates")
      .select("*")
      .in("type", ['package', 'hourly', 'edit']);

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את תבניות ההסכם",
        variant: "destructive",
      });
    } else if (data) {
      const templatesMap: Record<AgreementType, AgreementTemplate | null> = {
        package: null,
        hourly: null,
        edit: null,
      };
      const contentMap: Record<AgreementType, string> = { package: '', hourly: '', edit: '' };
      const nameMap: Record<AgreementType, string> = { package: '', hourly: '', edit: '' };

      data.forEach((t) => {
        const type = t.type as AgreementType;
        if (type in templatesMap) {
          templatesMap[type] = t as AgreementTemplate;
          contentMap[type] = t.content;
          nameMap[type] = t.name;
        }
      });

      setTemplates(templatesMap);
      setEditedContent(contentMap);
      setEditedName(nameMap);
    }
    setLoading(false);
  };

  const handleSave = async (type: AgreementType) => {
    const template = templates[type];
    if (!template) return;

    setSaving(type);
    const { error } = await supabase
      .from("agreement_templates")
      .update({
        content: editedContent[type],
        name: editedName[type],
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
        description: `תבנית הסכם ${agreementTypeConfig[type].label} עודכנה`,
      });
      fetchTemplates();
    }
    setSaving(null);
  };

  const handlePreview = (type: AgreementType) => {
    window.open(`/agreement/demo?type=${type}`, "_blank");
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">תבניות הסכם</h1>
            <p className="text-sm text-muted-foreground">
              ערוך את תבניות ההסכם השונות - חבילה, שעתי, ולערוך
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            const next = v as AgreementType;
            setActiveTab(next);
            setSearchParams({ type: next });
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            {(Object.keys(agreementTypeConfig) as AgreementType[]).map((type) => {
              const config = agreementTypeConfig[type];
              const Icon = config.icon;
              return (
                <TabsTrigger key={type} value={type} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(agreementTypeConfig) as AgreementType[]).map((type) => {
            const template = templates[type];
            const config = agreementTypeConfig[type];

            return (
              <TabsContent key={type} value={type}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <config.icon className="h-5 w-5 text-primary" />
                      הסכם {config.label}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(type)}>
                        <Eye className="h-4 w-4 ml-2" />
                        תצוגה מקדימה
                      </Button>
                      <Button size="sm" onClick={() => handleSave(type)} disabled={saving === type}>
                        {saving === type ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 ml-2" />
                        )}
                        שמור
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {template ? (
                      <>
                        <div>
                          <Label htmlFor={`name-${type}`}>שם התבנית</Label>
                          <Input
                            id={`name-${type}`}
                            value={editedName[type]}
                            onChange={(e) => setEditedName(prev => ({ ...prev, [type]: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`content-${type}`}>תוכן ההסכם</Label>
                          <Textarea
                            id={`content-${type}`}
                            value={editedContent[type]}
                            onChange={(e) => setEditedContent(prev => ({ ...prev, [type]: e.target.value }))}
                            className="min-h-[400px] font-mono text-sm"
                            dir="rtl"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          עודכן לאחרונה: {new Date(template.updated_at).toLocaleDateString("he-IL")}
                        </p>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">לא נמצאה תבנית להסכם {config.label}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </MainLayout>
  );
}