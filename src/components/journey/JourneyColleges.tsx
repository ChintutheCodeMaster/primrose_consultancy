import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BUCKET_COLOR: Record<string, string> = {
  reach: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  target: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  likely: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  safety: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function JourneyColleges({ studentId }: { studentId: string }) {
  const [colleges, setColleges] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('student_colleges')
      .select('*')
      .eq('student_id', studentId)
      .order('sort_order')
      .then(({ data }) => setColleges(data || []));
  }, [studentId]);

  const grouped = ['reach', 'target', 'likely', 'safety'].map((b) => ({
    bucket: b,
    items: colleges.filter((c) => c.list_bucket === b),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Colleges</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your working list, organized by reach. Talk to your consultant to add or change.
        </p>
      </div>

      {colleges.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Your consultant hasn't added any colleges yet.
          </CardContent>
        </Card>
      )}

      {grouped.map(
        (g) =>
          g.items.length > 0 && (
            <div key={g.bucket}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={BUCKET_COLOR[g.bucket]}>
                  {g.bucket.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">{g.items.length}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {g.items.map((c) => {
                  const days = c.deadline
                    ? Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <Card key={c.id}>
                      <CardContent className="p-4">
                        <div className="font-semibold">{c.college_name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                          {c.application_plan && <span>{c.application_plan}</span>}
                          {c.deadline && (
                            <span>
                              · {new Date(c.deadline).toLocaleDateString()}
                              {days !== null && ` (${days >= 0 ? `${days}d left` : `${-days}d ago`})`}
                            </span>
                          )}
                          <span>· {c.status}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ),
      )}
    </div>
  );
}
