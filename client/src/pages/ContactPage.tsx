import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'general_inquiry' | 'feedback' | 'feature_request' | 'bug_report' | 'enterprise'>('general_inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side validation
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!subject.trim() || subject.trim().length < 3) {
      setErrorMsg('Subject must be at least 3 characters long.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg('Please provide a message with at least 10 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(data.message || 'Your inquiry has been successfully submitted to the engineering team.');
        setSubmissionId(data.data?.id || 'SUB-OK');
        // Reset form
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(data.error?.message || 'Failed to submit inquiry. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error: Unable to contact server. Please verify your connection or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col selection:bg-workbench-cyan selection:text-black">
      {/* Header */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-workbench-surface border border-workbench-border mb-6">
          <MessageSquare className="w-3.5 h-3.5 text-workbench-cyan" />
          <span className="text-xs font-mono text-workbench-muted">Contact & Engineering Support</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-workbench-heading max-w-4xl mx-auto leading-tight mb-6">
          Get in Touch with Our Team
        </h1>

        <p className="text-base sm:text-lg text-workbench-muted max-w-2xl mx-auto leading-relaxed font-sans">
          Have questions about relational schema generation, want to request a dialect feature, or report an issue? Send us a message directly.
        </p>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information & Channels */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-workbench-border bg-workbench-surface/70 space-y-4">
              <h3 className="font-bold text-sm text-workbench-heading font-mono uppercase tracking-wider">
                Inquiry Channels
              </h3>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-workbench-heading">Direct Engineering Inquiries</div>
                    <div className="text-workbench-muted text-[11px] font-mono mt-0.5">contact@schemastudio.local</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-workbench-elevated text-workbench-emerald border border-workbench-border shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-workbench-heading">Security Inquiries</div>
                    <div className="text-workbench-muted text-[11px] font-mono mt-0.5">security@schemastudio.local</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Handling Note */}
            <div className="p-5 rounded-xl border border-workbench-border bg-workbench-surface/40 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] text-workbench-cyan uppercase font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Message Handling Policy</span>
              </div>
              <p className="text-[11px] text-workbench-muted leading-relaxed font-sans">
                All submitted contact forms are securely logged in our persistence store for engineering triage. Your contact details are never shared with third-party advertisers.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="p-6 sm:p-8 rounded-2xl border border-workbench-border bg-workbench-surface/80 shadow-panel">
              {successMsg ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-workbench-emerald/20 border border-workbench-emerald text-workbench-emerald flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-workbench-heading">
                    Inquiry Received
                  </h3>
                  <p className="text-xs text-workbench-muted max-w-md mx-auto leading-relaxed font-sans">
                    {successMsg}
                  </p>
                  {submissionId && (
                    <div className="text-[11px] font-mono text-workbench-cyan bg-workbench-bg px-3 py-1.5 rounded inline-block border border-workbench-border">
                      Reference ID: {submissionId}
                    </div>
                  )}
                  <div className="pt-4">
                    <button
                      onClick={() => setSuccessMsg(null)}
                      className="px-4 py-2 rounded bg-workbench-elevated hover:bg-workbench-overlay text-workbench-text text-xs font-mono border border-workbench-border transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 rounded bg-red-950/30 border border-red-900/60 text-red-300">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase text-workbench-muted">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full bg-workbench-bg border border-workbench-border rounded px-3 py-2 text-workbench-text focus:outline-none focus:border-workbench-cyan"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] uppercase text-workbench-muted">
                        Work Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full bg-workbench-bg border border-workbench-border rounded px-3 py-2 text-workbench-text focus:outline-none focus:border-workbench-cyan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase text-workbench-muted">
                        Inquiry Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-workbench-bg border border-workbench-border rounded px-3 py-2 text-workbench-cyan focus:outline-none focus:border-workbench-cyan"
                      >
                        <option value="general_inquiry">General Inquiry</option>
                        <option value="feature_request">Feature Request / Dialect</option>
                        <option value="bug_report">Bug Report / Syntax Diagnostic</option>
                        <option value="feedback">Product Feedback</option>
                        <option value="enterprise">Enterprise Custom Deployment</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] uppercase text-workbench-muted">
                        Subject <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of inquiry"
                        className="w-full bg-workbench-bg border border-workbench-border rounded px-3 py-2 text-workbench-text focus:outline-none focus:border-workbench-cyan"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-workbench-muted">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your question, feedback, or requested feature in detail..."
                      className="w-full bg-workbench-bg border border-workbench-border rounded p-3 text-workbench-text focus:outline-none focus:border-workbench-cyan leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-workbench-muted font-sans">
                      Protected by rate limiting & input sanitization.
                    </span>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Inquiry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
