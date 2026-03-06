import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ParsedRecord {
  name: string;
  meeting_summary: string;
  degree_type: string;
  created_at: string | null;
  advisor_name: string;
  source: string;
  package_notes: string;
  discontinue_reason: string;
  phone: string;
  email: string;
}

function parseDateStr(dateStr: string): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  const cleaned = dateStr.trim();
  
  // Try DD.MM.YY or DD.MM.YYYY or D.M.YY
  const match = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?$/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let year = match[3] ? parseInt(match[3]) : 2022;
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day).toISOString();
    }
  }
  
  // Try D.M.YYYY format like 3.7.2022
  const match2 = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match2) {
    const day = parseInt(match2[1]);
    const month = parseInt(match2[2]);
    const year = parseInt(match2[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day).toISOString();
    }
  }
  
  return null;
}

function mapDegreeType(raw: string): string {
  const lower = (raw || '').trim().toLowerCase();
  if (lower.includes('ראשון') || lower === 'ראשון') return 'bachelor';
  if (lower.includes('שני') || lower === 'שני') return 'master';
  if (lower.includes('דוקטורט') || lower.includes('phd')) return 'phd';
  if (lower.includes('אחר')) return 'bachelor';
  if (lower.includes('מלגה')) return 'bachelor';
  if (lower.includes('וטרינריה')) return 'bachelor';
  return 'bachelor'; // default
}

function cleanHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

