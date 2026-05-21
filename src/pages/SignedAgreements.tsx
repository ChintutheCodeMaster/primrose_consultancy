import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const typeLabels: Record<string, string> = {
  package: 'חבילה',
  hourly: 'שעתי',
  edit: 'לערוך',
  mba: 'MBA',
};

interface SignedAgreement {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_number: string;
  address: string;
  birth_date: string;
  signed_at: string;
  mba_package_selections: string[] | null;
  mba_package_other: string | null;
  mba_payment_option: string | null;
  mba_payment_other: string | null;
  linkedin_profile: string | null;
}

export default function SignedAgreements() {
  const [selectedAgreement, setSelectedAgreement] = useState<SignedAgreement | null>(null);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['signed-agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_agreements')
        .select('*')
        .order('signed_at', { ascending: false });
      if (error) throw error;
      return data as SignedAgreement[];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-payment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, payment_type, name');
      if (error) throw error;
      return data;
    },
  });

  const studentPaymentTypeMap = new Map(students.map(s => [s.id, s.payment_type || 'package']));
  const studentNameMap = new Map(students.map(s => [s.id, s.name]));

  // Group agreements by payment type
  const grouped = agreements.reduce<Record<string, SignedAgreement[]>>((acc, agreement) => {
    const type = studentPaymentTypeMap.get(agreement.student_id) || 'package';
    if (!acc[type]) acc[type] = [];
    acc[type].push(agreement);
    return acc;
  }, {});

  const openAgreement = async (agreement: SignedAgreement) => {
    setSelectedAgreement(agreement);
    setLoadingTemplate(true);
    const type = studentPaymentTypeMap.get(agreement.student_id) || 'package';
    const { data: template } = await supabase
      .from('agreement_templates')
      .select('content')
      .eq('type', type)
      .maybeSingle();
    setTemplateContent(template?.content || null);
    setLoadingTemplate(false);
  };

  const renderAgreementContent = () => {
    if (!selectedAgreement || !templateContent) return null;
    let content = templateContent;
    content = content.replace(/\[שם פרטי\]/g, selectedAgreement.first_name);
    content = content.replace(/\[שם משפחה\]/g, selectedAgreement.last_name);
    content = content.replace(/\[אימייל\]/g, selectedAgreement.email);
    content = content.replace(/\[טלפון\]/g, selectedAgreement.phone);
    content = content.replace(/\[ת\.ז\.\]/g, selectedAgreement.id_number);
    content = content.replace(/\[כתובת\]/g, selectedAgreement.address);
    content = content.replace(/\[תאריך לידה\]/g, selectedAgreement.birth_date);
    return content;
  };

  const typeOrder = ['package', 'hourly', 'edit', 'mba'];

  return (
    <MainLayout>
      <div className="space-y-6 p-6" dir="rtl">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">הסכמים חתומים</h1>
          <Badge variant="secondary" className="text-sm">
            {agreements.length} הסכמים
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : agreements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <p>אין הסכמים חתומים עדיין</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {typeOrder.map(type => {
              const items = grouped[type];
              if (!items || items.length === 0) return null;
              return (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {typeLabels[type] || type}
                      <Badge variant="outline">{items.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {items.map(agreement => (
                        <button
                          key={agreement.id}
                          onClick={() => openAgreement(agreement)}
                          className="flex items-center justify-between w-full py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors text-right"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {agreement.first_name} {agreement.last_name}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(agreement.signed_at), 'dd/MM/yyyy')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!selectedAgreement} onOpenChange={(open) => { if (!open) setSelectedAgreement(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                הסכם - {selectedAgreement?.first_name} {selectedAgreement?.last_name}
              </DialogTitle>
            </DialogHeader>
            {loadingTemplate ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm border rounded-lg p-4 bg-muted/30">
                  <div><span className="text-muted-foreground">שם:</span> {selectedAgreement?.first_name} {selectedAgreement?.last_name}</div>
                  <div><span className="text-muted-foreground">אימייל:</span> {selectedAgreement?.email}</div>
                  <div><span className="text-muted-foreground">טלפון:</span> {selectedAgreement?.phone}</div>
                  <div><span className="text-muted-foreground">ת.ז.:</span> {selectedAgreement?.id_number}</div>
                  <div><span className="text-muted-foreground">כתובת:</span> {selectedAgreement?.address}</div>
                  <div><span className="text-muted-foreground">תאריך לידה:</span> {selectedAgreement?.birth_date}</div>
                  <div><span className="text-muted-foreground">תאריך חתימה:</span> {selectedAgreement?.signed_at ? format(new Date(selectedAgreement.signed_at), 'dd/MM/yyyy HH:mm') : '-'}</div>
                  {selectedAgreement?.linkedin_profile && (
                    <div><span className="text-muted-foreground">לינקדאין:</span> {selectedAgreement.linkedin_profile}</div>
                  )}
                </div>

                {selectedAgreement?.mba_package_selections && selectedAgreement.mba_package_selections.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/30 text-sm space-y-2">
                    <p className="font-medium">חבילת הגשה:</p>
                    <ul className="list-disc pr-5">
                      {selectedAgreement.mba_package_selections.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                    {selectedAgreement.mba_package_other && <p>אחר: {selectedAgreement.mba_package_other}</p>}
                    {selectedAgreement.mba_payment_option && <p><span className="font-medium">אופן תשלום:</span> {selectedAgreement.mba_payment_option}</p>}
                    {selectedAgreement.mba_payment_other && <p>אחר: {selectedAgreement.mba_payment_other}</p>}
                  </div>
                )}

                {templateContent && (
                  <div
                    className="prose prose-sm max-w-none border rounded-lg p-6"
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: renderAgreementContent() || '' }}
                  />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
