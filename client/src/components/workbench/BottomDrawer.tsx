import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  AlertTriangle,
  AlertCircle,
  FileCode,
  BookOpen,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { CanonicalSchema, ValidationReport } from '@schema-studio/shared';
import { generatePostgresDDL } from '@schema-studio/shared';
import { SchemaCopilotDrawer } from './SchemaCopilotDrawer';
import { cn } from '../../utils/cn';

export type DrawerTab = 'sql' | 'diagnostics' | 'docs' | 'copilot' | 'unresolved' | 'history' | null;

interface BottomDrawerProps {
  schema: CanonicalSchema;
  validationReport: ValidationReport;
  activeTab: DrawerTab;
  onSelectTab: (tab: DrawerTab) => void;
  onFocusEntity?: (entityId: string) => void;
  token?: string | null;
  onSchemaUpdated?: (updatedSchema: CanonicalSchema, summary: string) => void;
  onOpenUnresolvedModal?: () => void;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  schema,
  validationReport,
  activeTab,
  onSelectTab,
  onFocusEntity,
  token,
  onSchemaUpdated,
  onOpenUnresolvedModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Unresolved batch answer input state
  const [batchAnswers, setBatchAnswers] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  if (!activeTab) return null;

  const generatedSQL = generatePostgresDDL(schema);
  const unresolvedQuestions = schema.unresolvedQuestions || [];

