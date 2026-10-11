import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'AI & Validation' | 'Database & SQL' | 'Studio Workbench';
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'General',
    question: 'What does Schema Studio AI do?',
    answer: 'Schema Studio AI is a specialized developer workbench that translates natural-language software specifications into normalized relational database schemas (3NF), interactive ER diagrams, PostgreSQL DDL scripts, and data dictionaries. It bridges domain requirements with strict database engineering constraints.'
  },
  {
    id: 'faq_2',
    category: 'AI & Validation',
    question: 'How does natural-language schema generation work?',
    answer: 'When you submit requirements, our backend uses Gemini 2.5 Flash constrained by a strict JSON schema contract. It extracts entities, attributes, data types, and foreign key relationships. The response is validated with Zod, and then passed through our deterministic relational validation engine to ensure integrity.'
  },
  {
    id: 'faq_3',
    category: 'Database & SQL',
    question: 'Which database dialects are currently supported?',
    answer: 'PostgreSQL 16 is the primary supported dialect, with full support for UUIDs, composite primary keys, timestamptz, jsonb, numeric precision, and foreign key cascading. MySQL and SQLite dialect targets are planned in upcoming releases.'
  },
  {
    id: 'faq_4',
    category: 'Database & SQL',
    question: 'What are primary keys and foreign keys in Schema Studio AI?',
    answer: 'A Primary Key (PK) uniquely identifies a row in a table (e.g. id uuid). A Foreign Key (FK) establishes a referential constraint pointing from a child table to a parent table. Schema Studio validates that every FK references a valid existing table and column, and warns if foreign keys lack indexes for query performance.'
  },
  {
    id: 'faq_5',
    category: 'Studio Workbench',
    question: 'Can I edit the generated ER diagram directly?',
    answer: 'Yes. The ER Canvas is completely interactive. You can drag and reposition tables, trigger automatic hierarchical DAG layout, click columns to edit attributes in the Entity Inspector, add or delete fields, and adjust relationship cardinality (1:1, 1:N, N:M) with instant synchronization.'
  },
  {
    id: 'faq_6',
    category: 'Database & SQL',
    question: 'Can I export the SQL scripts?',
    answer: 'Yes. You can preview, copy to clipboard, or download full PostgreSQL DDL scripts (.sql). The generator uses a topological sort (Kahn\'s algorithm) to guarantee parent tables are created before dependent child tables, and handles circular references via deferred ALTER TABLE statements.'
  },
  {
    id: 'faq_7',
    category: 'AI & Validation',
    question: 'Is AI output always correct?',
    answer: 'No AI model is inherently 100% reliable for database architecture. That is why Schema Studio AI never executes raw AI output. We apply a multi-tier deterministic validation engine that verifies primary key presence, foreign key target existence, and type compatibility. If minor syntax errors occur, our bounded repair engine self-corrects them.'
  },
  {
    id: 'faq_8',
    category: 'General',
    question: 'How are my software requirements and project data handled?',
    answer: 'Your requirement prompts are processed strictly server-side through Google GenAI SDK. We never send your credentials, API keys, or unauthorized project documents to the model. Prompts are treated purely as data within delimited boundaries to prevent prompt injection.'
  },
  {
    id: 'faq_9',
    category: 'General',
    question: 'Do I need database expertise to use the platform?',
    answer: 'No. Beginners and product managers can express their requirements in plain English and receive a structured, visually understandable ER diagram. At the same time, senior database architects can inspect types, indexes, cascade rules, and generated PostgreSQL DDL.'
  },
  {
    id: 'faq_10',
    category: 'AI & Validation',
    question: 'What happens if generation fails?',
    answer: 'If the AI service encounters network timeouts or rate limits, Schema Studio AI gracefully generates a baseline normalized schema template based on your provided modules, accompanied by an explicit diagnostic notice, ensuring you are never blocked from designing.'
  }
];

export const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>('faq_1');

  const categories = ['All', 'General', 'AI & Validation', 'Database & SQL', 'Studio Workbench'];

  const filteredFAQs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col selection:bg-workbench-cyan selection:text-black">
      {/* Header */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-workbench-surface border border-workbench-border mb-6">
          <HelpCircle className="w-3.5 h-3.5 text-workbench-cyan" />
          <span className="text-xs font-mono text-workbench-muted">Frequently Asked Questions</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-workbench-heading max-w-4xl mx-auto leading-tight mb-6">
          Everything You Need to Know
        </h1>

        <p className="text-base sm:text-lg text-workbench-muted max-w-2xl mx-auto leading-relaxed mb-8 font-sans">
          Answers to technical, operational, and architectural questions about Schema Studio AI.
        </p>

        {/* Search bar */}
        <div className="max-w-md mx-auto relative mb-6">
          <Search className="w-4 h-4 text-workbench-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-workbench-surface border border-workbench-border text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan font-mono"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                selectedCategory === cat
                  ? 'bg-workbench-elevated text-workbench-cyan border-workbench-cyan'
                  : 'bg-workbench-surface text-workbench-muted border-workbench-border hover:text-workbench-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Accordion List */}
      <section className="py-8 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-3">
        {filteredFAQs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-workbench-border rounded-lg text-workbench-muted text-xs font-mono">
            No matching questions found for "{searchQuery}".
          </div>
        ) : (
          filteredFAQs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-workbench-border rounded-xl bg-workbench-surface/70 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-workbench-elevated/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-workbench-bg text-workbench-cyan border border-workbench-border uppercase shrink-0">
                      {faq.category}
                    </span>
                    <span className="font-semibold text-sm text-workbench-heading">
                      {faq.question}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-workbench-cyan shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-workbench-muted shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs text-workbench-muted leading-relaxed font-sans border-t border-workbench-border/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-xl mx-auto p-8 rounded-xl border border-workbench-border bg-workbench-surface/80 space-y-4">
          <h3 className="font-bold text-base text-workbench-heading">
            Have a question not listed here?
          </h3>
          <p className="text-xs text-workbench-muted leading-relaxed font-sans">
            Reach out to our engineering team directly through our contact page or jump into the studio to test your requirements.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/contact"
              className="px-4 py-2 rounded bg-workbench-surface hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-text hover:text-workbench-cyan font-mono transition-colors"
            >
              Contact Team
            </Link>
            <Link
              to="/workspace"
              className="px-4 py-2 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Studio</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
