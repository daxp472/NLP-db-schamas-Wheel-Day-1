import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileQuestion,
  ListOrdered
} from 'lucide-react';
import { CanonicalSchema } from '@schema-studio/shared';

interface UnresolvedQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: CanonicalSchema;
  token?: string | null;
  onSchemaUpdated: (updatedSchema: CanonicalSchema, summary: string) => void;
}

export const UnresolvedQuestionsModal: React.FC<UnresolvedQuestionsModalProps> = ({
  isOpen,
  onClose,
  schema,
  token,
  onSchemaUpdated,
}) => {
  const questions = schema.unresolvedQuestions || [];
  const [batchAnswers, setBatchAnswers] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFillTemplate = () => {
    if (questions.length === 0) return;
    const template = questions
      .map((q, idx) => `${idx + 1}. [Re: ${q}]\nDecision: Yes, implement standard relational pattern.`)
      .join('\n\n');
    setBatchAnswers(template);
  };

  const handleResolveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchAnswers.trim()) {
      setError('Please provide your answers or decisions to resolve the questions.');
      return;
    }

    setSubmitting(true);
    setError(null);

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
        onSchemaUpdated(json.data.schema, json.data.summary || 'All questions resolved and incorporated into schema.');
        onClose();
      } else {
        setError(json.error?.message || 'Failed to update schema with answers.');
      }
    } catch {
      setError('Network error connecting to AI schema resolver.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl rounded-2xl bg-workbench-surface border border-workbench-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-workbench-border flex items-center justify-between bg-workbench-elevated">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-workbench-heading flex items-center gap-2">
                <span>Resolve Unresolved Questions</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {questions.length} Pending
                </span>
              </h2>
              <p className="text-[11px] text-workbench-muted">
                Answer all unresolved architectural questions in one unified batch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-workbench-muted hover:text-workbench-text hover:bg-workbench-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 select-text">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* List of pending questions */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-workbench-muted font-semibold flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-workbench-cyan" />
                <span>Pending Architectural Questions</span>
              </span>
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleFillTemplate}
                  className="text-[11px] font-mono text-workbench-cyan hover:underline"
                >
                  Fill Starter Template
                </button>
              )}
            </div>

            {questions.length === 0 ? (
              <div className="p-4 rounded-xl bg-workbench-bg border border-workbench-border text-center text-xs text-workbench-muted">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                <span>All architectural questions have been resolved for this schema!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-workbench-bg border border-amber-500/20 text-xs flex items-start gap-2.5 text-workbench-text"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-amber-100">{q}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unified Batch Answers Box */}
          <form onSubmit={handleResolveAll} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-workbench-heading mb-1.5">
                Provide Answers / Architectural Decisions (Batch Resolution)
              </label>
              <p className="text-[11px] text-workbench-muted mb-2">
                Type your answers for the questions above. You can address them numbered, in paragraphs, or bullet points.
                The AI will incorporate all decisions into the schema, create necessary tables/columns/constraints, and clear the resolved questions.
              </p>
              <textarea
                value={batchAnswers}
                onChange={(e) => setBatchAnswers(e.target.value)}
                rows={5}
                placeholder={`Example answers:\n1. Yes, add soft-delete columns (deleted_at) to all operational tables.\n2. Create an immutable audit_ledger table to track status transitions with actor_id and previous_state.\n3. Customers can order as guests without a password.`}
                className="w-full bg-workbench-bg border border-workbench-border rounded-xl p-3 text-xs text-workbench-text font-mono leading-relaxed placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan transition-colors"
                disabled={submitting}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-workbench-muted font-mono">
                {batchAnswers.length} characters
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-workbench-overlay hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-muted hover:text-workbench-text transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !batchAnswers.trim()}
                  className="px-4 py-2 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Schema...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Resolve & Update Schema</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
