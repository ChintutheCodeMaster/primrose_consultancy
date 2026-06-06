import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Save,
  Loader2,
  Eye,
  Package,
  Clock,
  GraduationCap,
  Plus,
  Trash2,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface AgreementTemplate {
  id: string;
  name: string;
  content: string;
  type: string;
  is_active: boolean;
  updated_at: string;
}

// Built-in defaults — always show even if no row exists yet.
const BUILT_IN: { type: string; label: string }[] = [
  { type: "package", label: "Package" },
  { type: "hourly", label: "Hourly" },
  { type: "mba", label: "MBA" },
];

const BUILT_IN_TYPES = new Set(BUILT_IN.map((b) => b.type));
// Legacy/hidden types we don't surface as tabs
const HIDDEN_TYPES = new Set(["edit"]);

const iconFor = (type: string) => {
  if (type === "hourly") return Clock;
  if (type === "mba") return GraduationCap;
  return Package;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `template_${Date.now()}`;

export default function AgreementTemplate() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [templates, setTemplates] = useState<Record<string, AgreementTemplate | null>>({});
  const [order, setOrder] = useState<{ type: string; label: string }[]>([]);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [editedName, setEditedName] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("package");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    document.title = "Agreement Templates | Primrose IEC";
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const t = searchParams.get("type");
    if (t && order.find((o) => o.type === t)) setActiveTab(t);
  }, [searchParams, order]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase.from("agreement_templates").select("*");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load agreement templates",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const tplMap: Record<string, AgreementTemplate | null> = {};
    const contentMap: Record<string, string> = {};
    const nameMap: Record<string, string> = {};

    // Seed defaults
    for (const b of BUILT_IN) {
      tplMap[b.type] = null;
      contentMap[b.type] = "";
      nameMap[b.type] = `${b.label} Agreement`;
    }

    const extras: { type: string; label: string }[] = [];
    (data || []).forEach((t: any) => {
      if (HIDDEN_TYPES.has(t.type)) return;
      tplMap[t.type] = t;
      contentMap[t.type] = t.content || "";
      nameMap[t.type] = t.name || t.type;
      if (!BUILT_IN_TYPES.has(t.type)) {
        extras.push({ type: t.type, label: t.name || t.type });
      }
    });

    extras.sort((a, b) => a.label.localeCompare(b.label));
    setOrder([...BUILT_IN, ...extras]);
    setTemplates(tplMap);
    setEditedContent(contentMap);
    setEditedName(nameMap);
    setLoading(false);
  };

  const handleSave = async (type: string) => {
    const template = templates[type];
    setSaving(type);

    const label = order.find((o) => o.type === type)?.label || type;
    const payload = {
      content: editedContent[type] || "",
      name: editedName[type] || label,
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
        description: `${label} agreement template updated`,
      });
      fetchTemplates();
    }
    setSaving(null);
  };

  const handlePreview = (type: string) => {
    window.open(`/agreement/demo?type=${type}`, "_blank");
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast({ title: "Name required", description: "Give your template a name.", variant: "destructive" });
      return;
    }
    let type = slugify(name);
    // ensure unique
    if (templates[type] || BUILT_IN_TYPES.has(type)) {
      type = `${type}_${Date.now().toString(36)}`;
    }
    const { error } = await supabase.from("agreement_templates").insert({
      type,
      name,
      content: "",
      is_active: true,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template added", description: name });
    setAddOpen(false);
    setNewName("");
    await fetchTemplates();
    setActiveTab(type);
    setSearchParams({ type });
  };

  const handleDelete = async (type: string) => {
    const template = templates[type];
    if (!template) return;
    if (!confirm(`Delete the "${editedName[type]}" template? This cannot be undone.`)) return;
    const { error } = await supabase.from("agreement_templates").delete().eq("id", template.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template deleted" });
    setActiveTab("package");
    setSearchParams({ type: "package" });
    fetchTemplates();
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agreement Templates</h1>
              <p className="text-sm text-muted-foreground">
                Edit your engagement agreement templates. Click any tab to edit it directly.
              </p>
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add template
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setSearchParams({ type: v });
          }}
        >
          <TabsList
            className="w-full flex flex-wrap gap-1 h-auto justify-start"
          >
            {order.map((o) => {
              const Icon = iconFor(o.type);
              return (
                <TabsTrigger key={o.type} value={o.type} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {o.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {order.map((o) => {
            const type = o.type;
            const template = templates[type];
            const Icon = iconFor(type);
            const isCustom = !BUILT_IN_TYPES.has(type);

            return (
              <TabsContent key={type} value={type}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4 gap-2 flex-wrap">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {editedName[type] || o.label}
                    </CardTitle>
                    <div className="flex gap-2">
                      {isCustom && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(type)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
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
                        value={editedName[type] || ""}
                        placeholder={`${o.label} Agreement`}
                        onChange={(e) => setEditedName((prev) => ({ ...prev, [type]: e.target.value }))}
                        className="max-w-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Agreement Content</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Add text, headings, lists, and formatting. Click Save to publish this template.
                      </p>
                      <RichTextEditor
                        content={editedContent[type] || ""}
                        onChange={(content) =>
                          setEditedContent((prev) => ({ ...prev, [type]: content }))
                        }
                      />
                    </div>

                    {template ? (
                      <p className="text-sm text-muted-foreground pt-4 border-t">
                        Last updated: {new Date(template.updated_at).toLocaleDateString("en-US")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground pt-4 border-t">
                        New template — write your {o.label.toLowerCase()} agreement above and click Save.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add agreement template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Template name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Test Prep, College Counseling, PhD"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                You'll be able to edit the content right after creating it.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