  const handleCopySQL = () => {
    navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([generatedSQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_schema.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    let md = `# Database Data Dictionary — ${schema.projectName}\n\n`;
    md += `Target Dialect: **${schema.targetDialect.toUpperCase()}**\n\n`;

    schema.entities.forEach((entity) => {
      md += `### Table: \`${entity.name}\`\n`;
      if (entity.description) md += `*${entity.description}*\n\n`;
      md += `| Column | Type | PK | FK | Nullable | Unique | Default | Comment |\n`;
      md += `|---|---|---|---|---|---|---|---|\n`;
      entity.fields.forEach((f) => {
        md += `| \`${f.name}\` | \`${f.dataType}\` | ${f.isPrimaryKey ? '✅' : '—'} | ${f.isForeignKey ? '🔗' : '—'} | ${f.isNullable ? 'Yes' : 'No'} | ${f.isUnique ? 'Yes' : '—'} | \`${f.defaultValue || '—'}\` | ${f.comment || '—'} |\n`;
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_data_dictionary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchAnswers.trim() || !onSchemaUpdated) return;

    setIsResolving(true);
    setResolveError(null);

    try {
      const res = await fetch('/api/projects/resolve-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          schema,
          batchAnswers: batchAnswers.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.schema) {
        onSchemaUpdated(json.data.schema, json.data.summary || 'Questions resolved successfully.');
        setBatchAnswers('');
      } else {
        setResolveError(json.error?.message || 'Failed to resolve questions.');
      }
    } catch {
      setResolveError('Network error connecting to resolution engine.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div
      className={cn(
        'border-t border-workbench-border bg-workbench-surface flex flex-col z-20 shadow-2xl transition-all duration-200 select-none',
        isExpanded ? 'h-[32rem]' : 'h-80'
      )}
    >
      {/* Drawer Header with Tabs */}
      <div className="h-10 border-b border-workbench-border px-3 flex items-center justify-between bg-workbench-elevated text-xs shrink-0">
        <div className="flex items-center gap-1 font-medium overflow-x-auto">
          {/* AI Update Chat Tab */}
          <button
            onClick={() => onSelectTab('copilot')}
            className={cn(
              'px-3 py-1.5 rounded flex items-center gap-1.5 text-[11px] font-semibold transition-colors',
              activeTab === 'copilot'
                ? 'bg-workbench-cyan/15 text-workbench-cyan border border-workbench-cyan/30 shadow-sm'
                : 'text-workbench-cyan/80 hover:text-workbench-cyan hover:bg-workbench-overlay'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-workbench-cyan animate-pulse" />
            <span>AI Update Chat</span>
          </button>

          {/* Unresolved Questions Tab */}
          <button
            onClick={() => onSelectTab('unresolved')}
            className={cn(
              'px-3 py-1.5 rounded flex items-center gap-1.5 text-[11px] font-medium transition-colors',
              activeTab === 'unresolved'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-workbench-overlay'
            )}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Unresolved Questions</span>
            {unresolvedQuestions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                {unresolvedQuestions.length}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-workbench-border mx-1" />

          {/* DDL SQL */}
          <button
            onClick={() => onSelectTab('sql')}
            className={cn(
              'px-3 py-1.5 rounded flex items-center gap-1.5 font-mono text-[11px] transition-colors',
              activeTab === 'sql'
                ? 'bg-workbench-overlay text-workbench-cyan border border-workbench-border-active'
                : 'text-workbench-muted hover:text-workbench-text'
            )}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>PostgreSQL DDL</span>
          </button>

          {/* Diagnostics */}
          <button
            onClick={() => onSelectTab('diagnostics')}
            className={cn(
              'px-3 py-1.5 rounded flex items-center gap-1.5 text-[11px] transition-colors',
              activeTab === 'diagnostics'
                ? 'bg-workbench-overlay text-workbench-cyan border border-workbench-border-active'
                : 'text-workbench-muted hover:text-workbench-text'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
            {validationReport.errors.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-400 font-mono">
                {validationReport.errors.length}
              </span>
            )}
            {validationReport.warnings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-mono">
                {validationReport.warnings.length}
              </span>
            )}
          </button>

          {/* Data Dictionary */}
          <button
            onClick={() => onSelectTab('docs')}
            className={cn(
              'px-3 py-1.5 rounded flex items-center gap-1.5 text-[11px] transition-colors',
              activeTab === 'docs'
                ? 'bg-workbench-overlay text-workbench-cyan border border-workbench-border-active'
                : 'text-workbench-muted hover:text-workbench-text'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Data Dictionary</span>
          </button>
        </div>

        {/* Actions (Copy / Download / Expand / Close) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'sql' && (
            <>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-workbench-bg hover:bg-workbench-overlay text-workbench-text border border-workbench-border transition-colors text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-workbench-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadSQL}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-workbench-bg hover:bg-workbench-overlay text-workbench-cyan border border-workbench-border transition-colors text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql</span>
              </button>
            </>
          )}

          {activeTab === 'docs' && (
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-workbench-bg hover:bg-workbench-overlay text-workbench-cyan border border-workbench-border transition-colors text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          )}

          <div className="h-4 w-px bg-workbench-border" />

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
            className="p-1 rounded text-workbench-muted hover:text-workbench-text transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onSelectTab(null)}
            title="Close Drawer"
            className="p-1 rounded text-workbench-muted hover:text-workbench-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-auto select-text font-mono text-xs">
        {/* AI Update Chat Panel */}
        {activeTab === 'copilot' && (
          <SchemaCopilotDrawer
            schema={schema}
            token={token}
            onSchemaUpdated={onSchemaUpdated || (() => {})}
            onOpenUnresolvedModal={onOpenUnresolvedModal}
          />
        )}

        {/* Unresolved Questions & Batch Resolution Panel */}
        {activeTab === 'unresolved' && (
          <div className="p-4 font-sans space-y-4 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-workbench-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-workbench-heading flex items-center gap-2">
                  <span>Unresolved Architectural Questions</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {unresolvedQuestions.length} Total
                  </span>
                </h3>
                <p className="text-[11px] text-workbench-muted">
                  Resolve all questions in one unified batch below. The AI will incorporate your decisions into the schema tables, columns, and constraints.
                </p>
              </div>

              {onOpenUnresolvedModal && (
                <button
                  type="button"
                  onClick={onOpenUnresolvedModal}
                  className="px-3 py-1.5 rounded-lg bg-workbench-surface hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-text flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-workbench-cyan" />
                  <span>Open Full Modal</span>
                </button>
              )}
            </div>

            {resolveError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resolveError}</span>
              </div>
            )}

            {unresolvedQuestions.length === 0 ? (
              <div className="p-6 rounded-xl bg-workbench-surface border border-workbench-border text-center text-xs text-workbench-muted">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-semibold text-workbench-heading text-sm mb-1">All Questions Resolved</h4>
                <p className="text-[11px]">There are no pending unresolved questions for this architecture.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Questions List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase text-workbench-muted font-semibold block">
                    Pending Questions ({unresolvedQuestions.length})
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {unresolvedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-workbench-bg border border-amber-500/20 text-xs text-amber-100 flex items-start gap-2.5 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Batch Answer Form */}
                <form onSubmit={handleBatchResolve} className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-workbench-heading mb-1">
                      Batch Decisions / Answers
                    </label>
                    <p className="text-[11px] text-workbench-muted mb-2">
                      Answer all questions at once (e.g. "1. Yes soft-delete, 2. Add audit log, 3. Guest checkout allowed"):
                    </p>
                    <textarea
                      value={batchAnswers}
                      onChange={(e) => setBatchAnswers(e.target.value)}
                      rows={4}
                      disabled={isResolving}
                      placeholder={`1. Yes, add deleted_at timestamptz to all tables.\n2. Create an audit_log table for status changes.\n3. Allow guest checkout.`}
                      className="w-full bg-workbench-bg border border-workbench-border rounded-xl p-3 text-xs text-workbench-text font-mono placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-workbench-muted">
                      {batchAnswers.length} chars
                    </span>
                    <button
                      type="submit"
                      disabled={isResolving || !batchAnswers.trim()}
                      className="px-4 py-2 rounded-xl bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Applying to Schema...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Apply Answers & Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* PostgreSQL DDL SQL */}
        {activeTab === 'sql' && (
          <div className="p-4">
            <pre className="text-workbench-text whitespace-pre overflow-x-auto leading-relaxed">
              {generatedSQL}
            </pre>
          </div>
        )}

        {/* Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="p-4 space-y-3 font-sans">
            {validationReport.errors.length === 0 && validationReport.warnings.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald">
                <Check className="w-5 h-5" />
                <div>
                  <h4 className="font-semibold text-xs">Schema Verification Passed</h4>
                  <p className="text-[11px] text-workbench-muted">
                    No referential integrity violations, missing keys, or type mismatches were found.
                  </p>
                </div>
              </div>
            ) : null}

            {validationReport.errors.map((err) => (
              <div
                key={err.id}
                onClick={() => err.entityId && onFocusEntity?.(err.entityId)}
                className="flex items-start gap-2.5 p-3 rounded bg-red-950/20 border border-red-900/50 text-red-300 cursor-pointer hover:border-red-500 transition-colors"
              >
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-red-900/40 text-red-200">
                      {err.code}
                    </span>
                    <span className="text-xs font-semibold">{err.message}</span>
                  </div>
                </div>
              </div>
            ))}

            {validationReport.warnings.map((warn) => (
              <div
                key={warn.id}
                onClick={() => warn.entityId && onFocusEntity?.(warn.entityId)}
                className="flex items-start gap-2.5 p-3 rounded bg-amber-950/20 border border-amber-900/50 text-amber-300 cursor-pointer hover:border-amber-500 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-900/40 text-amber-200">
                      {warn.code}
                    </span>
                    <span className="text-xs">{warn.message}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data Dictionary Docs */}
        {activeTab === 'docs' && (
          <div className="p-4 space-y-6 font-sans">
            {schema.entities.map((entity) => (
              <div key={entity.id} className="border border-workbench-border rounded bg-workbench-bg overflow-hidden">
                <div className="bg-workbench-elevated px-4 py-2 border-b border-workbench-border flex items-center justify-between">
                  <div className="font-mono font-semibold text-workbench-heading text-xs">
                    {entity.name}
                  </div>
                  <span className="text-[11px] text-workbench-muted italic">
                    {entity.description || 'No description'}
                  </span>
                </div>
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-workbench-surface text-workbench-muted border-b border-workbench-border text-[11px]">
                    <tr>
                      <th className="py-1.5 px-3">Column</th>
                      <th className="py-1.5 px-3">Type</th>
                      <th className="py-1.5 px-3">Keys</th>
                      <th className="py-1.5 px-3">Null?</th>
                      <th className="py-1.5 px-3">Default</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-workbench-border/40">
                    {entity.fields.map((f) => (
                      <tr key={f.id} className="hover:bg-workbench-elevated/40">
                        <td className="py-1.5 px-3 font-semibold text-workbench-heading">{f.name}</td>
                        <td className="py-1.5 px-3 text-workbench-cyan">{f.dataType}</td>
                        <td className="py-1.5 px-3">
                          {f.isPrimaryKey && <span className="text-amber-400 mr-1.5 font-sans font-bold">PK</span>}
                          {f.isForeignKey && <span className="text-workbench-violet font-sans font-bold">FK</span>}
                        </td>
                        <td className="py-1.5 px-3 text-workbench-muted">{f.isNullable ? 'NULL' : 'NOT NULL'}</td>
                        <td className="py-1.5 px-3 text-workbench-muted">{f.defaultValue || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
