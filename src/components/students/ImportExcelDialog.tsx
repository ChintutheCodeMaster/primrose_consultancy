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
  { key: 'name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: true },
  { key: 'graduation_year', label: 'Graduation Year', required: true },
  { key: 'degree_type', label: 'Degree Type', required: false },
  { key: 'target_country', label: 'Target Country', required: false },
  { key: 'target_university', label: 'Target University', required: false },
  { key: 'program', label: 'Program', required: false },
  { key: 'package_cost', label: 'Package Cost', required: false },
  { key: 'amount_paid', label: 'Amount Paid', required: false },
  { key: 'advisor_name', label: 'Advisor Name', required: false },
  { key: 'source', label: 'Source', required: false },
];

export function ImportExcelDialog({ open, onOpenChange, onImport, graduationYear }: ImportExcelDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS.map(col => col.label),
      ['John Doe', 'john.doe@email.com', '0501234567', graduationYear, 'bachelor', 'USA', 'MIT', 'Computer Science', '15000', '15000', 'Jane Smith', 'Referral']
    ]);

    // Set column widths
    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alumni');
    XLSX.writeFile(wb, `Alumni_Template_${graduationYear}.xlsx`);
    toast.success('Template downloaded successfully!');
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
          setErrors(['File is empty or contains only headers.']);
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);

        const parseErrors: string[] = [];
        const students: ImportedStudent[] = [];

        rows.forEach((row, index) => {
          if (!row || row.every(cell => !cell)) return; // Skip empty rows

          const rowNum = index + 2;
          const name = String(row[headers.indexOf('Full Name')] || '').trim();
          const email = String(row[headers.indexOf('Email')] || '').trim();
          const phone = String(row[headers.indexOf('Phone')] || '').trim();
          const gradYear = String(row[headers.indexOf('Graduation Year')] || graduationYear).trim();

          if (!name) parseErrors.push(`Row ${rowNum}: Full name is missing.`);
          if (!email) parseErrors.push(`Row ${rowNum}: ⚠️ Email is missing (optional).`);
          if (!phone) parseErrors.push(`Row ${rowNum}: Phone is missing.`);

          if (name && phone) {
            students.push({
              name,
              email: email || '',
              phone,
              graduationYear: gradYear,
              degreeType: String(row[headers.indexOf('Degree Type')] || '').trim() || undefined,
              targetCountry: String(row[headers.indexOf('Target Country')] || '').trim() || undefined,
              targetUniversity: String(row[headers.indexOf('Target University')] || '').trim() || undefined,
              program: String(row[headers.indexOf('Program')] || '').trim() || undefined,
              packageCost: Number(row[headers.indexOf('Package Cost')]) || undefined,
              amountPaid: Number(row[headers.indexOf('Amount Paid')]) || undefined,
              advisorName: String(row[headers.indexOf('Advisor Name')] || '').trim() || undefined,
              source: String(row[headers.indexOf('Source')] || '').trim() || undefined,
            });
          }
        });

        setErrors(parseErrors);
        setPreviewData(students);

        if (students.length === 0 && parseErrors.length === 0) {
          setErrors(['No valid data found in the file.']);
        }
      } catch (error) {
        console.error('Error parsing Excel:', error);
        setErrors(['Error reading the file. Please ensure it is a valid Excel file.']);
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
      toast.error('Error importing data.');
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
            Import Alumni from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with alumni data for the {graduationYear} year.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Step 1: Download the Template</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Download the template file and fill it with client data.
            </p>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel Template
            </Button>
          </div>

          {/* Upload File */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Step 2: Upload the File</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Upload the completed Excel file.
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
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                File Errors
              </h3>
              <ul className="text-sm space-y-1">
                {errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-destructive">{error}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-muted-foreground">...and {errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Preview ({previewData.length} clients)
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Name</th>
                      <th className="text-left py-1">Email</th>
                      <th className="text-left py-1">Phone</th>
                      <th className="text-left py-1">Year</th>
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
                          ...and {previewData.length - 5} more clients
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
              {isLoading ? 'Importing...' : `Import ${previewData.length} clients`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
