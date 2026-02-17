import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';

export default function TempExportEmails() {
  const [status, setStatus] = useState('טוען...');

  const exportToExcel = async () => {
    setStatus('מושך נתונים...');
    const { data, error } = await supabase
      .from('students')
      .select('name, email, amount_paid, graduation_year')
      .eq('did_not_continue', false)
      .gte('amount_paid', 1000)
      .or('graduation_year.is.null,graduation_year.eq.2026')
      .order('name');

    if (error || !data) {
      setStatus('שגיאה: ' + (error?.message || 'לא נמצאו נתונים'));
      return;
    }

    const rows = data.map((s) => ({
      'שם': s.name,
      'אימייל': s.email || '',
      'סכום ששולם': s.amount_paid,
      'סוג': s.graduation_year === '2026' ? 'לקוח עבר 2026' : 'סטודנט פעיל',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'רשימת אימיילים');
    
    // Set column widths
    ws['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 18 }];
    
    XLSX.writeFile(wb, 'students_emails_1000plus.xlsx');
    setStatus(`הורד בהצלחה! ${rows.length} רשומות`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" dir="rtl">
      <h1 className="text-2xl font-bold">ייצוא אימיילים - סטודנטים ולקוחות עבר 2026</h1>
      <p className="text-muted-foreground">ששילמו ₪1,000 ומעלה</p>
      <Button onClick={exportToExcel} size="lg">הורד אקסל</Button>
      <p>{status}</p>
    </div>
  );
}
