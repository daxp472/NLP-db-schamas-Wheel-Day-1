import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CanonicalSchema,
  Entity,
  Relationship,
  SAMPLE_ECOMMERCE_SCHEMA,
  ValidationReport,
  generatePostgresDDL,
  ProjectVisibility,
  CollaborationRole
} from '@schema-studio/shared';
import { Toolbar } from '../components/workbench/Toolbar';
import { SchemaExplorer } from '../components/workbench/SchemaExplorer';
import { EntityInspector } from '../components/workbench/EntityInspector';
import { BottomDrawer, DrawerTab } from '../components/workbench/BottomDrawer';
import { ERCanvas } from '../components/canvas/ERCanvas';
import { calculateAutoLayout } from '../utils/autoLayout';
import { validateCanonicalSchema } from '../store/schemaStore';
import { useAuth } from '../context/AuthContext';
import { ProjectVisibilityModal } from '../components/modals/ProjectVisibilityModal';
import { ProjectMembersModal } from '../components/modals/ProjectMembersModal';
import { SchemaConflictModal } from '../components/modals/SchemaConflictModal';
import { UnresolvedQuestionsModal } from '../components/modals/UnresolvedQuestionsModal';
import { AlertCircle, Sparkles } from 'lucide-react';

export const StudioPage: React.FC = () => {
  const { token } = useAuth();

  // Load active project metadata from localStorage
  const activeProjectMeta = useMemo(() => {
    const savedActive = localStorage.getItem('schema_studio_active_project');
    if (savedActive) {
      try {
        return JSON.parse(savedActive);
      } catch (e) {
        console.error('Error parsing active project meta:', e);
      }
    }
    return null;
  }, []);

  const projectId = activeProjectMeta?.id;
  const projectRole: CollaborationRole = activeProjectMeta?.role || 'owner';
  const cloneCount = activeProjectMeta?.cloneCount || 0;

  const [projectVisibility, setProjectVisibility] = useState<ProjectVisibility>(
    activeProjectMeta?.visibility || 'private'
  );
  const [projectVersion, setProjectVersion] = useState<number>(
    activeProjectMeta?.version || 1
  );

  // Modals state
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [unresolvedModalOpen, setUnresolvedModalOpen] = useState(false);
  const [copilotFeedbackMsg, setCopilotFeedbackMsg] = useState<string | null>(null);
  const [conflictServerVersion, setConflictServerVersion] = useState<number | undefined>(undefined);
  const [conflictServerSchema, setConflictServerSchema] = useState<CanonicalSchema | undefined>(undefined);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Load active project schema from localStorage or fall back to sample ecommerce schema
  const [schema, setSchema] = useState<CanonicalSchema>(() => {
    if (activeProjectMeta?.schema && activeProjectMeta.schema.entities) {
      return activeProjectMeta.schema;
    }
    return SAMPLE_ECOMMERCE_SCHEMA;
  });

  // Undo / Redo history
  const [history, setHistory] = useState<CanonicalSchema[]>([schema]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Selection & UI state
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    schema.entities[0]?.id || null
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>(null);

  // Persistence status
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Deterministic Validation Report computed in real time from canonical schema
  const validationReport = useMemo<ValidationReport>(() => {
    return validateCanonicalSchema(schema);
  }, [schema]);

  // Selected Entity
  const selectedEntity = useMemo(() => {
    return schema.entities.find((e) => e.id === selectedEntityId) || null;
  }, [schema.entities, selectedEntityId]);

  // Push new schema to undo stack
  const commitSchemaUpdate = useCallback((newSchema: CanonicalSchema) => {
    setSchema(newSchema);
    setHasUnsavedChanges(true);

    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newSchema];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Handles AI Copilot or Batch Questions schema mutation
  const handleAIUpdatedSchema = useCallback((newSchema: CanonicalSchema, summary: string) => {
    commitSchemaUpdate(newSchema);
    setCopilotFeedbackMsg(summary);
    setTimeout(() => {
      setCopilotFeedbackMsg(null);
    }, 7000);
  }, [commitSchemaUpdate]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setSchema(history[prevIndex]);
      setHasUnsavedChanges(true);
    }
  }, [historyIndex, history]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setSchema(history[nextIndex]);
      setHasUnsavedChanges(true);
    }
  }, [historyIndex, history]);

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Ensure project exists on backend if authenticated and sync latest metadata
  useEffect(() => {
    if (!token || !projectId) return;

    let isMounted = true;
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            if (json.data.visibility) {
              setProjectVisibility(json.data.visibility);
            }
            if (typeof json.data.version === 'number') {
              setProjectVersion(json.data.version);
            }
          }
        }
      } catch (err) {
        console.warn('Initial project sync check warning:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token, projectId]);

  // Auto layout action
  const handleAutoLayout = useCallback(() => {
    const newPositions = calculateAutoLayout(schema.entities, schema.relationships);
    commitSchemaUpdate({
      ...schema,
      layout: {
        ...schema.layout,
        positions: newPositions,
      },
    });
  }, [schema, commitSchemaUpdate]);

  // Update entity
  const handleUpdateEntity = useCallback((updatedEntity: Entity) => {
    const newEntities = schema.entities.map((e) =>
      e.id === updatedEntity.id ? updatedEntity : e
    );
    commitSchemaUpdate({
      ...schema,
      entities: newEntities,
    });
  }, [schema, commitSchemaUpdate]);

  // Delete entity
  const handleDeleteEntity = useCallback((entityId: string) => {
    const newEntities = schema.entities.filter((e) => e.id !== entityId);
    // Remove cascading relationships pointing to or from deleted entity
    const newRelationships = schema.relationships.filter(
      (r) => r.sourceEntityId !== entityId && r.targetEntityId !== entityId
    );
    commitSchemaUpdate({
      ...schema,
      entities: newEntities,
      relationships: newRelationships,
    });
    if (selectedEntityId === entityId) {
      setSelectedEntityId(newEntities[0]?.id || null);
    }
  }, [schema, selectedEntityId, commitSchemaUpdate]);

  // Add Table
  const handleAddTable = useCallback((tableName: string) => {
    const newId = `e_${tableName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
    const newEntity: Entity = {
      id: newId,
      name: tableName,
      description: `Table for ${tableName}`,
      fields: [
        {
          id: `f_${tableName}_id`,
          name: 'id',
          dataType: 'uuid',
          isPrimaryKey: true,
          isForeignKey: false,
          isNullable: false,
          isUnique: true,
          defaultValue: 'gen_random_uuid()',
        },
        {
          id: `f_${tableName}_created_at`,
          name: 'created_at',
          dataType: 'timestamptz',
          isPrimaryKey: false,
          isForeignKey: false,
          isNullable: false,
          isUnique: false,
          defaultValue: 'CURRENT_TIMESTAMP',
        },
      ],
    };

    const newPositions = {
      ...(schema.layout?.positions || {}),
      [newId]: { x: 100 + (schema.entities.length % 3) * 320, y: 100 + Math.floor(schema.entities.length / 3) * 340 },
    };

    commitSchemaUpdate({
      ...schema,
      entities: [...schema.entities, newEntity],
      layout: {
        ...schema.layout,
        positions: newPositions,
      },
    });
    setSelectedEntityId(newId);
  }, [schema, commitSchemaUpdate]);

  // Update Relationship
  const handleUpdateRelationship = useCallback((updatedRel: Relationship) => {
    const newRelationships = schema.relationships.map((r) =>
      r.id === updatedRel.id ? updatedRel : r
    );
    commitSchemaUpdate({
      ...schema,
      relationships: newRelationships,
    });
  }, [schema, commitSchemaUpdate]);

  // Delete Relationship
  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    const newRelationships = schema.relationships.filter((r) => r.id !== relationshipId);
    commitSchemaUpdate({
      ...schema,
      relationships: newRelationships,
    });
  }, [schema, commitSchemaUpdate]);

  // Update Canvas Positions
  const handleUpdatePositions = useCallback((positions: Record<string, { x: number; y: number }>) => {
    setSchema((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        positions,
      },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (projectRole === 'viewer') {
      alert('You have Viewer access on this project. Viewers cannot modify or save changes to the canonical schema.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      // Save to localStorage active project cache
      const activeObj = {
        id: projectId,
        name: schema.projectName,
        targetDialect: schema.targetDialect,
        schema,
        visibility: projectVisibility,
        role: projectRole,
        version: projectVersion,
        cloneCount,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('schema_studio_active_project', JSON.stringify(activeObj));

      // Update in projects list
      const projectsList = JSON.parse(localStorage.getItem('schema_studio_projects') || '[]');
      const updatedList = projectsList.map((p: any) =>
        p.id === projectId || p.name === schema.projectName
          ? { ...p, schema, updatedAt: new Date().toISOString() }
          : p
      );
      localStorage.setItem('schema_studio_projects', JSON.stringify(updatedList));

      // Attempt to save to backend API with optimistic concurrency control
      if (token && projectId) {
        const res = await fetch(`/api/projects/${projectId}/save-schema`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            schema,
            expectedVersion: projectVersion,
          }),
        });

        const json = await res.json();

        if (res.status === 409) {
          // Simultaneous edit conflict detected
          setConflictServerVersion(json.error?.details?.currentVersion);
          setConflictServerSchema(json.error?.details?.latestSchema);
          setConflictModalOpen(true);
          return;
        }

        if (!res.ok || !json.success) {
          setSaveErrorMessage(json.error?.message || 'Failed to save schema to server.');
          return;
        }

        // Successfully saved on backend! Update revision
        if (json.data && json.data.version) {
          setProjectVersion(json.data.version);
          localStorage.setItem(
            'schema_studio_active_project',
            JSON.stringify({ ...activeObj, version: json.data.version })
          );
        }
      }

      setHasUnsavedChanges(false);
    } catch {
      setSaveErrorMessage('Network error while saving schema.');
    } finally {
      setIsSaving(false);
    }
  }, [schema, projectId, projectVersion, projectVisibility, projectRole, cloneCount, token]);

  // Export handlers
  const handleExportSQL = () => {
    const sql = generatePostgresDDL(schema);
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_schema.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDiagram = () => {
    alert('ER Diagram SVG export initiated.');
  };

  const handleExportDocs = () => {
    setActiveDrawerTab('docs');
  };

  const handleReloadServerSchema = (incomingSchema: CanonicalSchema) => {
    setSchema(incomingSchema);
    if (conflictServerVersion) {
      setProjectVersion(conflictServerVersion);
    }
    setConflictModalOpen(false);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-workbench-bg overflow-hidden select-none">
      {/* Viewer Banner if applicable */}
      {projectRole === 'viewer' && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-1.5 text-xs text-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span>
              <strong>Viewer Mode:</strong> You are viewing this shared architecture with read-only permissions.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase bg-blue-500/20 px-2 py-0.5 rounded">
            Read Only
          </span>
        </div>
      )}

      {/* Save Error notification */}
      {saveErrorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{saveErrorMessage}</span>
          </div>
          <button
            onClick={() => setSaveErrorMessage(null)}
            className="text-xs hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI Copilot Update Feedback Banner */}
      {copilotFeedbackMsg && (
        <div className="bg-workbench-cyan/10 border-b border-workbench-cyan/30 px-4 py-2 text-xs text-workbench-cyan flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-workbench-cyan shrink-0 animate-pulse" />
            <span><strong>AI Schema Copilot:</strong> {copilotFeedbackMsg}</span>
          </div>
          <button onClick={() => setCopilotFeedbackMsg(null)} className="text-xs hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Toolbar */}
      <Toolbar
        projectId={projectId}
        projectName={schema.projectName}
        targetDialect={schema.targetDialect}
        visibility={projectVisibility}
        role={projectRole}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        canUndo={historyIndex > 0 && projectRole !== 'viewer'}
        canRedo={historyIndex < history.length - 1 && projectRole !== 'viewer'}
        validationReport={validationReport}
        activeDrawerTab={activeDrawerTab}
        unresolvedCount={schema.unresolvedQuestions?.length || 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAutoLayout={handleAutoLayout}
        onToggleDrawerTab={(tab) => setActiveDrawerTab(activeDrawerTab === tab ? null : tab)}
        onExportSQL={handleExportSQL}
        onExportDiagram={handleExportDiagram}
        onExportDocs={handleExportDocs}
        onSave={handleSave}
        onOpenVisibility={() => setVisibilityModalOpen(true)}
        onOpenMembers={() => setMembersModalOpen(true)}
        onOpenUnresolvedModal={() => setUnresolvedModalOpen(true)}
      />

      {/* Main Workspace Multi-Panel Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Schema Explorer */}
        <SchemaExplorer
          entities={schema.entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={(id) => {
            setSelectedEntityId(id);
            setSelectedFieldId(null);
          }}
          onAddTable={handleAddTable}
          isCollapsed={isExplorerCollapsed}
          onToggleCollapse={() => setIsExplorerCollapsed(!isExplorerCollapsed)}
        />

        {/* Center: Interactive ER Canvas */}
        <main className="flex-1 h-full relative">
          <ERCanvas
            schema={schema}
            selectedEntityId={selectedEntityId}
            selectedFieldId={selectedFieldId}
            onSelectEntity={(id) => setSelectedEntityId(id || null)}
            onSelectField={(entityId, fieldId) => {
              setSelectedEntityId(entityId);
              setSelectedFieldId(fieldId);
            }}
            onUpdatePositions={handleUpdatePositions}
          />
        </main>

        {/* Right: Entity & Relationship Inspector */}
        <EntityInspector
          entity={selectedEntity}
          allEntities={schema.entities}
          relationships={schema.relationships}
          assumptions={schema.assumptions}
          unresolvedQuestions={schema.unresolvedQuestions}
          onUpdateEntity={handleUpdateEntity}
          onDeleteEntity={handleDeleteEntity}
          onUpdateRelationship={handleUpdateRelationship}
          onDeleteRelationship={handleDeleteRelationship}
          onAddRelationship={() => {}}
          onOpenUnresolvedModal={() => setUnresolvedModalOpen(true)}
        />
      </div>

      {/* Bottom Drawer (AI Copilot Update Chat, Unresolved Questions, SQL Preview, Diagnostics, Docs) */}
      <BottomDrawer
        schema={schema}
        validationReport={validationReport}
        activeTab={activeDrawerTab}
        onSelectTab={setActiveDrawerTab}
        onFocusEntity={(entityId) => setSelectedEntityId(entityId)}
        token={token}
        onSchemaUpdated={handleAIUpdatedSchema}
        onOpenUnresolvedModal={() => setUnresolvedModalOpen(true)}
      />

      {/* Unresolved Questions Batch Resolver Modal */}
      <UnresolvedQuestionsModal
        isOpen={unresolvedModalOpen}
        onClose={() => setUnresolvedModalOpen(false)}
        schema={schema}
        token={token}
        onSchemaUpdated={handleAIUpdatedSchema}
      />

      {/* Project Visibility Modal */}
      {projectId && (
        <ProjectVisibilityModal
          projectId={projectId}
          projectName={schema.projectName}
          currentVisibility={projectVisibility}
          cloneCount={cloneCount}
          token={token}
          isOpen={visibilityModalOpen}
          onClose={() => setVisibilityModalOpen(false)}
          onVisibilityChanged={(newVis) => setProjectVisibility(newVis)}
        />
      )}

      {/* Project Collaborators Modal */}
      {projectId && (
        <ProjectMembersModal
          projectId={projectId}
          projectName={schema.projectName}
          isOwner={projectRole === 'owner'}
          token={token}
          isOpen={membersModalOpen}
          onClose={() => setMembersModalOpen(false)}
        />
      )}

      {/* Simultaneous Edit Conflict Modal */}
      <SchemaConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        serverVersion={conflictServerVersion}
        serverSchema={conflictServerSchema}
        onReloadServerSchema={handleReloadServerSchema}
      />
    </div>
  );
};
