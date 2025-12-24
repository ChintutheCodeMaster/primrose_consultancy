import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { UniversityAutocomplete } from "@/components/ui/university-autocomplete";
import { 
  GraduationCap, 
  User, 
  Phone, 
  Mail, 
  ChevronLeft,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  Upload,
  Loader2,
  ExternalLink,
  Search,
  MessageSquare,
  Award,
  Calendar,
  History
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

interface Advisor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  signed_agreement: boolean;
  is_paid: boolean;
  target_country: string | null;
  target_university: string | null;
  status: string;
  did_not_continue: boolean;
}

interface AcceptedUniversity {
  id: string;
  name: string;
  country: string | null;
  acceptance_letter_url: string | null;
}

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

interface Conversation {
  id: string;
  conversation_date: string;
  summary: string;
  follow_up_actions: string | null;
  created_by: string;
  created_at: string;
}

const documentCategories = [
  { value: "general", label: "כללי" },
  { value: "start", label: "תחילת תהליך" },
  { value: "application", label: "הגשות" },
  { value: "acceptance", label: "קבלות" },
];

export default function AdvisorPortal() {
  const { advisorId } = useParams<{ advisorId: string }>();
  const [loading, setLoading] = useState(true);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [pastStudents, setPastStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  
  // Selected student for management
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [acceptedUniversities, setAcceptedUniversities] = useState<AcceptedUniversity[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  
  // New item states
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState("");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New document states
  const [newDocName, setNewDocName] = useState("");
  const [newDocDescription, setNewDocDescription] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Conversation states
  const [newConversationSummary, setNewConversationSummary] = useState("");
  const [newConversationFollowUp, setNewConversationFollowUp] = useState("");
  const [isAddConversationOpen, setIsAddConversationOpen] = useState(false);
  const [savingConversation, setSavingConversation] = useState(false);

  // Acceptance states
  const [newUniversityName, setNewUniversityName] = useState("");
  const [newUniversityCountry, setNewUniversityCountry] = useState("");
  const [isAddAcceptanceOpen, setIsAddAcceptanceOpen] = useState(false);
  const [savingAcceptance, setSavingAcceptance] = useState(false);
  const acceptanceFileRef = useRef<HTMLInputElement>(null);
  const [uploadingAcceptance, setUploadingAcceptance] = useState<string | null>(null);

  useEffect(() => {
    if (advisorId) {
      fetchAdvisorData();
    }
  }, [advisorId]);

  const fetchAdvisorData = async () => {
    setLoading(true);
    
    // Fetch advisor info
    const { data: advisorData, error: advisorError } = await supabase
      .from("advisors")
      .select("id, name, email, phone")
      .eq("id", advisorId)
      .maybeSingle();

    if (advisorError || !advisorData) {
      toast({
        title: "שגיאה",
        description: "לא נמצא יועץ עם הקישור הזה",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setAdvisor(advisorData);

    // Fetch active students (not did_not_continue and status not 'accepted')
    const { data: activeData } = await supabase
      .from("students")
      .select("id, name, email, phone, signed_agreement, is_paid, target_country, target_university, status, did_not_continue")
      .eq("advisor_id", advisorId)
      .or("did_not_continue.is.null,did_not_continue.eq.false")
      .neq("status", "accepted")
      .order("name", { ascending: true });

    setActiveStudents(activeData || []);

    // Fetch past students (did_not_continue or status = 'accepted')
    const { data: pastData } = await supabase
      .from("students")
      .select("id, name, email, phone, signed_agreement, is_paid, target_country, target_university, status, did_not_continue")
      .eq("advisor_id", advisorId)
      .or("did_not_continue.eq.true,status.eq.accepted")
      .order("name", { ascending: true });

    setPastStudents(pastData || []);
    setLoading(false);
  };

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingStudent(true);

    // Fetch all data in parallel
    const [checklistResult, documentsResult, conversationsResult, universitiesResult] = await Promise.all([
      supabase
        .from("student_checklist_items")
        .select("*")
        .eq("student_id", student.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("student_documents")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("student_conversations")
        .select("*")
        .eq("student_id", student.id)
        .order("conversation_date", { ascending: false }),
      supabase
        .from("accepted_universities")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
    ]);

    setChecklist(checklistResult.data || []);
    setDocuments(documentsResult.data || []);
    setConversations(conversationsResult.data || []);
    setAcceptedUniversities(universitiesResult.data || []);
    setLoadingStudent(false);
  };

  const addChecklistItem = async () => {
    if (!newItemTitle.trim() || !selectedStudent) return;
    
    setSaving(true);
    const { error } = await supabase.from("student_checklist_items").insert({
      student_id: selectedStudent.id,
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
      selectStudent(selectedStudent);
    }
    setSaving(false);
  };

  const deleteChecklistItem = async (itemId: string) => {
    const { error } = await supabase
      .from("student_checklist_items")
      .delete()
      .eq("id", itemId);

    if (!error) {
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
    if (!selectedFile || !newDocName.trim() || !selectedStudent) return;
    
    setUploading(true);
    
    const fileExt = selectedFile.name.split(".").pop();
    const fileName = `${selectedStudent.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("student-documents")
      .upload(fileName, selectedFile);

    if (uploadError) {
      toast({ title: "שגיאה", description: "לא ניתן להעלות קובץ", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("student-documents")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("student_documents").insert({
      student_id: selectedStudent.id,
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
      selectStudent(selectedStudent);
    }
    setUploading(false);
  };

  const deleteDocument = async (docId: string, fileUrl: string) => {
    const urlParts = fileUrl.split("/student-documents/");
    if (urlParts.length > 1) {
      await supabase.storage.from("student-documents").remove([urlParts[1]]);
    }

    const { error } = await supabase
      .from("student_documents")
      .delete()
      .eq("id", docId);

    if (!error) {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  // Conversation functions
  const addConversation = async () => {
    if (!newConversationSummary.trim() || !selectedStudent || !advisor) return;
    
    setSavingConversation(true);
    const { error } = await supabase.from("student_conversations").insert({
      student_id: selectedStudent.id,
      advisor_id: advisor.id,
      summary: newConversationSummary,
      follow_up_actions: newConversationFollowUp || null,
      created_by: "advisor",
    });

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף שיחה", variant: "destructive" });
    } else {
      toast({ title: "השיחה נוספה בהצלחה" });
      setNewConversationSummary("");
      setNewConversationFollowUp("");
      setIsAddConversationOpen(false);
      selectStudent(selectedStudent);
    }
    setSavingConversation(false);
  };

  const deleteConversation = async (convId: string) => {
    const { error } = await supabase
      .from("student_conversations")
      .delete()
      .eq("id", convId);

    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== convId));
      toast({ title: "השיחה נמחקה" });
    }
  };

  // Acceptance functions
  const addAcceptedUniversity = async () => {
    if (!newUniversityName.trim() || !newUniversityCountry.trim() || !selectedStudent) return;
    
    setSavingAcceptance(true);
    const { error } = await supabase.from("accepted_universities").insert({
      student_id: selectedStudent.id,
      name: newUniversityName,
      country: newUniversityCountry,
    });

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף קבלה", variant: "destructive" });
    } else {
      toast({ title: "הקבלה נוספה בהצלחה" });
      setNewUniversityName("");
      setNewUniversityCountry("");
      setIsAddAcceptanceOpen(false);
      selectStudent(selectedStudent);
    }
    setSavingAcceptance(false);
  };

  const uploadAcceptanceLetter = async (uniId: string, file: File) => {
    if (!selectedStudent) return;
    
    setUploadingAcceptance(uniId);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${selectedStudent.id}/${uniId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("acceptance-letters")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "שגיאה", description: "לא ניתן להעלות קובץ", variant: "destructive" });
      setUploadingAcceptance(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("acceptance-letters")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("accepted_universities")
      .update({ acceptance_letter_url: urlData.publicUrl })
      .eq("id", uniId);

    if (updateError) {
      toast({ title: "שגיאה", description: "לא ניתן לשמור קישור", variant: "destructive" });
    } else {
      toast({ title: "מכתב הקבלה הועלה בהצלחה" });
      setAcceptedUniversities(prev => 
        prev.map(u => u.id === uniId ? { ...u, acceptance_letter_url: urlData.publicUrl } : u)
      );
    }
    setUploadingAcceptance(null);
  };

  const deleteAcceptedUniversity = async (uniId: string) => {
    const { error } = await supabase
      .from("accepted_universities")
      .delete()
      .eq("id", uniId);

    if (!error) {
      setAcceptedUniversities(prev => prev.filter(u => u.id !== uniId));
      toast({ title: "הקבלה נמחקה" });
    }
  };

  const currentStudents = activeTab === "active" ? activeStudents : pastStudents;
  const filteredStudents = currentStudents.filter(s => 
    s.name.includes(searchTerm) || s.email.includes(searchTerm) || s.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">הקישור לא תקין</h1>
            <p className="text-gray-600">לא נמצא יועץ עם הקישור הזה</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            שלום, {advisor.name}! 👋
          </h1>
          <p className="text-lg text-primary font-medium">
            נוגה ייעוץ ללימודים בחו"ל - פורטל יועץ
          </p>
        </div>

        {selectedStudent ? (
          // Student Management View
          <div className="space-y-6">
            {/* Back button and student info */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                <ChevronLeft className="h-4 w-4 ml-1" />
                חזרה לרשימה
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/portal/${selectedStudent.id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 ml-1" />
                  צפה בפורטל
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = `${window.location.origin}/portal/${selectedStudent.id}`;
                    navigator.clipboard.writeText(link);
                    toast({ title: "הקישור הועתק!" });
                  }}
                >
                  העתק קישור לפורטל
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedStudent.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedStudent.phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${selectedStudent.signed_agreement ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {selectedStudent.signed_agreement ? 'חתם הסכם' : 'לא חתם'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${selectedStudent.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedStudent.is_paid ? 'שולם' : 'לא שולם'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loadingStudent ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* First row: Acceptances and Conversations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Accepted Universities */}
                  <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-600" />
                        קבלות ({acceptedUniversities.length})
                      </CardTitle>
                      <Dialog open={isAddAcceptanceOpen} onOpenChange={setIsAddAcceptanceOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף קבלה
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>הוספת קבלה לאוניברסיטה</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>מדינה *</Label>
                              <Select value={newUniversityCountry} onValueChange={setNewUniversityCountry}>
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר מדינה" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="אנגליה">אנגליה</SelectItem>
                                  <SelectItem value="ארה״ב">ארה״ב</SelectItem>
                                  <SelectItem value="קנדה">קנדה</SelectItem>
                                  <SelectItem value="הולנד">הולנד</SelectItem>
                                  <SelectItem value="גרמניה">גרמניה</SelectItem>
                                  <SelectItem value="אוסטרליה">אוסטרליה</SelectItem>
                                  <SelectItem value="אירלנד">אירלנד</SelectItem>
                                  <SelectItem value="צרפת">צרפת</SelectItem>
                                  <SelectItem value="ספרד">ספרד</SelectItem>
                                  <SelectItem value="אחר">אחר</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>שם האוניברסיטה *</Label>
                              <UniversityAutocomplete
                                value={newUniversityName}
                                onChange={setNewUniversityName}
                                onSelectSuggestion={(suggestion) => {
                                  setNewUniversityName(suggestion.name);
                                  if (suggestion.country && !newUniversityCountry) {
                                    setNewUniversityCountry(suggestion.country);
                                  }
                                }}
                                placeholder="לדוגמה: University of Manchester"
                              />
                            </div>
                            <Button onClick={addAcceptedUniversity} disabled={savingAcceptance || !newUniversityCountry || !newUniversityName.trim()} className="w-full">
                              {savingAcceptance ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                              הוסף
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {acceptedUniversities.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">אין קבלות עדיין</p>
                      ) : (
                        <div className="space-y-2">
                          {acceptedUniversities.map((uni) => (
                            <div
                              key={uni.id}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                            >
                              <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{uni.name}</p>
                                {uni.country && (
                                  <p className="text-xs text-muted-foreground">{uni.country}</p>
                                )}
                              </div>
                              {uni.acceptance_letter_url ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(uni.acceptance_letter_url!, "_blank")}
                                  className="gap-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  מכתב קבלה
                                </Button>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    className="hidden"
                                    id={`upload-${uni.id}`}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadAcceptanceLetter(uni.id, file);
                                    }}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={uploadingAcceptance === uni.id}
                                    onClick={() => document.getElementById(`upload-${uni.id}`)?.click()}
                                    className="gap-1"
                                  >
                                    {uploadingAcceptance === uni.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Upload className="h-3 w-3" />
                                    )}
                                    העלה מכתב
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => deleteAcceptedUniversity(uni.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Conversations */}
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        יומן שיחות ({conversations.length})
                      </CardTitle>
                      <Dialog open={isAddConversationOpen} onOpenChange={setIsAddConversationOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף שיחה
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>הוספת שיחה</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>סיכום השיחה *</Label>
                              <Textarea
                                value={newConversationSummary}
                                onChange={(e) => setNewConversationSummary(e.target.value)}
                                placeholder="מה דובר בשיחה?"
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>פעולות להמשך</Label>
                              <Textarea
                                value={newConversationFollowUp}
                                onChange={(e) => setNewConversationFollowUp(e.target.value)}
                                placeholder="מה צריך לעשות בהמשך?"
                                rows={2}
                              />
                            </div>
                            <Button onClick={addConversation} disabled={savingConversation} className="w-full">
                              {savingConversation ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                              הוסף
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {conversations.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">אין שיחות מתועדות</p>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {conversations.map((conv) => (
                            <div
                              key={conv.id}
                              className="p-3 rounded-lg border bg-white space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(conv.conversation_date), "dd/MM/yyyy HH:mm", { locale: he })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => deleteConversation(conv.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm">{conv.summary}</p>
                              {conv.follow_up_actions && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                  <strong>פעולות להמשך:</strong> {conv.follow_up_actions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Second row: Checklist and Documents */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Checklist */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        צ'קליסט ({checklist.length})
                      </CardTitle>
                      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף
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
                        <p className="text-center text-muted-foreground py-8">אין פריטים</p>
                      ) : (
                        <div className="space-y-2">
                          {checklist.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                item.is_completed ? "bg-green-50/50 border-green-200" : "bg-white"
                              }`}
                            >
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
                                className="text-destructive"
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

                  {/* Documents */}
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
                            העלה
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
                              />
                            </div>
                            <div>
                              <Label>תיאור</Label>
                              <Textarea
                                value={newDocDescription}
                                onChange={(e) => setNewDocDescription(e.target.value)}
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
                                  {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: he })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(doc.file_url, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
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
            )}
          </div>
        ) : (
          // Students List View with Tabs
          <div className="space-y-6">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                <TabsTrigger value="active" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  סטודנטים פעילים ({activeStudents.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-2">
                  <History className="h-4 w-4" />
                  לקוחות עבר ({pastStudents.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש סטודנט..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <Card 
                  key={student.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => selectStudent(student)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-lg font-bold text-primary">{student.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{student.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${student.signed_agreement ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {student.signed_agreement ? 'חתם' : 'לא חתם'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${student.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {student.is_paid ? 'שולם' : 'לא שולם'}
                      </span>
                      {student.target_country && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          {student.target_country}
                        </span>
                      )}
                      {student.did_not_continue && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                          לא המשיך
                        </span>
                      )}
                      {student.status === "accepted" && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          התקבל
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {currentStudents.length === 0 
                      ? (activeTab === "active" ? "אין סטודנטים פעילים" : "אין לקוחות עבר")
                      : "לא נמצאו תוצאות"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>נוגה ייעוץ ללימודים בחו"ל © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
