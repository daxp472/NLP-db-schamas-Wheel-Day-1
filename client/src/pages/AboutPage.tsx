import React from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Sparkles,
  ShieldCheck,
  Network,
  ArrowRight
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col selection:bg-workbench-cyan selection:text-black">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-workbench-surface border border-workbench-border mb-6">
          <Database className="w-3.5 h-3.5 text-workbench-cyan" />
          <span className="text-xs font-mono text-workbench-muted">Product Philosophy & Engineering Vision</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-workbench-heading max-w-4xl mx-auto leading-tight mb-6">
          Engineered for Clarity in <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-workbench-cyan via-sky-400 to-indigo-400">
            Database Architecture
          </span>
        </h1>

        <p className="text-base sm:text-lg text-workbench-muted max-w-3xl mx-auto leading-relaxed mb-10 font-sans">
          Relational data modeling is the foundation of reliable software. We built Schema Studio AI to make database architecture transparent, editable, and accessible to everyone.
        </p>
      </section>

      {/* Core Philosophy Grid */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-12">
        {/* The Problem */}
        <div className="p-8 sm:p-10 rounded-2xl border border-workbench-border bg-workbench-surface/60 space-y-4 shadow-panel">
          <div className="flex items-center gap-2 text-xs font-mono text-workbench-cyan uppercase font-semibold">
            <span className="w-2 h-2 rounded-full bg-workbench-cyan" />
            <span>The Challenge We Address</span>
          </div>
          <h2 className="text-2xl font-bold text-workbench-heading">
            The Chasm Between PRDs and Database Constraints
          </h2>
          <p className="text-xs sm:text-sm text-workbench-muted leading-relaxed font-sans">
            Software begins with human intent: "users book appointments," "customers checkout with multiple store items," "organizations manage seat licenses." However, relational databases demand mathematical rigor: Third Normal Form (3NF), composite primary keys, foreign key referential actions, and index optimization.
          </p>
          <p className="text-xs sm:text-sm text-workbench-muted leading-relaxed font-sans">
            Traditionally, developers either spent hours writing repetitive migration boilerplate or used generic AI chatbots that hallucinated unviable schemas with missing keys, cyclic deletion loops, and orphaned constraints.
          </p>
        </div>

        {/* The Philosophy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 sm:p-8 rounded-xl border border-workbench-border bg-workbench-surface/50 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-workbench-elevated border border-workbench-border flex items-center justify-center text-workbench-emerald mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-workbench-heading">
              Transparent, Not Opaque
            </h3>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              AI should propose, but deterministic engines must verify. We never assume an AI response is valid SQL code. Every entity passes through deterministic database design checks, separating assumptions from explicit requirements.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-xl border border-workbench-border bg-workbench-surface/50 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-workbench-elevated border border-workbench-border flex items-center justify-center text-workbench-violet mb-2">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-workbench-heading">
              Visual & Code Synchronization
            </h3>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              Diagrams must never become stale pictures. The Canonical Schema Model is the single source of truth: changes on the ER canvas update the SQL script, and modifications in the inspector reflect on the diagram immediately.
            </p>
          </div>
        </div>

        {/* Democratizing Relational Modeling */}
        <div className="p-8 sm:p-10 rounded-2xl border border-workbench-border bg-workbench-surface/60 space-y-4 shadow-panel">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Accessibility</span>
          </div>
          <h2 className="text-2xl font-bold text-workbench-heading">
            Making Relational Engineering Accessible
          </h2>
          <p className="text-xs sm:text-sm text-workbench-muted leading-relaxed font-sans">
            Whether you are a startup founder prototyping your first minimum viable product, a CS student learning normalization and cascades, or a senior database architect planning a multi-tenant enterprise data model, Schema Studio AI gives you a visual, verified canvas to bring ideas to life.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <Link
          to="/workspace"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-panel hover:shadow-glow-cyan"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start Designing with Schema Studio</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </section>
    </div>
  );
};
