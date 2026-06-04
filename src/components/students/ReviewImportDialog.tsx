import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Edit2,
  Trash2,
  Save,
  X
} from 'lucide-react';

export interface ParsedClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  meetingSummary: string;
  degreeType: string;
  advisorName: string;
  source: string;
  amountPaid: number;
  packageNotes: string;
  acceptedTo: string;
  notes: string;
  hasIssues: boolean;
  issues: string[];
  selected: boolean;
}

interface ReviewImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ParsedClient[];
  onImport: (clients: ParsedClient[]) => Promise<void>;
  graduationYear: string;
}

export function ReviewImportDialog({ 
  open, 
  onOpenChange, 
  clients: initialClients, 
  onImport,
  graduationYear 
}: ReviewImportDialogProps) {
  const [clients, setClients] = useState<ParsedClient[]>(initialClients);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterIssues, setFilterIssues] = useState(false);

  const filteredClients = useMemo(() => {
    if (filterIssues) {
      return clients.filter(c => c.hasIssues);
    }
    return clients;
  }, [clients, filterIssues]);

  const selectedClients = useMemo(() => clients.filter(c => c.selected), [clients]);
  const clientsWithIssues = useMemo(() => clients.filter(c => c.hasIssues), [clients]);

  const toggleSelect = (id: string) => {
    setClients(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = filteredClients.every(c => c.selected);
    const ids = new Set(filteredClients.map(c => c.id));
    setClients(prev => prev.map(c => 
      ids.has(c.id) ? { ...c, selected: !allSelected } : c
    ));
  };

  const updateClient = (id: string, updates: Partial<ParsedClient>) => {
    setClients(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...updates };
      // Recalculate issues
      const issues: string[] = [];
      if (!updated.name.trim()) issues.push('Missing Name');
      if (!updated.email.trim() && !updated.phone.trim()) issues.push('Missing Email or Phone');
      updated.issues = issues;
      updated.hasIssues = issues.length > 0;
      return updated;
    }));
  };

  const removeClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleImport = async () => {
    if (selectedClients.length === 0) return;
    setIsLoading(true);
    try {
      await onImport(selectedClients);
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Data Before Import - Alumni {graduationYear}</DialogTitle>
          <DialogDescription>
            {clients.length} records found. Review and correct the data before import.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex flex-wrap gap-3 py-2 border-b">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Selected: {selectedClients.length}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            With Issues: {clientsWithIssues.length}
          </Badge>
          <div className="flex items-center gap-2 ml-auto">
            <Checkbox 
              id="filter-issues" 
              checked={filterIssues}
              onCheckedChange={(checked) => setFilterIssues(checked === true)}
            />
            <label htmlFor="filter-issues" className="text-sm cursor-pointer">
              Show only records with issues
            </label>
          </div>
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2 py-2 border-b">
          <Checkbox 
            id="select-all"
            checked={filteredClients.length > 0 && filteredClients.every(c => c.selected)}
            onCheckedChange={toggleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({filteredClients.length})
          </label>
        </div>

        {/* Client List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                className={`border rounded-lg overflow-hidden ${
                  client.hasIssues ? 'border-amber-300 bg-amber-50/50' : 'border-border'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center gap-3 p-3">
                  <Checkbox 
                    checked={client.selected}
                    onCheckedChange={() => toggleSelect(client.id)}
                  />
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{client.name || '(No Name)'}</span>
                      {client.hasIssues && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                          {client.issues.join(', ')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
                      {client.email && <span>{client.email}</span>}
                      {client.phone && <span>{client.phone}</span>}
                      {client.advisorName && <span>Consultant: {client.advisorName}</span>}
                      {client.amountPaid > 0 && <span>Paid: ${client.amountPaid.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(editingId === client.id ? null : client.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                    >
                      {expandedId === client.id ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedId === client.id && !editingId && (
                  <div className="border-t p-3 bg-muted/30 text-sm space-y-2">
                    {client.meetingSummary && (
                      <div>
                        <span className="font-medium">Meeting Summary: </span>
                        <span className="whitespace-pre-wrap">{client.meetingSummary}</span>
                      </div>
                    )}
                    {client.packageNotes && (
                      <div>
                        <span className="font-medium">Package Notes: </span>
                        <span>{client.packageNotes}</span>
                      </div>
                    )}
                    {client.acceptedTo && (
                      <div>
                        <span className="font-medium">Accepted To: </span>
                        <span>{client.acceptedTo}</span>
                      </div>
                    )}
                    {client.notes && (
                      <div>
                        <span className="font-medium">Notes: </span>
                        <span>{client.notes}</span>
                      </div>
                    )}
                    {client.degreeType && (
                      <div>
                        <span className="font-medium">Degree Type: </span>
                        <span>{client.degreeType}</span>
                      </div>
                    )}
                    {client.source && (
                      <div>
                        <span className="font-medium">Source: </span>
                        <span>{client.source}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Mode */}
                {editingId === client.id && (
                  <div className="border-t p-3 bg-muted/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={client.name}
                          onChange={(e) => updateClient(client.id, { name: e.target.value })}
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          value={client.email}
                          onChange={(e) => updateClient(client.id, { email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input
                          value={client.phone}
                          onChange={(e) => updateClient(client.id, { phone: e.target.value })}
                          placeholder="123-456-7890"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Consultant</label>
                        <Input
                          value={client.advisorName}
                          onChange={(e) => updateClient(client.id, { advisorName: e.target.value })}
                          placeholder="Consultant's Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Amount Paid</label>
                        <Input
                          type="number"
                          value={client.amountPaid}
                          onChange={(e) => updateClient(client.id, { amountPaid: Number(e.target.value) || 0 })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Source</label>
                        <Input
                          value={client.source}
                          onChange={(e) => updateClient(client.id, { source: e.target.value })}
                          placeholder="Lead Source"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Meeting Summary</label>
                      <Textarea
                        value={client.meetingSummary}
                        onChange={(e) => updateClient(client.id, { meetingSummary: e.target.value })}
                        placeholder="Meeting summary..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Package Notes</label>
                      <Input
                        value={client.packageNotes}
                        onChange={(e) => updateClient(client.id, { packageNotes: e.target.value })}
                        placeholder="Package details..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Accepted To</label>
                      <Input
                        value={client.acceptedTo}
                        onChange={(e) => updateClient(client.id, { acceptedTo: e.target.value })}
                        placeholder="University/Program Name"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={() => setEditingId(null)}>
                        <Save className="h-4 w-4 mr-1" />
                        Finish Editing
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isLoading || selectedClients.length === 0}
          >
            {isLoading ? 'Importing...' : `Import ${selectedClients.length} Clients`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}