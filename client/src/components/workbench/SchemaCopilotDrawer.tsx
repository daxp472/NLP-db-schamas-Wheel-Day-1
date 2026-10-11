import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { CanonicalSchema } from '@schema-studio/shared';
import { cn } from '../../utils/cn';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  summary?: string;
  isError?: boolean;
}

interface SchemaCopilotDrawerProps {
  schema: CanonicalSchema;
  token?: string | null;
  onSchemaUpdated: (updatedSchema: CanonicalSchema, summary: string) => void;
  onOpenUnresolvedModal?: () => void;
}

const QUICK_PROMPTS = [
  'Add payments and transaction ledger tables',
  'Add soft delete (deleted_at) to all operational tables',
  'Add an immutable audit_log table with actor_id and action',
  'Add unique constraint and email verification timestamp to users',
  'Add tags table with a many-to-many junction to main entities',
];

export const SchemaCopilotDrawer: React.FC<SchemaCopilotDrawerProps> = ({
  schema,
  token,
  onSchemaUpdated,
  onOpenUnresolvedModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your AI Schema Copilot. Tell me what should be added, updated, or modified in "${schema.projectName}". For example:\n• "Add a payments table with stripe_charge_id and currency"\n• "Add soft-delete column to all tables"\n• "Link orders to customers via foreign key"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend?: string) => {
    const instruction = (textToSend || input).trim();
    if (!instruction || isProcessing) return;

    const userMessageId = `msg_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: instruction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/projects/iterate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          schema,
          instruction,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.schema) {
        const updatedSchema = json.data.schema;
        const summary = json.data.summary || 'Schema updated successfully.';

        onSchemaUpdated(updatedSchema, summary);

        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: `I've updated the schema based on your instruction:\n\n${summary}`,
          summary,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: json.error?.message || 'Could not apply this schema change. Please try phrasing differently.',
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: 'Network error connecting to the AI update engine.',
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-workbench-bg overflow-hidden select-text text-xs">
      {/* Quick Prompts Bar */}
      <div className="border-b border-workbench-border/60 bg-workbench-surface px-3 py-2 flex items-center gap-2 overflow-x-auto select-none">
        <span className="text-[10px] font-mono text-workbench-muted uppercase flex items-center gap-1 shrink-0">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Suggestions:</span>
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => void handleSendMessage(prompt)}
            disabled={isProcessing}
            className="shrink-0 px-2.5 py-1 rounded-full bg-workbench-bg hover:bg-workbench-elevated border border-workbench-border text-[11px] text-workbench-muted hover:text-workbench-text transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
        {schema.unresolvedQuestions?.length > 0 && onOpenUnresolvedModal && (
          <button
            onClick={onOpenUnresolvedModal}
            className="shrink-0 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] text-amber-300 font-semibold transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Batch Resolve {schema.unresolvedQuestions.length} Questions</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-start gap-2.5 max-w-3xl',
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs',
                msg.sender === 'user'
                  ? 'bg-workbench-cyan/20 text-workbench-cyan border border-workbench-cyan/40'
                  : 'bg-workbench-violet/20 text-workbench-violet border border-workbench-violet/40'
              )}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={cn(
                'p-3 rounded-2xl max-w-xl text-xs leading-relaxed whitespace-pre-wrap',
                msg.sender === 'user'
                  ? 'bg-workbench-cyan text-black font-medium rounded-tr-none'
                  : msg.isError
                  ? 'bg-red-950/30 border border-red-500/30 text-red-300 rounded-tl-none'
                  : 'bg-workbench-surface border border-workbench-border text-workbench-text rounded-tl-none'
              )}
            >
              {msg.text}
              <div
                className={cn(
                  'mt-1 text-[9px] font-mono opacity-60 text-right',
                  msg.sender === 'user' ? 'text-black/70' : 'text-workbench-muted'
                )}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2.5 text-workbench-muted text-xs p-2">
            <div className="w-6 h-6 rounded-full bg-workbench-violet/20 text-workbench-violet border border-workbench-violet/40 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-workbench-surface border border-workbench-border">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-workbench-cyan" />
              <span>Analyzing requirements & updating canonical schema...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-3 border-t border-workbench-border bg-workbench-surface select-none">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              placeholder="Ask Copilot what to add or modify (e.g. 'Add discounts table connected to products')..."
              rows={2}
              className="w-full bg-workbench-bg border border-workbench-border rounded-xl px-3 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/50 focus:outline-none focus:border-workbench-cyan resize-none transition-colors"
            />
          </div>
          <button
            onClick={() => void handleSendMessage()}
            disabled={isProcessing || !input.trim()}
            className="p-2.5 rounded-xl bg-workbench-cyan text-black hover:bg-cyan-300 transition-all disabled:opacity-40 shadow-sm shrink-0"
            title="Send Update Instruction (Enter)"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
