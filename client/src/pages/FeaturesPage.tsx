import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Network,
  ShieldCheck,
  FileCode,
  Search,
  Sliders,
  CheckCircle2,
  Download,
  ArrowRight
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col selection:bg-workbench-cyan selection:text-black">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-workbench-surface border border-workbench-border mb-6">
          <span className="w-2 h-2 rounded-full bg-workbench-cyan" />
          <span className="text-xs font-mono text-workbench-muted">Feature Catalog & Technical Specifications</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-workbench-heading max-w-4xl mx-auto leading-tight mb-6">
          Comprehensive Database Engineering Tools
        </h1>

        <p className="text-base sm:text-lg text-workbench-muted max-w-3xl mx-auto leading-relaxed mb-8 font-sans">
          Every tool you need to design, inspect, normalize, and export production database architectures without boilerplate.
        </p>

        <div className="flex justify-center gap-3">
          <Link
            to="/workspace"
            className="flex items-center gap-2 px-6 py-3 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-panel hover:shadow-glow-cyan"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try All Features in Studio</span>
          </Link>
        </div>
      </section>

      {/* Feature Deep-Dive Sections */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-20">
        {/* Section 1: Natural Language Input & Extraction */}
        <div className="border border-workbench-border rounded-2xl bg-workbench-surface/50 p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
            <div className="space-y-4 max-w-xl">
              <span className="px-2.5 py-1 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border text-xs font-mono uppercase">
                Input & Extraction Engine
              </span>
              <h2 className="text-2xl font-bold text-workbench-heading">
                Natural-Language Entity & Attribute Extraction
              </h2>
              <p className="text-xs text-workbench-muted leading-relaxed font-sans">
                Transforms plain text requirements into discrete entity models. It extracts column names with appropriate data types (e.g. UUID, VARCHAR, NUMERIC, TIMESTAMPTZ) and assigns column attributes (Nullable, Unique, Default).
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded bg-workbench-bg border border-workbench-border">
                  <div className="text-workbench-cyan font-semibold">Entity Extraction</div>
                  <div className="text-[11px] text-workbench-muted mt-1">Identifies core nouns & aggregates</div>
                </div>
                <div className="p-3 rounded bg-workbench-bg border border-workbench-border">
                  <div className="text-workbench-violet font-semibold">Type Inference</div>
                  <div className="text-[11px] text-workbench-muted mt-1">Assigns dialect-native SQL types</div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 bg-workbench-bg p-4 rounded-xl border border-workbench-border font-mono text-xs space-y-2 shrink-0">
              <div className="text-[11px] text-workbench-muted pb-2 border-b border-workbench-border flex items-center justify-between">
                <span>Domain Extraction Output</span>
                <span className="text-workbench-emerald">3NF Validated</span>
              </div>
              <div className="p-2 rounded bg-workbench-surface border border-workbench-border text-[11px] space-y-1">
                <div className="text-workbench-heading font-semibold">Entity: patients</div>
                <div className="text-workbench-muted text-[10px]">• id: UUID (PK)</div>
                <div className="text-workbench-muted text-[10px]">• national_id: VARCHAR(50) (UQ)</div>
                <div className="text-workbench-muted text-[10px]">• date_of_birth: DATE</div>
                <div className="text-workbench-muted text-[10px]">• created_at: TIMESTAMPTZ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Relationship Inference & Foreign Key Modeling */}
        <div className="border border-workbench-border rounded-2xl bg-workbench-surface/50 p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row-reverse gap-8 items-start justify-between">
            <div className="space-y-4 max-w-xl">
              <span className="px-2.5 py-1 rounded bg-workbench-elevated text-workbench-violet border border-workbench-border text-xs font-mono uppercase">
                Relational Architecture
              </span>
              <h2 className="text-2xl font-bold text-workbench-heading">
                Relationship Inference & Cardinality Modeling
              </h2>
              <p className="text-xs text-workbench-muted leading-relaxed font-sans">
                Automatically determines relational topology (One-to-One, One-to-Many, Many-to-Many). For Many-to-Many relationships, it automatically designs junction tables with composite primary keys and appropriate cascading rules.
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-workbench-text">
                  <span className="px-2 py-0.5 rounded bg-workbench-elevated text-workbench-violet">1:1</span>
                  <span>One-to-One (e.g. User Profile to User Account)</span>
                </div>
                <div className="flex items-center gap-2 text-workbench-text">
                  <span className="px-2 py-0.5 rounded bg-workbench-elevated text-workbench-cyan">1:N</span>
                  <span>One-to-Many (e.g. Customer to Placed Orders)</span>
                </div>
                <div className="flex items-center gap-2 text-workbench-text">
                  <span className="px-2 py-0.5 rounded bg-workbench-elevated text-amber-400">N:M</span>
                  <span>Many-to-Many with Junction Association Table</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 bg-workbench-bg p-4 rounded-xl border border-workbench-border font-mono text-xs space-y-3 shrink-0">
              <div className="text-[11px] text-workbench-muted pb-2 border-b border-workbench-border flex items-center justify-between">
                <span>Junction Model: order_items</span>
                <span className="text-workbench-cyan">Composite PK</span>
              </div>
              <div className="p-3 rounded bg-workbench-surface border border-workbench-border text-[11px] space-y-1.5">
                <div className="text-amber-400 font-semibold">PRIMARY KEY (order_id, product_id)</div>
                <div className="text-workbench-violet">FK 1: order_id ➔ orders(id) [CASCADE]</div>
                <div className="text-workbench-violet">FK 2: product_id ➔ products(id) [RESTRICT]</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Interactive Workbench UI (Explorer, Canvas, Inspector, Drawer) */}
        <div className="border border-workbench-border rounded-2xl bg-workbench-surface/50 p-8 sm:p-10 space-y-8">
          <div className="max-w-2xl">
            <span className="px-2.5 py-1 rounded bg-workbench-elevated text-workbench-emerald border border-workbench-border text-xs font-mono uppercase">
              Developer Ergonomics
            </span>
            <h2 className="text-2xl font-bold text-workbench-heading mt-2">
              Multi-Panel Schema Engineering Workbench
            </h2>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans mt-2">
              Designed after high-performance database IDEs. Four synchronized panels allow visual navigation, deep attribute inspection, table manipulation, and real-time SQL generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-workbench-bg border border-workbench-border space-y-2.5">
              <div className="flex items-center gap-2 text-workbench-cyan font-mono text-xs font-semibold">
                <Search className="w-4 h-4" />
                <span>Schema Explorer</span>
              </div>
              <p className="text-[11px] text-workbench-muted leading-relaxed font-sans">
                Search tables, view column counts, add entities on the fly, and collapse for full canvas focus.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-workbench-bg border border-workbench-border space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold">
                <Network className="w-4 h-4" />
                <span>ER Canvas</span>
              </div>
              <p className="text-[11px] text-workbench-muted leading-relaxed font-sans">
                React Flow canvas with smooth step relationship edges, minimap, drag repositioning, and DAG layout.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-workbench-bg border border-workbench-border space-y-2.5">
              <div className="flex items-center gap-2 text-workbench-violet font-mono text-xs font-semibold">
                <Sliders className="w-4 h-4" />
                <span>Entity Inspector</span>
              </div>
              <p className="text-[11px] text-workbench-muted leading-relaxed font-sans">
                Edit column types, nullability, unique flags, default values, check constraints, and FK cascade rules.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-workbench-bg border border-workbench-border space-y-2.5">
              <div className="flex items-center gap-2 text-workbench-emerald font-mono text-xs font-semibold">
                <FileCode className="w-4 h-4" />
                <span>Bottom Drawer</span>
              </div>
              <p className="text-[11px] text-workbench-muted leading-relaxed font-sans">
                Live PostgreSQL DDL preview with syntax formatting, copy to clipboard, .sql download, and data dictionary.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Validation Engine & Export System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-workbench-surface/50 border border-workbench-border space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-workbench-emerald uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Diagnostic Verifier</span>
            </div>
            <h3 className="text-xl font-bold text-workbench-heading">
              Deterministic Semantic Validation
            </h3>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Runs in the background on every edit. Identifies missing primary keys, orphaned foreign keys, duplicate table names, circular delete loops, and missing FK indexes.
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-workbench-text">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-workbench-emerald" />
                <span>Zero false-positive diagnostics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-workbench-emerald" />
                <span>Instant focus-on-entity navigation from errors</span>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-2xl bg-workbench-surface/50 border border-workbench-border space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-workbench-cyan uppercase">
              <Download className="w-4 h-4" />
              <span>Multi-Format Export</span>
            </div>
            <h3 className="text-xl font-bold text-workbench-heading">
              PostgreSQL DDL & Documentation Exports
            </h3>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Export your validated schema in three native formats: topologically sorted SQL migrations (.sql), full Markdown Data Dictionaries (.md), and Canonical Schema JSON (.json).
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-workbench-text">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-workbench-cyan" />
                <span>Topological sort guarantees clean migration execution</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-workbench-cyan" />
                <span>Table and column comments included for team docs</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 text-center">
        <Link
          to="/workspace"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-panel hover:shadow-glow-cyan"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Schema Studio Free</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </section>
    </div>
  );
};
