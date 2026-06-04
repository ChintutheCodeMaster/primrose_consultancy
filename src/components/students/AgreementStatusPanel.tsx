import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, FileX, Copy, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface StudentAgreementStatus {
  id: string;
  name: string;
  email: string;
  signedAgreement: boolean;
  signedAt?: string;
}

type AgreementType = 'package' | 'hourly' | 'edit' | 'mba';

const agreementTypes: Record<AgreementType, string> = {
  package: 'Package',
  hourly: 'Hourly',
  edit: 'Edit',
  mba: 'MBA',
};

export const AgreementStatusPanel = () => {
  const [students, setStudents] = useState<StudentAgreementStatus[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAgreementTypes, setSelectedAgreementTypes] = useState<Record<string, AgreementType>>({});

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

      const fetchedStudents = (studentsData || []).map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        signedAgreement: s.signed_agreement || false,
        signedAt: agreementMap.get(s.id),
      }));

      setStudents(fetchedStudents);
      
      // Initialize default agreement type for each student
      const defaults: Record<string, AgreementType> = {};
      fetchedStudents.forEach((s) => {
        defaults[s.id] = 'package';
      });
      setSelectedAgreementTypes(defaults);
      
      setLoading(false);
    };

    fetchStudents();
  }, []);

  const getAgreementLink = (studentId: string, type: AgreementType) => {
    return `${window.location.origin}/agreement/${studentId}?type=${type}`;
  };

  const copyLink = (studentId: string) => {
    const type = selectedAgreementTypes[studentId] || 'package';
    const link = getAgreementLink(studentId, type);
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: `The ${agreementTypes[type]} agreement link has been copied to the clipboard.`,
    });
  };

  const openLink = (studentId: string) => {
    const type = selectedAgreementTypes[studentId] || 'package';
    const link = getAgreementLink(studentId, type);
    window.open(link, "_blank");
  };

  const handleAgreementTypeChange = (studentId: string, type: AgreementType) => {
    setSelectedAgreementTypes((prev) => ({
      ...prev,
      [studentId]: type,
    }));
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
          <span className="writing-mode-vertical text-xs mr-1">Agreements</span>
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed left-4 top-20 w-80 z-50 shadow-lg border-primary/20 max-h-[calc(100vh-6rem)]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Agreement Tracking
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
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-2 text-sm">
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                Signed: {signedStudents.length}
              </Badge>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                Unsigned: {unsignedStudents.length}
              </Badge>
            </div>

            {/* Unsigned Students */}
            {unsignedStudents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-1">
                  <FileX className="h-4 w-4" />
                  Awaiting Signature
                </h4>
                <ScrollArea className="h-40">
                  <div className="space-y-2 pl-2">
                    {unsignedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex flex-col gap-2 bg-orange-50 rounded-lg p-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate flex-1">{student.name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyLink(student.id)}
                              title="Copy Link"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openLink(student.id)}
                              title="Open Form"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <Select
                          value={selectedAgreementTypes[student.id] || 'package'}
                          onValueChange={(v) => handleAgreementTypeChange(student.id, v as AgreementType)}
                        >
                          <SelectTrigger className="h-7 text-xs bg-white">
                            <SelectValue placeholder="Select Agreement" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-[100]">
                            <SelectItem value="package">Package</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                            <SelectItem value="mba">MBA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Signed Students */}
            {signedStudents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1">
                  <FileCheck className="h-4 w-4" />
                  Agreement Signed
                </h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2 pl-2">
                    {signedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between bg-green-50 rounded-lg p-2 text-sm"
                      >
                        <span className="font-medium truncate">{student.name}</span>
                        {student.signedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(student.signedAt).toLocaleDateString("en-US")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
