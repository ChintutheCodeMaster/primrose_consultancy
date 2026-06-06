import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";


const AgreementPreview = () => {
  const [searchParams] = useSearchParams();
  const agreementType = searchParams.get("type") || "package";
  const [loading, setLoading] = useState(true);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>("");

  useEffect(() => {
    const fetchTemplate = async () => {
      const { data: template } = await supabase
        .from("agreement_templates")
        .select("content, name")
        .eq("type", agreementType)
        .maybeSingle();

      if (template) {
        setTemplateContent(template.content);
        setTemplateName(template.name);
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [agreementType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!templateContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir="ltr">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-10 pb-10">
            <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Template Not Found
            </h1>
            <p className="text-gray-600">
              No agreement template of this type was found in the system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4" dir="ltr">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {templateName || "Work Order Form"}
          </h1>
          <p className="text-lg text-primary font-medium">
            Primrose IEC Consulting for Study Abroad
          </p>
          <div className="mt-4 inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium">
            Preview Only
          </div>
        </div>

        {/* Agreement Content */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div 
              className="agreement-content prose prose-sm max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-strong:text-gray-900 prose-ul:pl-5 prose-ol:pl-5"
              dangerouslySetInnerHTML={{ __html: templateContent }} 
            />
          </CardContent>
        </Card>

        {/* Sample Signature Form (disabled) */}
        <Card className="opacity-60">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Signatory Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-gray-100 rounded border"></div>
              <div className="h-10 bg-gray-100 rounded border"></div>
              <div className="h-10 bg-gray-100 rounded border"></div>
              <div className="h-10 bg-gray-100 rounded border"></div>
            </div>
            <div className="mt-4 h-10 bg-gray-100 rounded border"></div>
            <div className="mt-6 h-12 bg-primary/20 rounded"></div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Primrose IEC Consulting for Study Abroad
        </p>
      </div>
    </div>
  );
};

export default AgreementPreview;