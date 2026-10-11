import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Database,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function sanitizeRedirect(url: string | null): string {
  if (!url) return '/dashboard';
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  return '/dashboard';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password, rememberMe);
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectTarget, { replace: true });
    } else {
      setErrorMessage(result.error || 'Invalid email address or password.');
    }
  };

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blueprint grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2030_1px,transparent_1px),linear-gradient(to_bottom,#1b2030_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand identity header */}
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
          Sign in to your workbench
        </h1>
        <p className="mt-1 text-center text-xs text-workbench-muted">
          Access your database schemas, visual ER diagrams, and SQL export pipeline.
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
                  placeholder="engineer@company.com"
                  autoComplete="email"
                  required
                  className="w-full bg-workbench-bg border border-workbench-border rounded-lg pl-9 pr-3 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan focus:ring-1 focus:ring-workbench-cyan transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-medium text-workbench-text">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-mono text-workbench-cyan hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-workbench-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
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
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-workbench-bg border-workbench-border text-workbench-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-workbench-muted">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-md hover:shadow-glow-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footnotes & links */}
          <div className="mt-6 pt-6 border-t border-workbench-border/60 text-center">
            <p className="text-xs text-workbench-muted">
              Don't have an account yet?{' '}
              <Link
                to={`/register${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : ''}`}
                className="font-medium text-workbench-cyan hover:underline"
              >
                Create a free account
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge callout */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-workbench-muted font-mono">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-workbench-emerald" />
            <span>Encrypted Credentials</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-workbench-cyan" />
            <span>Deterministic DDL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
