import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (students: ImportedStudent[]) => Promise<void>;
  graduationYear: string;
}

export interface ImportedStudent {
  name: string;
  email: string;
  phone: string;
  graduationYear: string;
  degreeType?: string;
  targetCountry?: string;
  targetUniversity?: string;
  program?: string;
  packageCost?: number;
  amountPaid?: number;
  advisorName?: string;
  source?: string;
}

const TEMPLATE_COLUMNS = [
  { key: 'name', label: 'שם מלא', required: true },
  { key: 'email', label: 'אימייל', required: false },
  { key: 'phone', label: 'טלפון', required: true },
  { key: 'graduation_year', label: 'שנת סיום', required: true },
  { key: 'degree_type', label: 'סוג תואר', required: false },
  { key: 'target_country', label: 'מדינת יעד', required: false },
  { key: 'target_university', label: 'אוניברסיטה', required: false },
  { key: 'program', label: 'תוכנית', required: false },
  { key: 'package_cost', label: 'עלות חבילה', required: false },
  { key: 'amount_paid', label: 'סכום ששולם', required: false },
  { key: 'advisor_name', label: 'שם יועץ', required: false },
  { key: 'source', label: 'מקור הגעה', required: false },
];

export function ImportExcelDialog({ open, onOpenChange, onImport, graduationYear }: ImportExcelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS.map(col => col.label),
      ['ישראל ישראלי', 'israel@email.com', '0501234567', graduationYear, 'bachelor', 'USA', 'MIT', 'Computer Science', '15000', '15000', 'דני כהן', 'המלצה']
    ]);

    // Set column widths
    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'לקוחות עבר');
    XLSX.writeFile(wb, `תבנית_לקוחות_עבר_${graduationYear}.xlsx`);
    toast.success('התבנית הורדה בהצלחה!');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setErrors(['הקובץ ריק או מכיל רק כותרות']);
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);

        const parseErrors: string[] = [];
        const students: ImportedStudent[] = [];

        rows.forEach((row, index) => {
          if (!row || row.every(cell => !cell)) return; // Skip empty rows

          const rowNum = index + 2;
          const name = String(row[headers.indexOf('שם מלא')] || '').trim();
          const email = String(row[headers.indexOf('אימייל')] || '').trim();
          const phone = String(row[headers.indexOf('טלפון')] || '').trim();
          const gradYear = String(row[headers.indexOf('שנת סיום')] || graduationYear).trim();

          if (!name) parseErrors.push(`שורה ${rowNum}: חסר שם מלא`);
          if (!email) parseErrors.push(`שורה ${rowNum}: ⚠️ חסר אימייל (אופציונלי)`);
          if (!phone) parseErrors.push(`שורה ${rowNum}: חסר טלפון`);

          if (name && phone) {
            students.push({
              name,
              email: email || '',
              phone,
              graduationYear: gradYear,
              degreeType: String(row[headers.indexOf('סוג תואר')] || '').trim() || undefined,
              targetCountry: String(row[headers.indexOf('מדינת יעד')] || '').trim() || undefined,
              targetUniversity: String(row[headers.indexOf('אוניברסיטה')] || '').trim() || undefined,
              program: String(row[headers.indexOf('תוכנית')] || '').trim() || undefined,
              packageCost: Number(row[headers.indexOf('עלות חבילה')]) || undefined,
              amountPaid: Number(row[headers.indexOf('סכום ששולם')]) || undefined,
              advisorName: String(row[headers.indexOf('שם יועץ')] || '').trim() || undefined,
              source: String(row[headers.indexOf('מקור הגעה')] || '').trim() || undefined,
            });
          }
        });

        setErrors(parseErrors);
        setPreviewData(students);

        if (students.length === 0 && parseErrors.length === 0) {
          setErrors(['לא נמצאו נתונים תקינים בקובץ']);
        }
      } catch (error) {
        console.error('Error parsing Excel:', error);
        setErrors(['שגיאה בקריאת הקובץ. ודא שזה קובץ Excel תקין']);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsLoading(true);
    try {
      await onImport(previewData);
      setPreviewData([]);
      setErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('שגיאה בייבוא הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPreviewData([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ייבוא לקוחות עבר מאקסל
          </DialogTitle>
          <DialogDescription>
            העלה קובץ Excel עם נתוני לקוחות עבר לשנת {graduationYear}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">שלב 1: הורד את התבנית</h3>
            <p className="text-sm text-muted-foreground mb-3">
              הורד את קובץ התבנית ומלא אותו עם נתוני הלקוחות
            </p>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 ml-2" />
              הורד תבנית Excel
            </Button>
          </div>

          {/* Upload File */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">שלב 2: העלה את הקובץ</h3>
            <p className="text-sm text-muted-foreground mb-3">
              העלה את קובץ ה-Excel המלא
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 ml-2" />
              בחר קובץ
            </Button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                שגיאות בקובץ
              </h3>
              <ul className="text-sm space-y-1">
                {errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-destructive">{error}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-muted-foreground">...ועוד {errors.length - 5} שגיאות</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                תצוגה מקדימה ({previewData.length} לקוחות)
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-1">שם</th>
                      <th className="text-right py-1">אימייל</th>
                      <th className="text-right py-1">טלפון</th>
                      <th className="text-right py-1">שנה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((student, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-1">{student.name}</td>
                        <td className="py-1">{student.email}</td>
                        <td className="py-1">{student.phone}</td>
                        <td className="py-1">{student.graduationYear}</td>
                      </tr>
                    ))}
                    {previewData.length > 5 && (
                      <tr>
                        <td colSpan={4} className="py-1 text-muted-foreground">
                          ...ועוד {previewData.length - 5} לקוחות
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {previewData.length > 0 && (
            <Button 
              onClick={handleImport} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'מייבא...' : `ייבא ${previewData.length} לקוחות`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
