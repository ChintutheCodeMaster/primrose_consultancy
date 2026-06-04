import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';

export default function TempExportEmails() {
  const [status, setStatus] = useState('לחצי על הכפתור להורדה');

  const exportToExcel = async () => {
    setStatus('מושך נתונים...');
    const { data, error } = await supabase
      .from('students')
      .select('name, email, amount_paid')
      .eq('graduation_year', '2025')
      .eq('did_not_continue', false)
      .gte('amount_paid', 500)
      .order('name');

    if (error || !data) {
      setStatus('שגיאה: ' + (error?.message || 'לא נמצאו נתונים'));
      return;
    }

    // Filter out entries without real email and deduplicate by email
    const seenEmails = new Map<string, typeof data[0]>();

    for (const row of data) {
      const email = (row.email || '').trim().toLowerCase();
      if (!email || email.includes('לא צוין') || email.includes('pending') || email === '') continue;
      
      const existing = seenEmails.get(email);
      if (!existing || (row.amount_paid || 0) > (existing.amount_paid || 0)) {
        seenEmails.set(email, row);
      }
    }

    const rows = Array.from(seenEmails.values()).map((s) => ({
      'שם': s.name.replace(/\s*2$/, '').trim(),
      'אימייל': s.email || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'לקוחות עבר 2025');
    ws['!cols'] = [{ wch: 25 }, { wch: 35 }];
    XLSX.writeFile(wb, 'past_clients_2025_emails.xlsx');
    setStatus(`הורד בהצלחה! ${rows.length} רשומות (ללא כפילויות מייל)`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" dir="rtl">
      <h1 className="text-2xl font-bold">ייצוא מיילים - לקוחות עבר 2025</h1>
      <p className="text-muted-foreground">שולם 500$ ומעלה, ללא כפילויות מייל</p>
      <Button onClick={exportToExcel} size="lg">הורד אקסל</Button>
      <p>{status}</p>
    </div>
  );
}
