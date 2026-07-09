import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ContactUs = () => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email, and message.");
      return;
    }
    setSubmitting(true);
    try {
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
      );
      const subject = encodeURIComponent(
        form.subject || "Contact from Primrose site",
      );
      window.location.href = `mailto:hello@primrose-iec.com?subject=${subject}&body=${body}`;
      toast.success("Opening your email client…");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-background to-rose-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <div className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            Contact us
          </h1>
          <p className="mt-3 text-muted-foreground">
            Questions, feedback, or want a walk-through? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-10">
          <div className="rounded-xl border border-border/60 bg-white/70 backdrop-blur p-4">
            <Mail className="h-5 w-5 text-violet-600 mb-2" />
            <div className="text-sm font-semibold">Email</div>
            <a
              href="mailto:hello@primrose-iec.com"
              className="text-sm text-muted-foreground hover:text-foreground break-all"
            >
              hello@primrose-iec.com
            </a>
          </div>
          <div className="rounded-xl border border-border/60 bg-white/70 backdrop-blur p-4">
            <MessageCircle className="h-5 w-5 text-rose-600 mb-2" />
            <div className="text-sm font-semibold">Support</div>
            <span className="text-sm text-muted-foreground">
              Mon–Fri, 9am–6pm
            </span>
          </div>
          <div className="rounded-xl border border-border/60 bg-white/70 backdrop-blur p-4">
            <MapPin className="h-5 w-5 text-amber-600 mb-2" />
            <div className="text-sm font-semibold">Primrose</div>
            <span className="text-sm text-muted-foreground">
              Remote-first team
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="What&apos;s this about?"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us a bit more…"
              rows={6}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="gap-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:from-violet-700 hover:to-rose-600 text-white border-0"
            >
              <Send className="h-4 w-4" /> Send message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
