import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Phone, Mail, FileText, ExternalLink, RotateCcw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { openExternalFile } from '@/lib/file-open';

export default function PastAdvisors() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null);

  const { data: advisors = [], isLoading, refetch } = useQuery({
    queryKey: ['past-advisors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .eq('is_active', false)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleReactivate = async (advisorId: string) => {
    const { error } = await supabase
      .from('advisors')
      .update({ is_active: true })
      .eq('id', advisorId);

    if (error) {      toast.error('Error reactivating consultant');
      return;
    }

    toast.success('Consultant reactivated successfully');
    refetch();
  };

  const filteredAdvisors = advisors.filter(advisor =>
    advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    advisor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Past Consultants</h1>
            <p className="text-muted-foreground">Consultants who are no longer active in the system</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => navigate('/advisors')}
          >
            <ArrowRight className="h-4 w-4" />
            Back to Active Consultants
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search consultant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Advisors Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredAdvisors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No consultants found matching the search' : 'No past consultants in the system'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAdvisors.map((advisor) => (
              <Card key={advisor.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{advisor.name}</CardTitle>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Inactive
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {advisor.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${advisor.email}`} className="hover:underline">
                        {advisor.email}
                      </a>
                    </div>
                  )}
                  {advisor.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${advisor.phone}`} className="hover:underline">
                        {advisor.phone}
                      </a>
                    </div>
                  )}
                  
                  {advisor.payment_notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {advisor.payment_notes}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {advisor.contract_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openExternalFile(advisor.contract_url, `advisor-contract-${advisor.name}`)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Agreement
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/advisor/${advisor.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Portal
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleReactivate(advisor.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reactivate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
