import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Calendar, Mail, Phone, CreditCard, MapPin, Clock, Monitor } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface AgreementDetails {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
  phone: string;
  id_number: string;
  address: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface AgreementDetailsDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgreementDetailsDialog({ studentId, studentName, open, onOpenChange }: AgreementDetailsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<AgreementDetails | null>(null);

  useEffect(() => {
    if (open && studentId) {
      fetchAgreementDetails();
    }
  }, [open, studentId]);

  const fetchAgreementDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_agreements")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching agreement details:", error);
    }
    setDetails(data);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            פרטי הסכם - {studentName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">שם פרטי</label>
                <p className="font-medium">{details.first_name}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">שם משפחה</label>
                <p className="font-medium">{details.last_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  תאריך לידה
                </label>
                <p className="font-medium">
                  {format(new Date(details.birth_date), "dd/MM/yyyy", { locale: he })}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  תעודת זהות
                </label>
                <p className="font-medium" dir="ltr">{details.id_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  אימייל
                </label>
                <p className="font-medium text-sm" dir="ltr">{details.email}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  טלפון
                </label>
                <p className="font-medium" dir="ltr">{details.phone}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                כתובת
              </label>
              <p className="font-medium">{details.address}</p>
            </div>

            {/* Signature Info */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3 text-primary">פרטי חתימה</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">נחתם בתאריך:</span>
                  <span className="font-medium">
                    {format(new Date(details.signed_at), "dd/MM/yyyy בשעה HH:mm", { locale: he })}
                  </span>
                </div>
                {details.ip_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">כתובת IP:</span>
                    <span className="font-medium" dir="ltr">{details.ip_address}</span>
                  </div>
                )}
                {details.user_agent && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">דפדפן:</span>
                    <p className="font-medium text-xs mt-1 bg-muted/50 p-2 rounded" dir="ltr">
                      {details.user_agent}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">לא נמצאו פרטי הסכם</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
