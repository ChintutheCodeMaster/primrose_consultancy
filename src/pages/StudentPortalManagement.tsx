import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { openExternalFile } from "@/lib/file-open";
import { 
  ArrowRight, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  CheckCircle2, 
  Upload,
  Loader2,
  ExternalLink,
  GripVertical
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  sort_order: number;
}

interface Document {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  category: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
}

const documentCategories = [
  { value: "general", label: "כללי" },
  { value: "start", label: "תחילת תהליך" },
  { value: "application", label: "הגשות" },
  { value: "acceptance", label: "קבלות" },
];

export default function StudentPortalManagement() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // New item states
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState("");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  
  // New document states
  const [newDocName, setNewDocName] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: studentData } = await supabase
      .from("students")
      .select("id, name")
      .eq("id", studentId)
      .maybeSingle();

    if (!studentData) {
      toast({ title: "שגיאה", description: "לא נמצא סטודנט", variant: "destructive" });
      navigate("/students");
      return;
    }

    setStudent(studentData);

    const { data: checklistData } = await supabase
      .from("student_checklist_items")
      .select("*")
      .eq("student_id", studentId)
      .order("sort_order", { ascending: true });

    setChecklist(checklistData || []);

    const { data: documentsData } = await supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    setDocuments(documentsData || []);
    setLoading(false);
  };

  const addChecklistItem = async () => {
    if (!newItemTitle.trim()) return;
    
    setSaving(true);
    const { error } = await supabase.from("student_checklist_items").insert({
      student_id: studentId,
      title: newItemTitle,
      description: newItemDescription || null,
      due_date: newItemDueDate || null,
      sort_order: checklist.length,
    });

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף פריט", variant: "destructive" });
    } else {
      toast({ title: "נוסף בהצלחה" });
      setNewItemTitle("");
      setNewItemDescription("");
      setNewItemDueDate("");
      setIsAddItemOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const deleteChecklistItem = async (itemId: string) => {
    const { error } = await supabase
      .from("student_checklist_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן למחוק", variant: "destructive" });
    } else {
      setChecklist(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const toggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("student_checklist_items")
      .update({ is_completed: !currentStatus })
      .eq("id", itemId);

    if (!error) {
      setChecklist(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, is_completed: !currentStatus } : item
        )
      );
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !newDocName.trim()) return;
    
    setUploading(true);
    
    const fileExt = selectedFile.name.split(".").pop();
    const fileName = `${studentId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("student-documents")
      .upload(fileName, selectedFile, { contentType: selectedFile.type, cacheControl: "3600" });

    if (uploadError) {
      toast({ title: "שגיאה", description: "לא ניתן להעלות קובץ", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("student-documents")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("student_documents").insert({
      student_id: studentId,
      name: newDocName,
      description: newDocDescription || null,
      file_url: urlData.publicUrl,
      category: newDocCategory,
    });

    if (insertError) {
      toast({ title: "שגיאה", description: "לא ניתן לשמור מסמך", variant: "destructive" });
    } else {
      toast({ title: "המסמך הועלה בהצלחה" });
      setNewDocName("");
      setNewDocDescription("");
      setNewDocCategory("general");
      setSelectedFile(null);
      setIsAddDocOpen(false);
      fetchData();
    }
    setUploading(false);
  };

  const deleteDocument = async (docId: string, fileUrl: string) => {
    // Extract file path from URL
    const urlParts = fileUrl.split("/student-documents/");
    if (urlParts.length > 1) {
      await supabase.storage.from("student-documents").remove([urlParts[1]]);
    }

    const { error } = await supabase
      .from("student_documents")
      .delete()
      .eq("id", docId);

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן למחוק", variant: "destructive" });
    } else {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/portal/${studentId}`;
    navigator.clipboard.writeText(link);
    toast({ title: "הקישור הועתק!", description: "קישור לפורטל המועמד הועתק ללוח" });
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ניהול פורטל - {student?.name}</h1>
              <p className="text-sm text-muted-foreground">ניהול צ'קליסט ומסמכים לפורטל המועמד</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyPortalLink}>
              <ExternalLink className="h-4 w-4 ml-2" />
              העתק קישור לפורטל
            </Button>
            <Button variant="outline" onClick={() => window.open(`/portal/${studentId}`, "_blank")}>
              צפה בפורטל
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checklist Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                צ'קליסט ({checklist.length} פריטים)
              </CardTitle>
              <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-1" />
                    הוסף פריט
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>הוספת פריט לצ'קליסט</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>כותרת *</Label>
                      <Input
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder="לדוגמה: הגשת תעודות"
                      />
                    </div>
                    <div>
                      <Label>תיאור</Label>
                      <Textarea
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder="פרטים נוספים..."
                      />
                    </div>
                    <div>
                      <Label>תאריך יעד</Label>
                      <Input
                        type="date"
                        value={newItemDueDate}
                        onChange={(e) => setNewItemDueDate(e.target.value)}
                      />
                    </div>
                    <Button onClick={addChecklistItem} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                      הוסף
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {checklist.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">אין פריטים בצ'קליסט</p>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.is_completed ? "bg-green-50/50 border-green-200" : "bg-white"
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Checkbox
                        checked={item.is_completed}
                        onCheckedChange={() => toggleChecklistItem(item.id, item.is_completed)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                          {item.title}
                        </p>
                        {item.due_date && (
                          <p className="text-xs text-muted-foreground">
                            עד {format(new Date(item.due_date), "dd/MM/yyyy", { locale: he })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteChecklistItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                מסמכים ({documents.length})
              </CardTitle>
              <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 ml-1" />
                    העלה מסמך
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>העלאת מסמך</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>שם המסמך *</Label>
                      <Input
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="לדוגמה: מדריך הגשה"
                      />
                    </div>
                    <div>
                      <Label>תיאור</Label>
                      <Textarea
                        value={newDocDescription}
                        onChange={(e) => setNewDocDescription(e.target.value)}
                        placeholder="פרטים נוספים..."
                      />
                    </div>
                    <div>
                      <Label>קטגוריה</Label>
                      <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>קובץ *</Label>
                      <Input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button onClick={uploadDocument} disabled={uploading} className="w-full">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
                      העלה
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">אין מסמכים</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {documentCategories.find(c => c.value === doc.category)?.label || doc.category}
                          {" • "}
                          {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: he })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openExternalFile(doc.file_url, doc.name)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteDocument(doc.id, doc.file_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
