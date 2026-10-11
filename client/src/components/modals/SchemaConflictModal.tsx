import React from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { CanonicalSchema } from '@schema-studio/shared';

interface SchemaConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverVersion?: number;
  serverSchema?: CanonicalSchema;
  onReloadServerSchema: (serverSchema: CanonicalSchema) => void;
}

export const SchemaConflictModal: React.FC<SchemaConflictModalProps> = ({
  isOpen,
  onClose,
  serverVersion,
  serverSchema,
  onReloadServerSchema,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md rounded-2xl bg-workbench-surface border border-amber-500/30 shadow-2xl p-6 overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h2 className="text-base font-bold text-workbench-heading text-center mb-1">
          Simultaneous Edit Conflict Detected
        </h2>
        <p className="text-xs text-workbench-muted text-center leading-relaxed mb-5">
          Another collaborator has saved a newer revision of this schema
          {serverVersion ? ` (Revision v${serverVersion})` : ''}.
          To prevent accidentally overwriting their changes, your save was safely paused.
        </p>

        <div className="p-3.5 rounded-xl bg-workbench-bg border border-workbench-border text-xs space-y-2 mb-6">
          <div className="flex items-center gap-2 text-workbench-heading font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Recommended Next Step:</span>
          </div>
          <p className="text-workbench-muted text-[11px] leading-relaxed">
            Reload the latest revision from the server to review incoming changes. Your current
            session will update to the latest revision number.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-workbench-overlay hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-muted hover:text-workbench-text transition-all"
          >
            Keep Local Draft
          </button>

          {serverSchema && (
            <button
              type="button"
              onClick={() => onReloadServerSchema(serverSchema)}
              className="px-4 py-2 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Latest Revision</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
