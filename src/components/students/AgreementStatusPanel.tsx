import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  FileX,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FileText,
  Plus,
  Settings,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface StudentAgreementStatus {
  id: string;
  name: string;
  email: string;
  signedAgreement: boolean;
  signedAt?: string;
}

interface AgreementTemplate {
  id: string;
  name: string;
  is_active: boolean;
}

export const AgreementStatusPanel = () => {
  const [students, setStudents] = useState<StudentAgreementStatus[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const { data: templates = [] } = useQuery({
    queryKey: ["agreement-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agreement_templates")
        .select("id, name, is_active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AgreementTemplate[];
    },
  });

  useEffect(() => {
    const fetchStudents = async () => {
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name, email, signed_agreement")
        .is("graduation_year", null)
        .order("created_at", { ascending: false });

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        return;
      }

      const { data: agreements, error: agreementsError } = await supabase
        .from("student_agreements")
        .select("student_id, signed_at");

      if (agreementsError) {
        console.error("Error fetching agreements:", agreementsError);
      }

      const agreementMap = new Map(
        (agreements || []).map((a) => [a.student_id, a.signed_at])
      );

      setStudents(
        (studentsData || []).map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          signedAgreement: s.signed_agreement || false,
          signedAt: agreementMap.get(s.id),
        }))
      );
      setLoading(false);
    };

    fetchStudents();
  }, []);

  const copyLink = (studentId: string) => {
    const link = `${window.location.origin}/agreement/${studentId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "הקישור הועתק!",
      description: "הקישור לטופס ההסכם הועתק ללוח",
    });
  };

  const openLink = (studentId: string) => {
    const link = `${window.location.origin}/agreement/${studentId}`;
    window.open(link, "_blank");
  };

  const signedStudents = students.filter((s) => s.signedAgreement);
  const unsignedStudents = students.filter((s) => !s.signedAgreement);

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="rounded-r-lg rounded-l-none h-24 px-2"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="writing-mode-vertical text-xs mr-1">טפסים</span>
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed left-4 top-20 w-80 z-50 shadow-lg border-primary/20 max-h-[calc(100vh-6rem)]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          טפסים והסכמים
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[calc(100vh-14rem)]">
          <div className="space-y-4 pl-2">
            {/* Forms Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  טפסי תחילת תהליך
                </h4>
                <Link to="/agreement-templates">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-1">
                {templates.length === 0 ? (
                  <Link to="/agreement-templates">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      צור טופס ראשון
                    </Button>
                  </Link>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{template.name}</span>
                        {template.is_active && (
                          <Badge
                            variant="default"
                            className="text-[10px] px-1.5 py-0"
                          >
                            פעיל
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <Link to="/agreement-templates">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-xs mt-1"
                  >
                    <Settings className="h-3 w-3" />
                    ניהול טפסים
                  </Button>
                </Link>
              </div>
            </div>

            <hr />

            {/* Agreement Status Section */}
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                טוען...
              </p>
            ) : (
              <>
                {/* Summary */}
                <div className="flex gap-2 text-sm">
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 hover:bg-green-100"
                  >
                    חתמו: {signedStudents.length}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800 hover:bg-orange-100"
                  >
                    טרם חתמו: {unsignedStudents.length}
                  </Badge>
                </div>

                {/* Unsigned Students */}
                {unsignedStudents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-1">
                      <FileX className="h-4 w-4" />
                      ממתינים לחתימה
                    </h4>
                    <div className="space-y-2">
                      {unsignedStudents.slice(0, 10).map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between bg-orange-50 rounded-lg p-2 text-sm"
                        >
                          <span className="font-medium truncate flex-1">
                            {student.name}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyLink(student.id)}
                              title="העתק קישור"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openLink(student.id)}
                              title="פתח טופס"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {unsignedStudents.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center">
                          ועוד {unsignedStudents.length - 10} נוספים...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Signed Students */}
                {signedStudents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1">
                      <FileCheck className="h-4 w-4" />
                      חתמו על ההסכם
                    </h4>
                    <div className="space-y-2">
                      {signedStudents.slice(0, 5).map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between bg-green-50 rounded-lg p-2 text-sm"
                        >
                          <span className="font-medium truncate">
                            {student.name}
                          </span>
                          {student.signedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(student.signedAt).toLocaleDateString(
                                "he-IL"
                              )}
                            </span>
                          )}
                        </div>
                      ))}
                      {signedStudents.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          ועוד {signedStudents.length - 5} נוספים...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
