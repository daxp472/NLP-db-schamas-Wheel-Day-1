import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  X,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { ProjectMember, ProjectInvitation } from '@schema-studio/shared';

interface ProjectMembersModalProps {
  projectId: string;
  projectName: string;
  isOwner: boolean;
  token?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  projectId,
  projectName,
  isOwner,
  token,
  isOpen,
  onClose,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Action state (removing or updating role)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchMembersAndInvites = useCallback(async () => {
    if (!token || !projectId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setMembers(json.data.members || []);
        setInvitations(json.data.pendingInvitations || []);
      } else {
        setError(json.error?.message || 'Failed to load project members.');
      }
    } catch {
      setError('Network error loading collaborators.');
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    if (isOpen) {
      void fetchMembersAndInvites();
    }
  }, [isOpen, fetchMembersAndInvites]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    setSuccessMsg(null);
    setGeneratedInviteLink(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Invitation created for ${inviteEmail.trim()}.`);
        if (json.data.invitationLink) {
          setGeneratedInviteLink(json.data.invitationLink);
        }
        setInviteEmail('');
        void fetchMembersAndInvites();
      } else {
        setError(json.error?.message || 'Failed to invite collaborator.');
      }
    } catch {
      setError('Network error while creating invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    setActionLoadingId(userId);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMembers((prev) =>
          prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
        );
      } else {
        setError(json.error?.message || 'Failed to update member role.');
      }
    } catch {
      setError('Network error while updating role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      return;
    }

    setActionLoadingId(userId);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
      } else {
        setError(json.error?.message || 'Failed to remove member.');
      }
    } catch {
      setError('Network error removing member.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      } else {
        setError(json.error?.message || 'Failed to revoke invitation.');
      }
    } catch {
      setError('Network error revoking invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl rounded-2xl bg-workbench-surface border border-workbench-border shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-workbench-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-workbench-cyan/10 border border-workbench-cyan/30 flex items-center justify-center text-workbench-cyan">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-workbench-heading">Collaborators & Permissions</h2>
              <p className="text-[11px] text-workbench-muted truncate max-w-xs">{projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-workbench-muted hover:text-workbench-text hover:bg-workbench-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Invite Form (only if current user is owner) */}
        {isOwner && (
          <form onSubmit={handleInvite} className="mt-4 p-3.5 rounded-xl bg-workbench-bg border border-workbench-border space-y-3">
            <span className="text-xs font-bold text-workbench-heading flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-workbench-cyan" />
              <span>Invite New Collaborator</span>
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-workbench-muted" />
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-workbench-surface border border-workbench-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
                />
              </div>

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                className="bg-workbench-surface border border-workbench-border rounded-lg px-2.5 py-1.5 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
              >
                <option value="editor">Editor (Can edit)</option>
                <option value="viewer">Viewer (Read-only)</option>
              </select>

              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 shrink-0"
              >
                {inviting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>Send Invite</span>
              </button>
            </div>

            {/* Generated Invite Link Notification for quick sharing */}
            {generatedInviteLink && (
              <div className="p-2.5 rounded-lg bg-workbench-surface border border-workbench-cyan/30 text-xs space-y-1.5">
                <span className="text-[11px] text-workbench-cyan font-medium">
                  Invitation link ready (single-use):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteLink}
                    className="flex-1 bg-workbench-bg border border-workbench-border rounded px-2 py-1 text-[11px] font-mono text-workbench-text select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(generatedInviteLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-workbench-elevated text-[11px] text-workbench-text hover:bg-workbench-border transition-colors flex items-center gap-1"
                  >
                    {copiedLink ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-workbench-muted" />
                    )}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Members & Invitations Lists */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {/* Active Members */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-workbench-muted mb-2">
              Active Members ({members.length})
            </h3>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-workbench-cyan animate-spin" />
              </div>
            ) : (
              <div className="space-y-1.5">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="p-2.5 rounded-xl bg-workbench-bg border border-workbench-border flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-workbench-elevated border border-workbench-border flex items-center justify-center font-bold text-[11px] text-workbench-cyan">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-workbench-text">
                            {member.name}
                          </span>
                          {member.role === 'owner' && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Owner
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-workbench-muted">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    {/* Member role & actions */}
                    <div className="flex items-center gap-2">
                      {isOwner && member.role !== 'owner' ? (
                        <>
                          <select
                            value={member.role}
                            disabled={actionLoadingId === member.userId}
                            onChange={(e) =>
                              handleChangeRole(member.userId, e.target.value as 'editor' | 'viewer')
                            }
                            className="bg-workbench-surface border border-workbench-border rounded px-2 py-1 text-[11px] text-workbench-text focus:outline-none"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>

                          <button
                            onClick={() => handleRemoveMember(member.userId, member.name)}
                            disabled={actionLoadingId === member.userId}
                            className="p-1.5 rounded text-workbench-muted hover:text-red-400 hover:bg-red-950/20 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        member.role !== 'owner' && (
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                              member.role === 'editor'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {member.role}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-workbench-muted mb-2">
                Pending Invitations ({invitations.length})
              </h3>
              <div className="space-y-1.5">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-xl bg-workbench-bg border border-workbench-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-workbench-text">
                          {inv.invitedEmail || inv.email}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {inv.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-workbench-muted">
                        Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </span>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleRevokeInvitation(inv.id)}
                        disabled={actionLoadingId === inv.id}
                        className="px-2 py-1 rounded bg-workbench-overlay hover:bg-workbench-elevated text-[11px] text-workbench-muted hover:text-red-400 border border-workbench-border transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-workbench-border mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-workbench-elevated hover:bg-workbench-border text-xs font-medium text-workbench-text transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
