import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  ShieldCheck,
  Network,
  FileCode,
  ArrowRight,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Describe Your Application Domain',
      desc: 'Enter your requirements in natural language. Outline the core actors, transactions, and business rules of your system. You can optionally specify known modules, audit requirements, or scaling tiers.',
      detail: 'Our input layer performs character bounding (min 20, max 4000) and prompt injection filtering to protect the generation pipeline.',
      icon: FileText,
      badge: 'Input Phase'
    },
    {
      step: '02',
      title: 'Decompose Domain & Clarify Assumptions',
      desc: 'The platform identifies relational entities, attributes, primary keys, and relationships. It transparently separates confirmed requirements from AI-inferred assumptions and flags any unresolved questions.',
      detail: 'Assumptions and unresolved ambiguities are made visible rather than hidden behind silent hallucinated design choices.',
      icon: Sparkles,
      badge: 'Analysis Phase'
    },
    {
      step: '03',
      title: 'Structured 3NF Schema Synthesis',
      desc: 'Gemini 2.5 Flash is invoked through the backend with a strict JSON schema contract. It outputs standardized table names, typed fields, primary keys, and foreign key references.',
      detail: 'Output is validated using Zod schemas at runtime. If any format anomalies occur, a bounded 1-turn repair loop self-corrects the output.',
      icon: Cpu,
      badge: 'Synthesis Phase'
    },
    {
      step: '04',
      title: 'Deterministic Database Integrity Validation',
      desc: 'Never trust AI output as valid relational code. The schema is sent through our deterministic validation engine to check primary key presence, foreign key reference integrity, and type compatibility.',
      detail: 'Circular cascade cycles and duplicate identifiers are caught immediately before visual rendering or persistence.',
      icon: ShieldCheck,
      badge: 'Verification Phase'
    },
    {
      step: '05',
      title: 'Interactive ER Diagram Workbench',
      desc: 'The validated schema opens in the Schema Studio. Drag tables, pan the canvas, inspect columns, edit data types, adjust cardinality (1:1, 1:N, N:M), and trigger DAG auto-layout.',
      detail: 'The Canonical Schema remains the single source of truth. Mutations in the Entity Inspector instantly update the diagram and SQL scripts.',
      icon: Network,
      badge: 'Studio Workbench'
    },
    {
      step: '06',
      title: 'Deterministic SQL DDL & Documentation Export',
      desc: 'Export production-grade PostgreSQL DDL scripts with correct dependency ordering (topological sort) and table comments, plus Markdown Data Dictionaries.',
      detail: 'Generated SQL can be downloaded as .sql or copied with syntax formatting, ready for immediate execution in psql or migration tools.',
      icon: FileCode,
      badge: 'Export Phase'
    }
  ];

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col selection:bg-workbench-cyan selection:text-black">
      {/* Header */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-workbench-surface border border-workbench-border mb-6">
          <span className="w-2 h-2 rounded-full bg-workbench-cyan" />
          <span className="text-xs font-mono text-workbench-muted">End-to-End Engineering Workflow</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-workbench-heading max-w-4xl mx-auto leading-tight mb-6">
          How Schema Studio AI Works
        </h1>

        <p className="text-base sm:text-lg text-workbench-muted max-w-3xl mx-auto leading-relaxed mb-8 font-sans">
          From natural language prompt to production-grade PostgreSQL DDL. A transparent, multi-tiered pipeline that combines Gemini semantic analysis with deterministic graph validation.
        </p>

        <div className="inline-flex items-center gap-2 p-3 rounded-lg bg-workbench-surface border border-workbench-border text-xs font-mono text-workbench-cyan">
          <ShieldCheck className="w-4 h-4 text-workbench-emerald" />
          <span>Core Principle: AI proposes designs, deterministic rules verify them, and humans control them.</span>
        </div>
      </section>

      {/* 6 Step Pipeline */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-8">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="p-6 sm:p-8 rounded-xl border border-workbench-border bg-workbench-surface/60 hover:border-workbench-cyan/50 transition-all flex flex-col sm:flex-row gap-6 shadow-panel"
            >
              <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 shrink-0">
                <div className="w-12 h-12 rounded-lg bg-workbench-elevated border border-workbench-border flex items-center justify-center text-workbench-cyan">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-mono text-xl font-bold text-workbench-muted/70">
                  {s.step}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-workbench-heading">
                    {s.title}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border uppercase">
                    {s.badge}
                  </span>
                </div>

                <p className="text-xs text-workbench-text leading-relaxed font-sans">
                  {s.desc}
                </p>

                <div className="p-3 rounded bg-workbench-bg border border-workbench-border text-[11px] font-mono text-workbench-muted flex items-start gap-2">
                  <span className="text-workbench-cyan shrink-0">ℹ</span>
                  <span>{s.detail}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Real Walkthrough Example Section */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-workbench-heading mb-2">
            A Concrete Transformation Walkthrough
          </h2>
          <p className="text-xs text-workbench-muted font-mono">
            Witness how a natural language spec converts into relational entities and ordered DDL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {/* Box 1: Input */}
          <div className="p-5 rounded-lg border border-workbench-border bg-workbench-surface space-y-3">
            <div className="text-workbench-muted text-[11px] uppercase pb-2 border-b border-workbench-border flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-workbench-cyan" />
              <span>1. Specification</span>
            </div>
            <div className="text-workbench-text text-[11px] leading-relaxed bg-workbench-bg p-3 rounded border border-workbench-border">
              "We need an e-commerce platform where customers browse products, add them to carts, and place orders with line items. Calculate total prices and record payment records."
            </div>
            <div className="text-[10px] text-workbench-muted">
              Length: 215 chars • Target: PostgreSQL
            </div>
          </div>

          {/* Box 2: Validated Graph */}
          <div className="p-5 rounded-lg border border-workbench-border bg-workbench-surface space-y-3">
            <div className="text-workbench-muted text-[11px] uppercase pb-2 border-b border-workbench-border flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Synthesized Model</span>
            </div>
            <div className="text-workbench-text text-[11px] leading-relaxed bg-workbench-bg p-3 rounded border border-workbench-border space-y-1.5">
              <div>• <span className="text-workbench-cyan">users</span> (id, email, name)</div>
              <div>• <span className="text-workbench-cyan">products</span> (id, sku, price, stock)</div>
              <div>• <span className="text-workbench-cyan">orders</span> (id, user_id, total, status)</div>
              <div>• <span className="text-workbench-cyan">order_items</span> (id, order_id, product_id, qty)</div>
              <div>• <span className="text-workbench-cyan">payments</span> (id, order_id, amount, status)</div>
            </div>
            <div className="text-[10px] text-workbench-emerald flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Referential Graph: Valid (3NF)</span>
            </div>
          </div>

          {/* Box 3: Output */}
          <div className="p-5 rounded-lg border border-workbench-border bg-workbench-surface space-y-3">
            <div className="text-workbench-muted text-[11px] uppercase pb-2 border-b border-workbench-border flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-workbench-emerald" />
              <span>3. Topologically Ordered DDL</span>
            </div>
            <div className="text-workbench-text text-[11px] leading-relaxed bg-workbench-bg p-3 rounded border border-workbench-border overflow-x-auto">
              <pre className="text-[10px] text-workbench-muted">
{`-- Table 1: users (independent)
CREATE TABLE "users" (...);

-- Table 2: products (independent)
CREATE TABLE "products" (...);

-- Table 3: orders (depends on users)
CREATE TABLE "orders" (...);

-- Table 4: order_items (junction)
CREATE TABLE "order_items" (...);`}
              </pre>
            </div>
            <div className="text-[10px] text-workbench-cyan flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Topological Sort: Zero FK errors</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <Link
          to="/workspace"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-panel hover:shadow-glow-cyan"
        >
          <Sparkles className="w-4 h-4" />
          <span>Try the Workflow Now</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </section>
    </div>
  );
};
