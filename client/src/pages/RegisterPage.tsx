import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Database,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function sanitizeRedirect(url: string | null): string {
  if (!url) return '/dashboard';
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  return '/dashboard';
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));

  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    name.trim().length >= 2 &&
    email.includes('@') &&
    hasMinLength &&
    hasLetter &&
    hasNumberOrSymbol &&
    passwordsMatch &&
    agreeTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumberOrSymbol) {
      setErrorMessage('Password must be at least 8 characters with letters and numbers/symbols.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectTarget, { replace: true });
    } else {
      setErrorMessage(result.error || 'Failed to create account.');
    }
  };

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Blueprint grid background */}
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
          Create your developer account
        </h1>
        <p className="mt-1 text-center text-xs text-workbench-muted">
          Design, validate, and collaborate on production database schemas.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-workbench-surface border border-workbench-border rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-workbench-text mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-workbench-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                  className="w-full bg-workbench-bg border border-workbench-border rounded-lg pl-9 pr-3 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan focus:ring-1 focus:ring-workbench-cyan transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-workbench-text mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-workbench-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ada@computing.org"
                  autoComplete="email"
                  required
                  className="w-full bg-workbench-bg border border-workbench-border rounded-lg pl-9 pr-3 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan focus:ring-1 focus:ring-workbench-cyan transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-workbench-text mb-1.5">
                Password
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Indicators */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-1 bg-workbench-bg/70 p-2.5 rounded border border-workbench-border/60">
                  <div className="text-[10px] font-mono text-workbench-muted mb-1 uppercase tracking-wider">
                    Password Requirements:
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-workbench-emerald shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-workbench-muted shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-workbench-emerald' : 'text-workbench-muted'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {hasLetter ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-workbench-emerald shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-workbench-muted shrink-0" />
                    )}
                    <span className={hasLetter ? 'text-workbench-emerald' : 'text-workbench-muted'}>
                      Contains letter
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {hasNumberOrSymbol ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-workbench-emerald shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-workbench-muted shrink-0" />
                    )}
                    <span className={hasNumberOrSymbol ? 'text-workbench-emerald' : 'text-workbench-muted'}>
                      Contains number or special character
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-workbench-text mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-workbench-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className="w-full bg-workbench-bg border border-workbench-border rounded-lg pl-9 pr-3 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan focus:ring-1 focus:ring-workbench-cyan transition-all"
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-[11px] text-red-400">Passwords do not match.</p>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="w-4 h-4 mt-0.5 rounded bg-workbench-bg border-workbench-border text-workbench-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                />
                <span className="text-xs text-workbench-muted leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className="text-workbench-cyan hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and acknowledge the{' '}
                  <Link to="/privacy" target="_blank" className="text-workbench-cyan hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-md hover:shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-workbench-border/60 text-center">
            <p className="text-xs text-workbench-muted">
              Already have an account?{' '}
              <Link
                to={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                className="font-medium text-workbench-cyan hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-workbench-muted font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-workbench-emerald" />
          <span>Zero third-party prompt leakage • Verified DDL execution</span>
        </div>
      </div>
    </div>
  );
};
