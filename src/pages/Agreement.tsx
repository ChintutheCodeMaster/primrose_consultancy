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
  "Application to one program - $12,000 + VAT",
  "Each additional application - $5,000 + VAT",
  "Application to three programs (subject to advance package selection) - $21,000 + VAT",
  "Application to five programs (subject to advance package selection) - $30,000 + VAT",
];

const MBA_PAYMENT_OPTIONS = [
  "First payment for the package (1-4 installments)",
  "Advance payment of 10% of the total package cost",
  "Other",
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
        title: "Error",
        description: "You must agree to the terms of the agreement",
        variant: "destructive",
      });
      return;
    }

    // MBA-specific validations
    if (isMba) {
      if (formData.mbaPackageSelections.length === 0 && !formData.mbaPackageOther) {
        toast({
          title: "Error",
          description: "You must select at least one option for the package question",
          variant: "destructive",
        });
        return;
      }
      if (!formData.mbaPaymentOption) {
        toast({
          title: "Error",
          description: "You must select a payment method",
          variant: "destructive",
        });
        return;
      }
      if (formData.mbaPaymentOption === "Other" && !formData.mbaPaymentOther) {
        toast({
          title: "Error",
          description: "Please specify the payment method",
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
            mba_payment_other: formData.mbaPaymentOption === "Other" ? formData.mbaPaymentOther : null,
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
        title: "Signed successfully!",
        description: "The agreement has been signed and saved in the system.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving the agreement",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4" >
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Link
            </h1>
            <p className="text-gray-600">
              No student found with this link. Please ensure you have the correct link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4" >
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Agreement Signed Successfully!
            </h1>
            <p className="text-gray-600 mb-4">
              {studentName}, thank you for signing the agreement.
            </p>
            {signedAt && (
              <p className="text-sm text-gray-500">
                Signed on: {new Date(signedAt).toLocaleDateString("en-US")} at{" "}
                {new Date(signedAt).toLocaleTimeString("en-US", {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4" >
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <img src={nogaLogo} alt="Primrose IEC" className="h-20 w-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Engagement Agreement Form
          </h1>
          <p className="text-lg text-primary font-medium">
            Primrose IEC - Overseas Studies Consulting
          </p>
        </div>

        {/* Agreement Content */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            {templateContent ? (
              <div
                className="agreement-content prose prose-sm max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-strong:text-gray-900 prose-ul:pl-5 prose-ol:pl-5"
                dangerouslySetInnerHTML={{ __html: templateContent }}
              />
            ) : (
              <p className="text-center text-muted-foreground">Loading agreement content...</p>
            )}
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Signer's Details
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
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
                  <Label htmlFor="lastName">Last Name *</Label>
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
                  <Label htmlFor="birthDate">Date of Birth *</Label>
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
                  <Label htmlFor="idNumber">ID Number *</Label>
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
                  <Label htmlFor="email">Email Address *</Label>
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
                  <Label htmlFor="phone">Mobile Phone Number *</Label>
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
                      Please select the appropriate application package *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      If you agreed on a different package with a Primrose representative, please select "Other"
                    </p>
                    <div className="space-y-2">
                      {MBA_PACKAGE_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
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
                      <div className="flex items-start space-x-2 gap-2">
                        <div className="flex items-center space-x-2 mt-2">
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
                            Other:
                          </Label>
                        </div>
                        <Input
                          placeholder="Please specify"
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
                      Please select your payment method *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      If you agreed on a different payment method with a Primrose representative, please select "Other"
                    </p>
                    <div className="space-y-2">
                      {MBA_PAYMENT_OPTIONS.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
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
                            {option === "Other" ? "Other, please specify here:" : option}
                          </Label>
                        </div>
                      ))}
                      {formData.mbaPaymentOption === "Other" && (
                        <Input
                          placeholder="Please specify the payment method"
                          value={formData.mbaPaymentOther}
                          onChange={(e) =>
                            setFormData({ ...formData, mbaPaymentOther: e.target.value })
                          }
                          className="ml-6"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* LinkedIn Profile - Optional */}
                  <div className="pt-4 border-t">
                    <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
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
                <Label htmlFor="address">Residential Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t">
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
                  I acknowledge that filling out this form constitutes agreement with the above. *
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Sign and Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Primrose IEC - Overseas Studies Consulting
        </p>
      </div>
    </div>
  );
};

export default Agreement;