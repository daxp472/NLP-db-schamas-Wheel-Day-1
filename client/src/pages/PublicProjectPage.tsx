import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Database,
  GitFork,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  User,
  Table,
  Key,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import {
  CanonicalSchema,
  PublicProjectSummary,
  generatePostgresDDL
} from '@schema-studio/shared';
import { ERCanvas } from '../components/canvas/ERCanvas';
import { useAuth } from '../context/AuthContext';

export const PublicProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [project, setProject] = useState<PublicProjectSummary | null>(null);
  const [schema, setSchema] = useState<CanonicalSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector and selection state
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'sql' | 'entities'>('canvas');

  // Clone & link copy state
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchPublicProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/public/${projectId}`);
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          setProject(json.data);
          if (json.data.schema) {
            setSchema(json.data.schema);
            if (json.data.schema.entities && json.data.schema.entities.length > 0) {
              setSelectedEntityId(json.data.schema.entities[0].id);
            }
          }
        } else {
          setError(
            json.error?.message ||
              'This architecture is either private, unpublished, or does not exist.'
          );
        }
      } catch {
        setError('Failed to connect to Schema Studio server.');
      } finally {
        setLoading(false);
      }
    };

    void fetchPublicProject();
  }, [projectId]);

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleClone = async () => {
    if (!project) return;

    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/p/${project.id}`)}`);
      return;
    }

    setCloning(true);
    setCloneError(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Fetch new project to set active and redirect to studio
        const pRes = await fetch(`/api/projects/${json.data.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pJson = await pRes.json();
        if (pRes.ok && pJson.data) {
          localStorage.setItem(
            'schema_studio_active_project',
            JSON.stringify({
              id: pJson.data.id,
              name: pJson.data.name,
              targetDialect: pJson.data.targetDialect,
              schema: pJson.data.schema,
              updatedAt: pJson.data.updatedAt,
            })
          );
        }
        navigate('/studio');
      } else {
        setCloneError(json.error?.message || 'Failed to clone this project.');
      }
    } catch {
      setCloneError('Network error while cloning project.');
    } finally {
      setCloning(false);
    }
  };

  const selectedEntity = useMemo(() => {
    if (!schema || !selectedEntityId) return null;
    return schema.entities.find((e) => e.id === selectedEntityId) || null;
  }, [schema, selectedEntityId]);

  const generatedSQL = useMemo(() => {
    if (!schema) return '';
    try {
      return generatePostgresDDL(schema);
    } catch {
      return '-- DDL generation unavailable for this schema definition.';
    }
  }, [schema]);

  if (loading) {
    return (
      <div className="min-h-screen bg-workbench-bg flex flex-col items-center justify-center p-6 text-workbench-text">
        <Loader2 className="w-10 h-10 text-workbench-cyan animate-spin mb-4" />
        <p className="text-sm font-mono text-workbench-muted">Loading public architecture...</p>
      </div>
    );
  }

  if (error || !project || !schema) {
    return (
      <div className="min-h-screen bg-workbench-bg flex flex-col items-center justify-center p-6 text-workbench-text">
        <div className="max-w-md w-full p-8 rounded-xl bg-workbench-surface border border-workbench-border text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-workbench-heading mb-2">Architecture Unavailable</h2>
          <p className="text-sm text-workbench-muted mb-6 leading-relaxed">
            {error || 'This project is private, has been unpublished, or is no longer accessible.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/explore"
              className="px-4 py-2 rounded-lg bg-workbench-overlay hover:bg-workbench-elevated border border-workbench-border text-xs font-medium text-workbench-text flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Explore Public Schemas</span>
            </Link>
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-workbench-cyan text-black hover:bg-cyan-300 text-xs font-semibold flex items-center justify-center transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text flex flex-col font-sans select-none">
      {/* Top Bar / Navigation Header */}
      <header className="h-14 border-b border-workbench-border bg-workbench-surface px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/explore"
            className="flex items-center gap-1.5 text-xs font-mono text-workbench-muted hover:text-workbench-cyan transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Explore</span>
          </Link>
          <span className="text-workbench-border text-sm">/</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-workbench-cyan/10 border border-workbench-cyan/30 flex items-center justify-center text-workbench-cyan">
              <Database className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-sm font-semibold text-workbench-heading max-w-[200px] sm:max-w-xs truncate">
              {project.name}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Public Read-Only
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-workbench-bg hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-text flex items-center gap-1.5 transition-all"
            title="Copy Public Project URL"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-workbench-muted" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          <button
            onClick={handleClone}
            disabled={cloning}
            className="px-3.5 py-1.5 rounded-lg bg-workbench-cyan hover:bg-cyan-300 text-black text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-60"
          >
            {cloning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cloning...</span>
              </>
            ) : (
              <>
                <GitFork className="w-3.5 h-3.5" />
                <span>Clone Schema</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Project Meta Banner */}
      <section className="bg-workbench-surface/60 border-b border-workbench-border px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-workbench-muted">
            <span className="flex items-center gap-1.5 text-workbench-text font-medium">
              <User className="w-3.5 h-3.5 text-workbench-cyan" />
              <span>{project.authorName}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5" />
              <span>{project.cloneCount || 0} clones</span>
            </span>
            <span className="font-mono uppercase px-2 py-0.5 rounded bg-workbench-overlay text-[11px] border border-workbench-border">
              {project.targetDialect}
            </span>

            {/* Attribution Banner if this was cloned */}
            {project.clonedFrom && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Info className="w-3 h-3" />
                <span>Cloned from original architecture</span>
              </span>
            )}
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="flex items-center gap-1 bg-workbench-bg p-0.5 rounded-lg border border-workbench-border self-start md:self-auto">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'canvas'
                  ? 'bg-workbench-elevated text-workbench-cyan shadow-sm border border-workbench-border-active'
                  : 'text-workbench-muted hover:text-workbench-text'
              }`}
            >
              Interactive ER Diagram
            </button>
            <button
              onClick={() => setActiveTab('entities')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'entities'
                  ? 'bg-workbench-elevated text-workbench-cyan shadow-sm border border-workbench-border-active'
                  : 'text-workbench-muted hover:text-workbench-text'
              }`}
            >
              Tables ({schema.entities.length})
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'sql'
                  ? 'bg-workbench-elevated text-workbench-cyan shadow-sm border border-workbench-border-active'
                  : 'text-workbench-muted hover:text-workbench-text'
              }`}
            >
              SQL DDL
            </button>
          </div>
        </div>

        {project.description && (
          <div className="max-w-7xl mx-auto mt-2 text-xs text-workbench-muted line-clamp-2">
            {project.description}
          </div>
        )}

        {cloneError && (
          <div className="max-w-7xl mx-auto mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{cloneError}</span>
          </div>
        )}
      </section>

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'canvas' && (
          <div className="flex-1 flex w-full h-[calc(100vh-8.5rem)]">
            {/* Interactive Canvas */}
            <div className="flex-1 h-full relative">
              <ERCanvas
                schema={schema}
                selectedEntityId={selectedEntityId}
                selectedFieldId={selectedFieldId}
                onSelectEntity={(id) => {
                  setSelectedEntityId(id);
                  setSelectedFieldId(null);
                }}
                onSelectField={(eId, fId) => {
                  setSelectedEntityId(eId);
                  setSelectedFieldId(fId);
                }}
                onUpdatePositions={() => {
                  // Read-only canvas; positions don't mutate server state
                }}
              />

              {/* Read-Only Notice Badge */}
              <div className="absolute bottom-4 left-4 bg-workbench-surface/90 backdrop-blur border border-workbench-border px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-xs text-workbench-muted pointer-events-none z-10">
                <ShieldCheck className="w-4 h-4 text-workbench-cyan" />
                <span>
                  Read-only view • Zoom, pan, or click nodes to inspect details
                </span>
              </div>
            </div>

            {/* Right Side Entity Inspector Panel */}
            <aside className="w-80 border-l border-workbench-border bg-workbench-surface flex flex-col h-full overflow-hidden">
              <div className="p-3 border-b border-workbench-border flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-workbench-heading flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-workbench-cyan" />
                  <span>Entity Inspector</span>
                </span>
                <span className="text-[11px] font-mono text-workbench-muted">
                  {schema.entities.length} tables
                </span>
              </div>

              {selectedEntity ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-workbench-heading flex items-center gap-2">
                      <span>{selectedEntity.name}</span>
                    </h3>
                    {selectedEntity.description && (
                      <p className="text-xs text-workbench-muted mt-1 leading-relaxed">
                        {selectedEntity.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-workbench-muted font-bold tracking-wider mb-2">
                      Fields ({selectedEntity.fields.length})
                    </h4>
                    <div className="space-y-1.5">
                      {selectedEntity.fields.map((field) => (
                        <div
                          key={field.id}
                          className={`p-2 rounded border text-xs font-mono transition-colors ${
                            selectedFieldId === field.id
                              ? 'bg-workbench-elevated border-workbench-cyan text-workbench-cyan'
                              : 'bg-workbench-bg border-workbench-border text-workbench-text'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1">
                              {field.isPrimaryKey && (
                                <span title="Primary Key">
                                  <Key className="w-3 h-3 text-amber-400" />
                                </span>
                              )}
                              {field.name}
                            </span>
                            <span className="text-[11px] text-workbench-muted">
                              {field.dataType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-workbench-muted">
                            {field.isPrimaryKey && (
                              <span className="text-amber-400">PK</span>
                            )}
                            {field.isForeignKey && (
                              <span className="text-cyan-400">FK</span>
                            )}
                            {!field.isNullable && (
                              <span>NOT NULL</span>
                            )}
                            {field.isUnique && (
                              <span>UNIQUE</span>
                            )}
                            {field.defaultValue && (
                              <span className="truncate max-w-[120px]">
                                DEF: {field.defaultValue}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Incoming / Outgoing relationships for this entity */}
                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-workbench-muted font-bold tracking-wider mb-2">
                      Relationships
                    </h4>
                    {schema.relationships.filter(
                      (r) =>
                        r.sourceEntityId === selectedEntity.id ||
                        r.targetEntityId === selectedEntity.id
                    ).length === 0 ? (
                      <p className="text-xs text-workbench-muted italic">No relationships</p>
                    ) : (
                      <div className="space-y-1.5">
                        {schema.relationships
                          .filter(
                            (r) =>
                              r.sourceEntityId === selectedEntity.id ||
                              r.targetEntityId === selectedEntity.id
                          )
                          .map((rel) => {
                            const isSource = rel.sourceEntityId === selectedEntity.id;
                            const otherEntityId = isSource
                              ? rel.targetEntityId
                              : rel.sourceEntityId;
                            const otherEntity = schema.entities.find(
                              (e) => e.id === otherEntityId
                            );
                            return (
                              <div
                                key={rel.id}
                                className="p-2 rounded bg-workbench-bg border border-workbench-border text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="text-workbench-muted font-mono text-[10px]">
                                    {isSource ? 'points to' : 'referenced by'}
                                  </span>
                                  <p className="font-semibold text-workbench-text">
                                    {otherEntity?.name || otherEntityId}
                                  </p>
                                </div>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-workbench-overlay border border-workbench-border text-workbench-cyan">
                                  {rel.cardinality}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-workbench-muted">
                  <Table className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">Click a table on the canvas to inspect its columns and constraints.</p>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Entities Full Table View */}
        {activeTab === 'entities' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
            <h2 className="text-lg font-bold text-workbench-heading mb-4">Schema Tables & Columns</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schema.entities.map((entity) => (
                <div
                  key={entity.id}
                  className="p-4 rounded-xl bg-workbench-surface border border-workbench-border shadow-sm flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold font-mono text-workbench-heading flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-workbench-cyan" />
                      <span>{entity.name}</span>
                    </h3>
                    <span className="text-[11px] font-mono text-workbench-muted">
                      {entity.fields.length} columns
                    </span>
                  </div>
                  {entity.description && (
                    <p className="text-xs text-workbench-muted mb-3">{entity.description}</p>
                  )}
                  <div className="border border-workbench-border/60 rounded-lg overflow-hidden flex-1">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-workbench-bg text-workbench-muted text-[10px] uppercase border-b border-workbench-border/60">
                        <tr>
                          <th className="py-1.5 px-3">Column</th>
                          <th className="py-1.5 px-3">Type</th>
                          <th className="py-1.5 px-3">Attributes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-workbench-border/30">
                        {entity.fields.map((f) => (
                          <tr key={f.id} className="hover:bg-workbench-elevated/40">
                            <td className="py-1.5 px-3 font-semibold text-workbench-text flex items-center gap-1">
                              {f.isPrimaryKey && (
                                <Key className="w-3 h-3 text-amber-400" />
                              )}
                              <span>{f.name}</span>
                            </td>
                            <td className="py-1.5 px-3 text-workbench-muted">{f.dataType}</td>
                            <td className="py-1.5 px-3 text-[10px] space-x-1">
                              {f.isPrimaryKey && (
                                <span className="text-amber-400">PK</span>
                              )}
                              {f.isForeignKey && (
                                <span className="text-cyan-400">FK</span>
                              )}
                              {!f.isNullable && <span>NOT NULL</span>}
                              {f.isUnique && <span>UNIQUE</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SQL DDL Tab */}
        {activeTab === 'sql' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-workbench-heading">PostgreSQL DDL Export</h2>
                <p className="text-xs text-workbench-muted mt-0.5">
                  Production-grade DDL script generated from this canonical schema definition.
                </p>
              </div>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(generatedSQL);
                  alert('DDL script copied to clipboard.');
                }}
                className="px-3 py-1.5 rounded-lg bg-workbench-surface hover:bg-workbench-elevated border border-workbench-border text-xs text-workbench-text flex items-center gap-1.5 transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-workbench-muted" />
                <span>Copy SQL</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-workbench-surface border border-workbench-border font-mono text-xs text-workbench-text overflow-x-auto leading-relaxed shadow-sm">
              <code>{generatedSQL}</code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};
