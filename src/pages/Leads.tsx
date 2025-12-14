import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LeadCard } from '@/components/leads/LeadCard';
import { AddLeadDialog } from '@/components/leads/AddLeadDialog';
import { mockLeads } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Lead, LeadStatus, leadStatusLabels } from '@/types/crm';
import { toast } from 'sonner';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.includes(searchTerm) || 
                         lead.email.includes(searchTerm) || 
                         lead.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddLead = (newLead: Omit<Lead, 'id' | 'createdAt' | 'lastContactAt'>) => {
    const lead: Lead = {
      ...newLead,
      id: String(leads.length + 1),
      createdAt: new Date(),
      lastContactAt: new Date(),
    };
    setLeads([lead, ...leads]);
    toast.success('הליד נוסף בהצלחה!');
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">לידים</h1>
            <p className="text-muted-foreground mt-1">ניהול פניות התעניינות</p>
          </div>
          <AddLeadDialog onAdd={handleAddLead} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(leadStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead, index) => (
            <div key={lead.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <LeadCard lead={lead} />
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">לא נמצאו לידים</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
