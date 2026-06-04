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
import { FIELD_OPTIONS } from "@/data/fieldOptions";
import { UniversityDropdown } from "@/components/ui/university-dropdown";
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
  History,
  Pencil,
  Save
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
  payment_type: string | null;
  advisor_payment_notes: string | null;
  degree_type: string | null;
  interested_country: string | null;
  interested_field: string | null;
}

interface AcceptedUniversity {
  id: string;
  name: string;
  country: string | null;
  acceptance_letter_url: string | null;
  degree_type: string | null;
  degree_type_other: string | null;
  field: string | null;
  study_year: string | null;
}

interface AppliedUniversity {
  id: string;
  name: string;
  country: string | null;
  degree_type: string | null;
  degree_type_other: string | null;
  field: string | null;
  study_year: string | null;
  application_status: string | null;
  notes: string | null;
}

const applicationStatusLabels: Record<string, string> = {
  submitted: 'Submitted',
  waiting: 'Waiting for response',
  rejected: 'Rejected',
  accepted: 'Accepted',
};

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
  { value: "strategy_questionnaire", label: "Strategy Questionnaire" },
  { value: "personal_essays", label: "Personal Essays" },
  { value: "recommendations", label: "Recommendations" },
  { value: "cv", label: "CV" },
  { value: "additional", label: "Additional Documents" },
  { value: "general", label: "General" },
  { value: "start", label: "Process Start" },
  { value: "application", label: "Applications" },
  { value: "acceptance", label: "Accepted To" },
];

