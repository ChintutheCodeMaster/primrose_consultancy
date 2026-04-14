import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { openExternalFile } from "@/lib/file-open";
import { 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download, 
  User, 
  Phone, 
  Mail,
  Loader2,
  FileSignature,
  CreditCard,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  advisor_name: string | null;
  signed_agreement: boolean;
  is_paid: boolean;
  target_country: string | null;
  target_university: string | null;
  program: string | null;
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

interface AcceptedUniversity {
  id: string;
  name: string;
  country: string | null;
  acceptance_letter_url: string | null;
}

export default function StudentPortal() {
  const { studentId } = useParams<{ studentId: string }>();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [acceptedUniversities, setAcceptedUniversities] = useState<AcceptedUniversity[]>([]);

  useEffect(() => {
    if (studentId) {
      fetchPortalData();
    }
  }, [studentId]);

  const fetchPortalData = async () => {
    setLoading(true);
    
    // Fetch student info
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("id, name, email, phone, advisor_name, signed_agreement, is_paid, target_country, target_university, program")
      .eq("id", studentId)
      .maybeSingle();

    if (studentError || !studentData) {
      toast({
        title: "שגיאה",
        description: "לא נמצא מועמד עם הקישור הזה",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setStudent(studentData);

    // Fetch checklist items
    const { data: checklistData } = await supabase
      .from("student_checklist_items")
      .select("*")
      .eq("student_id", studentId)
      .order("sort_order", { ascending: true });

    setChecklist(checklistData || []);

    // Fetch documents
    const { data: documentsData } = await supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    setDocuments(documentsData || []);

    // Fetch accepted universities
    const { data: universitiesData } = await supabase
      .from("accepted_universities")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });

    setAcceptedUniversities(universitiesData || []);
    setLoading(false);
  };

  const toggleChecklistItem = async (itemId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("student_checklist_items")
      .update({ is_completed: !currentStatus })
      .eq("id", itemId);

    if (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הפריט",
        variant: "destructive",
      });
      return;
    }

    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, is_completed: !currentStatus } : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.is_completed).length;
  const progressPercent = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">הקישור לא תקין</h1>
            <p className="text-gray-600">לא נמצא מועמד עם הקישור הזה</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            שלום, {student.name}! 👋
          </h1>
          <p className="text-lg text-primary font-medium">
            נוגה ייעוץ ללימודים בחו"ל
          </p>
        </div>

        {/* Advisor Info */}
        {student.advisor_name && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">היועץ שלך</p>
                  <p className="font-medium">{student.advisor_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Agreement Status */}
          <Card className={student.signed_agreement ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <FileSignature className={`h-5 w-5 ${student.signed_agreement ? "text-green-600" : "text-orange-600"}`} />
                <div>
                  <p className="text-sm text-muted-foreground">הסכם עבודה</p>
                  <p className={`font-medium ${student.signed_agreement ? "text-green-700" : "text-orange-700"}`}>
                    {student.signed_agreement ? "נחתם ✓" : "ממתין לחתימה"}
                  </p>
                </div>
              </div>
              {!student.signed_agreement && (
                <Button 
                  size="sm" 
                  className="mt-3 w-full"
                  onClick={() => window.open(`/agreement/${studentId}`, "_blank")}
                >
                  חתום על ההסכם
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className={student.is_paid ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <CreditCard className={`h-5 w-5 ${student.is_paid ? "text-green-600" : "text-red-600"}`} />
                <div>
                  <p className="text-sm text-muted-foreground">תשלום</p>
                  <p className={`font-medium ${student.is_paid ? "text-green-700" : "text-red-700"}`}>
                    {student.is_paid ? "שולם ✓" : "ממתין לתשלום"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">יעד</p>
                  <p className="font-medium">
                    {student.target_university || student.target_country || "טרם נקבע"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accepted Universities */}
        {acceptedUniversities.length > 0 && (
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-green-600" />
                אוניברסיטאות שהתקבלת אליהן 🎉
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(
                  acceptedUniversities.reduce((acc, uni) => {
                    const country = uni.country || 'אחר';
                    if (!acc[country]) acc[country] = [];
                    acc[country].push(uni);
                    return acc;
                  }, {} as Record<string, AcceptedUniversity[]>)
                ).map(([country, unis]) => (
                  <div key={country}>
                    <div className="text-sm font-medium text-muted-foreground mb-1">{country}</div>
                    <div className="space-y-2">
                      {unis.map((uni) => (
                        <div key={uni.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-green-100">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{uni.name}</span>
                          </div>
                          {uni.acceptance_letter_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openExternalFile(uni.acceptance_letter_url!, `acceptance-letter-${uni.name}`)}
                              className="gap-1"
                            >
                              <Download className="h-4 w-4" />
                              מכתב קבלה
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        {checklist.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">התקדמות בתהליך</span>
                <span className="text-sm text-muted-foreground">{completedCount}/{checklist.length} משימות</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              רשימת משימות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checklist.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                אין משימות כרגע
              </p>
            ) : (
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      item.is_completed ? "bg-green-50/50 border-green-200" : "bg-white border-border"
                    }`}
                  >
                    <Checkbox
                      checked={item.is_completed}
                      onCheckedChange={() => toggleChecklistItem(item.id, item.is_completed)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      {item.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3" />
                          <span>עד {format(new Date(item.due_date), "dd/MM/yyyy", { locale: he })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents - Grouped by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              מסמכים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                אין מסמכים כרגע
              </p>
            ) : (
              <div className="space-y-4">
                {[
                  { value: "strategy_questionnaire", label: "שאלון אסטרטגיה" },
                  { value: "personal_essays", label: "חיבורים אישיים" },
                  { value: "recommendations", label: "המלצות" },
                  { value: "cv", label: "קורות חיים" },
                  { value: "additional", label: "מסמכים נוספים" },
                ].map((cat) => {
                  const catDocs = documents.filter(d => d.category === cat.value);
                  if (catDocs.length === 0) return null;
                  return (
                    <div key={cat.value}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">{cat.label}</h4>
                      <div className="space-y-2">
                        {catDocs.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openExternalFile(doc.file_url, doc.name)}
                            >
                              <Download className="h-4 w-4 ml-1" />
                              הורד
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Other/legacy categories */}
                {(() => {
                  const otherDocs = documents.filter(d => !['strategy_questionnaire', 'personal_essays', 'recommendations', 'cv', 'additional'].includes(d.category));
                  if (otherDocs.length === 0) return null;
                  return (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">מסמכים כלליים</h4>
                      <div className="space-y-2">
                        {otherDocs.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openExternalFile(doc.file_url, doc.name)}
                            >
                              <Download className="h-4 w-4 ml-1" />
                              הורד
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>יש שאלות? צור קשר עם היועץ שלך</p>
          <p className="mt-2">נוגה ייעוץ ללימודים בחו"ל © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
