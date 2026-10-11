import React from 'react';
import {
  Undo2,
  Redo2,
  LayoutGrid,
  ShieldCheck,
  FileCode,
  Download,
  CheckCircle2,
  RefreshCw,
  FileText,
  Globe,
  Lock,
  Users,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { DatabaseDialect, ValidationReport, ProjectVisibility, CollaborationRole } from '@schema-studio/shared';
import { DrawerTab } from './BottomDrawer';
import { cn } from '../../utils/cn';

interface ToolbarProps {
  projectId?: string;
  projectName: string;
  targetDialect: DatabaseDialect;
  visibility?: ProjectVisibility;
  role?: CollaborationRole;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  validationReport: ValidationReport;
  activeDrawerTab: DrawerTab;
  unresolvedCount?: number;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  onToggleDrawerTab: (tab: DrawerTab) => void;
  onExportSQL: () => void;
  onExportDiagram?: () => void;
  onExportDocs?: () => void;
  onSave?: () => void;
  onOpenVisibility?: () => void;
  onOpenMembers?: () => void;
  onOpenUnresolvedModal?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  projectId,
  projectName,
  targetDialect,
  visibility = 'private',
  role = 'owner',
  hasUnsavedChanges,
  isSaving,
  canUndo,
  canRedo,
  validationReport,
  activeDrawerTab,
  unresolvedCount = 0,
  onUndo,
  onRedo,
  onAutoLayout,
  onToggleDrawerTab,
  onExportSQL,
  onSave,
  onOpenVisibility,
  onOpenMembers,
  onOpenUnresolvedModal,
}) => {
  const errorCount = validationReport.errors.length;
  const warningCount = validationReport.warnings.length;

  return (
    <div className="h-12 border-b border-workbench-border bg-workbench-surface px-3 flex items-center justify-between text-xs select-none z-20">
      {/* Left section: Project metadata and save status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-workbench-heading tracking-tight text-sm max-w-56 truncate" title={projectName}>
            {projectName}
          </span>
          <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border">
            {targetDialect}
          </span>

          {/* Visibility badge & toggle */}
          {projectId && onOpenVisibility && (
            <button
              onClick={onOpenVisibility}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                visibility === 'public'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-workbench-overlay text-workbench-muted border-workbench-border hover:text-workbench-text'
              }`}
              title="Change project visibility"
            >
              {visibility === 'public' ? (
                <>
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </>
              )}
            </button>
          )}

          {/* Role badge if not owner */}
          {role && role !== 'owner' && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase border ${
                role === 'editor'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}
            >
              {role}
            </span>
          )}

          {/* Team / Collaborators modal button */}
          {projectId && onOpenMembers && (
            <button
              onClick={onOpenMembers}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-workbench-overlay hover:bg-workbench-elevated border border-workbench-border text-workbench-muted hover:text-workbench-text transition-all"
              title="Manage project collaborators"
            >
              <Users className="w-3 h-3 text-workbench-cyan" />
              <span>Team</span>
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-workbench-border" />

        {/* Persistence Status */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          {isSaving ? (
            <span className="flex items-center gap-1 text-workbench-cyan">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          ) : hasUnsavedChanges ? (
            <button
              onClick={onSave}
              className="flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
              title="Click to save now"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Unsaved changes</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-workbench-emerald">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle section: Action controls (Undo, Redo, Layout, Validation) */}
      <div className="flex items-center gap-1 bg-workbench-bg p-0.5 rounded border border-workbench-border">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={cn(
            'p-1.5 rounded text-workbench-muted transition-colors',
            canUndo ? 'hover:text-workbench-text hover:bg-workbench-elevated' : 'opacity-30 cursor-not-allowed'
          )}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={cn(
            'p-1.5 rounded text-workbench-muted transition-colors',
            canRedo ? 'hover:text-workbench-text hover:bg-workbench-elevated' : 'opacity-30 cursor-not-allowed'
          )}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-workbench-border mx-0.5" />

        <button
          onClick={onAutoLayout}
          title="Auto-Layout ER Diagram (Hierarchical DAG)"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-workbench-muted hover:text-workbench-cyan hover:bg-workbench-elevated transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="font-medium text-[11px]">Auto Layout</span>
        </button>

        <div className="h-3.5 w-px bg-workbench-border mx-0.5" />

        <button
          onClick={() => onToggleDrawerTab('diagnostics')}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-[11px] font-medium',
            activeDrawerTab === 'diagnostics'
              ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-border-active'
              : errorCount > 0
              ? 'text-red-400 hover:bg-workbench-elevated'
              : warningCount > 0
              ? 'text-amber-400 hover:bg-workbench-elevated'
              : 'text-workbench-emerald hover:bg-workbench-elevated'
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {errorCount > 0
              ? `${errorCount} Error${errorCount > 1 ? 's' : ''}`
              : warningCount > 0
              ? `${warningCount} Warn${warningCount > 1 ? 's' : ''}`
              : 'Valid Schema'}
          </span>
        </button>
      </div>

      {/* Right section: AI Copilot, Unresolved Questions, SQL preview, Documentation & Export dropdowns */}
      <div className="flex items-center gap-1.5">
        {/* AI Copilot Update Chat Button */}
        <button
          onClick={() => onToggleDrawerTab('copilot')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded font-medium text-[11px] transition-all shadow-sm',
            activeDrawerTab === 'copilot'
              ? 'bg-workbench-cyan text-black font-semibold'
              : 'bg-workbench-cyan/15 text-workbench-cyan hover:bg-workbench-cyan/25 border border-workbench-cyan/30'
          )}
          title="Open AI Schema Copilot / Update Chat"
        >
          <Sparkles className="w-3.5 h-3.5 text-workbench-cyan animate-pulse" />
          <span>AI Copilot</span>
        </button>

        {/* Unresolved Questions Button */}
        {unresolvedCount > 0 && (
          <button
            onClick={onOpenUnresolvedModal || (() => onToggleDrawerTab('unresolved'))}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded font-medium text-[11px] transition-all',
              activeDrawerTab === 'unresolved'
                ? 'bg-amber-500 text-black font-semibold'
                : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
            )}
            title="Batch resolve unanswered questions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Unresolved ({unresolvedCount})</span>
          </button>
        )}

        <button
          onClick={() => onToggleDrawerTab('sql')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] transition-colors',
            activeDrawerTab === 'sql'
              ? 'bg-workbench-cyan text-black font-semibold'
              : 'bg-workbench-elevated text-workbench-text hover:text-workbench-cyan border border-workbench-border'
          )}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>PostgreSQL SQL</span>
        </button>

        <button
          onClick={() => onToggleDrawerTab('docs')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] transition-colors',
            activeDrawerTab === 'docs'
              ? 'bg-workbench-elevated text-workbench-cyan border border-workbench-cyan'
              : 'bg-workbench-elevated text-workbench-muted hover:text-workbench-text border border-workbench-border'
          )}
          title="Data Dictionary & Documentation"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Docs</span>
        </button>

        <button
          onClick={onExportSQL}
          title="Download PostgreSQL DDL script (.sql)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-workbench-elevated hover:bg-workbench-overlay text-workbench-text border border-workbench-border transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-workbench-cyan" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
};
