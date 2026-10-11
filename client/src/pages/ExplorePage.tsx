import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Layers,
  GitFork,
  ArrowRight,
  Loader2,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PublicProjectSummary } from '@schema-studio/shared';
import { useAuth } from '../context/AuthContext';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [projects, setProjects] = useState<PublicProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, filter & pagination state
  const [search, setSearch] = useState('');
  const [selectedDialect, setSelectedDialect] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'clones' | 'name'>('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Cloning state
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchPublicProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        sort: sortBy,
      });
      if (search.trim()) params.append('search', search.trim());
      if (selectedDialect !== 'all') params.append('dialect', selectedDialect);

      const res = await fetch(`/api/projects/public?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setProjects(json.data.items || []);
        setTotalPages(json.data.totalPages || 1);
        setTotalCount(json.data.total || 0);
      } else {
        setError(json.error?.message || 'Failed to load public architectures.');
      }
    } catch {
      setError('Network error connecting to public gallery.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDialect, sortBy]);

  useEffect(() => {
    void fetchPublicProjects();
  }, [fetchPublicProjects]);

  const handleClone = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/p/${projectId}`)}`);
      return;
    }

    setCloningId(projectId);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActionNotice(`Successfully cloned "${json.data.name}". Redirecting to Studio...`);
        // Fetch cloned project details to load into studio
        const projectRes = await fetch(`/api/projects/${json.data.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const projectJson = await projectRes.json();
        if (projectJson.success && projectJson.data) {
          localStorage.setItem('schema_studio_active_project', JSON.stringify({
            id: projectJson.data._id || projectJson.data.id,
            name: projectJson.data.name,
            description: projectJson.data.description,
            targetDialect: projectJson.data.targetDialect,
            schema: projectJson.data.currentSchema,
            myRole: 'owner',
            visibility: 'private',
            version: projectJson.data.version || 1,
            updatedAt: projectJson.data.updatedAt,
          }));
        }

        setTimeout(() => {
          navigate('/studio');
        }, 800);
      } else {
        alert(json.error?.message || 'Failed to clone project.');
      }
    } catch {
      alert('Network error attempting to clone project.');
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col">
      {/* Hero / Header */}
      <div className="border-b border-workbench-border pb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-workbench-surface border border-workbench-border text-xs font-mono text-workbench-cyan mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>COMMUNITY ARCHITECTURE HUB</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-workbench-heading">
              Public Database Architectures
            </h1>
            <p className="mt-1.5 text-xs text-workbench-muted max-w-2xl leading-relaxed">
              Explore verified relational schemas built by software engineers. Inspect table structures, keys, and foreign-key topologies, or clone any architecture into your workspace to modify it.
            </p>
          </div>

          <Link
            to="/workspace"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-sm shrink-0"
          >
            <span>Publish Your Own Schema</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Global notification banner */}
        {actionNotice && (
          <div className="mt-4 p-3 rounded-lg bg-workbench-emerald/10 border border-workbench-emerald/30 text-workbench-emerald text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Search, Filter & Sort Controls */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-workbench-muted" />
            <input
              type="text"
              placeholder="Search by architecture name or keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-workbench-surface border border-workbench-border rounded-lg pl-9 pr-4 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/60 focus:outline-none focus:border-workbench-cyan"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dialect Filter */}
            <div className="flex items-center gap-1 bg-workbench-surface p-1 rounded-lg border border-workbench-border text-xs font-mono">
              {(['all', 'postgresql', 'mysql', 'sqlite'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDialect(d);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded transition-colors uppercase text-[11px] ${
                    selectedDialect === d
                      ? 'bg-workbench-elevated text-workbench-cyan font-bold border border-workbench-border-active'
                      : 'text-workbench-muted hover:text-workbench-text'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 text-xs text-workbench-muted font-mono">
              <Filter className="w-3.5 h-3.5 text-workbench-cyan" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-workbench-surface border border-workbench-border rounded-lg px-2.5 py-1.5 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
              >
                <option value="recent">Recently Published</option>
                <option value="clones">Most Cloned</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="py-8 flex-1">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-workbench-muted font-mono">
            <Loader2 className="w-8 h-8 animate-spin text-workbench-cyan" />
            <span>Loading published architectures...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center border border-dashed border-red-500/30 rounded-xl p-8 bg-red-950/10">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <h2 className="text-sm font-semibold text-workbench-heading">{error}</h2>
            <button
              onClick={() => void fetchPublicProjects()}
              className="mt-4 px-3 py-1.5 rounded bg-workbench-elevated text-xs font-mono text-workbench-text hover:bg-workbench-surface border border-workbench-border"
            >
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-workbench-border rounded-xl bg-workbench-surface/30 p-8">
            <Compass className="w-12 h-12 text-workbench-muted mx-auto mb-3 opacity-40" />
            <h2 className="text-sm font-semibold text-workbench-heading">No public architectures found</h2>
            <p className="text-xs text-workbench-muted mt-1 max-w-md mx-auto">
              No published projects match your current filters. Be the first engineer to publish an architecture!
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedDialect('all');
                  setSortBy('recent');
                }}
                className="px-3 py-1.5 rounded bg-workbench-surface border border-workbench-border text-xs text-workbench-text hover:bg-workbench-elevated"
              >
                Reset Filters
              </button>
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300"
              >
                Go to My Projects
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/p/${proj.id}`)}
                className="group bg-workbench-surface border border-workbench-border hover:border-workbench-cyan/50 rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-glow-cyan"
              >
                <div>
                  {/* Top Bar: Dialect + Clone Count */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-workbench-elevated text-workbench-cyan border border-workbench-border font-semibold">
                      {proj.targetDialect}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-workbench-muted bg-workbench-bg px-2 py-0.5 rounded border border-workbench-border">
                      <GitFork className="w-3 h-3 text-workbench-cyan" />
                      <span>{proj.cloneCount} clones</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-base font-bold text-workbench-heading group-hover:text-workbench-cyan transition-colors line-clamp-1">
                    {proj.name}
                  </h2>
                  <p className="text-xs text-workbench-muted mt-2 line-clamp-2 leading-relaxed">
                    {proj.description || 'Public database architecture with validated relational entities and foreign-key constraints.'}
                  </p>

                  {/* Attribution if cloned */}
                  {proj.clonedFrom && (
                    <div className="mt-2 text-[10px] font-mono text-workbench-muted truncate flex items-center gap-1">
                      <GitFork className="w-2.5 h-2.5 text-workbench-cyan" />
                      <span>Fork of {proj.clonedFrom.sourceProjectName}</span>
                    </div>
                  )}
                </div>

                {/* Footer Metadata & CTA */}
                <div className="mt-5 pt-4 border-t border-workbench-border/60">
                  <div className="flex items-center justify-between text-[11px] font-mono text-workbench-muted mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3 h-3 text-workbench-cyan" />
                      <span className="truncate">{proj.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-[11px] font-mono text-workbench-muted">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-workbench-cyan" />
                        <span>{proj.tableCount} tables</span>
                      </span>
                      <span>•</span>
                      <span>{proj.relationshipCount} rels</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleClone(proj.id, e)}
                        disabled={cloningId === proj.id}
                        title="Clone into your account"
                        className="px-2.5 py-1 rounded bg-workbench-elevated hover:bg-workbench-cyan hover:text-black text-workbench-text text-xs font-mono font-medium border border-workbench-border transition-all flex items-center gap-1"
                      >
                        {cloningId === proj.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <GitFork className="w-3 h-3" />
                        )}
                        <span>Clone</span>
                      </button>

                      <Link
                        to={`/p/${proj.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded hover:bg-workbench-elevated text-workbench-cyan transition-colors"
                        title="View Architecture"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-workbench-border pt-4 text-xs font-mono text-workbench-muted">
            <div>
              Showing {projects.length} of {totalCount} published architectures
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded bg-workbench-surface border border-workbench-border disabled:opacity-40 hover:bg-workbench-elevated transition-colors"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded bg-workbench-surface border border-workbench-border disabled:opacity-40 hover:bg-workbench-elevated transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
