import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Laptop,
  Mail,
  Send
} from 'lucide-react';
import { useAuth, SessionInfo } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, updateProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions' | 'danger'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email verification resend
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sessions
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const loadSessions = async () => {
    if (!token) return;
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      void loadSessions();
    }
  }, [activeTab]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!name.trim()) return;

    setProfileSaving(true);
    const res = await updateProfile(name.trim());
    setProfileSaving(false);

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile name successfully updated.' });
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const handleResendVerification = async () => {
    if (!token) return;
    setResendingVerification(true);
    setVerificationNotice(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setVerificationNotice('Verification link has been sent to your email.');
      } else {
        setVerificationNotice(json.error?.message || 'Failed to send verification email.');
      }
    } catch {
      setVerificationNotice('Network error dispatching verification.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPasswordMsg({ type: 'success', text: 'Password successfully changed.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: json.error?.message || 'Incorrect current password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error updating password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError('Password is required to confirm account deletion.');
      return;
    }

    if (!confirm('Are you ABSOLUTELY certain you want to permanently delete your account and all schemas? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        await logout();
        navigate('/', { replace: true });
      } else {
        setDeleteError(json.error?.message || 'Failed to delete account. Please verify password.');
      }
    } catch {
      setDeleteError('Network error executing account deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Title */}
      <div className="mb-8 border-b border-workbench-border pb-5">
        <h1 className="text-xl font-bold text-workbench-heading flex items-center gap-2">
          <span>Account & Security Settings</span>
        </h1>
        <p className="text-xs text-workbench-muted mt-1">
          Manage your developer credentials, profile name, active sessions, and data ownership.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active'
                : 'text-workbench-muted hover:text-workbench-text hover:bg-workbench-surface'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active'
                : 'text-workbench-muted hover:text-workbench-text hover:bg-workbench-surface'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'sessions'
                ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active'
                : 'text-workbench-muted hover:text-workbench-text hover:bg-workbench-surface'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Active Sessions</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'danger'
                ? 'bg-red-950/40 text-red-400 border border-red-500/30'
                : 'text-workbench-muted hover:text-red-400 hover:bg-red-950/20'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 bg-workbench-surface border border-workbench-border rounded-xl p-6 shadow-sm">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-workbench-heading pb-3 border-b border-workbench-border">
                Developer Profile
              </h2>

              {profileMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald'
                      : 'bg-red-950/40 border border-red-500/30 text-red-300'
                  }`}
                >
                  {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-mono text-workbench-text mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-workbench-bg border border-workbench-border rounded-lg px-3 py-2 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-workbench-text mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-workbench-bg/50 border border-workbench-border/60 rounded-lg px-3 py-2 text-xs text-workbench-muted cursor-not-allowed font-mono"
                    />
                    {user?.isEmailVerified ? (
                      <span className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-workbench-emerald px-2 py-1 rounded bg-workbench-emerald/10 border border-workbench-emerald/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-workbench-amber px-2 py-1 rounded bg-workbench-amber/10 border border-workbench-amber/30">
                        <Mail className="w-3 h-3" />
                        <span>Unverified</span>
                      </span>
                    )}
                  </div>
                </div>

                {!user?.isEmailVerified && (
                  <div className="p-3 rounded-lg bg-workbench-bg border border-workbench-border space-y-2">
                    <p className="text-xs text-workbench-muted">
                      Your email address is not verified yet. Verification ensures account recovery and system notifications.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="text-xs font-semibold text-workbench-cyan hover:underline flex items-center gap-1.5"
                    >
                      {resendingVerification ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Resend Verification Link</span>
                    </button>
                    {verificationNotice && (
                      <p className="text-[11px] text-workbench-cyan font-mono">{verificationNotice}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="py-2 px-4 rounded-lg bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all flex items-center gap-2"
                >
                  {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-workbench-heading pb-3 border-b border-workbench-border">
                Password & Credentials
              </h2>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald'
                      : 'bg-red-950/40 border border-red-500/30 text-red-300'
                  }`}
                >
                  {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-mono text-workbench-text mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-workbench-bg border border-workbench-border rounded-lg px-3 py-2 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-workbench-text mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full bg-workbench-bg border border-workbench-border rounded-lg px-3 py-2 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-workbench-text mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full bg-workbench-bg border border-workbench-border rounded-lg px-3 py-2 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="py-2 px-4 rounded-lg bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all flex items-center gap-2"
                >
                  {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </form>
            </div>
          )}

          {/* SESSIONS TAB */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-workbench-heading pb-3 border-b border-workbench-border">
                Active Devices & Sessions
              </h2>

              {loadingSessions ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-workbench-muted font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-workbench-cyan" />
                  <span>Loading active sessions...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-lg bg-workbench-bg border border-workbench-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-workbench-elevated border border-workbench-border flex items-center justify-center text-workbench-cyan">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-workbench-text">
                              {sess.userAgent?.substring(0, 45) || 'Web Browser'}
                            </span>
                            {sess.isCurrentSession && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-workbench-emerald/10 text-workbench-emerald border border-workbench-emerald/30">
                                Current Device
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-workbench-muted mt-0.5">
                            IP: {sess.ipAddress || '127.0.0.1'} • Started {new Date(sess.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {!sess.isCurrentSession && (
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline font-mono"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-red-500/30">
                <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Delete Developer Account</span>
                </h2>
                <p className="text-xs text-workbench-muted mt-1">
                  Permanently deletes your account, all private schema workspaces, and generated version history.
                </p>
              </div>

              {deleteError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md">
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-workbench-muted leading-relaxed">
                  ⚠️ This action is irreversible. All your database models, diagrams, and saved configurations will be permanently destroyed.
                </div>

                <div>
                  <label className="block text-xs font-mono text-workbench-text mb-1">
                    Confirm Your Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    placeholder="Enter password to confirm"
                    className="w-full bg-workbench-bg border border-red-500/40 rounded-lg px-3 py-2 text-xs text-workbench-text focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDeleting}
                  className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Permanently Delete Account</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
