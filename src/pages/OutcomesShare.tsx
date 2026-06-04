import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function OutcomesShare() {
  const { token } = useParams<{ token: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-outcomes-pdf?token=${token}`,
        );
        if (!res.ok) {
          setErr(await res.text());
          return;
        }
        setHtml(await res.text());
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, [token]);

  if (err) return <div className="p-10 text-center text-muted-foreground">{err}</div>;
  if (!html) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  return <iframe title="Outcomes" srcDoc={html} className="w-full h-screen border-0" />;
}
