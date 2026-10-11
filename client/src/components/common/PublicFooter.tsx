import React from 'react';
import { Link } from 'react-router-dom';
import { Database, ExternalLink } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-workbench-border bg-workbench-surface/90 text-workbench-text select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand & Overview */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded bg-workbench-elevated border border-workbench-border-active flex items-center justify-center text-workbench-cyan">
                <Database className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm tracking-wide text-workbench-heading">
                SCHEMA STUDIO <span className="text-workbench-cyan font-mono text-xs">AI</span>
              </span>
            </Link>

            <p className="text-xs text-workbench-muted leading-relaxed max-w-sm font-sans">
              AI-powered Database Schema and Interactive ER Diagram Studio. Convert natural language software specifications into validated 3NF relational schemas, interactive ER diagrams, and deterministic PostgreSQL DDL scripts.
            </p>

            {/* Operational Status */}
            <div className="flex items-center gap-2 text-xs font-mono text-workbench-muted pt-1">
              <span className="w-2 h-2 rounded-full bg-workbench-emerald animate-pulse" />
              <span>Engine Status: Active & Operational</span>
            </div>

            {/* Dialects */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-workbench-bg border border-workbench-border text-workbench-cyan">
                PostgreSQL 16
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-workbench-bg border border-workbench-border text-workbench-muted">
                MySQL (Beta)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-workbench-bg border border-workbench-border text-workbench-muted">
                SQLite (Beta)
              </span>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-workbench-heading font-semibold">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-workbench-muted font-sans">
              <li>
                <Link to="/product" className="hover:text-workbench-cyan transition-colors">
                  Product Overview
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-workbench-cyan transition-colors">
                  All Features
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-workbench-cyan transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/use-cases" className="hover:text-workbench-cyan transition-colors">
                  Domain Use Cases
                </Link>
              </li>
              <li>
                <Link to="/studio" className="hover:text-workbench-cyan transition-colors flex items-center gap-1 text-workbench-cyan">
                  <span>Interactive Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Workspace & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-workbench-heading font-semibold">
              Workbench
            </h4>
            <ul className="space-y-2 text-xs text-workbench-muted font-sans">
              <li>
                <Link to="/workspace" className="hover:text-workbench-cyan transition-colors">
                  Requirement Workspace
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-workbench-cyan transition-colors">
                  Projects Dashboard
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-workbench-cyan transition-colors">
                  Explore Architectures
                </Link>
              </li>
              <li>
                <Link to="/collaboration" className="hover:text-workbench-cyan transition-colors">
                  Teams & Collaboration
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-workbench-cyan transition-colors">
                  Technical FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-workbench-cyan transition-colors">
                  Contact & Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-workbench-heading font-semibold">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-xs text-workbench-muted font-sans">
              <li>
                <Link to="/about" className="hover:text-workbench-cyan transition-colors">
                  About & Philosophy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-workbench-cyan transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-workbench-cyan transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-workbench-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-workbench-muted">
          <div>
            © {new Date().getFullYear()} Schema Studio AI. Professional Database Engineering Workbench.
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Deterministic PostgreSQL Generator</span>
            <span>•</span>
            <span>Powered by Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
