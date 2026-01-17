import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import nogaLogo from "@/assets/noga-logo.png";
interface FormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  idNumber: string;
  address: string;
  agreed: boolean;
  // MBA specific fields
  mbaPackageSelections: string[];
  mbaPackageOther: string;
  mbaPaymentOption: string;
  mbaPaymentOther: string;
  linkedinProfile: string;
}

const MBA_PACKAGE_OPTIONS = [
  "הגשה לתכנית אחת - 12,000 ש״ח + מע״מ",
  "כל הגשה נוספת - 5,000 ש״ח + מע״מ",
  "הגשה לשלוש תכניות (מותנה בבחירת החבילה מראש) - 21,000 ש״ח + מע״מ",
  "הגשה לחמש תכניות (מותנה בבחירת החבילה מראש) - 30,000 ש״ח + מע״מ",
];

const MBA_PAYMENT_OPTIONS = [
  "תשלום ראשון עבור החבילה (1-4 תשלומים)",
  "מקדמה ע״ס 10% מעלות החבילה הכוללת",
  "אחר",
];

const Agreement = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const agreementType = searchParams.get("type") || "package";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    birthDate: "",
    email: "",
    phone: "",
    idNumber: "",
    address: "",
    agreed: false,
    mbaPackageSelections: [],
    mbaPackageOther: "",
    mbaPaymentOption: "",
    mbaPaymentOther: "",
    linkedinProfile: "",
  });
  
  const isMba = agreementType === "mba";

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        navigate("/");
        return;
      }

      // Fetch agreement template based on type
      const { data: template } = await supabase
        .from("agreement_templates")
        .select("content")
        .eq("type", agreementType)
        .eq("is_active", true)
        .maybeSingle();

      if (template) {
        setTemplateContent(template.content);
      }

      // Check if already signed
      const { data: agreement } = await supabase
        .from("student_agreements")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();

      if (agreement) {
        setAlreadySigned(true);
        setSignedAt(agreement.signed_at);
        setStudentName(`${agreement.first_name} ${agreement.last_name}`);
        setLoading(false);
        return;
      }

      // Get student info
      const { data: student, error } = await supabase
        .from("students")
        .select("name, email, phone")
        .eq("id", studentId)
        .maybeSingle();

      if (error || !student) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const nameParts = student.name.split(" ");
      setFormData((prev) => ({
        ...prev,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: student.email || "",
        phone: student.phone || "",
      }));
      setStudentName(student.name);
      setLoading(false);
    };

    fetchData();
  }, [studentId, navigate, agreementType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreed) {
      toast({
        title: "שגיאה",
        description: "יש לאשר את תנאי ההסכם",
        variant: "destructive",
      });
      return;
    }

    // MBA-specific validations
    if (isMba) {
      if (formData.mbaPackageSelections.length === 0 && !formData.mbaPackageOther) {
        toast({
          title: "שגיאה",
          description: "יש לבחור לפחות אפשרות אחת בשאלת החבילה",
          variant: "destructive",
        });
        return;
      }
      if (!formData.mbaPaymentOption) {
        toast({
          title: "שגיאה",
          description: "יש לבחור אופן תשלום",
          variant: "destructive",
        });
        return;
      }
      if (formData.mbaPaymentOption === "אחר" && !formData.mbaPaymentOther) {
        toast({
          title: "שגיאה",
          description: "יש לפרט את אופן התשלום",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      // Insert agreement
      const { error: agreementError } = await supabase
        .from("student_agreements")
        .insert({
          student_id: studentId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate,
          email: formData.email,
          phone: formData.phone,
          id_number: formData.idNumber,
          address: formData.address,
          user_agent: navigator.userAgent,
          // MBA specific fields
          ...(isMba && {
            mba_package_selections: formData.mbaPackageSelections.length > 0 ? formData.mbaPackageSelections : null,
            mba_package_other: formData.mbaPackageOther || null,
            mba_payment_option: formData.mbaPaymentOption || null,
            mba_payment_other: formData.mbaPaymentOption === "אחר" ? formData.mbaPaymentOther : null,
            linkedin_profile: formData.linkedinProfile || null,
          }),
        });

      if (agreementError) throw agreementError;

      // Update student signed_agreement status
      const { error: updateError } = await supabase
        .from("students")
        .update({ signed_agreement: true })
        .eq("id", studentId);

      if (updateError) throw updateError;

      setAlreadySigned(true);
      setSignedAt(new Date().toISOString());

      toast({
        title: "נחתם בהצלחה!",
        description: "ההסכם נחתם ונשמר במערכת",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בשמירת ההסכם",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4" dir="rtl">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              הקישור אינו תקין
            </h1>
            <p className="text-gray-600">
              לא נמצא סטודנט עם הקישור הזה. אנא וודא שקיבלת את הקישור הנכון.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4" dir="rtl">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ההסכם נחתם בהצלחה!
            </h1>
            <p className="text-gray-600 mb-4">
              {studentName}, תודה שחתמת על ההסכם
            </p>
            {signedAt && (
              <p className="text-sm text-gray-500">
                נחתם בתאריך: {new Date(signedAt).toLocaleDateString("he-IL")} בשעה{" "}
                {new Date(signedAt).toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <img src={nogaLogo} alt="נוגה" className="h-20 w-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            טופס הזמנת עבודה
          </h1>
          <p className="text-lg text-primary font-medium">
            נוגה ייעוץ ללימודים בחו"ל
          </p>
        </div>

        {/* Agreement Content */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            {templateContent ? (
              <div 
                className="agreement-content prose prose-sm max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-strong:text-gray-900 prose-ul:pr-5 prose-ol:pr-5"
                dangerouslySetInnerHTML={{ __html: templateContent }} 
              />
            ) : (
              <p className="text-center text-muted-foreground">טוען תוכן הסכם...</p>
            )}
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              פרטי החותם
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">שם פרטי *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">שם משפחה *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDate">תאריך לידה *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="idNumber">מספר תעודת זהות *</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, idNumber: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">כתובת דואר אלקטרוני *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">מספר טלפון נייד *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* MBA-specific fields - before address */}
              {isMba && (
                <>
                  {/* Package Selection - Multiple Choice */}
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-base font-semibold">
                      נא בחר בחבילה ההגשה המתאימה *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      במידה וסיכמת על חבילה אחרת עם נציג נוגה אנא סמן ״אחר״
                    </p>
                    <div className="space-y-2">
                      {MBA_PACKAGE_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={`package-${option}`}
                            checked={formData.mbaPackageSelections.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  mbaPackageSelections: [...formData.mbaPackageSelections, option],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  mbaPackageSelections: formData.mbaPackageSelections.filter(
                                    (s) => s !== option
                                  ),
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`package-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                      {/* Other option with text input */}
                      <div className="flex items-start space-x-2 space-x-reverse gap-2">
                        <div className="flex items-center space-x-2 space-x-reverse mt-2">
                          <Checkbox
                            id="package-other"
                            checked={formData.mbaPackageOther.length > 0}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setFormData({ ...formData, mbaPackageOther: "" });
                              }
                            }}
                          />
                          <Label htmlFor="package-other" className="font-normal cursor-pointer">
                            אחר:
                          </Label>
                        </div>
                        <Input
                          placeholder="נא לפרט"
                          value={formData.mbaPackageOther}
                          onChange={(e) =>
                            setFormData({ ...formData, mbaPackageOther: e.target.value })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Option - Single Choice */}
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-base font-semibold">
                      אנא בחר באופן התשלום *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      במידה וסיכמת על אופן תשלום אחר עם נציג נוגה אנא סמן ״אחר״
                    </p>
                    <div className="space-y-2">
                      {MBA_PAYMENT_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2 space-x-reverse">
                          <input
                            type="radio"
                            id={`payment-${option}`}
                            name="mbaPaymentOption"
                            value={option}
                            checked={formData.mbaPaymentOption === option}
                            onChange={(e) =>
                              setFormData({ ...formData, mbaPaymentOption: e.target.value })
                            }
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor={`payment-${option}`} className="font-normal cursor-pointer">
                            {option === "אחר" ? "אחר, נא לפרט כאן:" : option}
                          </Label>
                        </div>
                      ))}
                      {formData.mbaPaymentOption === "אחר" && (
                        <Input
                          placeholder="נא לפרט את אופן התשלום"
                          value={formData.mbaPaymentOther}
                          onChange={(e) =>
                            setFormData({ ...formData, mbaPaymentOther: e.target.value })
                          }
                          className="mr-6"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* LinkedIn Profile - Optional */}
                  <div className="pt-4 border-t">
                    <Label htmlFor="linkedinProfile">פרופיל לינקדאין</Label>
                    <Input
                      id="linkedinProfile"
                      value={formData.linkedinProfile}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedinProfile: e.target.value })
                      }
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="address">כתובת מגורים *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-4 border-t">
                <Checkbox
                  id="agreed"
                  checked={formData.agreed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreed: checked as boolean })
                  }
                />
                <Label
                  htmlFor="agreed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  אני רואה במילוי טופס זה הסכמה עם הכתוב למעלה *
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || !formData.agreed}
              >
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    שולח...
                  </>
                ) : (
                  "חתום והגש"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} נוגה ייעוץ ללימודים בחו"ל
        </p>
      </div>
    </div>
  );
};

export default Agreement;
