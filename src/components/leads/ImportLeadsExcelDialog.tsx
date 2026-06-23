import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

interface ImportLeadsExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  year: string;
}

interface ParsedLead {
  name: string;
  email: string;
  phone: string;
  degreeType: string;
  meetingSummary: string;
  advisorName: string;
  source: string;
  packageCost: number;
  amountPaid: number;
  packageNotes: string;
}

interface DuplicateInfo {
  lead: ParsedLead;
  duplicateType: 'within_list' | 'existing_lead' | 'existing_student';
  existingName?: string;
  existingLocation?: string;
}

interface ConflictResolution {
  index: number;
  action: 'skip' | 'import' | 'pending';
}

// Column mapping from Hebrew to our fields
const COLUMN_MAP: Record<string, keyof ParsedLead> = {
  'Client': 'name',
  'Name': 'name',
  'Full Name': 'name',
  'Email': 'email',
  'Phone': 'phone',
  'Degree Type': 'degreeType',
  'Meeting Summary': 'meetingSummary',
  'Assigned Consultant': 'advisorName',
  'Consultant': 'advisorName',
  'Lead Source': 'source',
  'Source': 'source',
  'Origin': 'source',
  'Service Cost': 'packageCost',
  'Package Cost': 'packageCost',
  'Paid': 'amountPaid',
  'Amount Paid': 'amountPaid',
  'Package Notes': 'packageNotes',
  'Notes': 'packageNotes',
};

