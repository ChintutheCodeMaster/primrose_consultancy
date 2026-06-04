import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';

export default function TempExportEmails() {
  const [status, setStatus] = useState('Click the button to download');

  const exportToExcel = async () => {
    setStatus('Fetching data...');
    const { data, error } = await supabase
      .from('students')
      .select('name, email, amount_paid')
      .eq('graduation_year', '2025')
      .eq('did_not_continue', false)
      .gte('amount_paid', 500)
      .order('name');

    if (error || !data) {
      setStatus('Error: ' + (error?.message || 'No data found'));
      return;
    }

    // Filter out entries without real email and deduplicate by email
    const seenEmails = new Map<string, typeof data[0]>();

    for (const row of data) {
      const email = (row.email || '').trim().toLowerCase();
      if (!email || email.includes('Not specified') || email.includes('pending') || email === '') continue;
      
      const existing = seenEmails.get(email);
      if (!existing || (row.amount_paid || 0) > (existing.amount_paid || 0)) {
        seenEmails.set(email, row);
      }
    }

    const rows = Array.from(seenEmails.values()).map((s) => ({
      'Name': s.name.replace(/\s*2$/, '').trim(),
      'Email': s.email || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alumni 2025');
    ws['!cols'] = [{ wch: 25 }, { wch: 35 }];
    XLSX.writeFile(wb, 'past_clients_2025_emails.xlsx');
    setStatus(`Downloaded successfully! ${rows.length} records (no duplicate emails)`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Export Emails - Alumni 2025</h1>
      <p className="text-muted-foreground">Paid 500$ and above, no duplicate emails</p>
      <Button onClick={exportToExcel} size="lg">Download Excel</Button>
      <p>{status}</p>
    </div>
  );
}
