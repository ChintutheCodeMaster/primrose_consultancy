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
import { StudentApplicantProfile } from "@/components/students/StudentApplicantProfile";
import { StudentCollegeList } from "@/components/students/StudentCollegeList";
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
import { enUS } from "date-fns/locale"; // Changed locale from he to enUS
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
  { value: "strategy_questionnaire", label: "Strategy Questionnaire" },
  { value: "personal_essays", label: "Personal Essays" },
  { value: "recommendations", label: "Recommendations" },
  { value: "cv", label: "CV" },
  { value: "additional", label: "Additional Documents" },
  { value: "general", label: "General" },
  { value: "start", label: "Process Start" },
  { value: "application", label: "Applications" },
  { value: "acceptance", label: "Acceptances" },
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
      toast({ title: "Error", description: "Student not found", variant: "destructive" });
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
      toast({ title: "Error", description: "Could not add item", variant: "destructive" });
    } else {
      toast({ title: "Added successfully" });
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
      toast({ title: "Error", description: "Could not delete item", variant: "destructive" });
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

  const uploadDocument = async (categoryOverride?: string) => {
    if (!selectedFile || !newDocName.trim()) return;
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(selectedFile.type) && !['pdf', 'doc', 'docx'].includes(fileExt || '')) {
      toast({ title: "Error", description: "Only PDF or Word files can be uploaded", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    
    const fileName = `${studentId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("student-documents")
      .upload(fileName, selectedFile, { contentType: selectedFile.type, cacheControl: "3600" });

    if (uploadError) {
      toast({ title: "Error", description: "Could not upload file", variant: "destructive" });
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
      category: categoryOverride || newDocCategory,
    });

    if (insertError) {
      toast({ title: "Error", description: "Could not save document", variant: "destructive" });
    } else {
      toast({ title: "Document uploaded successfully" });
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
      toast({ title: "Error", description: "Could not delete", variant: "destructive" });
    } else {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}/portal/${studentId}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: "Candidate portal link copied to clipboard" });
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
              <h1 className="text-2xl font-bold text-foreground">Portal Management - {student?.name}</h1>
              <p className="text-sm text-muted-foreground">Manage checklist and documents for the candidate portal</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyPortalLink}>
              <ExternalLink className="h-4 w-4 mr-2" /> {/* Changed ml-2 to mr-2 for LTR */}
              Copy Portal Link
            </Button>
            <Button variant="outline" onClick={() => window.open(`/portal/${studentId}`, "_blank")}>
              View Portal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checklist Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Checklist ({checklist.length} items)
              </CardTitle>
              <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> {/* Changed ml-1 to mr-1 for LTR */}
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Checklist Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder="e.g., Submit application forms"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder="Additional details..."
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newItemDueDate}
                        onChange={(e) => setNewItemDueDate(e.target.value)}
                      />
                    </div>
                    <Button onClick={addChecklistItem} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} {/* Changed ml-2 to mr-2 for LTR */}
                      Add
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {checklist.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No checklist items</p>
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
                            By {format(new Date(item.due_date), "dd/MM/yyyy", { locale: enUS })} {/* Changed locale from he to enUS */}
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

          {/* Documents Management - Grouped by Category */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documents ({documents.length})
              </CardTitle>
              <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-1" /> {/* Changed ml-1 to mr-1 for LTR */}
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Document Name *</Label>
                      <Input
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="e.g., Application Guide"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newDocDescription}
                        onChange={(e) => setNewDocDescription(e.target.value)}
                        placeholder="Additional details..."
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
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
                      <Label>File * (PDF or Word only)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button onClick={() => uploadDocument()} disabled={uploading} className="w-full">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} {/* Changed ml-2 to mr-2 for LTR */}
                      Upload
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentCategories.slice(0, 5).map((cat) => {
                  const catDocs = documents.filter(d => d.category === cat.value);
                  return (
                    <div key={cat.value} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{cat.label} ({catDocs.length})</h4>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setSelectedFile(file);
                              setNewDocName(file.name.replace(/\.[^/.]+$/, ""));
                              setNewDocCategory(cat.value);
                              // Direct upload
                              const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                              const ext = file.name.split(".").pop()?.toLowerCase();
                              if (!allowedTypes.includes(file.type) && !['pdf', 'doc', 'docx'].includes(ext || '')) {
                                toast({ title: "Error", description: "Only PDF or Word files can be uploaded", variant: "destructive" });
                                e.target.value = '';
                                return;
                              }
                              setUploading(true);
                              const fileName = `${studentId}/${Date.now()}.${ext}`;
                              const { error: uploadError } = await supabase.storage
                                .from("student-documents")
                                .upload(fileName, file, { contentType: file.type, cacheControl: "3600" });
                              if (uploadError) {
                                toast({ title: "Error", description: "Could not upload file", variant: "destructive" });
                                setUploading(false);
                                e.target.value = '';
                                return;
                              }
                              const { data: urlData } = supabase.storage.from("student-documents").getPublicUrl(fileName);
                              const { error: insertError } = await supabase.from("student_documents").insert({
                                student_id: studentId,
                                name: file.name.replace(/\.[^/.]+$/, ""),
                                file_url: urlData.publicUrl,
                                category: cat.value,
                              });
                              if (insertError) {
                                toast({ title: "Error", description: "Could not save document", variant: "destructive" });
                              } else {
                                toast({ title: "Document uploaded successfully" });
                                fetchData();
                              }
                              setUploading(false);
                              e.target.value = '';
                            }}
                          />
                          <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer">
                            <Plus className="h-3 w-3" />
                            Upload
                          </span>
                        </label>
                      </div>
                      {catDocs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No documents</p>
                      ) : (
                        <div className="space-y-1.5">
                          {catDocs.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="flex-1 truncate">{doc.name}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openExternalFile(doc.file_url, doc.name)}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteDocument(doc.id, doc.file_url)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Show remaining categories if they have docs */}
                {(() => {
                  const otherDocs = documents.filter(d => !['strategy_questionnaire', 'personal_essays', 'recommendations', 'cv', 'additional'].includes(d.category));
                  if (otherDocs.length === 0) return null;
                  return (
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-2">Other ({otherDocs.length})</h4>
                      <div className="space-y-1.5">
                        {otherDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="flex-1 truncate">{doc.name}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openExternalFile(doc.file_url, doc.name)}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteDocument(doc.id, doc.file_url)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IECA workflow: applicant profile + college list */}
        {studentId && (
          <>
            <StudentApplicantProfile studentId={studentId} />
            <StudentCollegeList studentId={studentId} />
          </>
        )}
      </div>
    </MainLayout>
  );
}
