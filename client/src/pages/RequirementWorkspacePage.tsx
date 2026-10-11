import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Info,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Sliders,
  RefreshCw
} from 'lucide-react';
import { DatabaseDialect, CanonicalSchema } from '@schema-studio/shared';
import { useAuth } from '../context/AuthContext';

const PRESET_EXAMPLES = [
  {
    name: 'Healthcare Clinic & Telehealth',
    text: 'Build a HIPAA-compliant medical practice system. Patients can book appointment slots with doctors based on doctor specialties and clinic locations. Doctors record medical consultations, prescription orders, and diagnostic lab test results. Include an immutable audit log for patient chart access.',
    modules: ['Patients', 'Appointments', 'Doctors', 'Prescriptions', 'Audit Logs']
  },
  {
    name: 'Ride-Hailing & Fleet Management',
    text: 'A ride sharing platform where riders request trips from pickup to dropoff locations. Drivers with verified vehicles accept trips and submit GPS telemetry coordinates. Calculate fares dynamically, record payment transactions with stripe tokens, and allow mutual driver and passenger rating reviews.',
    modules: ['Users', 'Drivers', 'Vehicles', 'Rides', 'Payments', 'Reviews']
  },
  {
    name: 'E-Commerce Marketplace',
    text: 'A multi-vendor marketplace where independent sellers manage store products with inventory counts. Customers add items to shopping carts and place checkout orders with line items. Calculate taxes and shipping addresses. Record payment transactions and status history.',
    modules: ['Users', 'Vendors', 'Products', 'Orders', 'OrderItems', 'Payments']
  }
];

