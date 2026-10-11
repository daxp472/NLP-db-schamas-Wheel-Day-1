import React, { useState } from 'react';
import {
  Globe,
  Lock,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Loader2,
  X,
  GitFork,
  ShieldAlert
} from 'lucide-react';
import { ProjectVisibility } from '@schema-studio/shared';

interface ProjectVisibilityModalProps {
  projectId: string;
  projectName: string;
  currentVisibility: ProjectVisibility;
  cloneCount?: number;
  token?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onVisibilityChanged: (newVisibility: ProjectVisibility) => void;
}

export const ProjectVisibilityModal: React.FC<ProjectVisibilityModalProps> = ({
  projectId,
  projectName,
  currentVisibility,
  cloneCount = 0,
  token,
  isOpen,
  onClose,
  onVisibilityChanged,
}) => {
  const [visibility, setVisibility] = useState<ProjectVisibility>(currentVisibility);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/p/${projectId}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggle = async (targetVisibility: ProjectVisibility) => {
    if (targetVisibility === visibility) return;

    // Show confirmation step
    setConfirmPending(true);
  };

  const executeChange = async (targetVisibility: ProjectVisibility) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ visibility: targetVisibility, projectName }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setVisibility(targetVisibility);
        onVisibilityChanged(targetVisibility);
        setConfirmPending(false);
        try {
          const savedActive = localStorage.getItem('schema_studio_active_project');
          if (savedActive) {
            const parsed = JSON.parse(savedActive);
            parsed.visibility = targetVisibility;
            localStorage.setItem('schema_studio_active_project', JSON.stringify(parsed));
          }
        } catch {}
      } else {
        setError(json.error?.message || 'Failed to update visibility.');
      }
    } catch {
      setError('Network error updating project visibility.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg rounded-2xl bg-workbench-surface border border-workbench-border shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-workbench-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-workbench-cyan/10 border border-workbench-cyan/30 flex items-center justify-center text-workbench-cyan">
              {visibility === 'public' ? (
                <Globe className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-workbench-heading">Project Visibility Settings</h2>
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
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current State & Selector */}
        {!confirmPending ? (
          <div className="py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Private Option */}
              <button
                type="button"
                onClick={() => handleToggle('private')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  visibility === 'private'
                    ? 'bg-workbench-elevated border-workbench-cyan shadow-sm'
                    : 'bg-workbench-bg border-workbench-border hover:border-workbench-border-active'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Lock className={`w-4 h-4 ${visibility === 'private' ? 'text-workbench-cyan' : 'text-workbench-muted'}`} />
                  <span className="text-xs font-bold text-workbench-heading">Private</span>
                </div>
                <p className="text-[11px] text-workbench-muted leading-relaxed">
                  Only you and invited project collaborators have access.
                </p>
              </button>

              {/* Public Option */}
              <button
                type="button"
                onClick={() => handleToggle('public')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  visibility === 'public'
                    ? 'bg-workbench-elevated border-workbench-cyan shadow-sm'
                    : 'bg-workbench-bg border-workbench-border hover:border-workbench-border-active'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className={`w-4 h-4 ${visibility === 'public' ? 'text-workbench-cyan' : 'text-workbench-muted'}`} />
                  <span className="text-xs font-bold text-workbench-heading">Public</span>
                </div>
                <p className="text-[11px] text-workbench-muted leading-relaxed">
                  Anyone with the link or browsing the Explore gallery can view.
                </p>
              </button>
            </div>

            {/* Public Link Copy & Actions */}
            {visibility === 'public' && (
              <div className="p-3.5 rounded-xl bg-workbench-bg border border-workbench-border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-workbench-muted font-medium">Public URL</span>
                  <a
                    href={`/p/${projectId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-workbench-cyan hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Preview as visitor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 bg-workbench-surface border border-workbench-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-workbench-text select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-workbench-elevated hover:bg-workbench-border border border-workbench-border text-xs text-workbench-text flex items-center gap-1.5 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-workbench-muted" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-workbench-muted">
                  <GitFork className="w-3.5 h-3.5 text-workbench-cyan" />
                  <span>Cloned {cloneCount} times by other developers</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Confirmation Flow */
          <div className="py-5 space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-200">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  {visibility === 'private'
                    ? 'Publish this project to the public?'
                    : 'Make this project private?'}
                </span>
              </div>
              <p className="leading-relaxed">
                {visibility === 'private'
                  ? 'Making this project public will allow anyone with the link to inspect your tables, columns, constraints, and relationships. It will also be discoverable in the public Explore gallery. Note: personal emails, API keys, or private accounts are NEVER exposed.'
                  : 'Making this project private will immediately remove it from the public Explore gallery and deny public access to visitors. Existing clones will remain intact.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPending(false)}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-workbench-bg hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-muted hover:text-workbench-text transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  executeChange(visibility === 'private' ? 'public' : 'private')
                }
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>
                    Confirm {visibility === 'private' ? 'Publish' : 'Make Private'}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-workbench-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-workbench-elevated hover:bg-workbench-border text-xs font-medium text-workbench-text transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
