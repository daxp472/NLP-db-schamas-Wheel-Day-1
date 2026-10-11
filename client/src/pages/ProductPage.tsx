import React from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Sparkles,
  Network,
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export const ProductPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col selection:bg-workbench-cyan selection:text-black">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-workbench-surface border border-workbench-border mb-6">
          <span className="w-2 h-2 rounded-full bg-workbench-cyan" />
          <span className="text-xs font-mono text-workbench-muted">Product Architecture & Capabilities</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-workbench-heading max-w-4xl mx-auto leading-tight mb-6">
          A Purpose-Built Studio for <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-workbench-cyan via-sky-400 to-indigo-400">
            Relational Database Engineering
          </span>
        </h1>

        <p className="text-base sm:text-lg text-workbench-muted max-w-3xl mx-auto leading-relaxed mb-10">
          Schema Studio AI bridges the gap between high-level application specifications and strict relational database semantics. Explore the ten integrated engines powering the workbench.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/workspace"
            className="flex items-center gap-2 px-6 py-3 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-panel hover:shadow-glow-cyan"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Schema Studio</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            to="/studio"
            className="flex items-center gap-2 px-6 py-3 rounded bg-workbench-surface text-workbench-text border border-workbench-border hover:border-workbench-cyan text-xs font-medium transition-all"
          >
            <Network className="w-4 h-4 text-workbench-cyan" />
            <span>Explore Live Canvas</span>
          </Link>
        </div>
      </section>

      {/* 10 Core Product Capabilities */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-16">
        {/* 1. Natural Language Requirement Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-workbench-surface/40 p-8 rounded-xl border border-workbench-border">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-workbench-cyan uppercase">
              <span className="px-2 py-0.5 rounded bg-workbench-elevated border border-workbench-border">01</span>
              <span>Requirement Ingestion & Deconstruction</span>
            </div>
            <h2 className="text-2xl font-bold text-workbench-heading">
              Natural Language Requirement Analysis
            </h2>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Enter software specifications, PRDs, or domain models in plain English. The platform decomposes your requirements into core actors, transactional records, and operational lookup dictionaries.
            </p>
            <ul className="space-y-2 text-xs text-workbench-text font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-emerald shrink-0" />
                <span>Bounded length checks (20 to 4,000 characters)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-emerald shrink-0" />
                <span>Prompt injection filtering and system instruction isolation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-emerald shrink-0" />
                <span>Support for structured modules, business rules, and scaling tiers</span>
              </li>
            </ul>
          </div>
          <div className="bg-workbench-bg p-5 rounded-lg border border-workbench-border font-mono text-xs space-y-3">
            <div className="text-workbench-muted text-[11px] pb-2 border-b border-workbench-border flex items-center justify-between">
              <span>input_prompt.txt</span>
              <span className="text-workbench-cyan">POST /api/projects/generate-direct</span>
            </div>
            <div className="text-workbench-text text-xs leading-relaxed bg-workbench-surface p-3 rounded border border-workbench-border">
              "Users place orders containing items from store catalog. Each item tracks inventory and unit pricing. Track customer addresses and payment transactions."
            </div>
            <div className="flex items-center gap-2 text-[11px] text-workbench-emerald">
              <ShieldCheck className="w-4 h-4" />
              <span>Input validated: Safe for synthesis</span>
            </div>
          </div>
        </div>

        {/* 2. AI-Powered Schema Generation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-workbench-surface/40 p-8 rounded-xl border border-workbench-border">
          <div className="order-2 lg:order-1 bg-workbench-bg p-5 rounded-lg border border-workbench-border font-mono text-xs space-y-3">
            <div className="text-workbench-muted text-[11px] pb-2 border-b border-workbench-border flex items-center justify-between">
              <span>gemini_synthesis.json</span>
              <span className="text-workbench-violet">gemini-2.5-flash</span>
            </div>
            <pre className="text-workbench-text text-[11px] leading-relaxed overflow-x-auto p-2 bg-workbench-surface rounded">
{`{
  "projectName": "Modern E-Commerce Engine",
  "targetDialect": "postgresql",
  "entities": [
    { "name": "users", "fields": 5 },
    { "name": "orders", "fields": 5 },
    { "name": "products", "fields": 5 },
    { "name": "order_items", "fields": 5 }
  ],
  "relationships": 3
}`}
            </pre>
            <div className="text-[11px] text-workbench-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-workbench-violet" />
              <span>Strict JSON schema contract enforced</span>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-workbench-violet uppercase">
              <span className="px-2 py-0.5 rounded bg-workbench-elevated border border-workbench-border">02</span>
              <span>Semantic Relational Modeling</span>
            </div>
            <h2 className="text-2xl font-bold text-workbench-heading">
              AI-Powered 3NF Schema Generation
            </h2>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Gemini 2.5 Flash synthesizes clean, normalized database tables. Rather than returning raw unformatted text or guesses, the AI is constrained by strict JSON schema contracts and database design guidelines.
            </p>
            <ul className="space-y-2 text-xs text-workbench-text font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-violet shrink-0" />
                <span>Normalizes to Third Normal Form (3NF)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-violet shrink-0" />
                <span>Separates assumptions from confirmed requirements</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-violet shrink-0" />
                <span>Bounded automated repair loop for recovering edge-case syntax</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Interactive ER Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-workbench-surface/40 p-8 rounded-xl border border-workbench-border">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-amber-400 uppercase">
              <span className="px-2 py-0.5 rounded bg-workbench-elevated border border-workbench-border">03</span>
              <span>Visual Entity-Relationship Studio</span>
            </div>
            <h2 className="text-2xl font-bold text-workbench-heading">
              Interactive ER Diagram Canvas
            </h2>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Built on React Flow (`@xyflow/react`), the canvas provides complete visual clarity into database topology. Drag tables, pan across large architectures, zoom to fit, and use the minimap for instant navigation.
            </p>
            <ul className="space-y-2 text-xs text-workbench-text font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Custom TableNodes with primary, foreign, unique, and nullable badges</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Hierarchical DAG auto-layout for zero overlapping nodes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Full bidirectional state synchronization with canonical schema</span>
              </li>
            </ul>
          </div>
          <div className="bg-workbench-bg p-5 rounded-lg border border-workbench-border flex flex-col items-center justify-center min-h-[220px]">
            <div className="w-64 rounded-md border border-workbench-cyan bg-workbench-surface shadow-glow-cyan text-xs font-mono p-3 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-workbench-border font-semibold text-workbench-heading">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-workbench-cyan" />
                  <span>orders</span>
                </span>
                <span className="text-[10px] text-workbench-muted">5 cols</span>
              </div>
              <div className="text-[11px] space-y-1">
                <div className="flex justify-between text-amber-400">
                  <span>🔑 id</span>
                  <span>uuid</span>
                </div>
                <div className="flex justify-between text-workbench-violet">
                  <span>🔗 user_id</span>
                  <span>uuid</span>
                </div>
                <div className="flex justify-between text-workbench-text">
                  <span>total_amount</span>
                  <span>numeric(10,2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Deterministic Schema Validation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-workbench-surface/40 p-8 rounded-xl border border-workbench-border">
          <div className="order-2 lg:order-1 bg-workbench-bg p-5 rounded-lg border border-workbench-border font-mono text-xs space-y-2.5">
            <div className="text-workbench-muted text-[11px] pb-2 border-b border-workbench-border flex items-center justify-between">
              <span>validator_report.log</span>
              <span className="text-workbench-emerald">100% Passed</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Primary Keys: All 4 entities contain valid PKs</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Referential Integrity: 0 orphaned foreign keys</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Type Compatibility: All FK types match target PKs</span>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-workbench-emerald uppercase">
              <span className="px-2 py-0.5 rounded bg-workbench-elevated border border-workbench-border">04</span>
              <span>Layered Quality Assurance</span>
            </div>
            <h2 className="text-2xl font-bold text-workbench-heading">
              Deterministic Database Design Validation
            </h2>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Never trust AI output blindly. Every schema is evaluated through deterministic relational database rules before rendering or export.
            </p>
            <ul className="space-y-2 text-xs text-workbench-text font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-emerald shrink-0" />
                <span>Primary key presence and non-nullability verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-emerald shrink-0" />
                <span>Foreign key target table and column existence</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-emerald shrink-0" />
                <span>FK index recommendations for JOIN performance</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 5. PostgreSQL DDL Generation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-workbench-surface/40 p-8 rounded-xl border border-workbench-border">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-workbench-cyan uppercase">
              <span className="px-2 py-0.5 rounded bg-workbench-elevated border border-workbench-border">05</span>
              <span>Code Generation & Migration</span>
            </div>
            <h2 className="text-2xl font-bold text-workbench-heading">
              PostgreSQL DDL & Script Generation
            </h2>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Export production-ready SQL scripts that can be executed directly in psql, Supabase, Neon, or pgAdmin. Tables are topologically sorted to eliminate dependency errors.
            </p>
            <ul className="space-y-2 text-xs text-workbench-text font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-cyan shrink-0" />
                <span>Topological sort ensures parent tables precede child tables</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-cyan shrink-0" />
                <span>Circular foreign keys are deferred to ALTER TABLE statements</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-workbench-cyan shrink-0" />
                <span>Includes COMMENT ON TABLE and COMMENT ON COLUMN</span>
              </li>
            </ul>
          </div>
          <div className="bg-workbench-bg p-5 rounded-lg border border-workbench-border font-mono text-xs space-y-2">
            <div className="text-workbench-muted text-[11px] pb-2 border-b border-workbench-border flex items-center justify-between">
              <span>export_schema.sql</span>
              <span className="text-workbench-cyan">PostgreSQL 16</span>
            </div>
            <pre className="text-workbench-text text-[11px] leading-relaxed overflow-x-auto p-2 bg-workbench-surface rounded">
{`CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  CONSTRAINT "fk_orders_user_id"
    FOREIGN KEY ("user_id")
    REFERENCES "users" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);`}
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center">
        <div className="p-8 sm:p-12 rounded-2xl border border-workbench-border bg-workbench-surface/80 relative overflow-hidden shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-workbench-heading mb-4">
            Ready to Design Production Database Schemas?
          </h2>
          <p className="text-xs sm:text-sm text-workbench-muted max-w-xl mx-auto leading-relaxed mb-8">
            Experience the full Schema Studio AI workbench with interactive ER editing, automatic relational normalization, and deterministic PostgreSQL DDL generation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/workspace"
              className="flex items-center gap-2 px-6 py-3 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-sm hover:shadow-glow-cyan"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Designing Free</span>
            </Link>
            <Link
              to="/features"
              className="px-6 py-3 rounded bg-workbench-bg text-workbench-text border border-workbench-border hover:border-workbench-cyan text-xs font-medium transition-all"
            >
              Browse Feature Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
