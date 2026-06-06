import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { FileText, Save, Loader2, Eye, Package, Clock, Edit3 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";


type AgreementType = 'package' | 'hourly' | 'edit' | 'mba';

interface AgreementTemplate {
  id: string;
  name: string;
  content: string;
  type: AgreementType;
  is_active: boolean;
  updated_at: string;
}

const agreementTypeConfig: Record<AgreementType, { label: string; icon: typeof Package }> = {
  package: { label: 'Package', icon: Package },
  hourly: { label: 'Hourly', icon: Clock },
  edit: { label: 'Edit', icon: Edit3 },
  mba: { label: 'MBA', icon: Package },
};

export default function AgreementTemplate() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [templates, setTemplates] = useState<Record<AgreementType, AgreementTemplate | null>>({
    package: null,
    hourly: null,
    edit: null,
    mba: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<AgreementType | null>(null);
  const [editedContent, setEditedContent] = useState<Record<AgreementType, string>>({
    package: '',
    hourly: '',
    edit: '',
    mba: '',
  });
  const [editedName, setEditedName] = useState<Record<AgreementType, string>>({
    package: '',
    hourly: '',
    edit: '',
    mba: '',
  });
  const [activeTab, setActiveTab] = useState<AgreementType>('package');

  useEffect(() => {
    document.title = 'Agreement Templates | Primrose IEC';
  }, []);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'package' || type === 'hourly' || type === 'edit' || type === 'mba') {
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
      .in("type", ['package', 'hourly', 'edit', 'mba']);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load agreement templates",
        variant: "destructive",
      });
    } else if (data) {
      const templatesMap: Record<AgreementType, AgreementTemplate | null> = {
        package: null,
        hourly: null,
        edit: null,
        mba: null,
      };
      const contentMap: Record<AgreementType, string> = { package: '', hourly: '', edit: '', mba: '' };
      const nameMap: Record<AgreementType, string> = { package: '', hourly: '', edit: '', mba: '' };

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
    setSaving(type);

    const payload = {
      content: editedContent[type] || '',
      name: editedName[type] || `${agreementTypeConfig[type].label} Agreement`,
      type,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = template
      ? await supabase.from("agreement_templates").update(payload).eq("id", template.id)
      : await supabase.from("agreement_templates").insert(payload);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved Successfully",
        description: `${agreementTypeConfig[type].label} agreement template updated`,
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
            <h1 className="text-2xl font-bold text-foreground">Agreement Templates</h1>
            <p className="text-sm text-muted-foreground">
              Edit the various agreement templates - Package, Hourly, and Edit
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
          <TabsList className="grid w-full grid-cols-4">
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
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <config.icon className="h-5 w-5 text-primary" />
                      {config.label} Agreement
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(type)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" onClick={() => handleSave(type)} disabled={saving === type}>
                        {saving === type ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div>
                      <Label htmlFor={`name-${type}`}>Template Name</Label>
                      <Input
                        id={`name-${type}`}
                        value={editedName[type]}
                        placeholder={`${config.label} Agreement`}
                        onChange={(e) => setEditedName(prev => ({ ...prev, [type]: e.target.value }))}
                        className="max-w-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Agreement Content</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Add text, headings, lists, and formatting. Click Save to publish this template.
                      </p>
                      <RichTextEditor
                        content={editedContent[type]}
                        onChange={(content) => setEditedContent(prev => ({ ...prev, [type]: content }))}
                      />
                    </div>

                    {template ? (
                      <p className="text-sm text-muted-foreground pt-4 border-t">
                        Last updated: {new Date(template.updated_at).toLocaleDateString("en-US")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground pt-4 border-t">
                        New template — write your {config.label.toLowerCase()} agreement above and click Save.
                      </p>
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
