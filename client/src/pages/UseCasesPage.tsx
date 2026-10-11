import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
  GraduationCap,
  Package,
  Activity,
  Briefcase,
  Library
} from 'lucide-react';

interface UseCase {
  id: string;
  title: string;
  category: string;
  icon: any;
  problem: string;
  entities: string[];
  relationships: string[];
  howStudioHelps: string;
}

const USE_CASES: UseCase[] = [
  {
    id: 'ecommerce',
    title: 'Multi-Vendor E-Commerce Platform',
    category: 'Retail & Marketplaces',
    icon: Database,
    problem: 'Managing independent seller stores, catalog variants, cart line items, dynamic inventory decrements, and complex multi-tender payment authorizations.',
    entities: ['users', 'vendors', 'products', 'categories', 'orders', 'order_items', 'payments', 'shipping_addresses'],
    relationships: [
      'vendors ➔ users (1:1 store owner)',
      'products ➔ vendors (1:N vendor catalog)',
      'order_items ➔ orders & products (N:M junction with price snapshots)',
      'payments ➔ orders (1:N transaction attempts)'
    ],
    howStudioHelps: 'Synthesizes junction tables for order lines, enforces numeric decimal precision on currency fields, and creates non-null foreign keys with RESTRICT delete cascades to prevent order data loss.'
  },
  {
    id: 'lms',
    title: 'Learning Management System (LMS)',
    category: 'EdTech & Training',
    icon: GraduationCap,
    problem: 'Organizing course hierarchies (modules, lessons, quizzes), tracking student enrollment progress, submissions, and teacher grading evaluations across cohorts.',
    entities: ['users', 'courses', 'modules', 'lessons', 'enrollments', 'submissions', 'quizzes', 'certificates'],
    relationships: [
      'courses ➔ users (1:N instructor courses)',
      'lessons ➔ modules ➔ courses (Hierarchical 1:N tree)',
      'enrollments ➔ users & courses (N:M student enrollment)',
      'submissions ➔ lessons & users (1:N assignment tracking)'
    ],
    howStudioHelps: 'Generates composite keys on student-course enrollments to prevent duplicate registrations and configures CASCADE deletion on nested lesson modules.'
  },
  {
    id: 'saas_billing',
    title: 'B2B Multi-Tenant SaaS Billing Engine',
    category: 'Enterprise SaaS',
    icon: Building2,
    problem: 'Isolating tenant organizations, seat licensing, subscription plan upgrades/downgrades, metered feature usage events, and compliant invoice auditing.',
    entities: ['organizations', 'organization_members', 'users', 'plans', 'subscriptions', 'usage_records', 'invoices'],
    relationships: [
      'organization_members ➔ organizations & users (N:M tenant membership with role)',
      'subscriptions ➔ organizations & plans (1:N billing tiers)',
      'usage_records ➔ organizations (1:N high-volume event ledger)',
      'invoices ➔ subscriptions (1:N billing periods)'
    ],
    howStudioHelps: 'Establishes clean tenant foreign key indexes for fast multi-tenant WHERE partitioning, and normalizes audit timestamps across invoice records.'
  },
  {
    id: 'inventory',
    title: 'Warehouse & Inventory Management',
    category: 'Logistics & Supply Chain',
    icon: Package,
    problem: 'Tracking raw stock lots across physical warehouse aisles, bin shelves, supplier purchase orders, and stock transfer movements with serial numbers.',
    entities: ['warehouses', 'zones', 'storage_bins', 'items', 'item_lots', 'stock_transfers', 'suppliers', 'purchase_orders'],
    relationships: [
      'storage_bins ➔ zones ➔ warehouses (Hierarchical location graph)',
      'item_lots ➔ items (1:N batch expiry & quantity tracking)',
      'stock_transfers ➔ source & target storage_bins (Dual FK location movement)',
      'purchase_orders ➔ suppliers (1:N procurement)'
    ],
    howStudioHelps: 'Handles dual foreign keys pointing to the same table (e.g. source_bin_id and dest_bin_id pointing to storage_bins) with correct constraint naming.'
  },
  {
    id: 'healthcare',
    title: 'Hospital & Patient Care Portal',
    category: 'Healthcare & EHR',
    icon: Activity,
    problem: 'Managing patient profiles, physician medical credentials, non-overlapping consultation booking slots, diagnostic prescriptions, and strict audit access logs.',
    entities: ['patients', 'practitioners', 'specialties', 'appointments', 'consultation_notes', 'prescriptions', 'access_audit_logs'],
    relationships: [
      'practitioners ➔ specialties (1:N medical domain)',
      'appointments ➔ patients & practitioners (N:M calendar schedule)',
      'consultation_notes ➔ appointments (1:1 clinical diagnosis)',
      'prescriptions ➔ consultation_notes (1:N pharmaceutical orders)'
    ],
    howStudioHelps: 'Models unique composite constraints to prevent physician double-booking, and sets immutable timestamptz defaults on audit logs.'
  },
  {
    id: 'project_mgmt',
    title: 'Collaborative Project Management',
    category: 'Productivity & Workflows',
    icon: Briefcase,
    problem: 'Tracking workspace projects, sprint milestones, parent-child task trees, priority tags, assignees, and audit activity feeds.',
    entities: ['workspaces', 'projects', 'tasks', 'sprints', 'tags', 'task_tags', 'task_assignees', 'comments'],
    relationships: [
      'tasks ➔ tasks (Self-referencing 1:N parent-subtask tree)',
      'task_tags ➔ tasks & tags (N:M tagging junction)',
      'task_assignees ➔ tasks & users (N:M team assignment)',
      'comments ➔ tasks & users (1:N conversation thread)'
    ],
    howStudioHelps: 'Resolves self-referencing foreign keys (parent_task_id -> tasks.id) using deferred ALTER TABLE statements to guarantee clean script execution.'
  },
  {
    id: 'library',
    title: 'Municipal Library Management',
    category: 'Civic & Information',
    icon: Library,
    problem: 'Cataloging physical book editions by ISBN, authors, genres, patron memberships, active loans, and overdue fine calculations.',
    entities: ['books', 'authors', 'book_authors', 'book_copies', 'patrons', 'loans', 'fines', 'reservations'],
    relationships: [
      'book_authors ➔ books & authors (N:M multi-author attribution)',
      'book_copies ➔ books (1:N physical barcode inventory)',
      'loans ➔ book_copies & patrons (1:N active lending history)',
      'fines ➔ loans (1:1 overdue fee tracking)'
    ],
    howStudioHelps: 'Distinguishes book metadata (title, publisher) from physical assets (barcodes, wear condition) through clean normalization.'
  }
];

