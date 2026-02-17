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
      .select('name, email, amount_paid, graduation_year')
      .eq('did_not_continue', false)
      .gt('amount_paid', 0)
      .or('graduation_year.is.null,graduation_year.eq.2026')
      .order('name');

    if (error || !data) {
      setStatus('שגיאה: ' + (error?.message || 'לא נמצאו נתונים'));
      return;
    }

    // Deduplicate: keep the entry with higher amount_paid, prefer real email
    const seen = new Map<string, typeof data[0]>();
    
    // Normalize name for dedup
    const normalize = (name: string) => {
      return name
        .replace(/\s*2$/, '') // remove trailing " 2"
        .replace(/ג'יניאו/, "ג'יניאנו") // normalize variant
        .replace(/עבודה שעתית/, '') // remove "עבודה שעתית" suffix
        .trim();
    };

    for (const row of data) {
      const key = normalize(row.name);
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, row);
      } else {
        // Keep the one with a real email, or higher amount
        const existingHasEmail = existing.email && !existing.email.includes('לא צוין') && !existing.email.includes('pending');
        const newHasEmail = row.email && !row.email.includes('לא צוין') && !row.email.includes('pending');
        
        if (!existingHasEmail && newHasEmail) {
          seen.set(key, { ...row, amount_paid: (existing.amount_paid || 0) + (row.amount_paid || 0) });
        } else if (existingHasEmail) {
          seen.set(key, { ...existing, amount_paid: (existing.amount_paid || 0) + (row.amount_paid || 0) });
        } else if ((row.amount_paid || 0) > (existing.amount_paid || 0)) {
          seen.set(key, row);
        }
      }
    }

    const rows = Array.from(seen.values()).map((s) => ({
      'שם': s.name.replace(/\s*2$/, '').replace(/עבודה שעתית/, '').trim(),
      'אימייל': s.email || '',
      'סכום ששולם': s.amount_paid,
      'סוג': s.graduation_year === '2026' ? 'לקוח עבר 2026' : 'סטודנט פעיל',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'רשימת סטודנטים');
    ws['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 18 }];
    XLSX.writeFile(wb, 'students_and_past_clients_2026.xlsx');
    setStatus(`הורד בהצלחה! ${rows.length} רשומות (אחרי הסרת כפילויות)`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4" dir="rtl">
      <h1 className="text-2xl font-bold">ייצוא סטודנטים ולקוחות עבר 2026</h1>
      <p className="text-muted-foreground">כולל כל מי ששילם (ללא כפילויות)</p>
      <Button onClick={exportToExcel} size="lg">הורד אקסל</Button>
      <p>{status}</p>
    </div>
  );
}
