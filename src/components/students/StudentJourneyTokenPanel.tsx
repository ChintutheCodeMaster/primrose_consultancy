import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, RefreshCw, Link as LinkIcon, ShieldOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function genToken() {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function StudentJourneyTokenPanel({ studentId }: { studentId: string }) {
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('student_portal_tokens')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setToken(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [studentId]);

  const create = async () => {
    const newToken = genToken();
    const { error } = await supabase.from('student_portal_tokens').insert({
      student_id: studentId,
      token: newToken,
      status: 'active',
    });
    if (error) {
      toast.error('Failed to generate link');
      return;
    }
    toast.success('Portal link generated');
    load();
  };

  const rotate = async () => {
    if (token) {
      await supabase
        .from('student_portal_tokens')
        .update({ status: 'revoked' })
        .eq('id', token.id);
    }
    await create();
  };

  const revoke = async () => {
    if (!token) return;
    await supabase.from('student_portal_tokens').update({ status: 'revoked' }).eq('id', token.id);
    toast.success('Link revoked');
    load();
  };

  const url = token ? `${window.location.origin}/journey/${token.token}` : null;

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Student Portal Access</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Share this private link with the student. They'll see their tasks, colleges, documents, messages, AI Writing
          Lab, and AI Detector.
        </p>

        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : token ? (
          <>
            <div className="flex gap-2">
              <input
                readOnly
                value={url || ''}
                className="flex-1 text-xs px-3 py-2 rounded-md border bg-muted/30 font-mono truncate"
              />
              <Button size="sm" variant="outline" onClick={copy} className="gap-1">
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {token.last_seen_at && <span>Last opened: {new Date(token.last_seen_at).toLocaleString()}</span>}
              {!token.last_seen_at && <span>Not opened yet</span>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={rotate} className="gap-1">
                <RefreshCw className="h-3 w-3" /> Rotate
              </Button>
              <Button size="sm" variant="ghost" onClick={revoke} className="gap-1 text-destructive">
                <ShieldOff className="h-3 w-3" /> Revoke
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={create} className="gap-2">
            <LinkIcon className="h-4 w-4" /> Generate portal link
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
