import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProjectInvitation } from '@schema-studio/shared';

interface CollaborationProject {
  id: string;
  name: string;
  description: string;
  targetDialect: string;
  role: 'owner' | 'editor' | 'viewer';
  membersCount: number;
  updatedAt: string;
  ownerId?: string;
}

export const CollaborationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteTokenFromUrl = searchParams.get('invite');

  const { isAuthenticated, token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'shared' | 'owned' | 'invites'>('shared');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [sharedProjects, setSharedProjects] = useState<CollaborationProject[]>([]);
  const [ownedProjects, setOwnedProjects] = useState<CollaborationProject[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);

  // Direct URL token invite state
  const [directInviteToken, setDirectInviteToken] = useState<string | null>(inviteTokenFromUrl);

  const loadCollaborationData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch collaborations overview
      const collabRes = await fetch('/api/collaborations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const collabJson = await collabRes.json();

      if (collabRes.ok && collabJson.success) {
        setSharedProjects(collabJson.data.sharedWithMe || []);
        setOwnedProjects(collabJson.data.myTeamProjects || []);
      }

      // 2. Fetch pending invitations for current user
      const invitesRes = await fetch('/api/invitations/my-invitations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const invitesJson = await invitesRes.json();

      if (invitesRes.ok && invitesJson.success) {
        setPendingInvitations(invitesJson.data || []);
      }
    } catch {
      setError('Failed to load team and collaboration data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadCollaborationData();
    }
  }, [isAuthenticated, loadCollaborationData]);

  // Handle accepting an invitation
  const handleAcceptInvite = async (invitationToken: string) => {
    setActionLoading(invitationToken);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: invitationToken }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(
          `Invitation accepted! You are now a collaborator on "${json.data.projectName}".`
        );
        setDirectInviteToken(null);
        void loadCollaborationData();
      } else {
        setError(json.error?.message || 'Failed to accept invitation.');
      }
    } catch {
      setError('Network error processing invitation acceptance.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle declining an invitation
  const handleDeclineInvite = async (invitationToken: string) => {
    setActionLoading(invitationToken);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/invitations/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: invitationToken }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg('Invitation declined.');
        setDirectInviteToken(null);
        void loadCollaborationData();
      } else {
        setError(json.error?.message || 'Failed to decline invitation.');
      }
    } catch {
      setError('Network error processing invitation decline.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenProjectInStudio = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        localStorage.setItem(
          'schema_studio_active_project',
          JSON.stringify({
            id: json.data.id,
            name: json.data.name,
            targetDialect: json.data.targetDialect,
            schema: json.data.schema,
            updatedAt: json.data.updatedAt,
          })
        );
        navigate('/studio');
      }
    } catch {
      setError('Could not open project.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-workbench-surface border border-workbench-border flex items-center justify-center text-workbench-cyan mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-workbench-heading mb-2">Team Collaboration</h1>
        <p className="text-sm text-workbench-muted max-w-md mx-auto mb-6">
          Sign in or create an account to collaborate with your team, manage project access, and
          accept workspace invitations.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to={`/login?redirect=${encodeURIComponent(
              inviteTokenFromUrl ? `/collaboration?invite=${inviteTokenFromUrl}` : '/collaboration'
            )}`}
            className="px-5 py-2.5 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-lg bg-workbench-surface hover:bg-workbench-elevated border border-workbench-border text-xs font-medium text-workbench-text transition-all"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-workbench-cyan/10 border border-workbench-cyan/30 flex items-center justify-center text-workbench-cyan">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-workbench-heading">Teams & Collaboration</h1>
          </div>
          <p className="text-xs text-workbench-muted">
            Manage cross-functional architecture access, invite colleagues, and coordinate schema designs.
          </p>
        </div>

        <button
          onClick={() => void loadCollaborationData()}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-workbench-surface hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-muted hover:text-workbench-text flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Direct Invitation Banner (from URL token) */}
      {directInviteToken && (
        <div className="mb-8 p-5 rounded-xl bg-workbench-surface border border-workbench-cyan/40 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-workbench-cyan/10 border border-workbench-cyan/30 flex items-center justify-center text-workbench-cyan shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-workbench-heading">
                  You Have a Pending Project Invitation
                </h3>
                <p className="text-xs text-workbench-muted mt-0.5">
                  You were invited to collaborate on a database architecture. Accept below to add it to your workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => handleAcceptInvite(directInviteToken)}
                disabled={actionLoading === directInviteToken}
                className="px-4 py-2 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-60"
              >
                {actionLoading === directInviteToken ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Accept Invite</span>
              </button>
              <button
                onClick={() => handleDeclineInvite(directInviteToken)}
                disabled={actionLoading === directInviteToken}
                className="px-3 py-2 rounded-lg bg-workbench-overlay hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-muted hover:text-red-400 flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-workbench-border pb-3 mb-6">
        <button
          onClick={() => setActiveTab('shared')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'shared'
              ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active shadow-sm'
              : 'text-workbench-muted hover:text-workbench-text'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Shared with Me ({sharedProjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('owned')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'owned'
              ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active shadow-sm'
              : 'text-workbench-muted hover:text-workbench-text'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>My Team Projects ({ownedProjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invites')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === 'invites'
              ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active shadow-sm'
              : 'text-workbench-muted hover:text-workbench-text'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Pending Invitations ({pendingInvitations.length})</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-workbench-cyan animate-spin mb-3" />
          <p className="text-xs font-mono text-workbench-muted">Loading collaboration spaces...</p>
        </div>
      )}

      {/* Tab 1: Shared with Me */}
      {!loading && activeTab === 'shared' && (
        <div>
          {sharedProjects.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-xl bg-workbench-surface border border-workbench-border">
              <Users className="w-10 h-10 text-workbench-muted mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-workbench-heading mb-1">
                No Shared Projects Yet
              </h3>
              <p className="text-xs text-workbench-muted max-w-sm mx-auto mb-4">
                When other team members invite you to collaborate on their database architectures, they will appear here.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-workbench-cyan hover:underline"
              >
                <span>View My Projects</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-xl bg-workbench-surface border border-workbench-border hover:border-workbench-border-active flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-workbench-overlay border border-workbench-border text-workbench-cyan">
                        {p.targetDialect}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          p.role === 'editor'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {p.role}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-workbench-heading mb-1 truncate">
                      {p.name}
                    </h3>
                    <p className="text-xs text-workbench-muted line-clamp-2 mb-4">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-workbench-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-workbench-muted font-mono">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleOpenProjectInStudio(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-workbench-elevated hover:bg-workbench-border text-xs text-workbench-text flex items-center gap-1.5 transition-all"
                    >
                      <span>Open Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Team Projects */}
      {!loading && activeTab === 'owned' && (
        <div>
          {ownedProjects.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-xl bg-workbench-surface border border-workbench-border">
              <Shield className="w-10 h-10 text-workbench-muted mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-workbench-heading mb-1">
                No Team Projects Configured
              </h3>
              <p className="text-xs text-workbench-muted max-w-sm mx-auto mb-4">
                You haven't added any collaborators to your projects yet. Open any project from your dashboard and invite team members.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold"
              >
                <span>Go to Dashboard</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-xl bg-workbench-surface border border-workbench-border hover:border-workbench-border-active flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-workbench-overlay border border-workbench-border text-workbench-cyan">
                        {p.targetDialect}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Owner
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-workbench-heading mb-1 truncate">
                      {p.name}
                    </h3>
                    <p className="text-xs text-workbench-muted line-clamp-2 mb-4">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-workbench-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-workbench-muted flex items-center gap-1">
                      <Users className="w-3 h-3 text-workbench-cyan" />
                      <span>{p.membersCount} collaborators</span>
                    </span>
                    <button
                      onClick={() => handleOpenProjectInStudio(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-workbench-elevated hover:bg-workbench-border text-xs text-workbench-text flex items-center gap-1.5 transition-all"
                    >
                      <span>Manage Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pending Invitations */}
      {!loading && activeTab === 'invites' && (
        <div>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-xl bg-workbench-surface border border-workbench-border">
              <UserCheck className="w-10 h-10 text-workbench-muted mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-workbench-heading mb-1">
                No Pending Invitations
              </h3>
              <p className="text-xs text-workbench-muted max-w-sm mx-auto">
                You have answered all project invitations. When a teammate invites {user?.email}, it will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-xl bg-workbench-surface border border-workbench-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-workbench-overlay border border-workbench-border flex items-center justify-center text-workbench-cyan shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-workbench-heading">
                          Invitation for {inv.invitedEmail || inv.email}
                        </h4>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                            inv.role === 'editor'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}
                        >
                          Role: {inv.role}
                        </span>
                      </div>
                      <p className="text-xs text-workbench-muted mt-1">
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleAcceptInvite(inv.token || inv.id)}
                      disabled={actionLoading === (inv.token || inv.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-60"
                    >
                      {actionLoading === (inv.token || inv.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv.token || inv.id)}
                      disabled={actionLoading === (inv.token || inv.id)}
                      className="px-3 py-1.5 rounded-lg bg-workbench-overlay hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-muted hover:text-red-400 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
