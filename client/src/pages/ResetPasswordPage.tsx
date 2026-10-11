import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Database,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Reset token is missing from the URL. Please request a new link.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumberOrSymbol) {
      setErrorMessage('Password must be at least 8 characters and include letters and numbers/symbols.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || 'Failed to reset password. The link may have expired.');
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage('Network error resetting password. Please try again.');
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
          Choose a new password
        </h1>
        <p className="mt-1 text-center text-xs text-workbench-muted">
          Enter and confirm your new secure credentials below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-workbench-surface border border-workbench-border rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {!token && !isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-workbench-heading">
                Invalid or Missing Recovery Token
              </h2>
              <p className="text-xs text-workbench-muted">
                The password reset URL is incomplete or missing a valid token parameter.
              </p>
              <div className="pt-2">
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-workbench-cyan text-black hover:bg-cyan-300 transition-all"
                >
                  <span>Request New Link</span>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-workbench-heading">
                Password Successfully Reset
              </h2>
              <p className="text-xs text-workbench-muted">
                Your new credentials have been updated and any previous active sessions were invalidated for security.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-workbench-cyan text-black hover:bg-cyan-300 transition-all shadow-md"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight className="w-4 h-4" />
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
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-workbench-muted">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      required
                      className="w-full bg-workbench-bg border border-workbench-border rounded-lg pl-9 pr-10 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan focus:ring-1 focus:ring-workbench-cyan transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-workbench-muted hover:text-workbench-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-workbench-text mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-workbench-muted">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      required
                      className="w-full bg-workbench-bg border border-workbench-border rounded-lg pl-9 pr-3 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan focus:ring-1 focus:ring-workbench-cyan transition-all"
                    />
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1 text-[11px] text-red-400">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !passwordsMatch || !hasMinLength}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-md hover:shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