export default function AdvisorPortal() {
  const { advisorId } = useParams<{ advisorId: string }>();
  const [loading, setLoading] = useState(true);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [otherAdvisors, setOtherAdvisors] = useState<OtherAdvisor[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [pastStudents, setPastStudents] = useState<Student[]>([]);
  const [acceptedStudentIds, setAcceptedStudentIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Selected student for management
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [acceptedUniversities, setAcceptedUniversities] = useState<AcceptedUniversity[]>([]);
  const [appliedUniversities, setAppliedUniversities] = useState<AppliedUniversity[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Applied universities: add/edit form state
  const [isAddAppliedOpen, setIsAddAppliedOpen] = useState(false);
  const [savingApplied, setSavingApplied] = useState(false);
  const [newAppliedName, setNewAppliedName] = useState('');
  const [newAppliedCountry, setNewAppliedCountry] = useState('');
  const [newAppliedDegreeType, setNewAppliedDegreeType] = useState('');
  const [newAppliedDegreeTypeOther, setNewAppliedDegreeTypeOther] = useState('');
  const [newAppliedField, setNewAppliedField] = useState('');
  const [newAppliedStudyYear, setNewAppliedStudyYear] = useState('');
  const [newAppliedStatus, setNewAppliedStatus] = useState('submitted');
  const [newAppliedNotes, setNewAppliedNotes] = useState('');
  const [editingAppliedId, setEditingAppliedId] = useState<string | null>(null);
  const [editAppliedData, setEditAppliedData] = useState<Partial<AppliedUniversity>>({});

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

  // New acceptance fields
  const [newAcceptanceDegreeType, setNewAcceptanceDegreeType] = useState("");
  const [newAcceptanceDegreeTypeOther, setNewAcceptanceDegreeTypeOther] = useState("");
  const [newAcceptanceField, setNewAcceptanceField] = useState("");
  const [newAcceptanceStudyYear, setNewAcceptanceStudyYear] = useState("");
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [customFieldValue, setCustomFieldValue] = useState('');
  const fieldDropdownRef = useRef<HTMLDivElement>(null);
  const [fieldOptions, setFieldOptions] = useState<string[]>([...FIELD_OPTIONS]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showAddCustomCountry, setShowAddCustomCountry] = useState(false);
  const [customCountryValue, setCustomCountryValue] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const [editingUniId, setEditingUniId] = useState<string | null>(null);
  const [editUniData, setEditUniData] = useState<Partial<AcceptedUniversity>>({});


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
      if (fieldDropdownRef.current && !fieldDropdownRef.current.contains(event.target as Node)) {
        setFieldDropdownOpen(false);
        setFieldSearch('');
        setShowAddCustomField(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
        setCountrySearch('');
        setShowAddCustomCountry(false);
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
      toast({ title: "Error", description: "Failed to add university", variant: "destructive" });
      return;
    }
    if (!universityOptions.includes(trimmed)) {
      setUniversityOptions(prev => [...prev, trimmed]);
    }
    setNewUniversityName(trimmed);
    setCustomUniValue('');
    setShowAddCustomUni(false);
    setUniDropdownOpen(false);
    toast({ title: `${trimmed} added to list` });
  };

  const handleAddCustomScholarship = async () => {
    const trimmed = customScholarshipValue.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from('scholarship_options')
      .insert({ name: trimmed, sort_order: scholarshipOptions.length + 1 });
    if (error && error.code !== '23505') {
      toast({ title: "Error", description: "Failed to add scholarship", variant: "destructive" });
      return;
    }
    if (!scholarshipOptions.includes(trimmed)) {
      setScholarshipOptions(prev => [...prev, trimmed]);
    }
    setNewScholarshipName(trimmed);
    setCustomScholarshipValue('');
    setShowAddCustomScholarship(false);
    setScholarshipDropdownOpen(false);
    toast({ title: `${trimmed} added to list` });
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
        title: "Error",
        description: "No advisor found with this link",
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
      .select("id, name, email, phone, signed_agreement, is_paid, target_country, target_university, status, did_not_continue, graduation_year, advisor_name, payment_type, advisor_payment_notes, degree_type, interested_country, interested_field")
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

    // Fetch which of these students have accepted universities
    const studentIds = advisorStudents.map(s => s.id);
    if (studentIds.length > 0) {
      const { data: acceptedData } = await supabase
        .from("accepted_universities")
        .select("student_id")
        .in("student_id", studentIds);
      setAcceptedStudentIds(new Set((acceptedData || []).map((r: any) => r.student_id)));
    } else {
      setAcceptedStudentIds(new Set());
    }

    setLoading(false);
  };

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingStudent(true);

    // Fetch all data in parallel
    const [checklistResult, documentsResult, conversationsResult, universitiesResult, scholarshipsResult, appliedResult] = await Promise.all([
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
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("applied_universities")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
    ]);

    setChecklist(checklistResult.data || []);
    setDocuments(documentsResult.data || []);
    setConversations(conversationsResult.data || []);
    setAcceptedUniversities(universitiesResult.data || []);
    setScholarships(scholarshipsResult.data || []);
    setAppliedUniversities(appliedResult.data || []);
    setLoadingStudent(false);
  };

  // Applied universities helpers
  const addAppliedUniversity = async () => {
    if (!newAppliedName.trim() || !newAppliedCountry.trim() || !selectedStudent) return;
    setSavingApplied(true);
    const insertData: any = {
      student_id: selectedStudent.id,
      name: newAppliedName,
      country: newAppliedCountry,
      application_status: newAppliedStatus || 'submitted',
    };
    if (newAppliedDegreeType) {
      insertData.degree_type = newAppliedDegreeType;
      if (newAppliedDegreeType === 'Other' && newAppliedDegreeTypeOther.trim()) {
        insertData.degree_type_other = newAppliedDegreeTypeOther;
      }
    }
    if (newAppliedField) insertData.field = newAppliedField;
    if (newAppliedStudyYear.trim()) insertData.study_year = newAppliedStudyYear.trim();
    if (newAppliedNotes.trim()) insertData.notes = newAppliedNotes.trim();

    const { error } = await (supabase as any).from("applied_universities").insert(insertData);
    if (error) {
      toast({ title: "Error", description: "Failed to add application", variant: "destructive" });
    } else {
      toast({ title: "Application added successfully" });
      setNewAppliedName('');
      setNewAppliedCountry('');
      setNewAppliedDegreeType('');
      setNewAppliedDegreeTypeOther('');
      setNewAppliedField('');
      setNewAppliedStudyYear('');
      setNewAppliedStatus('submitted');
      setNewAppliedNotes('');
      setIsAddAppliedOpen(false);
      selectStudent(selectedStudent);
    }
    setSavingApplied(false);
  };

  const deleteAppliedUniversity = async (id: string) => {
    const { error } = await (supabase as any)
      .from("applied_universities")
      .delete()
      .eq("id", id);
    if (!error) {
      setAppliedUniversities(prev => prev.filter(u => u.id !== id));
      toast({ title: "Application deleted" });
    }
  };

  const startEditApplied = (uni: AppliedUniversity) => {
    setEditingAppliedId(uni.id);
    setEditAppliedData({ ...uni });
  };

  const saveEditApplied = async () => {
    if (!editingAppliedId || !editAppliedData.name?.trim()) return;
    const { error } = await (supabase as any)
      .from("applied_universities")
      .update({
        name: editAppliedData.name,
        country: editAppliedData.country || null,
        degree_type: editAppliedData.degree_type || null,
        degree_type_other: editAppliedData.degree_type === 'Other' ? (editAppliedData.degree_type_other || null) : null,
        field: editAppliedData.field || null,
        study_year: editAppliedData.study_year || null,
        application_status: editAppliedData.application_status || 'submitted',
        notes: editAppliedData.notes || null,
      })
      .eq("id", editingAppliedId);

    if (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } else {
      setAppliedUniversities(prev =>
        prev.map(u => u.id === editingAppliedId ? { ...u, ...editAppliedData, degree_type_other: editAppliedData.degree_type === 'Other' ? editAppliedData.degree_type_other || null : null } as AppliedUniversity : u)
      );
      setEditingAppliedId(null);
      setEditAppliedData({});
      toast({ title: "Application updated" });
    }
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
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    } else {
      toast({ title: "Successfully Added" });
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
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
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
      toast({ title: "Error", description: "Failed to save document", variant: "destructive" });
    } else {
      toast({ title: "Document uploaded successfully" });
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
      toast({ title: "Error", description: "Failed to add conversation", variant: "destructive" });
    } else {
      toast({ title: "Conversation added successfully" });
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
      toast({ title: "Conversation deleted" });
    }
  };

  // Acceptance functions
  const addAcceptedUniversity = async () => {
    if (!newUniversityName.trim() || !newUniversityCountry.trim() || !selectedStudent) return;

    setSavingAcceptance(true);
    const insertData: any = {
      student_id: selectedStudent.id,
      name: newUniversityName,
      country: newUniversityCountry,
    };
    if (newAcceptanceDegreeType) {
      insertData.degree_type = newAcceptanceDegreeType;
      if (newAcceptanceDegreeType === 'Other' && newAcceptanceDegreeTypeOther.trim()) {
        insertData.degree_type_other = newAcceptanceDegreeTypeOther;
      }
    }
    if (newAcceptanceField) {
      insertData.field = newAcceptanceField;
    }
    if (newAcceptanceStudyYear.trim()) {
      insertData.study_year = newAcceptanceStudyYear.trim();
    }

    const { error } = await supabase.from("accepted_universities").insert(insertData);

    if (error) {
      toast({ title: "Error", description: "Failed to add acceptance", variant: "destructive" });
    } else {
      toast({ title: "Admission added successfully" });
      setNewUniversityName("");
      setNewUniversityCountry("");
      setNewAcceptanceDegreeType("");
      setNewAcceptanceDegreeTypeOther("");
      setNewAcceptanceField("");
      setNewAcceptanceStudyYear("");
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
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
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
      toast({ title: "Error", description: "Failed to save link", variant: "destructive" });
    } else {
      toast({ title: "Acceptance letter uploaded successfully" });
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
      toast({ title: "Admission deleted" });
    }
  };
  const startEditUniversity = (uni: AcceptedUniversity) => {
    setEditingUniId(uni.id);
    setEditUniData({ ...uni });
  };

  const saveEditUniversity = async () => {
    if (!editingUniId || !editUniData.name?.trim()) return;
    const { error } = await supabase
      .from("accepted_universities")
      .update({
        name: editUniData.name,
        country: editUniData.country || null,
        degree_type: editUniData.degree_type || null,
        degree_type_other: editUniData.degree_type === 'Other' ? (editUniData.degree_type_other || null) : null,
        field: editUniData.field || null,
        study_year: editUniData.study_year || null,
      })
      .eq("id", editingUniId);

    if (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } else {
      setAcceptedUniversities(prev =>
        prev.map(u => u.id === editingUniId ? { ...u, ...editUniData, degree_type_other: editUniData.degree_type === 'Other' ? editUniData.degree_type_other || null : null } : u)
      );
      setEditingUniId(null);
      setEditUniData({});
      toast({ title: "Admission updated" });
    }
  };


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
      toast({ title: "Error", description: "Failed to add scholarship", variant: "destructive" });
    } else {
      toast({ title: "Scholarship added successfully" });
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
      toast({ title: "Scholarship deleted" });
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4" dir="ltr">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600">No advisor found with this link</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4" dir="ltr">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hello, {advisor.name}! 👋
          </h1>
          <p className="text-lg text-primary font-medium">
            Primrose IEC - Consultant Portal
          </p>
        </div>

        {selectedStudent ? (
          // Student Management View
          <div className="space-y-6">
            {/* Back button and student info */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to list
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/portal/${selectedStudent.id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Portal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = `${window.location.origin}/portal/${selectedStudent.id}`;
                    navigator.clipboard.writeText(link);
                    toast({ title: "Link copied!" });
                  }}
                >
                  Copy Portal Link
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
                    <div className="flex items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedStudent.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedStudent.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2 flex-wrap">
                      {selectedStudent.degree_type && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Degree Type: {selectedStudent.degree_type === 'bachelor' ? 'Bachellor' : selectedStudent.degree_type === 'master' ? 'Master' : selectedStudent.degree_type === 'phd' ? 'PhD' : selectedStudent.degree_type === 'scholarship' ? 'Scholarship' : selectedStudent.degree_type}
                        </span>
                      )}
                      {selectedStudent.interested_country && (
                        <span>Country of Interest: {selectedStudent.interested_country}</span>
                      )}
                      {selectedStudent.interested_field && (
                        <span>Field of Study: {selectedStudent.interested_field}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedStudent.payment_type && (
                      <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                        Rate: {selectedStudent.payment_type === 'hourly' ? 'Hourly' : selectedStudent.payment_type === 'package' ? 'Package' : selectedStudent.payment_type === 'other' ? 'Hybrid' : selectedStudent.payment_type}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm ${selectedStudent.signed_agreement ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {selectedStudent.signed_agreement ? 'Signed Agreement' : 'No Agreement'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${selectedStudent.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedStudent.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedStudent.advisor_payment_notes && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Student Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{selectedStudent.advisor_payment_notes}</p>
                </CardContent>
              </Card>
            )}

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
                        Accepted To ({acceptedUniversities.length + scholarships.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Universities sub-section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">Universities ({acceptedUniversities.length})</h4>
                          <Dialog open={isAddAcceptanceOpen} onOpenChange={setIsAddAcceptanceOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add University Acceptance</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Country *</Label>
                                    <div ref={countryDropdownRef} className="relative">
                                      <div
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                                        onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                                      >
                                        <span className={newUniversityCountry ? "" : "text-muted-foreground"}>
                                          {newUniversityCountry || "Select Country"}
                                        </span>
                                        <ChevronLeft className="h-4 w-4 opacity-50 rotate-90" />
                                      </div>
                                      {countryDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                                          <div className="p-2">
                                            <Input
                                              value={countrySearch}
                                              onChange={(e) => setCountrySearch(e.target.value)}
                                              placeholder="Search country..."
                                              className="h-8 text-sm"
                                              autoFocus
                                            />
                                          </div>
                                          <div className="max-h-48 overflow-y-auto">
                                            {countryOptions
                                              .filter(opt => opt.toLowerCase().includes(countrySearch.toLowerCase()))
                                              .map(option => (
                                                <button
                                                  key={option}
                                                  type="button"
                                                  className={`w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors ${newUniversityCountry === option ? "bg-primary/10 font-medium" : ""}`}
                                                  onClick={() => {
                                                    setNewUniversityCountry(option);
                                                    setCountryDropdownOpen(false);
                                                    setCountrySearch('');
                                                  }}
                                                >
                                                  {option}
                                                </button>
                                              ))}
                                            {countryOptions.filter(opt => opt.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                                              <p className="px-3 py-2 text-sm text-muted-foreground">No results found</p>
                                            )}
                                          </div>
                                          <div className="border-t p-2">
                                            {!showAddCustomCountry ? (
                                              <button
                                                type="button"
                                                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2 text-primary"
                                                onClick={() => setShowAddCustomCountry(true)}
                                              >
                                                <Plus className="h-4 w-4" />
                                                Add New Country
                                              </button>
                                            ) : (
                                              <div className="flex gap-2">
                                                <Input
                                                  value={customCountryValue}
                                                  onChange={(e) => setCustomCountryValue(e.target.value)}
                                                  placeholder="Country Name..."
                                                  className="h-8 text-sm flex-1"
                                                  autoFocus
                                                  onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      if (customCountryValue.trim()) {
                                                        await supabase.from('country_options').insert({ name: customCountryValue.trim(), sort_order: countryOptions.length });
                                                        setNewUniversityCountry(customCountryValue.trim());
                                                        setCustomCountryValue('');
                                                        setShowAddCustomCountry(false);
                                                        setCountryDropdownOpen(false);
                                                      }
                                                    }
                                                  }}
                                                />
                                                <Button type="button" size="sm" className="h-8" onClick={async () => {
                                                  if (customCountryValue.trim()) {
                                                    await supabase.from('country_options').insert({ name: customCountryValue.trim(), sort_order: countryOptions.length });
                                                    setNewUniversityCountry(customCountryValue.trim());
                                                    setCustomCountryValue('');
                                                    setShowAddCustomCountry(false);
                                                    setCountryDropdownOpen(false);
                                                  }
                                                }}>
                                                  Add
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>University *</Label>
                                    <div ref={uniDropdownRef} className="relative">
                                      <div
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                                        onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
                                      >
                                        <span className={newUniversityName ? "" : "text-muted-foreground"}>
                                          {newUniversityName || "Select University"}
                                        </span>
                                        <ChevronLeft className="h-4 w-4 opacity-50 rotate-90" />
                                      </div>
                                      {uniDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                                          <div className="p-2">
                                            <Input
                                              value={uniSearch}
                                              onChange={(e) => setUniSearch(e.target.value)}
                                              placeholder="Search university..."
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
                                                  className={`w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors ${newUniversityName === option ? "bg-primary/10 font-medium" : ""}`}
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
                                              <p className="px-3 py-2 text-sm text-muted-foreground">No results found</p>
                                            )}
                                          </div>
                                          <div className="border-t p-2">
                                            {!showAddCustomUni ? (
                                              <button
                                                type="button"
                                                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2 text-primary"
                                                onClick={() => setShowAddCustomUni(true)}
                                              >
                                                <Plus className="h-4 w-4" />
                                                Add New University
                                              </button>
                                            ) : (
                                              <div className="flex gap-2">
                                                <Input
                                                  value={customUniValue}
                                                  onChange={(e) => setCustomUniValue(e.target.value)}
                                                  placeholder="University Name..."
                                                  className="h-8 text-sm flex-1"
                                                  dir="ltr"
                                                  autoFocus
                                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomUniversity())}
                                                />
                                                <Button type="button" size="sm" className="h-8" onClick={handleAddCustomUniversity}>
                                                  Add
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Degree Type</Label>
                                    <Select value={newAcceptanceDegreeType} onValueChange={setNewAcceptanceDegreeType}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Degree" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="bachelor">Bachellor</SelectItem>
                                        <SelectItem value="master">Master</SelectItem>
                                        <SelectItem value="phd">PhD</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {newAcceptanceDegreeType === 'other' && (
                                      <Input
                                        value={newAcceptanceDegreeTypeOther}
                                        onChange={(e) => setNewAcceptanceDegreeTypeOther(e.target.value)}
                                        placeholder="Specify..."
                                        className="mt-2"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <Label>Field</Label>
                                    <div ref={fieldDropdownRef} className="relative">
                                      <div
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                                        onClick={() => setFieldDropdownOpen(!fieldDropdownOpen)}
                                      >
                                        <span className={newAcceptanceField ? "" : "text-muted-foreground"}>
                                          {newAcceptanceField || "Select Field"}
                                        </span>
                                        <ChevronLeft className="h-4 w-4 opacity-50 rotate-90" />
                                      </div>
                                      {fieldDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                                          <div className="p-2">
                                            <Input
                                              value={fieldSearch}
                                              onChange={(e) => setFieldSearch(e.target.value)}
                                              placeholder="Search Field..."
                                              className="h-8 text-sm"
                                              autoFocus
                                            />
                                          </div>
                                          <div className="max-h-48 overflow-y-auto">
                                            {fieldOptions
                                              .filter(opt => opt.toLowerCase().includes(fieldSearch.toLowerCase()))
                                              .map(option => (
                                                <button
                                                  key={option}
                                                  type="button"
                                                  className={`w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors ${newAcceptanceField === option ? "bg-primary/10 font-medium" : ""}`}
                                                  onClick={() => {
                                                    setNewAcceptanceField(option);
                                                    setFieldDropdownOpen(false);
                                                    setFieldSearch('');
                                                  }}
                                                >
                                                  {option}
                                                </button>
                                              ))}
                                            {fieldOptions.filter(opt => opt.toLowerCase().includes(fieldSearch.toLowerCase())).length === 0 && (
                                              <p className="px-3 py-2 text-sm text-muted-foreground">No results found</p>
                                            )}
                                          </div>
                                          <div className="border-t p-2">
                                            {!showAddCustomField ? (
                                              <button
                                                type="button"
                                                className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2 text-primary"
                                                onClick={() => setShowAddCustomField(true)}
                                              >
                                                <Plus className="h-4 w-4" />
                                                Add New Field
                                              </button>
                                            ) : (
                                              <div className="flex gap-2">
                                                <Input
                                                  value={customFieldValue}
                                                  onChange={(e) => setCustomFieldValue(e.target.value)}
                                                  placeholder="Field Name..."
                                                  className="h-8 text-sm flex-1"
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      if (customFieldValue.trim()) {
                                                        setFieldOptions(prev => [...prev, customFieldValue.trim()]);
                                                        setNewAcceptanceField(customFieldValue.trim());
                                                        setCustomFieldValue('');
                                                        setShowAddCustomField(false);
                                                        setFieldDropdownOpen(false);
                                                      }
                                                    }
                                                  }}
                                                />
                                                <Button type="button" size="sm" className="h-8" onClick={() => {
                                                  if (customFieldValue.trim()) {
                                                    setFieldOptions(prev => [...prev, customFieldValue.trim()]);
                                                    setNewAcceptanceField(customFieldValue.trim());
                                                    setCustomFieldValue('');
                                                    setShowAddCustomField(false);
                                                    setFieldDropdownOpen(false);
                                                  }
                                                }}>
                                                  Add
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm">Study Year</Label>
                                  <Input
                                    value={newAcceptanceStudyYear}
                                    onChange={(e) => setNewAcceptanceStudyYear(e.target.value)}
                                    placeholder="Example: 2025-2026"
                                  />
                                </div>

                                <Button onClick={addAcceptedUniversity} disabled={savingAcceptance || !newUniversityCountry || !newUniversityName.trim()} className="w-full">
                                  {savingAcceptance ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                  Add
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {acceptedUniversities.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">No universities</p>
                        ) : (
                          <div className="space-y-2">
                            {acceptedUniversities.map((uni) => (
                              <div key={uni.id} className="p-3 rounded-lg border bg-white space-y-2">
                                {editingUniId === uni.id ? (
                                  <>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        value={editUniData.name || ''}
                                        onChange={(e) => setEditUniData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="University Name"
                                      />
                                      <Input
                                        value={editUniData.country || ''}
                                        onChange={(e) => setEditUniData(prev => ({ ...prev, country: e.target.value }))}
                                        placeholder="Country"
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                        value={editUniData.degree_type || ''}
                                        onChange={(e) => setEditUniData(prev => ({ ...prev, degree_type: e.target.value }))}
                                      >
                                        <option value="">Degree Type</option>
                                        <option value="bachelor">Bachellor</option>
                                        <option value="master">Master</option>
                                        <option value="phd">PhD</option>
                                        <option value="other">Other</option>
                                      </select>
                                      <Input
                                        value={editUniData.field || ''}
                                        onChange={(e) => setEditUniData(prev => ({ ...prev, field: e.target.value }))}
                                        placeholder="Field"
                                      />
                                      <Input
                                        value={editUniData.study_year || ''}
                                        onChange={(e) => setEditUniData(prev => ({ ...prev, study_year: e.target.value }))}
                                        placeholder="Study Year"
                                      />
                                    </div>
                                    {editUniData.degree_type === 'other' && (
                                      <Input
                                        value={editUniData.degree_type_other || ''}
                                        onChange={(e) => setEditUniData(prev => ({ ...prev, degree_type_other: e.target.value }))}
                                        placeholder="Specify Degree Type"
                                      />
                                    )}
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="ghost" size="sm" onClick={() => { setEditingUniId(null); setEditUniData({}); }}>
                                        Cancel
                                      </Button>
                                      <Button size="sm" onClick={saveEditUniversity} className="gap-1">
                                        <Save className="h-3 w-3" />
                                        Save
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{uni.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {[
                                          uni.country,
                                          uni.degree_type === 'other' ? uni.degree_type_other : uni.degree_type,
                                          uni.field,
                                          uni.study_year
                                        ].filter(Boolean).join(' • ')}
                                      </p>
                                    </div>
                                    {uni.acceptance_letter_url ? (
                                      <Button variant="outline" size="sm" onClick={() => openExternalFile(uni.acceptance_letter_url!, `acceptance-letter-${uni.name}`)} className="gap-1">
                                        <FileText className="h-3 w-3" />
                                        Acceptance Letter
                                      </Button>
                                    ) : (
                                      <>
                                        <input type="file" className="hidden" id={`upload-${uni.id}`} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                          onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAcceptanceLetter(uni.id, file); }} />
                                        <Button variant="outline" size="sm" disabled={uploadingAcceptance === uni.id}
                                          onClick={() => document.getElementById(`upload-${uni.id}`)?.click()} className="gap-1">
                                          {uploadingAcceptance === uni.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                          Upload Letter
                                        </Button>
                                      </>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => startEditUniversity(uni)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAcceptedUniversity(uni.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
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
                          <h4 className="font-semibold text-sm">Scholarships ({scholarships.length})</h4>
                          <Dialog open={isAddScholarshipOpen} onOpenChange={setIsAddScholarshipOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-100">
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Scholarship</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Scholarship Name *</Label>
                                  <div ref={scholarshipDropdownRef} className="relative">
                                    <div
                                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                                      onClick={() => setScholarshipDropdownOpen(!scholarshipDropdownOpen)}
                                    >
                                      <span className={newScholarshipName ? "" : "text-muted-foreground"}>
                                        {newScholarshipName || "Select Scholarship"}
                                      </span>
                                      <ChevronLeft className="h-4 w-4 opacity-50 rotate-90" />
                                    </div>
                                    {scholarshipDropdownOpen && (
                                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                                        <div className="p-2">
                                          <Input
                                            value={scholarshipSearch}
                                            onChange={(e) => setScholarshipSearch(e.target.value)}
                                            placeholder="Search scholarship..."
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
                                                className={`w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors ${newScholarshipName === option ? "bg-primary/10 font-medium" : ""}`}
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
                                            <p className="px-3 py-2 text-sm text-muted-foreground">No results found</p>
                                          )}
                                        </div>
                                        <div className="border-t p-2">
                                          {!showAddCustomScholarship ? (
                                            <button
                                              type="button"
                                              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted transition-colors flex items-center gap-2 text-primary"
                                              onClick={() => setShowAddCustomScholarship(true)}
                                            >
                                              <Plus className="h-4 w-4" />
                                              Add New Scholarship
                                            </button>
                                          ) : (
                                            <div className="flex gap-2">
                                              <Input
                                                value={customScholarshipValue}
                                                onChange={(e) => setCustomScholarshipValue(e.target.value)}
                                                placeholder="Scholarship Name..."
                                                className="h-8 text-sm flex-1"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomScholarship())}
                                              />
                                              <Button type="button" size="sm" className="h-8" onClick={handleAddCustomScholarship}>
                                                Add
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <Label>Scholarship Amount</Label>
                                  <Input
                                    value={newScholarshipAmount}
                                    onChange={(e) => setNewScholarshipAmount(e.target.value)}
                                    placeholder="Example: $10,000"
                                    dir="ltr"
                                  />
                                </div>
                                <div>
                                  <Label>Notes</Label>
                                  <Textarea
                                    value={newScholarshipNotes}
                                    onChange={(e) => setNewScholarshipNotes(e.target.value)}
                                    placeholder="Additional notes..."
                                    rows={2}
                                  />
                                </div>
                                <Button onClick={addScholarship} disabled={savingScholarship || !newScholarshipName.trim()} className="w-full">
                                  {savingScholarship ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                  Add
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {scholarships.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">No scholarships</p>
                        ) : (
                          <div className="space-y-2">
                            {scholarships.map((sch) => (
                              <div key={sch.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                                <GraduationCap className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{sch.name}</p>
                                  {sch.amount && <p className="text-xs text-muted-foreground">Amount: {sch.amount}</p>}
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

                  {/* Applied Universities */}
                  <Card className="border-primary/30 bg-primary/5 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Where Did They Apply? ({appliedUniversities.length})
                      </CardTitle>
                      <Dialog open={isAddAppliedOpen} onOpenChange={setIsAddAppliedOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Application
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add Application Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Country *</Label>
                                <Select value={newAppliedCountry} onValueChange={setNewAppliedCountry}>
                                  <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                                  <SelectContent>
                                    {countryOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>University Name *</Label>
                                <UniversityDropdown value={newAppliedName} onChange={setNewAppliedName} placeholder="Select University" />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label>Degree Type</Label>
                                <Select value={newAppliedDegreeType} onValueChange={setNewAppliedDegreeType}>
                                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bachelor">Bachellor</SelectItem>
                                    <SelectItem value="master">Master</SelectItem>
                                    <SelectItem value="phd">PhD</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Field</Label>
                                <Input value={newAppliedField} onChange={(e) => setNewAppliedField(e.target.value)} placeholder="Field" />
                              </div>
                              <div>
                                <Label>Year</Label>
                                <Input value={newAppliedStudyYear} onChange={(e) => setNewAppliedStudyYear(e.target.value)} placeholder="Study Year" />
                              </div>
                            </div>
                            {newAppliedDegreeType === 'other' && (
                              <Input value={newAppliedDegreeTypeOther} onChange={(e) => setNewAppliedDegreeTypeOther(e.target.value)} placeholder="Specify Degree Type" />
                            )}
                            <div>
                              <Label>Application Status</Label>
                              <Select value={newAppliedStatus} onValueChange={setNewAppliedStatus}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(applicationStatusLabels).map(([v, l]) => (<SelectItem key={v} value={v}>{l}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Notes</Label>
                              <Textarea value={newAppliedNotes} onChange={(e) => setNewAppliedNotes(e.target.value)} rows={2} placeholder="Notes (optional)" />
                            </div>
                            <Button onClick={addAppliedUniversity} disabled={savingApplied || !newAppliedCountry || !newAppliedName.trim()} className="w-full">
                              {savingApplied ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                              Add
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {appliedUniversities.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">No applications yet</p>
                      ) : (
                        <div className="space-y-2">
                          {appliedUniversities.map((uni) => (
                            <div key={uni.id} className="p-3 rounded-lg border bg-background space-y-2">
                              {editingAppliedId === uni.id ? (
                                <>
                                  <div className="grid grid-cols-2 gap-2">
                                    <UniversityDropdown value={editAppliedData.name || ''} onChange={(v) => setEditAppliedData(prev => ({ ...prev, name: v }))} placeholder="University Name" />
                                    <Input value={editAppliedData.country || ''} onChange={(e) => setEditAppliedData(prev => ({ ...prev, country: e.target.value }))} placeholder="Country" />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editAppliedData.degree_type || ''} onChange={(e) => setEditAppliedData(prev => ({ ...prev, degree_type: e.target.value }))}>
                                      <option value="">Degree Type</option>
                                      <option value="bachelor">Bachellor</option>
                                      <option value="master">Master</option>
                                      <option value="phd">PhD</option>
                                      <option value="other">Other</option>
                                    </select>
                                    <Input value={editAppliedData.field || ''} onChange={(e) => setEditAppliedData(prev => ({ ...prev, field: e.target.value }))} placeholder="Field" />
                                    <Input value={editAppliedData.study_year || ''} onChange={(e) => setEditAppliedData(prev => ({ ...prev, study_year: e.target.value }))} placeholder="Year" />
                                  </div>
                                  {editAppliedData.degree_type === 'other' && (
                                    <Input value={editAppliedData.degree_type_other || ''} onChange={(e) => setEditAppliedData(prev => ({ ...prev, degree_type_other: e.target.value }))} placeholder="Specify Degree Type" />
                                  )}
                                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editAppliedData.application_status || 'submitted'} onChange={(e) => setEditAppliedData(prev => ({ ...prev, application_status: e.target.value }))}>
                                    {Object.entries(applicationStatusLabels).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                                  </select>
                                  <Textarea value={editAppliedData.notes || ''} onChange={(e) => setEditAppliedData(prev => ({ ...prev, notes: e.target.value }))} rows={2} placeholder="Notes" />
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingAppliedId(null); setEditAppliedData({}); }}>Cancel</Button>
                                    <Button size="sm" onClick={saveEditApplied} className="gap-1"><Save className="h-3 w-3" />Save</Button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-start gap-3">
                                  <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium truncate">{uni.name}</p>
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {applicationStatusLabels[uni.application_status || 'submitted'] || uni.application_status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {[uni.country, uni.degree_type === 'other' ? uni.degree_type_other : uni.degree_type, uni.field, uni.study_year].filter(Boolean).join(' • ')}
                                    </p>
                                    {uni.notes && (<p className="text-xs text-muted-foreground italic mt-1">{uni.notes}</p>)}
                                  </div>
                                  <Button variant="ghost" size="icon" onClick={() => startEditApplied(uni)}><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAppliedUniversity(uni.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              )}
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
                        Conversation Log ({conversations.length})
                      </CardTitle>
                      <Dialog open={isAddConversationOpen} onOpenChange={setIsAddConversationOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Conversation
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Conversation</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Conversation Summary *</Label>
                              <Textarea
                                value={newConversationSummary}
                                onChange={(e) => setNewConversationSummary(e.target.value)}
                                placeholder="What was discussed in the conversation?"
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label>Follow-up Actions</Label>
                              <Textarea
                                value={newConversationFollowUp}
                                onChange={(e) => setNewConversationFollowUp(e.target.value)}
                                placeholder="What needs to be done next?"
                                rows={2}
                              />
                            </div>
                            <Button onClick={addConversation} disabled={savingConversation} className="w-full">
                              {savingConversation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                              Add
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {conversations.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No conversations recorded</p>
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
                                  <strong>Follow-up Actions:</strong> {conv.follow_up_actions}
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
                        Checklist ({checklist.length})
                      </CardTitle>
                      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add
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
                                placeholder="Example: Submit Transcripts"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={newItemDescription}
                                onChange={(e) => setNewItemDescription(e.target.value)}
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
                              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                              Add
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {checklist.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No items</p>
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
                                    By {format(new Date(item.due_date), "dd/MM/yyyy", { locale: he })}
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
                        Documents ({documents.length})
                      </CardTitle>
                      <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
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
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={newDocDescription}
                                onChange={(e) => setNewDocDescription(e.target.value)}
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
                            <Button onClick={uploadDocument} disabled={uploading || !selectedFile || !newDocName.trim()} className="w-full">
                              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
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
                                      if (!file || !selectedStudent) return;
                                      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                                      const ext = file.name.split(".").pop()?.toLowerCase();
                                      if (!allowedTypes.includes(file.type) && !['pdf', 'doc', 'docx'].includes(ext || '')) {
                                        toast({ title: "Error", description: "Only PDF or Word files can be uploaded", variant: "destructive" });
                                        e.target.value = '';
                                        return;
                                      }
                                      setUploading(true);
                                      const fileName = `${selectedStudent.id}/${Date.now()}.${ext}`;
                                      const { error: uploadError } = await supabase.storage
                                        .from("student-documents")
                                        .upload(fileName, file, { contentType: file.type, cacheControl: "3600" });
                                      if (uploadError) {
                                        toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
                                        setUploading(false);
                                        e.target.value = '';
                                        return;
                                      }
                                      const { data: urlData } = supabase.storage.from("student-documents").getPublicUrl(fileName);
                                      const { error: insertError } = await supabase.from("student_documents").insert({
                                        student_id: selectedStudent.id,
                                        name: file.name.replace(/\.[^/.]+$/, ""),
                                        file_url: urlData.publicUrl,
                                        category: cat.value,
                                      });
                                      if (insertError) {
                                        toast({ title: "Error", description: "Failed to save document", variant: "destructive" });
                                      } else {
                                        toast({ title: "Document uploaded successfully" });
                                        selectStudent(selectedStudent);
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
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDocument(doc.id, doc.file_url)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* Legacy categories */}
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDocument(doc.id, doc.file_url)}>
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
                  Active Students ({activeStudents.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-2">
                  <History className="h-4 w-4" />
                  Alumni ({pastStudents.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
                            targetUrl = `/did-not-continue/2025-and-below?highlight=${student.id}`;
                          } else if (student.graduation_year) {
                            // Has graduation year - goes to past clients
                            targetUrl = `/past-clients/${student.graduation_year}?highlight=${student.id}`;
                          }
                          window.open(targetUrl, '_blank');
                        }}
                        title="Open student card in new window"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${student.signed_agreement ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {student.signed_agreement ? 'Signed' : 'Not Signed'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${student.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {student.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                      {student.target_country && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          {student.target_country}
                        </span>
                      )}
                      {student.did_not_continue && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                          Closed/Lost
                        </span>
                      )}
                      {student.status === "accepted" && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Accepted
                        </span>
                      )}
                      {student.status !== "accepted" && acceptedStudentIds.has(student.id) && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          Accepted
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
                      ? (activeTab === "active" ? "No active students" : "No alumni")
                      : "No results found"
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
                Other Consultants
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
          <p>Primrose IEC © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}