export const UseCasesPage: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<string>('ecommerce');
  const current = USE_CASES.find((c) => c.id === selectedCase) || USE_CASES[0];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col selection:bg-workbench-cyan selection:text-black">
      {/* Header */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-workbench-surface border border-workbench-border mb-6">
          <span className="w-2 h-2 rounded-full bg-workbench-cyan" />
          <span className="text-xs font-mono text-workbench-muted">Real-World Software Domains</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-workbench-heading max-w-4xl mx-auto leading-tight mb-6">
          Architect Any Domain Model
        </h1>

        <p className="text-base sm:text-lg text-workbench-muted max-w-3xl mx-auto leading-relaxed mb-8 font-sans">
          Explore how Schema Studio AI analyzes specific business domains, defines foreign key relationships, handles junction entities, and produces production PostgreSQL schemas.
        </p>

        {/* Use-Case Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {USE_CASES.map((uc) => {
            const isSelected = selectedCase === uc.id;
            return (
              <button
                key={uc.id}
                onClick={() => setSelectedCase(uc.id)}
                className={`px-3.5 py-2 rounded text-xs font-mono transition-all border ${
                  isSelected
                    ? 'bg-workbench-elevated text-workbench-cyan border-workbench-cyan shadow-sm'
                    : 'bg-workbench-surface text-workbench-muted border-workbench-border hover:text-workbench-text'
                }`}
              >
                {uc.title}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Use-Case Deep Dive */}
      <section className="py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-2xl border border-workbench-border bg-workbench-surface/70 space-y-8 shadow-panel">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-workbench-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-workbench-elevated border border-workbench-border flex items-center justify-center text-workbench-cyan">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-workbench-muted">
                  {current.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-workbench-heading">
                  {current.title}
                </h2>
              </div>
            </div>

            <Link
              to="/workspace"
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Design Similar Schema</span>
            </Link>
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase text-workbench-cyan font-semibold">
              The Data Modeling Challenge
            </h3>
            <p className="text-xs text-workbench-text leading-relaxed font-sans bg-workbench-bg p-4 rounded-lg border border-workbench-border">
              {current.problem}
            </p>
          </div>

          {/* Entities Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase text-workbench-heading font-semibold">
              Key Relational Entities ({current.entities.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {current.entities.map((ent) => (
                <span
                  key={ent}
                  className="px-2.5 py-1 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border font-mono text-xs"
                >
                  {ent}
                </span>
              ))}
            </div>
          </div>

          {/* Relationships */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase text-workbench-heading font-semibold">
              Foreign Key Relationships & Integrity
            </h3>
            <div className="space-y-2">
              {current.relationships.map((rel, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded bg-workbench-bg border border-workbench-border text-xs font-mono text-workbench-text"
                >
                  <span className="text-workbench-violet">🔗</span>
                  <span>{rel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How Studio Solves This */}
          <div className="space-y-2 pt-2 border-t border-workbench-border">
            <h3 className="text-xs font-mono uppercase text-workbench-emerald font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>How Schema Studio AI Solves This</span>
            </h3>
            <p className="text-xs text-workbench-muted leading-relaxed font-sans">
              {current.howStudioHelps}
            </p>
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
          <span>Start Designing Your Domain Schema</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </section>
    </div>
  );
};