export default function TempImportDidNotContinue() {
  const [status, setStatus] = useState('העלי את הקובץ להתחלה');
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [duplicatesInFile, setDuplicatesInFile] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (rows.length < 2) {
          setStatus('קובץ ריק');
          return;
        }

        const headers = rows[0] as string[];
        const nameIdx = headers.indexOf('שם');
        const summaryIdx = headers.indexOf('סיכום פגישה');
        const degreeIdx = headers.indexOf('סוג תואר');
        const dateIdx = headers.indexOf('תאריך התחלה');
        const advisorIdx = headers.indexOf('יועץ מלווה');
        const sourceIdx = headers.indexOf('מקור הפנייה');
        const costIdx = headers.indexOf('עלות שירות- שולם');
        const packageIdx = headers.indexOf('הערות חבילה');
        const reasonIdx = headers.indexOf('למה לא המשיכו');
        const phoneIdx = headers.indexOf('טלפון');
        const emailIdx = headers.indexOf('אימייל');

        const parsed: ParsedRecord[] = [];
        const nameMap = new Map<string, number>();
        const dupes: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[nameIdx]) continue;

          const name = String(row[nameIdx] || '').trim();
          if (!name) continue;

          const costStr = String(row[costIdx] || '').trim();
          const packageStr = String(row[packageIdx] || '').trim();
          const packageNotes = [costStr, packageStr].filter(Boolean).join(' | ');

          const record: ParsedRecord = {
            name,
            meeting_summary: cleanHtml(String(row[summaryIdx] || '')),
            degree_type: mapDegreeType(String(row[degreeIdx] || '')),
            created_at: parseDateStr(String(row[dateIdx] || '')),
            advisor_name: String(row[advisorIdx] || '').trim(),
            source: String(row[sourceIdx] || '').trim(),
            package_notes: cleanHtml(packageNotes),
            discontinue_reason: cleanHtml(String(row[reasonIdx] || '')),
            phone: String(row[phoneIdx] || '').replace(/\*/g, '').trim() || '0000000000',
            email: String(row[emailIdx] || '').replace(/[<>]/g, '').trim(),
          };

          // Handle duplicates within file - keep the more detailed one
          const existingIdx = nameMap.get(name);
          if (existingIdx !== undefined) {
            dupes.push(name);
            const existing = parsed[existingIdx];
            // Keep the one with more content
            const existingLen = Object.values(existing).join('').length;
            const newLen = Object.values(record).join('').length;
            if (newLen > existingLen) {
              // Merge: keep longer fields
              parsed[existingIdx] = {
                ...record,
                meeting_summary: record.meeting_summary.length > existing.meeting_summary.length ? record.meeting_summary : existing.meeting_summary,
                package_notes: [existing.package_notes, record.package_notes].filter(Boolean).join(' | '),
                discontinue_reason: record.discontinue_reason || existing.discontinue_reason,
                phone: record.phone !== '0000000000' ? record.phone : existing.phone,
                email: record.email || existing.email,
              };
            } else {
              // Merge new info into existing
              parsed[existingIdx] = {
                ...existing,
                package_notes: [existing.package_notes, record.package_notes].filter(Boolean).join(' | '),
                discontinue_reason: existing.discontinue_reason || record.discontinue_reason,
                phone: existing.phone !== '0000000000' ? existing.phone : record.phone,
                email: existing.email || record.email,
              };
            }
          } else {
            nameMap.set(name, parsed.length);
            parsed.push(record);
          }
        }

        setRecords(parsed);
        setDuplicatesInFile(dupes);
        setStatus(`נמצאו ${parsed.length} רשומות ייחודיות (${dupes.length} כפילויות מוזגו)`);
      } catch (err) {
        console.error(err);
        setStatus('שגיאה בקריאת הקובץ');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const doImport = async () => {
    if (records.length === 0) return;
    setImporting(true);
    setStatus('בודק כפילויות מול בסיס הנתונים...');

    try {
      // Get existing students to check duplicates
      const { data: existingStudents } = await supabase
        .from('students')
        .select('name')
        .eq('did_not_continue', true);

      const existingNames = new Set(
        (existingStudents || []).map(s => s.name.trim().toLowerCase())
      );

      // Also check leads
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('name')
        .eq('did_not_continue', true);

      const existingLeadNames = new Set(
        (existingLeads || []).map(l => l.name.trim().toLowerCase())
      );

      const toInsert = records.filter(r => {
        const nameLower = r.name.trim().toLowerCase();
        return !existingNames.has(nameLower) && !existingLeadNames.has(nameLower);
      });

      const skipped = records.length - toInsert.length;
      if (skipped > 0) {
        setStatus(`${skipped} רשומות כבר קיימות, מייבא ${toInsert.length} חדשות...`);
      } else {
        setStatus(`מייבא ${toInsert.length} רשומות...`);
      }

      // Insert in batches of 50
      let inserted = 0;
      const batchSize = 50;
      
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize).map(r => ({
          name: r.name,
          meeting_summary: r.meeting_summary || null,
          degree_type: r.degree_type,
          created_at: r.created_at || new Date().toISOString(),
          advisor_name: r.advisor_name || null,
          source: r.source || null,
          package_notes: r.package_notes || null,
          discontinue_reason: r.discontinue_reason || null,
          phone: r.phone,
          email: r.email || null,
          did_not_continue: true,
          status: 'active',
          graduation_year: null,
        }));

        const { error } = await supabase.from('students').insert(batch);
        if (error) {
          console.error('Batch error:', error);
          toast.error(`שגיאה בבאצ' ${i / batchSize + 1}: ${error.message}`);
        } else {
          inserted += batch.length;
        }
      }

      setStatus(`הושלם! ${inserted} רשומות חדשות הוכנסו, ${skipped} כפילויות דולגו`);
      toast.success(`יובאו ${inserted} רשומות בהצלחה!`);
    } catch (err: any) {
      console.error(err);
      setStatus('שגיאה: ' + err.message);
      toast.error('שגיאה בייבוא');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8" dir="rtl">
      <h1 className="text-2xl font-bold">ייבוא לקוחות שלא המשיכו</h1>
      <p className="text-muted-foreground">כל הרשומות ייווצרו עם did_not_continue=true</p>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
        className="hidden"
      />
      
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        בחרי קובץ Excel
      </Button>

      <p className="text-lg">{status}</p>

      {duplicatesInFile.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 max-w-md">
          <p className="font-medium">כפילויות שמוזגו בקובץ:</p>
          <ul className="text-sm">
            {duplicatesInFile.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      {records.length > 0 && (
        <>
          <div className="max-h-60 overflow-y-auto border rounded p-2 w-full max-w-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-1">#</th>
                  <th className="text-right p-1">שם</th>
                  <th className="text-right p-1">סוג תואר</th>
                  <th className="text-right p-1">תאריך</th>
                  <th className="text-right p-1">יועץ</th>
                  <th className="text-right p-1">טלפון</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="p-1">{i + 1}</td>
                    <td className="p-1">{r.name}</td>
                    <td className="p-1">{r.degree_type}</td>
                    <td className="p-1">{r.created_at ? new Date(r.created_at).toLocaleDateString('he-IL') : '-'}</td>
                    <td className="p-1">{r.advisor_name || '-'}</td>
                    <td className="p-1">{r.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={doImport} disabled={importing} size="lg">
            {importing ? 'מייבא...' : `ייבא ${records.length} רשומות`}
          </Button>
        </>
      )}
    </div>
  );
}