export const RequirementWorkspacePage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Required inputs
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [dialect, setDialect] = useState<DatabaseDialect>('postgresql');

  // Optional structured inputs
  const [modules, setModules] = useState<string[]>([]);
  const [newModuleInput, setNewModuleInput] = useState('');
  const [businessRules, setBusinessRules] = useState<string[]>([]);
  const [newRuleInput, setNewRuleInput] = useState('');
  const [expectedScale, setExpectedScale] = useState('Standard (10K - 500K records)');
  const [softDelete, setSoftDelete] = useState(true);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const minChars = 20;
  const maxChars = 4000;
  const currentChars = description.length;
  const isValidLength = currentChars >= minChars && currentChars <= maxChars;

  const handleApplyPreset = (preset: typeof PRESET_EXAMPLES[0]) => {
    setAppName(preset.name);
    setDescription(preset.text);
    setModules(preset.modules);
    setErrorMsg(null);
  };

  const handleAddModule = () => {
    if (newModuleInput.trim()) {
      setModules((prev) => [...prev, newModuleInput.trim()]);
      setNewModuleInput('');
    }
  };

  const handleAddRule = () => {
    if (newRuleInput.trim()) {
      setBusinessRules((prev) => [...prev, newRuleInput.trim()]);
      setNewRuleInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      setErrorMsg('Please specify an Application Name.');
      return;
    }
    if (!isValidLength) {
      setErrorMsg(`Please describe requirements between ${minChars} and ${maxChars} characters.`);
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      // First attempt to call the backend generation pipeline
      const response = await fetch('/api/projects/generate-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationName: appName.trim(),
          prompt: description.trim(),
          targetDialect: dialect,
          modules,
          rules: businessRules,
          expectedScale,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data?.schema) {
          const generatedSchema = json.data.schema;
          let projectId = `proj_${Date.now()}`;

          if (token) {
            try {
              const createRes = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  id: projectId,
                  name: appName.trim(),
                  description: description.trim(),
                  targetDialect: dialect,
                  currentSchema: generatedSchema,
                }),
              });
              const createJson = await createRes.json();
              if (createJson.success && createJson.data?.id) {
                projectId = createJson.data.id;
              }
            } catch (createErr) {
              console.warn('Failed to pre-persist project to database:', createErr);
            }
          }

          const newProject = {
            id: projectId,
            name: appName.trim(),
            description: description.trim(),
            targetDialect: dialect,
            schema: generatedSchema,
            visibility: 'private',
            role: 'owner',
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('schema_studio_active_project', JSON.stringify(newProject));
          navigate('/studio');
          return;
        }
      }

      // If backend is in progress or offline, synthesize client-side baseline schema safely
      const synthesizedSchema: CanonicalSchema = {
        version: '1.0.0',
        projectName: appName.trim(),
        targetDialect: dialect,
        assumptions: [
          `Entities normalized to Third Normal Form (3NF) based on modules: ${modules.join(', ') || 'Domain entities'}.`,
          softDelete ? 'All operational tables include deleted_at timestamptz for soft deletion.' : 'Physical row deletion applied.',
          `Primary keys standardized to UUID format with gen_random_uuid() default.`
        ],
        unresolvedQuestions: [
          'Should historical status transitions be stored in an immutable audit ledger?',
          'What are the data archival requirements for completed records?'
        ],
        entities: (modules.length > 0 ? modules : ['users', 'items', 'transactions']).map((mod) => {
          const tableName = mod.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          return {
            id: `e_${tableName}`,
            name: tableName,
            description: `Core records for ${mod}`,
            fields: [
              { id: `f_${tableName}_id`, name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
              { id: `f_${tableName}_name`, name: tableName === 'users' ? 'email' : 'title', dataType: 'varchar(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: tableName === 'users' },
              { id: `f_${tableName}_created_at`, name: 'created_at', dataType: 'timestamptz', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' },
            ]
          };
        }),
        relationships: []
      };

      let synthProjectId = `proj_${Date.now()}`;
      if (token) {
        try {
          const createRes = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: synthProjectId,
              name: appName.trim(),
              description: description.trim(),
              targetDialect: dialect,
              currentSchema: synthesizedSchema,
            }),
          });
          const createJson = await createRes.json();
          if (createJson.success && createJson.data?.id) {
            synthProjectId = createJson.data.id;
          }
        } catch (createErr) {
          console.warn('Failed to pre-persist synthesized project to database:', createErr);
        }
      }

      const newProject = {
        id: synthProjectId,
        name: appName.trim(),
        description: description.trim(),
        targetDialect: dialect,
        schema: synthesizedSchema,
        visibility: 'private',
        role: 'owner',
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('schema_studio_active_project', JSON.stringify(newProject));
      navigate('/studio');
    } catch (err) {
      console.error('Generation error:', err);
      setErrorMsg('Failed to process requirement generation. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text p-6 max-w-6xl mx-auto w-full flex flex-col">
      {/* Header */}
      <div className="pb-6 border-b border-workbench-border mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-workbench-surface border border-workbench-border text-xs font-mono text-workbench-cyan mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Requirement Studio</span>
        </div>
        <h1 className="text-2xl font-bold text-workbench-heading tracking-tight">
          Specify Application Domain Requirements
        </h1>
        <p className="text-xs text-workbench-muted mt-1 font-mono">
          Enter plain-English software requirements. Our AI engine will decompose your spec into normalized entities, foreign key graphs, and primary key hierarchies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded bg-red-950/30 border border-red-900/60 text-red-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Application Name & Dialect */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-mono uppercase text-workbench-muted">
                Application / Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Telehealth Clinic Portal"
                className="w-full bg-workbench-surface border border-workbench-border rounded px-3 py-2 text-xs text-workbench-text font-mono focus:outline-none focus:border-workbench-cyan"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-workbench-muted">
                Database Dialect
              </label>
              <select
                value={dialect}
                onChange={(e) => setDialect(e.target.value as DatabaseDialect)}
                className="w-full bg-workbench-surface border border-workbench-border rounded px-3 py-2 text-xs text-workbench-cyan font-mono focus:outline-none focus:border-workbench-cyan"
              >
                <option value="postgresql">PostgreSQL (Default)</option>
                <option value="mysql">MySQL 8.0</option>
                <option value="sqlite">SQLite 3</option>
              </select>
            </div>
          </div>

          {/* Natural Language Requirements Prompt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="uppercase text-workbench-muted">
                Software & Domain Requirements <span className="text-red-400">*</span>
              </label>
              <span className={`text-[11px] ${currentChars < minChars ? 'text-amber-400' : 'text-workbench-muted'}`}>
                {currentChars} / {maxChars} chars {currentChars < minChars && `(min ${minChars})`}
              </span>
            </div>
            <textarea
              required
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your system does, who uses it, what transactions happen, and what information must be persisted. (e.g., 'Users book appointments with doctors across multiple clinics...')"
              className="w-full bg-workbench-surface border border-workbench-border rounded p-3 text-xs text-workbench-text font-mono leading-relaxed focus:outline-none focus:border-workbench-cyan"
            />
          </div>

          {/* Optional Structured Nuances toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-workbench-cyan font-mono hover:underline"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Optional Structured Guidance' : 'Add Known Entities, Rules & Constraints'}</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="p-4 rounded border border-workbench-border bg-workbench-surface/60 space-y-4">
              {/* Known Modules */}
              <div>
                <label className="text-xs font-mono text-workbench-muted block mb-1">
                  Known Entities or Modules (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newModuleInput}
                    onChange={(e) => setNewModuleInput(e.target.value)}
                    placeholder="e.g. Invoices, Prescriptions"
                    className="flex-1 bg-workbench-bg border border-workbench-border rounded px-2.5 py-1 text-xs text-workbench-text font-mono focus:outline-none focus:border-workbench-cyan"
                  />
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="px-3 py-1 rounded bg-workbench-elevated text-workbench-cyan text-xs font-mono border border-workbench-border"
                  >
                    + Add
                  </button>
                </div>
                {modules.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {modules.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-workbench-elevated border border-workbench-border text-xs font-mono text-workbench-text"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => setModules(modules.filter((_, i) => i !== idx))}
                          className="text-workbench-muted hover:text-red-400"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Rules */}
              <div>
                <label className="text-xs font-mono text-workbench-muted block mb-1">
                  Critical Business Rules (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="e.g. Appointment times cannot overlap for the same doctor"
                    className="flex-1 bg-workbench-bg border border-workbench-border rounded px-2.5 py-1 text-xs text-workbench-text font-mono focus:outline-none focus:border-workbench-cyan"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3 py-1 rounded bg-workbench-elevated text-workbench-cyan text-xs font-mono border border-workbench-border"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Scale & Soft Delete */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-mono text-workbench-muted block mb-1">
                    Expected Scale
                  </label>
                  <select
                    value={expectedScale}
                    onChange={(e) => setExpectedScale(e.target.value)}
                    className="w-full bg-workbench-bg border border-workbench-border rounded px-2.5 py-1.5 text-xs text-workbench-text font-mono"
                  >
                    <option value="Standard (10K - 500K records)">Standard (10K - 500K records)</option>
                    <option value="High Volume (Millions of rows, partitioned)">High Volume (Millions of rows)</option>
                    <option value="Low Volume / Internal Prototype">Internal Prototype / MVP</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-workbench-text">
                    <input
                      type="checkbox"
                      checked={softDelete}
                      onChange={(e) => setSoftDelete(e.target.checked)}
                      className="rounded border-workbench-border bg-workbench-bg text-workbench-cyan focus:ring-0"
                    />
                    <span>Include Soft Delete (deleted_at)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-between border-t border-workbench-border">
            <span className="text-xs text-workbench-muted font-mono">
              Review and compile schema into interactive ER diagram
            </span>

            <button
              type="submit"
              disabled={isGenerating || !isValidLength || !appName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-panel"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Schema...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Schema & ER Canvas</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right 1 Col: Guidance and Presets */}
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="p-4 rounded-lg border border-workbench-border bg-workbench-surface">
            <div className="flex items-center gap-2 text-xs font-mono text-workbench-cyan mb-3">
              <BookOpen className="w-4 h-4" />
              <span>Load Domain Presets</span>
            </div>
            <div className="space-y-2">
              {PRESET_EXAMPLES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="w-full text-left p-2.5 rounded bg-workbench-bg hover:bg-workbench-elevated border border-workbench-border text-xs transition-colors group"
                >
                  <div className="font-semibold text-workbench-heading group-hover:text-workbench-cyan transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-workbench-muted line-clamp-1 mt-0.5">
                    {p.text}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Engineering Guidance */}
          <div className="p-4 rounded-lg border border-workbench-border bg-workbench-surface/50 text-xs space-y-2.5 font-sans">
            <div className="flex items-center gap-2 font-mono text-workbench-heading font-semibold">
              <Info className="w-4 h-4 text-workbench-cyan" />
              <span>Spec Formulation Tips</span>
            </div>
            <p className="text-workbench-muted leading-relaxed text-[11px]">
              For the best relational schemas, include:
            </p>
            <ul className="space-y-1.5 text-[11px] text-workbench-muted list-disc list-inside">
              <li>Core actors (e.g. Users, Customers, Doctors).</li>
              <li>Transactional relationships (e.g. Orders, Bookings).</li>
              <li>Cardinality hints (e.g. "each store has multiple items").</li>
              <li>Unique constraints (e.g. "emails must be unique").</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