export function ImportLeadsExcelDialog({ open, onOpenChange, onImportComplete, year }: ImportLeadsExcelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedLead[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [resolutions, setResolutions] = useState<ConflictResolution[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, '').replace(/^972/, '0');
  };

  const checkDuplicates = async (leads: ParsedLead[]) => {
    setIsChecking(true);
    const foundDuplicates: DuplicateInfo[] = [];

    try {
      // Fetch existing leads and students
      const [leadsResult, studentsResult] = await Promise.all([
        supabase.from('leads').select('name, email, phone'),
        supabase.from('students').select('name, email, phone'),
      ]);

      const existingLeads = leadsResult.data || [];
      const existingStudents = studentsResult.data || [];

      // Check each parsed lead
      const seenNames = new Map<string, number>();

      leads.forEach((lead, index) => {
        const normalizedName = lead.name.trim().toLowerCase();
        const normalizedPhone = normalizePhone(lead.phone);
        const normalizedEmail = lead.email?.trim().toLowerCase();

        // Check for duplicates within the list
        if (seenNames.has(normalizedName)) {
          foundDuplicates.push({
            lead,
            duplicateType: 'within_list',
            existingName: lead.name,
            existingLocation: `Row ${seenNames.get(normalizedName)! + 1} in list`,
          });
        } else {
          seenNames.set(normalizedName, index);
        }

        // Check against existing leads
        const matchingLead = existingLeads.find(el => {
          const elName = el.name?.trim().toLowerCase();
          const elPhone = normalizePhone(el.phone || '');
          const elEmail = el.email?.trim().toLowerCase();
          return elName === normalizedName || 
                 (normalizedPhone && elPhone === normalizedPhone) ||
                 (normalizedEmail && elEmail === normalizedEmail);
        });

        if (matchingLead) {
          foundDuplicates.push({
            lead,
            duplicateType: 'existing_lead',
            existingName: matchingLead.name,
            existingLocation: 'Inquiries',
          });
        }

        // Check against existing students
        const matchingStudent = existingStudents.find(es => {
          const esName = es.name?.trim().toLowerCase();
          const esPhone = normalizePhone(es.phone || '');
          const esEmail = es.email?.trim().toLowerCase();
          return esName === normalizedName || 
                 (normalizedPhone && esPhone === normalizedPhone) ||
                 (normalizedEmail && esEmail === normalizedEmail);
        });

        if (matchingStudent) {
          foundDuplicates.push({
            lead,
            duplicateType: 'existing_student',
            existingName: matchingStudent.name,
            existingLocation: 'Students',
          });
        }
      });

      setDuplicates(foundDuplicates);
      
      // Initialize resolutions - all pending
      setResolutions(foundDuplicates.map((_, i) => ({ index: i, action: 'pending' })));

    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.error('Error checking duplicates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setErrors(['The file is empty or contains only headers']);
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => h?.trim());
        const rows = jsonData.slice(1);

        const parseErrors: string[] = [];
        const leads: ParsedLead[] = [];

        // Map headers to field indices
        const fieldIndices: Partial<Record<keyof ParsedLead, number>> = {};
        headers.forEach((header, index) => {
          if (header && COLUMN_MAP[header]) {
            fieldIndices[COLUMN_MAP[header]] = index;
          }
        });

        rows.forEach((row, index) => {
          if (!row || row.every(cell => !cell)) return; // Skip empty rows

          const rowNum = index + 2;
          const getValue = (field: keyof ParsedLead): string => {
            const idx = fieldIndices[field];
            if (idx === undefined) return '';
            return String(row[idx] || '').trim();
          };

          const name = getValue('name');
          const phone = getValue('phone');

          if (!name) {
            parseErrors.push(`Row ${rowNum}: missing name`);
            return;
          }

          leads.push({
            name,
            email: getValue('email'),
            phone,
            degreeType: getValue('degreeType') || 'bachelor',
            meetingSummary: getValue('meetingSummary'),
            advisorName: getValue('advisorName'),
            source: getValue('source'),
            packageCost: Number(getValue('packageCost')) || 0,
            amountPaid: Number(getValue('amountPaid')) || 0,
            packageNotes: getValue('packageNotes'),
          });
        });

        setErrors(parseErrors);
        setPreviewData(leads);
        setDuplicates([]);
        setResolutions([]);

        if (leads.length > 0) {
          await checkDuplicates(leads);
        }

      } catch (error) {
        console.error('Error parsing Excel:', error);
        setErrors(['Error reading the file. Make sure it is a valid Excel file.']);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleResolution = (index: number, action: 'skip' | 'import') => {
    setResolutions(prev => prev.map((r, i) => 
      i === index ? { ...r, action } : r
    ));
  };

  const canImport = () => {
    if (previewData.length === 0) return false;
    if (duplicates.length > 0) {
      // All duplicates must have a resolution
      return resolutions.every(r => r.action !== 'pending');
    }
    return true;
  };

  const getLeadsToImport = (): ParsedLead[] => {
    if (duplicates.length === 0) return previewData;
    
    // Get names of leads to skip
    const skipNames = new Set(
      duplicates
        .filter((_, i) => resolutions[i]?.action === 'skip')
        .map(d => d.lead.name.trim().toLowerCase())
    );

    return previewData.filter(lead => !skipNames.has(lead.name.trim().toLowerCase()));
  };

  const handleImport = async () => {
    const leadsToImport = getLeadsToImport();
    if (leadsToImport.length === 0) {
      toast.info('No inquiries to import');
      return;
    }

    setIsLoading(true);
    try {
      // Auto-link imported leads to the logged-in consultant so RLS lets them
      // through. Admins (no advisor row) import with advisor_id NULL — those
      // leads land in the admin's IEC inbox.
      const { data: { user } } = await supabase.auth.getUser();
      let advisorId: string | null = null;
      let advisorName: string = '';
      if (user) {
        const { data: advisor } = await supabase
          .from('advisors')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (advisor) {
          advisorId = (advisor as any).id;
          advisorName = (advisor as any).name ?? '';
        }
      }

      const insertData = leadsToImport.map(lead => ({
        name: lead.name,
        email: lead.email || `no-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@placeholder.com`,
        phone: lead.phone || '',
        degree_type: lead.degreeType || 'bachelor',
        meeting_summary: lead.meetingSummary || null,
        source: lead.source || null,
        package_notes: lead.packageNotes || null,
        status: 'new',
        advisor_id: advisorId,
        advisor_name: advisorName || null,
      }));

      const { error } = await supabase.from('leads').insert(insertData as any);

      if (error) throw error;

      toast.success(`Imported ${leadsToImport.length} inquiries successfully!`);
      handleClose();
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error importing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewData([]);
    setDuplicates([]);
    setResolutions([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  const getDuplicateTypeLabel = (type: DuplicateInfo['duplicateType']) => {
    switch (type) {
      case 'within_list': return 'Duplicate in list';
      case 'existing_lead': return 'Exists in Inquiries';
      case 'existing_student': return 'Exists in Students';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import inquiries from Excel - {year}
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with inquiry data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload File */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Upload file Excel</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Supported columns: Client/Name, Email, Phone, Degree Type, Meeting Summary, Assigned Consultant, Lead Source, Service Cost, Paid, Package Notes
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="leads-excel-upload"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 ml-2" />
              Choose file
            </Button>
          </div>

          {/* Loading state */}
          {isChecking && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin ml-2" />
              <span>Checking duplicates...</span>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                Errors in file
              </h3>
              <ul className="text-sm space-y-1">
                {errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-destructive">{error}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-muted-foreground">...and {errors.length - 5} errors</li>
                )}
              </ul>
            </div>
          )}

          {/* Duplicates Found */}
          {duplicates.length > 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                Found {duplicates.length} Duplicates - please choose what to do
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {duplicates.map((dup, index) => (
                  <div key={index} className="bg-background rounded p-3 border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">{dup.lead.name}</span>
                        <span className="text-sm text-muted-foreground mr-2">
                          ({getDuplicateTypeLabel(dup.duplicateType)})
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {dup.duplicateType === 'within_list' 
                        ? `also appears in ${dup.existingLocation}`
                        : `already exists in ${dup.existingLocation}: ${dup.existingName}`}
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={resolutions[index]?.action === 'skip'}
                          onCheckedChange={() => handleResolution(index, 'skip')}
                        />
                        <span className="text-sm">Skip</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={resolutions[index]?.action === 'import'}
                          onCheckedChange={() => handleResolution(index, 'import')}
                        />
                        <span className="text-sm">Import anyway</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && !isChecking && (
            <div className="bg-primary/5 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Preview ({getLeadsToImport().length} of {previewData.length} imported)
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Name</th>
                      <th className="text-left py-1">Email</th>
                      <th className="text-left py-1">Phone</th>
                      <th className="text-left py-1">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((lead, index) => {
                      const isDuplicate = duplicates.some(d => 
                        d.lead.name.trim().toLowerCase() === lead.name.trim().toLowerCase()
                      );
                      const willSkip = isDuplicate && resolutions.some((r, i) => 
                        duplicates[i]?.lead.name.trim().toLowerCase() === lead.name.trim().toLowerCase() &&
                        r.action === 'skip'
                      );
                      
                      return (
                        <tr 
                          key={index} 
                          className={`border-b border-border/50 ${willSkip ? 'opacity-40 line-through' : ''}`}
                        >
                          <td className="py-1">{lead.name}</td>
                          <td className="py-1">{lead.email || '-'}</td>
                          <td className="py-1">{lead.phone || '-'}</td>
                          <td className="py-1">{lead.source || '-'}</td>
                        </tr>
                      );
                    })}
                    {previewData.length > 10 && (
                      <tr>
                        <td colSpan={4} className="py-1 text-muted-foreground">
                          ...and {previewData.length - 10} Inquiries
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {previewData.length > 0 && !isChecking && (
            <Button 
              onClick={handleImport} 
              disabled={isLoading || !canImport()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  Importing...
                </>
              ) : (
                `Import ${getLeadsToImport().length} Inquiries`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
