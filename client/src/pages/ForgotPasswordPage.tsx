import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || 'Failed to dispatch password recovery request.');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setErrorMessage('Network error attempting recovery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2030_1px,transparent_1px),linear-gradient(to_bottom,#1b2030_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-workbench-surface border border-workbench-border-active flex items-center justify-center text-workbench-cyan group-hover:shadow-glow-cyan transition-all">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-workbench-heading group-hover:text-workbench-cyan transition-colors">
                SCHEMA STUDIO
              </span>
              <span className="ml-1.5 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border">
                AI
              </span>
            </div>
          </Link>
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight text-workbench-heading">
          Recover your password
        </h1>
        <p className="mt-1 text-center text-xs text-workbench-muted">
          Enter your registered email address to receive a secure, single-use reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-workbench-surface border border-workbench-border rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-workbench-heading">
                Recovery Request Dispatched
              </h2>
              <p className="text-xs text-workbench-muted leading-relaxed">
                If an account exists with <span className="text-workbench-cyan font-mono">{email}</span>, a secure password reset link has been dispatched.
              </p>
              <div className="p-3 rounded-lg bg-workbench-bg border border-workbench-border text-[11px] text-workbench-muted font-mono text-left">
                ℹ️ Tokens expire after 60 minutes and can only be used once. Check your spam folder if you do not see the message.
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-workbench-cyan hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-workbench-text mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-workbench-muted">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      autoComplete="email"
                      required
                      className="w-full bg-workbench-bg border border-workbench-border rounded-lg pl-9 pr-3 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan focus:ring-1 focus:ring-workbench-cyan transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-md hover:shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-workbench-border/60 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-workbench-muted hover:text-workbench-cyan transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
