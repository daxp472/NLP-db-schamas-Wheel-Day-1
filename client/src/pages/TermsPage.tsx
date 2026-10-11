import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full selection:bg-workbench-cyan selection:text-black">
      {/* Draft Disclaimer Notice */}
      <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 text-amber-200 text-xs font-mono flex items-start gap-3 mb-8">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">INFORMATIONAL DRAFT NOTICE:</span> These Terms of Service represent an initial engineering draft outlining platform usage policies. Legal counsel review is required prior to commercial production release.
        </div>
      </div>

      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-workbench-cyan uppercase">
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </div>
        <h1 className="text-3xl font-bold text-workbench-heading">
          Terms of Service
        </h1>
        <p className="text-xs text-workbench-muted font-mono">
          Last Updated: October 11, 2026 • Version 1.0.0-Draft
        </p>
      </div>

      <div className="space-y-8 text-xs text-workbench-text leading-relaxed font-sans border-t border-workbench-border pt-6">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Schema Studio AI ("the Studio"), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must not access the application or its generation endpoints.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            2. Permitted Use & Developer License
          </h2>
          <p>
            Schema Studio AI grants you a revocable, non-exclusive license to use the workbench to design database models, inspect ER diagrams, and export SQL scripts for personal, educational, or commercial software projects.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-workbench-muted">
            <li>You may not use the service to submit abusive, illegal, or malicious prompts designed to compromise backend services.</li>
            <li>You may not circumvent rate limits, authentication barriers, or security filters.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            3. Disclaimer on Generated Code & Database Migrations
          </h2>
          <p>
            Schema Studio AI generates schema proposals, ER diagrams, and PostgreSQL DDL scripts based on algorithmic models and AI reasoning.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-workbench-muted">
            <li><strong>No Automatic Execution:</strong> Generated SQL scripts must be independently reviewed and tested in an isolated staging database before execution on production systems.</li>
            <li><strong>As-Is Basis:</strong> The service is provided "AS IS" without warranty of any kind, express or implied, including fitness for a particular database migration purpose.</li>
            <li>In no event shall the authors or copyright holders be liable for any claim, damages, data loss, or other liability arising from the execution of generated scripts.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            4. Intellectual Property & Exported Artifacts
          </h2>
          <p>
            You retain full ownership of all custom requirement prompts you author, as well as the database schemas and SQL migration scripts exported through your use of the service. Schema Studio AI claims no proprietary copyright over schemas designed using the workbench.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            5. Modifications to Service
          </h2>
          <p>
            We reserve the right to modify, update, or discontinue features of the Studio at any time, with or without prior notice.
          </p>
        </section>
      </div>
    </div>
  );
};
