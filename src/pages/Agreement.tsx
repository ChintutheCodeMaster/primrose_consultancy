import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  idNumber: string;
  address: string;
  agreed: boolean;
}

const Agreement = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    birthDate: "",
    email: "",
    phone: "",
    idNumber: "",
    address: "",
    agreed: false,
  });

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) {
        navigate("/");
        return;
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

    fetchStudent();
  }, [studentId, navigate]);

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            טופס הזמנת עבודה
          </h1>
          <p className="text-lg text-primary font-medium">
            נוגה ייעוץ ללימודים בחו"ל
          </p>
        </div>

        {/* Agreement Content */}
        <Card className="mb-8">
          <CardContent className="pt-6 prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p className="font-semibold text-lg text-gray-900">מועמד יקר,</p>
            <p>
              אנחנו מתרגשים להתחיל איתך תהליך של ליווי להגשה ללימודים בחו"ל!
              מדובר במסע מרגש ומשמעותי ותודה שבחרת בנו כדי שנהיה חלק ממנו.
              חשוב מאוד שתקדיש את מלוא תשומת הלב בקריאת הפרטים המופיעים מטה,
              כדי שהתהליך יתנהל בצורה הכי מקצועית ונכונה, דבר אשר יחסוך לך
              זמן לא מבוטל ומשאבים נוספים.
            </p>
            <p>
              אנחנו מתחייבים לרמה השירות הגבוהה ביותר, אשר כוללת ליווי של
              יועץ אישי ובנוסף, ללא עלות נוספת, מעבר של יועץ נוסף על החומרים
              שלך.
            </p>
            <p className="text-sm italic">
              עמוד זה הינו טופס הזמנת עבודה של הלקוח (להלן: "הלקוח") עם נוגה
              שירותים אקדמיים (להלן: "נוגה").
            </p>
            <p className="text-xs text-gray-500">
              * הנהלים והטופס מנוסחים בלשון זכר, אך מיועדים לנשים ולגברים כאחד
            </p>

            <hr className="my-6" />

            <h3 className="text-lg font-bold text-gray-900">
              פרטי תשלום ונהלים
            </h3>
            <ul className="list-disc pr-6 space-y-2">
              <li>
                עלות השירות תחול לפי המחיר שסוכם אל מול נציג נוגה. במידה והמחיר
                הסופי שסוכם שונה בעקבות הנחה, המחיר הסופי יהיה זה שהוסכם עליו
                בכתב מול נציג נוגה ויצורף להסכם זה כנספח א'.
              </li>
              <li>
                התשלום יתבצע באחת מהדרכים הבאות, ובתיאום עם הלקוח:
                <ul className="list-circle pr-4 mt-1">
                  <li>תשלום באמצעות כרטיס אשראי</li>
                  <li>העברה בנקאית</li>
                  <li>העברה באמצעות Bit</li>
                </ul>
              </li>
              <li>
                התשלום על חבילה יתבצע מראש, אלא אם הוסכם על פריסה לתשלומים.
                ככלל, מספר התשלומים לא יעלה על 4.
              </li>
            </ul>

            <h4 className="font-bold mt-4">סיום התקשרות:</h4>
            <ul className="list-disc pr-6 space-y-2">
              <li>
                במידה ולקוח מעוניין להפסיק את ההתקשרות, במידה ומדובר בחבילה,
                תתבצע הערכה של שעות העבודה בהסכמה עם המועמד ועל הלקוח יהיה לשלם
                תוך 5 ימי עסקים במידה ונותרה יתרה לתשלום.
              </li>
              <li>
                הלקוח ונוגה רשאים להפסיק את ההתקשרות עם נוגה בהתראה של 24 שעות
                ומכל סיבה שרואה לנכון.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-6">
              3. הגבלת אחריות
            </h3>
            <ul className="list-disc pr-6 space-y-2">
              <li>
                על המועמד לוודא מול המוסדות שהוא מנסה להתקבל אליהם, את התאריך
                הסופי להגשה (להלן: ״דד ליין״) ודרישות הקבלה.
              </li>
              <li>
                הלקוח מאשר כי האחריות על תהליך הקבלה שלו חלה אך ורק עליו, ולא
                ייראה בנוגה ומי מטעמה אחראיים לאי קבלתו למוסד שאליו פונה.
              </li>
              <li>
                ״אפליקיישן״ הינו תהליך שנדרשים אליו כללי אתיקה מסויימים
                מהמוסדות האקדמיים השונים. הלקוח לכן יאשר כי ייבחן את הכללים
                של המוסדות אליו פונה ויוודא שהוא עומד בהם במסגרת ההגשה:
                <ul className="list-none pr-4 mt-1 text-sm text-gray-600">
                  <li>
                    - All of the components of your application must be your
                    own work
                  </li>
                  <li>
                    - Your application must be an honest representation of
                    yourself
                  </li>
                  <li>
                    - Your application materials should be as current as
                    possible at the time of submission
                  </li>
                </ul>
              </li>
              <li>
                הלקוח מודע לכך שנוגה אינה אחראית וכן לא תבצע כתיבת חלקים בשם
                או במקום המועמד.
              </li>
              <li>
                עמידה בדדליין להגשת האפליקיישן היא אחריות של הלקוח ונוגה לא
                מתחייבת שתעמוד בדדליין מסויים.
              </li>
              <li>
                היקף העבודה שנוגה תבצע תהיה בהסכמה בין הצדדים, ובתנאי שהלקוח
                יעביר בזמן את החומרים הנדרשים לביצוע העבודה.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-6">4. סודיות</h3>
            <ul className="list-disc pr-6 space-y-2">
              <li>
                אני מאשר כי נוגה או מי מטעמו רשאי לעשות כל שימוש, על פי שיקול
                דעתו הבלעדי ובהתאם לצרכיו, לרבות שימוש בכל חומרי אישור קבלה,
                שיופקו בשל הליווי של החברה, וזאת ללא כל סייג ומבלי שיצטרכו
                לקבל אישור מפורש ממני בתנאי שימחקו פרטי האישיים.
              </li>
              <li>
                הנך מתחייב להימנע מכל פגיעה בשמה הטוב ו/או במוניטין נוגה ובכלל
                כך, עובדיה ו/או מנהליה.
              </li>
            </ul>

            <p className="mt-6 text-center text-sm text-gray-600">
              במידה ויש נושאים שתרצו לשתף, פנו ל-
              <a
                href="mailto:info@nogaconsultancy.com"
                className="text-primary hover:underline"
              >
                info@nogaconsultancy.com
              </a>
            </p>
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
