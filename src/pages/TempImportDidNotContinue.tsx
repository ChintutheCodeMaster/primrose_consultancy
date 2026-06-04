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
  
  return null;
}

function mapDegreeType(raw: string): string {
  const lower = (raw || '').trim().toLowerCase();
  if (lower.includes('Bachelor') || lower === 'Bachelor') return 'bachelor';
  if (lower.includes('Master') || lower === 'Master') return 'master';
  if (lower.includes('PhD') || lower.includes('phd')) return 'phd';
  return 'bachelor';
}

function cleanHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*/g, '')
    .trim();
}

function getLeadsYear(dateStr: string | null): string {
  // All go to "2025 and below" category, so leads_year should reflect actual year
  if (!dateStr) return '22'; // default
  const date = new Date(dateStr);
  const year = date.getFullYear();
  return String(year).slice(-2); // e.g. "21", "22", "23"
}

export default function TempImportDidNotContinue() {
  const [status, setStatus] = useState('Upload a file to start');
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
          setStatus('Empty file');
          return;
        }

        const headers = rows[0] as string[];
        console.log('Headers found:', headers);
        
        // Find column indices by header name
        const findCol = (name: string) => {
          const idx = headers.findIndex(h => h && String(h).trim().includes(name));
          return idx;
        };

        const nameIdx = findCol('Name');
        const summaryIdx = findCol('Meeting Summary');
        const degreeIdx = findCol('Degree Type');
        const dateIdx = findCol('Start Date');
        const advisorIdx = findCol('Assigned Consultant');
        const sourceIdx = findCol('Lead Source');
        const costIdx = findCol('Service Cost');
        const packageIdx = findCol('Package Notes');
        const reasonIdx = findCol('Reason for not continuing');
        const phoneIdx = findCol('Phone');
        const emailIdx = findCol('Email');

        console.log('Column indices:', { nameIdx, summaryIdx, degreeIdx, dateIdx, advisorIdx, sourceIdx, costIdx, packageIdx, reasonIdx, phoneIdx, emailIdx });

        const parsed: ParsedRecord[] = [];
        const nameMap = new Map<string, number>();
        const dupes: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[nameIdx]) continue;

          const name = String(row[nameIdx] || '').trim();
          if (!name) continue;

          const costStr = costIdx >= 0 ? cleanHtml(String(row[costIdx] || '')) : '';
          const packageStr = packageIdx >= 0 ? cleanHtml(String(row[packageIdx] || '')) : '';
          const packageNotes = [costStr, packageStr].filter(Boolean).join(' | ');

          const record: ParsedRecord = {
            name,
            meeting_summary: summaryIdx >= 0 ? cleanHtml(String(row[summaryIdx] || '')) : '',
            degree_type: degreeIdx >= 0 ? mapDegreeType(String(row[degreeIdx] || '')) : 'bachelor',
            created_at: dateIdx >= 0 ? parseDateStr(String(row[dateIdx] || '')) : null,
            advisor_name: advisorIdx >= 0 ? String(row[advisorIdx] || '').trim() : '',
            source: sourceIdx >= 0 ? String(row[sourceIdx] || '').trim() : '',
            package_notes: packageNotes,
            discontinue_reason: reasonIdx >= 0 ? cleanHtml(String(row[reasonIdx] || '')) : '',
            phone: phoneIdx >= 0 ? String(row[phoneIdx] || '').replace(/\*/g, '').replace(/[<>]/g, '').trim() : '',
            email: emailIdx >= 0 ? String(row[emailIdx] || '').replace(/[<>]/g, '').trim() : '',
          };

          // Handle duplicates within file - merge the more detailed one
          const existingIdx = nameMap.get(name);
          if (existingIdx !== undefined) {
            dupes.push(name);
            const existing = parsed[existingIdx];
            const existingLen = Object.values(existing).join('').length;
            const newLen = Object.values(record).join('').length;
            if (newLen > existingLen) {
              parsed[existingIdx] = {
                ...record,
                meeting_summary: record.meeting_summary.length > existing.meeting_summary.length ? record.meeting_summary : existing.meeting_summary,
                package_notes: [existing.package_notes, record.package_notes].filter(Boolean).join(' | '),
                discontinue_reason: record.discontinue_reason || existing.discontinue_reason,
                phone: record.phone || existing.phone,
                email: record.email || existing.email,
              };
            } else {
              parsed[existingIdx] = {
                ...existing,
                package_notes: [existing.package_notes, record.package_notes].filter(Boolean).join(' | '),
                discontinue_reason: existing.discontinue_reason || record.discontinue_reason,
                phone: existing.phone || record.phone,
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
        setStatus(`Found ${parsed.length} unique records (${dupes.length} duplicates merged)`);
      } catch (err) {
        console.error(err);
        setStatus('Error reading the file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const doImport = async () => {
    if (records.length === 0) return;
    setImporting(true);
    setStatus('Checking duplicates against the database...');

    try {
      // Check duplicates against existing leads AND students
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('name');

      const { data: existingStudents } = await supabase
        .from('students')
        .select('name');

      const existingNames = new Set([
        ...(existingLeads || []).map(l => l.name.trim().toLowerCase()),
        ...(existingStudents || []).map(s => s.name.trim().toLowerCase()),
      ]);

      const toInsert = records.filter(r => {
        const nameLower = r.name.trim().toLowerCase();
        return !existingNames.has(nameLower);
      });

      const skipped = records.length - toInsert.length;
      if (skipped > 0) {
        setStatus(`${skipped} records already exist, importing ${toInsert.length} new...`);
      } else {
        setStatus(`Importing ${toInsert.length} records...`);
      }

      // Insert into LEADS table in batches
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
          phone: r.phone || '0000000000',
          email: r.email || '',
          did_not_continue: true,
          status: 'new',
          leads_year: getLeadsYear(r.created_at),
        }));

        const { error } = await supabase.from('leads').insert(batch);
        if (error) {
          console.error('Batch error:', error);
          toast.error(`Error in batch' ${i / batchSize + 1}: ${error.message}`);
        } else {
          inserted += batch.length;
        }
      }

      setStatus(`Completed! ${inserted} new records added to inquiries, ${skipped} duplicates skipped`);
      toast.success(`Imported ${inserted} records successfully!`);
    } catch (err: any) {
      console.error(err);
      setStatus('Error: ' + err.message);
      toast.error('Import error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-bold">Import clients who did not continue</h1>
      <p className="text-muted-foreground">All records will be created as inquiries (leads) with did_not_continue=true</p>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
        className="hidden"
      />
      
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        Choose file Excel
      </Button>

      <p className="text-lg">{status}</p>

      {duplicatesInFile.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded p-3 max-w-md">
          <p className="font-medium">Duplicates merged in the file:</p>
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
                  <th className="text-left p-1">#</th>
                  <th className="text-left p-1">Name</th>
                  <th className="text-left p-1">Degree Type</th>
                  <th className="text-left p-1">Date</th>
                  <th className="text-left p-1">Consultant</th>
                  <th className="text-left p-1">Phone</th>
                  <th className="text-left p-1">Email</th>
                  <th className="text-left p-1">Package Notes</th>
                  <th className="text-left p-1">Reason</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="p-1">{i + 1}</td>
                    <td className="p-1">{r.name}</td>
                    <td className="p-1">{r.degree_type}</td>
                    <td className="p-1">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-US') : '-'}</td>
                    <td className="p-1">{r.advisor_name || '-'}</td>
                    <td className="p-1">{r.phone || '-'}</td>
                    <td className="p-1 text-xs">{r.email || '-'}</td>
                    <td className="p-1 text-xs max-w-32 truncate">{r.package_notes || '-'}</td>
                    <td className="p-1 text-xs max-w-32 truncate">{r.discontinue_reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={doImport} disabled={importing} size="lg">
            {importing ? 'Importing...' : `Import ${records.length} records to inquiries`}
          </Button>
        </>
      )}
    </div>
  );
}
