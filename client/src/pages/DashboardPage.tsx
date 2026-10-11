import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Database,
  Layers,
  Trash2,
  Copy,
  Sparkles,
  LayoutGrid,
  Loader2,
  Lock,
  Globe,
  Users,
  GitFork,
  Compass
} from 'lucide-react';
import { CanonicalSchema, DatabaseDialect, SAMPLE_ECOMMERCE_SCHEMA, ProjectVisibility, CollaborationRole } from '@schema-studio/shared';
import { useAuth } from '../context/AuthContext';
import { ProjectVisibilityModal } from '../components/modals/ProjectVisibilityModal';
import { ProjectMembersModal } from '../components/modals/ProjectMembersModal';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  targetDialect: DatabaseDialect;
  schema?: CanonicalSchema;
  entityCount?: number;
  relationshipCount?: number;
  visibility?: ProjectVisibility;
  role?: CollaborationRole;
  version?: number;
  cloneCount?: number;
  clonedFrom?: any;
  updatedAt: string;
  isTemplate?: boolean;
}

const TEMPLATE_PROJECTS: ProjectItem[] = [
  {
    id: 'demo_ecommerce',
    name: 'Modern E-Commerce Engine',
    description: 'Multi-vendor store with order line items, products, inventory, and users.',
    targetDialect: 'postgresql',
    schema: SAMPLE_ECOMMERCE_SCHEMA,
    entityCount: SAMPLE_ECOMMERCE_SCHEMA.entities.length,
    relationshipCount: SAMPLE_ECOMMERCE_SCHEMA.relationships.length,
    updatedAt: new Date().toISOString(),
    isTemplate: true,
  },
  {
    id: 'demo_saas',
    name: 'B2B Multi-Tenant Billing',
    description: 'Organizations, subscriptions, usage records, invoices, and payment events.',
    targetDialect: 'postgresql',
    schema: {
      ...SAMPLE_ECOMMERCE_SCHEMA,
      projectName: 'B2B Multi-Tenant Billing',
      entities: [
        {
          id: 'e_orgs',
          name: 'organizations',
          description: 'Tenant organizations and company accounts',
          fields: [
            { id: 'f_org_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
            { id: 'f_org_name', name: 'name', dataType: 'varchar(100)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
            { id: 'f_org_slug', name: 'slug', dataType: 'varchar(50)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: true },
          ]
        },
        {
          id: 'e_subs',
          name: 'subscriptions',
          description: 'Organization billing plans and renewal status',
          fields: [
            { id: 'f_sub_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
            { id: 'f_sub_org_id', name: 'organization_id', dataType: 'uuid', isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false },
            { id: 'f_sub_plan', name: 'plan_tier', dataType: 'varchar(50)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
            { id: 'f_sub_status', name: 'status', dataType: 'varchar(30)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: "'active'" }
          ]
        }
      ],
      relationships: [
        {
          id: 'rel_subs_orgs',
          sourceEntityId: 'e_subs',
          sourceFieldId: 'f_sub_org_id',
          targetEntityId: 'e_orgs',
          targetFieldId: 'f_org_id',
          cardinality: '1:N',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      ]
    },
    entityCount: 2,
    relationshipCount: 1,
    updatedAt: new Date().toISOString(),
    isTemplate: true,
  }
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const [projects, setProjects] = useState<ProjectItem[]>(TEMPLATE_PROJECTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'name'>('updatedAt');

  // Modal states
  const [visibilityModalProject, setVisibilityModalProject] = useState<ProjectItem | null>(null);
  const [membersModalProject, setMembersModalProject] = useState<ProjectItem | null>(null);

  const loadProjects = useCallback(async () => {
    if (!token) {
      setProjects(TEMPLATE_PROJECTS);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const userProjects = json.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          targetDialect: p.targetDialect || 'postgresql',
          entityCount: p.entityCount || 0,
          relationshipCount: p.relationshipCount || 0,
          visibility: p.visibility || 'private',
          role: p.role || 'owner',
          version: p.version || 1,
          cloneCount: p.cloneCount || 0,
          clonedFrom: p.clonedFrom,
          updatedAt: p.updatedAt || new Date().toISOString(),
          isTemplate: false,
        }));
        setProjects([...userProjects, ...TEMPLATE_PROJECTS]);
      }
    } catch {
      setProjects(TEMPLATE_PROJECTS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (id: string, isTemplate?: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (isTemplate) {
      alert('Default starter templates cannot be deleted.');
      return;
    }

    if (!confirm('Are you sure you want to delete this project?')) return;

    if (token) {
      try {
        await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore
      }
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDuplicateProject = async (proj: ProjectItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (token) {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${proj.name} (Copy)`,
            description: proj.description,
            targetDialect: proj.targetDialect,
          }),
        });
        const json = await res.json();
        if (json.success) {
          void loadProjects();
          return;
        }
      } catch {
        // Fallback to local
      }
    }

    const duplicated: ProjectItem = {
      ...proj,
      id: `proj_${Date.now()}`,
      name: `${proj.name} (Copy)`,
      isTemplate: false,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [duplicated, ...prev]);
  };

  const handleOpenProject = async (proj: ProjectItem) => {
    if (proj.isTemplate) {
      localStorage.setItem('schema_studio_active_project', JSON.stringify(proj));
      navigate('/studio');
      return;
    }

    if (token) {
      try {
        const res = await fetch(`/api/projects/${proj.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const loadedProj = {
            id: json.data.id || json.data._id,
            name: json.data.name,
            description: json.data.description,
            targetDialect: json.data.targetDialect,
            schema: json.data.schema || json.data.currentSchema,
            visibility: json.data.visibility || 'private',
            role: json.data.role || 'owner',
            version: json.data.version || 1,
            cloneCount: json.data.cloneCount || 0,
            clonedFrom: json.data.clonedFrom,
            updatedAt: json.data.updatedAt,
          };
          localStorage.setItem('schema_studio_active_project', JSON.stringify(loadedProj));
          navigate('/studio');
          return;
        }
      } catch {
        // Fallback
      }
    }

    localStorage.setItem('schema_studio_active_project', JSON.stringify(proj));
    navigate('/studio');
  };

  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="min-h-screen bg-workbench-bg text-workbench-text p-6 max-w-7xl mx-auto w-full flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-workbench-border">
        <div>
          <h1 className="text-2xl font-bold text-workbench-heading tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-workbench-cyan" />
            <span>Database Projects</span>
          </h1>
          <p className="text-xs text-workbench-muted mt-1 font-mono">
            {isAuthenticated && user ? (
              <span>Authenticated workspace for <strong className="text-workbench-text">{user.name}</strong> ({user.email})</span>
            ) : (
              <span>Guest sandbox workspace. Sign in to save private database schemas to your account.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/explore"
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-workbench-surface hover:bg-workbench-elevated text-workbench-text border border-workbench-border text-xs font-medium transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-workbench-cyan" />
            <span className="hidden sm:inline">Explore Gallery</span>
          </Link>

          <Link
            to="/collaboration"
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-workbench-surface hover:bg-workbench-elevated text-workbench-text border border-workbench-border text-xs font-medium transition-all"
          >
            <Users className="w-3.5 h-3.5 text-workbench-cyan" />
            <span className="hidden sm:inline">Teams</span>
          </Link>

          {!isAuthenticated && (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-workbench-surface hover:bg-workbench-elevated text-workbench-muted hover:text-workbench-text border border-workbench-border text-xs font-mono transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          <Link
            to="/workspace"
            className="flex items-center gap-2 px-4 py-2 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>New AI Requirement</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="py-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-workbench-muted" />
          <input
            type="text"
            placeholder="Search schemas, modules, or entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-workbench-surface border border-workbench-border rounded-lg pl-9 pr-4 py-2 text-xs text-workbench-text placeholder:text-workbench-muted/60 focus:outline-none focus:border-workbench-cyan"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-workbench-muted font-mono">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-workbench-surface border border-workbench-border text-xs rounded-lg px-2.5 py-1.5 text-workbench-text focus:outline-none focus:border-workbench-cyan"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="name">Project Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-workbench-muted font-mono">
          <Loader2 className="w-6 h-6 animate-spin text-workbench-cyan" />
          <span>Synchronizing projects from database...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border border-dashed border-workbench-border rounded-xl bg-workbench-surface/30">
          <Database className="w-12 h-12 text-workbench-muted mb-3 opacity-40" />
          <h2 className="text-sm font-semibold text-workbench-heading">No matching projects found</h2>
          <p className="text-xs text-workbench-muted mt-1 max-w-sm">
            Try adjusting your search filter or generate a new database schema from software requirements.
          </p>
          <Link
            to="/workspace"
            className="mt-4 px-3 py-1.5 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-all"
          >
            Start New Requirement
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {filteredProjects.map((proj) => {
            const entityCount = proj.entityCount ?? proj.schema?.entities.length ?? 0;
            const relationshipCount = proj.relationshipCount ?? proj.schema?.relationships.length ?? 0;

            return (
              <div
                key={proj.id}
                onClick={() => handleOpenProject(proj)}
                className="group relative bg-workbench-surface border border-workbench-border hover:border-workbench-cyan/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-glow-cyan flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-workbench-elevated border border-workbench-border flex items-center justify-center text-workbench-cyan group-hover:bg-workbench-cyan group-hover:text-black transition-colors">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-sm text-workbench-heading group-hover:text-workbench-cyan transition-colors">
                          {proj.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-workbench-bg text-workbench-muted border border-workbench-border">
                            {proj.targetDialect}
                          </span>

                          {/* Visibility badge */}
                          {!proj.isTemplate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVisibilityModalProject(proj);
                              }}
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border flex items-center gap-1 transition-all ${
                                proj.visibility === 'public'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-workbench-bg text-workbench-muted border-workbench-border hover:text-workbench-text'
                              }`}
                              title="Project Visibility Settings"
                            >
                              {proj.visibility === 'public' ? (
                                <>
                                  <Globe className="w-2.5 h-2.5" />
                                  <span>Public</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Private</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Collaborator Role Badge */}
                          {proj.role && proj.role !== 'owner' && (
                            <span
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                                proj.role === 'editor'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}
                            >
                              {proj.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {proj.isTemplate ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-500/30">
                        Template
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMembersModalProject(proj);
                          }}
                          title="Manage Collaborators"
                          className="p-1 rounded text-workbench-muted hover:text-workbench-cyan hover:bg-workbench-elevated transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicateProject(proj, e)}
                          title="Duplicate Project"
                          className="p-1 rounded text-workbench-muted hover:text-workbench-text hover:bg-workbench-elevated transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProject(proj.id, proj.isTemplate, e)}
                          title="Delete Project"
                          className="p-1 rounded text-workbench-muted hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-workbench-muted line-clamp-2 mt-2 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>

                  {/* Lineage / Attribution note */}
                  {proj.clonedFrom && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-amber-400/90 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      <GitFork className="w-3 h-3 shrink-0" />
                      <span className="truncate">Cloned from {proj.clonedFrom.projectName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-workbench-border/60 flex items-center justify-between text-[11px] font-mono text-workbench-muted">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-workbench-cyan" />
                      <span>{entityCount} tables</span>
                    </span>
                    <span>•</span>
                    <span>{relationshipCount} rels</span>

                    {proj.cloneCount && proj.cloneCount > 0 ? (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-workbench-cyan" title="Total times cloned">
                          <GitFork className="w-3 h-3" />
                          <span>{proj.cloneCount}</span>
                        </span>
                      </>
                    ) : null}
                  </div>
                  <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Visibility Modal */}
      {visibilityModalProject && (
        <ProjectVisibilityModal
          projectId={visibilityModalProject.id}
          projectName={visibilityModalProject.name}
          currentVisibility={visibilityModalProject.visibility || 'private'}
          cloneCount={visibilityModalProject.cloneCount || 0}
          token={token}
          isOpen={true}
          onClose={() => setVisibilityModalProject(null)}
          onVisibilityChanged={(newVis) => {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === visibilityModalProject.id ? { ...p, visibility: newVis } : p
              )
            );
            setVisibilityModalProject(null);
          }}
        />
      )}

      {/* Project Collaborators Modal */}
      {membersModalProject && (
        <ProjectMembersModal
          projectId={membersModalProject.id}
          projectName={membersModalProject.name}
          isOwner={membersModalProject.role === 'owner'}
          token={token}
          isOpen={true}
          onClose={() => setMembersModalProject(null)}
        />
      )}
    </div>
  );
};
