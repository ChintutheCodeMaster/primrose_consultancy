import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdvisorPortalPasswordGate } from "@/components/advisors/AdvisorPortalPasswordGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { openExternalFile } from "@/lib/file-open";
import { useCountryOptions } from "@/hooks/useCountryOptions";
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
  portal_password: string | null;
}

interface OtherAdvisor {
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
  graduation_year: string | null;
}

interface AcceptedUniversity {
  id: string;
  name: string;
  country: string | null;
  acceptance_letter_url: string | null;
}

interface Scholarship {
  id: string;
  name: string;
  amount: string | null;
  notes: string | null;
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
  { value: "acceptance", label: "לאן התקבל/ה" },
];

export default function AdvisorPortal() {
  const { advisorId } = useParams<{ advisorId: string }>();
  const [loading, setLoading] = useState(true);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [otherAdvisors, setOtherAdvisors] = useState<OtherAdvisor[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [pastStudents, setPastStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
  const [universityOptions, setUniversityOptions] = useState<string[]>([]);
  const [uniSearch, setUniSearch] = useState('');
  const [showAddCustomUni, setShowAddCustomUni] = useState(false);
  const [customUniValue, setCustomUniValue] = useState('');
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  // Scholarship states
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipOptions, setScholarshipOptions] = useState<string[]>([]);
  const [newScholarshipName, setNewScholarshipName] = useState("");
  const [newScholarshipAmount, setNewScholarshipAmount] = useState("");
  const [newScholarshipNotes, setNewScholarshipNotes] = useState("");
  const [isAddScholarshipOpen, setIsAddScholarshipOpen] = useState(false);
  const [savingScholarship, setSavingScholarship] = useState(false);
  const [scholarshipDropdownOpen, setScholarshipDropdownOpen] = useState(false);
  const [scholarshipSearch, setScholarshipSearch] = useState('');
  const [showAddCustomScholarship, setShowAddCustomScholarship] = useState(false);
  const [customScholarshipValue, setCustomScholarshipValue] = useState('');
  const scholarshipDropdownRef = useRef<HTMLDivElement>(null);

  const countryOptions = useCountryOptions();

  useEffect(() => {
    if (advisorId) {
      fetchAdvisorData();
    }
  }, [advisorId]);

  useEffect(() => {
    const fetchUniOptions = async () => {
      const { data } = await supabase
        .from('target_university_options')
        .select('name')
        .order('sort_order');
      if (data) setUniversityOptions(data.map(d => d.name));
    };
    fetchUniOptions();
  }, []);

  useEffect(() => {
    const fetchScholarshipOpts = async () => {
      const { data } = await supabase
        .from('scholarship_options')
        .select('name')
        .order('sort_order');
      if (data) setScholarshipOptions(data.map(d => d.name));
    };
    fetchScholarshipOpts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(event.target as Node)) {
        setUniDropdownOpen(false);
        setUniSearch('');
        setShowAddCustomUni(false);
      }
      if (scholarshipDropdownRef.current && !scholarshipDropdownRef.current.contains(event.target as Node)) {
        setScholarshipDropdownOpen(false);
        setScholarshipSearch('');
        setShowAddCustomScholarship(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCustomUniversity = async () => {
    const trimmed = customUniValue.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from('target_university_options')
      .insert({ name: trimmed, sort_order: universityOptions.length + 1 });
    if (error && error.code !== '23505') {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף אוניברסיטה", variant: "destructive" });
      return;
    }
    if (!universityOptions.includes(trimmed)) {
      setUniversityOptions(prev => [...prev, trimmed]);
    }
    setNewUniversityName(trimmed);
    setCustomUniValue('');
    setShowAddCustomUni(false);
    setUniDropdownOpen(false);
    toast({ title: `${trimmed} נוספה לרשימה` });
  };

  const handleAddCustomScholarship = async () => {
    const trimmed = customScholarshipValue.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from('scholarship_options')
      .insert({ name: trimmed, sort_order: scholarshipOptions.length + 1 });
    if (error && error.code !== '23505') {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף מלגה", variant: "destructive" });
      return;
    }
    if (!scholarshipOptions.includes(trimmed)) {
      setScholarshipOptions(prev => [...prev, trimmed]);
    }
    setNewScholarshipName(trimmed);
    setCustomScholarshipValue('');
    setShowAddCustomScholarship(false);
    setScholarshipDropdownOpen(false);
    toast({ title: `${trimmed} נוספה לרשימה` });
  };

  const fetchAdvisorData = async () => {
    setLoading(true);
    
    // Fetch advisor info (including password)
    const { data: advisorData, error: advisorError } = await supabase
      .from("advisors")
      .select("id, name, email, phone, portal_password")
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

    // Fetch other active advisors (excluding current one)
    const { data: otherAdvisorsData } = await supabase
      .from("advisors")
      .select("id, name, email, phone")
      .eq("is_active", true)
      .neq("id", advisorId)
      .order("name", { ascending: true });

    setOtherAdvisors(otherAdvisorsData || []);

    // Fetch all students and filter by advisor_name (supports multiple advisors)
    const { data: allStudents } = await supabase
      .from("students")
      .select("id, name, email, phone, signed_agreement, is_paid, target_country, target_university, status, did_not_continue, graduation_year, advisor_name")
      .order("name", { ascending: true });

    // Filter students where advisor_name contains this advisor's name
    const advisorStudents = (allStudents || []).filter(student => {
      if (!student.advisor_name) return false;
      const advisorNames = student.advisor_name.split(',').map((n: string) => n.trim());
      return advisorNames.includes(advisorData.name);
    });

    // Split into active and past students
    const active = advisorStudents.filter(s => 
      (!s.did_not_continue) && 
      s.status !== 'accepted' && 
      s.status !== 'graduated' &&
      !s.graduation_year
    );
    
    const past = advisorStudents.filter(s => 
      s.did_not_continue || 
      s.status === 'accepted' || 
      s.status === 'graduated' ||
      s.graduation_year
    );

    setActiveStudents(active);
    setPastStudents(past);
    setLoading(false);
  };

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingStudent(true);

    // Fetch all data in parallel
    const [checklistResult, documentsResult, conversationsResult, universitiesResult, scholarshipsResult] = await Promise.all([
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
        .order("created_at", { ascending: false }),
      supabase
        .from("student_scholarships")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
    ]);

    setChecklist(checklistResult.data || []);
    setDocuments(documentsResult.data || []);
    setConversations(conversationsResult.data || []);
    setAcceptedUniversities(universitiesResult.data || []);
    setScholarships(scholarshipsResult.data || []);
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
      .upload(fileName, file, { contentType: file.type, cacheControl: "3600" });

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

  // Scholarship functions
  const addScholarship = async () => {
    if (!newScholarshipName.trim() || !selectedStudent) return;
    
    setSavingScholarship(true);
    const { error } = await supabase.from("student_scholarships").insert({
      student_id: selectedStudent.id,
      name: newScholarshipName,
      amount: newScholarshipAmount || null,
      notes: newScholarshipNotes || null,
    });

    if (error) {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף מלגה", variant: "destructive" });
    } else {
      toast({ title: "המלגה נוספה בהצלחה" });
      setNewScholarshipName("");
      setNewScholarshipAmount("");
      setNewScholarshipNotes("");
      setIsAddScholarshipOpen(false);
      selectStudent(selectedStudent);
    }
    setSavingScholarship(false);
  };

  const deleteScholarship = async (scholarshipId: string) => {
    const { error } = await supabase
      .from("student_scholarships")
      .delete()
      .eq("id", scholarshipId);

    if (!error) {
      setScholarships(prev => prev.filter(s => s.id !== scholarshipId));
      toast({ title: "המלגה נמחקה" });
    }
  };

  const currentStudents = activeTab === "active" ? activeStudents : pastStudents;
  const filteredStudents = currentStudents.filter(s => 
    s.name.includes(searchTerm) || (s.email && s.email.includes(searchTerm)) || (s.phone && s.phone.includes(searchTerm))
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

  // Show password gate if advisor has a password and user hasn't authenticated
  if (advisor.portal_password && !isAuthenticated) {
    return (
      <AdvisorPortalPasswordGate
        advisorName={advisor.name}
        correctPassword={advisor.portal_password}
        onSuccess={() => setIsAuthenticated(true)}
      />
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
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-600" />
                        לאן התקבל/ה ({acceptedUniversities.length + scholarships.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Universities sub-section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">אוניברסיטאות ({acceptedUniversities.length})</h4>
                          <Dialog open={isAddAcceptanceOpen} onOpenChange={setIsAddAcceptanceOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                                <Plus className="h-4 w-4 ml-1" />
                                הוסף
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>הוספת קבלה לאוניברסיטה</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>מדינה *</Label>
                                    <Select value={newUniversityCountry} onValueChange={setNewUniversityCountry}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="בחר מדינה" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {countryOptions.map((country) => (
                                          <SelectItem key={country} value={country}>{country}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>אוניברסיטה *</Label>
                                    <div ref={uniDropdownRef} className="relative">
                                      <div
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                                        onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
                                      >
                                        <span className={newUniversityName ? "" : "text-muted-foreground"}>
                                          {newUniversityName || "בחר אוניברסיטה"}
                                        </span>
                                        <ChevronLeft className="h-4 w-4 opacity-50 rotate-[-90deg]" />
                                      </div>
                                      {uniDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                                          <div className="p-2">
                                            <Input
                                              value={uniSearch}
                                              onChange={(e) => setUniSearch(e.target.value)}
                                              placeholder="חפש אוניברסיטה..."
                                              className="h-8 text-sm"
                                              autoFocus
                                            />
                                          </div>
                                          <div className="max-h-48 overflow-y-auto">
                                            {universityOptions
                                              .filter(opt => opt.toLowerCase().includes(uniSearch.toLowerCase()))
                                              .map(option => (
                                                <button
                                                  key={option}
                                                  type="button"
                                                  className={`w-full px-3 py-1.5 text-sm text-right hover:bg-muted transition-colors ${newUniversityName === option ? "bg-primary/10 font-medium" : ""}`}
                                                  onClick={() => {
                                                    setNewUniversityName(option);
                                                    setUniDropdownOpen(false);
                                                    setUniSearch('');
                                                  }}
                                                >
                                                  {option}
                                                </button>
                                              ))}
                                            {universityOptions.filter(opt => opt.toLowerCase().includes(uniSearch.toLowerCase())).length === 0 && (
                                              <p className="px-3 py-2 text-sm text-muted-foreground">לא נמצאו תוצאות</p>
                                            )}
                                          </div>
                                          <div className="border-t p-2">
                                            {!showAddCustomUni ? (
                                              <button
                                                type="button"
                                                className="w-full px-3 py-1.5 text-sm text-right hover:bg-muted transition-colors flex items-center gap-2 text-primary"
                                                onClick={() => setShowAddCustomUni(true)}
                                              >
                                                <Plus className="h-4 w-4" />
                                                הוסף אוניברסיטה חדשה
                                              </button>
                                            ) : (
                                              <div className="flex gap-2">
                                                <Input
                                                  value={customUniValue}
                                                  onChange={(e) => setCustomUniValue(e.target.value)}
                                                  placeholder="שם האוניברסיטה..."
                                                  className="h-8 text-sm flex-1"
                                                  dir="ltr"
                                                  autoFocus
                                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomUniversity())}
                                                />
                                                <Button type="button" size="sm" className="h-8" onClick={handleAddCustomUniversity}>
                                                  הוסף
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Button onClick={addAcceptedUniversity} disabled={savingAcceptance || !newUniversityCountry || !newUniversityName.trim()} className="w-full">
                                  {savingAcceptance ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                                  הוסף
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {acceptedUniversities.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">אין אוניברסיטאות</p>
                        ) : (
                          <div className="space-y-2">
                            {acceptedUniversities.map((uni) => (
                              <div key={uni.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                                <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{uni.name}</p>
                                  {uni.country && <p className="text-xs text-muted-foreground">{uni.country}</p>}
                                </div>
                                {uni.acceptance_letter_url ? (
                                  <Button variant="outline" size="sm" onClick={() => openExternalFile(uni.acceptance_letter_url!, `acceptance-letter-${uni.name}`)} className="gap-1">
                                    <FileText className="h-3 w-3" />
                                    מכתב קבלה
                                  </Button>
                                ) : (
                                  <>
                                    <input type="file" className="hidden" id={`upload-${uni.id}`} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAcceptanceLetter(uni.id, file); }} />
                                    <Button variant="outline" size="sm" disabled={uploadingAcceptance === uni.id}
                                      onClick={() => document.getElementById(`upload-${uni.id}`)?.click()} className="gap-1">
                                      {uploadingAcceptance === uni.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                      העלה מכתב
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAcceptedUniversity(uni.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-green-200" />

                      {/* Scholarships sub-section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">מלגות ({scholarships.length})</h4>
                          <Dialog open={isAddScholarshipOpen} onOpenChange={setIsAddScholarshipOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                                <Plus className="h-4 w-4 ml-1" />
                                הוסף
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>הוספת מלגה</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>שם המלגה *</Label>
                                  <div ref={scholarshipDropdownRef} className="relative">
                                    <div
                                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                                      onClick={() => setScholarshipDropdownOpen(!scholarshipDropdownOpen)}
                                    >
                                      <span className={newScholarshipName ? "" : "text-muted-foreground"}>
                                        {newScholarshipName || "בחר מלגה"}
                                      </span>
                                      <ChevronLeft className="h-4 w-4 opacity-50 rotate-[-90deg]" />
                                    </div>
                                    {scholarshipDropdownOpen && (
                                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                                        <div className="p-2">
                                          <Input
                                            value={scholarshipSearch}
                                            onChange={(e) => setScholarshipSearch(e.target.value)}
                                            placeholder="חפש מלגה..."
                                            className="h-8 text-sm"
                                            autoFocus
                                          />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                          {scholarshipOptions
                                            .filter(opt => opt.toLowerCase().includes(scholarshipSearch.toLowerCase()))
                                            .map(option => (
                                              <button
                                                key={option}
                                                type="button"
                                                className={`w-full px-3 py-1.5 text-sm text-right hover:bg-muted transition-colors ${newScholarshipName === option ? "bg-primary/10 font-medium" : ""}`}
                                                onClick={() => {
                                                  setNewScholarshipName(option);
                                                  setScholarshipDropdownOpen(false);
                                                  setScholarshipSearch('');
                                                }}
                                              >
                                                {option}
                                              </button>
                                            ))}
                                          {scholarshipOptions.filter(opt => opt.toLowerCase().includes(scholarshipSearch.toLowerCase())).length === 0 && (
                                            <p className="px-3 py-2 text-sm text-muted-foreground">לא נמצאו תוצאות</p>
                                          )}
                                        </div>
                                        <div className="border-t p-2">
                                          {!showAddCustomScholarship ? (
                                            <button
                                              type="button"
                                              className="w-full px-3 py-1.5 text-sm text-right hover:bg-muted transition-colors flex items-center gap-2 text-primary"
                                              onClick={() => setShowAddCustomScholarship(true)}
                                            >
                                              <Plus className="h-4 w-4" />
                                              הוסף מלגה חדשה
                                            </button>
                                          ) : (
                                            <div className="flex gap-2">
                                              <Input
                                                value={customScholarshipValue}
                                                onChange={(e) => setCustomScholarshipValue(e.target.value)}
                                                placeholder="שם המלגה..."
                                                className="h-8 text-sm flex-1"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomScholarship())}
                                              />
                                              <Button type="button" size="sm" className="h-8" onClick={handleAddCustomScholarship}>
                                                הוסף
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label>סכום מלגה</Label>
                                  <Input
                                    value={newScholarshipAmount}
                                    onChange={(e) => setNewScholarshipAmount(e.target.value)}
                                    placeholder="לדוגמה: $10,000"
                                    dir="ltr"
                                  />
                                </div>
                                <div>
                                  <Label>הערות</Label>
                                  <Textarea
                                    value={newScholarshipNotes}
                                    onChange={(e) => setNewScholarshipNotes(e.target.value)}
                                    placeholder="הערות נוספות..."
                                    rows={2}
                                  />
                                </div>
                                <Button onClick={addScholarship} disabled={savingScholarship || !newScholarshipName.trim()} className="w-full">
                                  {savingScholarship ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
                                  הוסף
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {scholarships.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">אין מלגות</p>
                        ) : (
                          <div className="space-y-2">
                            {scholarships.map((sch) => (
                              <div key={sch.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                                <GraduationCap className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{sch.name}</p>
                                  {sch.amount && <p className="text-xs text-muted-foreground">סכום: {sch.amount}</p>}
                                  {sch.notes && <p className="text-xs text-muted-foreground">{sch.notes}</p>}
                                </div>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteScholarship(sch.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                                onClick={() => openExternalFile(doc.file_url, doc.name)}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Determine the correct page based on student status
                          let targetUrl = `/students?highlight=${student.id}`;
                          if (student.did_not_continue) {
                            targetUrl = `/did-not-continue/2025-ומטה?highlight=${student.id}`;
                          } else if (student.graduation_year) {
                            // Has graduation year - goes to past clients
                            targetUrl = `/past-clients/${student.graduation_year}?highlight=${student.id}`;
                          }
                          window.open(targetUrl, '_blank');
                        }}
                        title="פתח כרטיס לקוח בחלון חדש"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
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

        {/* Other Advisors Section */}
        {otherAdvisors.length > 0 && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                יועצים נוספים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherAdvisors.map((otherAdvisor) => (
                  <div key={otherAdvisor.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="font-medium">{otherAdvisor.name}</div>
                    {otherAdvisor.email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${otherAdvisor.email}`} className="hover:underline" dir="ltr">
                          {otherAdvisor.email}
                        </a>
                      </div>
                    )}
                    {otherAdvisor.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${otherAdvisor.phone}`} className="hover:underline" dir="ltr">
                          {otherAdvisor.phone}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>נוגה ייעוץ ללימודים בחו"ל © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
