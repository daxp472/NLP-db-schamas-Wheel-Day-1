import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full selection:bg-workbench-cyan selection:text-black">
      {/* Draft Disclaimer Notice */}
      <div className="p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 text-amber-200 text-xs font-mono flex items-start gap-3 mb-8">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold">INFORMATIONAL DRAFT NOTICE:</span> This document represents an initial informational policy draft outlining how Schema Studio AI currently processes data. It requires qualified legal counsel review prior to commercial deployment.
        </div>
      </div>

      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-workbench-cyan uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Data Governance & Privacy</span>
        </div>
        <h1 className="text-3xl font-bold text-workbench-heading">
          Privacy Policy
        </h1>
        <p className="text-xs text-workbench-muted font-mono">
          Effective Date: October 11, 2026 • Version 1.0.0-Draft
        </p>
      </div>

      <div className="space-y-8 text-xs text-workbench-text leading-relaxed font-sans border-t border-workbench-border pt-6">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            1. Overview & Scope
          </h2>
          <p>
            Schema Studio AI ("the Service") is a developer workspace that converts natural-language software specifications into relational database schemas, diagrams, and PostgreSQL scripts. This policy explains what information is collected, how it is processed by backend services and third-party AI APIs, and how it is stored.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            2. Requirement Prompts & Data Inputs
          </h2>
          <p>
            When you enter application descriptions or business rules into the Requirement Workspace, those text inputs are transmitted to the backend server over HTTPS for semantic schema decomposition and validation.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-workbench-muted">
            <li>We recommend not including sensitive production credentials, personally identifiable customer records, or proprietary trade secrets inside requirement prompts.</li>
            <li>Prompts are treated purely as design specifications and are not sold, rented, or distributed to third parties.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            3. Third-Party AI Processing (Google Gemini API)
          </h2>
          <p>
            The backend integrates with the Google GenAI SDK (`@google/genai`) to synthesize structured relational schemas.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-workbench-muted">
            <li>Only your submitted application requirements and requested target dialect are sent to the model API.</li>
            <li>API keys, user tokens, and unrelated database connection strings remain strictly on the backend and are never sent to Google.</li>
            <li>Google's API usage policies govern the transit and processing of data through their developer endpoints.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            4. Local Browser Persistence & Cookies
          </h2>
          <p>
            Schema Studio AI uses browser local storage (`localStorage`) to maintain active project state, canvas layout coordinates, and unsaved diagram edits across sessions. No advertising trackers, fingerprinting scripts, or third-party marketing pixels are embedded in the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-workbench-heading font-mono uppercase">
            5. Contact Submissions
          </h2>
          <p>
            Inquiries submitted via the Contact page are retained in our operational database for technical support, bug remediation, and product feedback. You may request deletion of logged contact messages at any time by contacting privacy@schemastudio.local.
          </p>
        </section>
      </div>
    </div>
  );
};
