import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { refreshUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setErrorMessage('Verification token missing from link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setIsSuccess(true);
          void refreshUser();
        } else {
          setErrorMessage(json.error?.message || 'Verification link is invalid or expired.');
        }
      } catch {
        setErrorMessage('Failed to connect to verification server.');
      } finally {
        setIsLoading(false);
      }
    };

    void verify();
  }, [token, refreshUser]);

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
          Email Verification
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-workbench-surface border border-workbench-border rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm text-center">
          {isLoading ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-workbench-cyan animate-spin" />
              <p className="text-xs font-mono text-workbench-muted">Verifying token signature...</p>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-workbench-heading">
                Email Successfully Verified!
              </h2>
              <p className="text-xs text-workbench-muted">
                Your account is confirmed and eligible for all production database generation features.
              </p>
              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-workbench-cyan text-black hover:bg-cyan-300 transition-all shadow-md"
                >
                  <span>Go to Projects Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-semibold text-workbench-heading">
                Verification Failed
              </h2>
              <p className="text-xs text-workbench-muted">
                {errorMessage || 'This verification link is invalid or has expired.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded bg-workbench-elevated text-workbench-text hover:bg-workbench-surface transition-all border border-workbench-border"
                >
                  <span>Manage in Account Settings</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
