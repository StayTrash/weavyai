'use client';

import * as React from 'react';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '@/stores/workflowStore';
import {  simpleTestWorkflow, marketingKitWorkflow } from '@/components/workflow/data/sampleWorkflows';
// import { simpleTestWorkflow, productListingWorkflow} from '@/components/workflow/data/sampleWorkflows';

import type { WorkflowNode, WorkflowEdge } from '@/types/workflow.types';
import { isValidConnection as checkIsValidConnection } from '@/lib/connectionValidation';

import { workflowNodeTypes } from './nodes';
import { customEdgeTypes } from './custom-edges';
import { CustomConnectionLine, connectionLineStyles } from './custom-connection-line';
import { BottomToolbar, LeftPanel, RightPanel } from './primitives';
import { WorkflowHistoryPanel } from './primitives/WorkflowHistoryPanel';
import { Spinner } from '@/components/ui/spinner';
import { createExecutionPlan, getConnectedNodes } from '@/lib/dagExecution';
import { executeNode, gatherNodeInputs } from '@/lib/nodeExecutor';
import { toast } from 'sonner';

// ============================================================================
// Main Builder Component
// ============================================================================

function BuilderInner() {
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const rf = useReactFlow();

  // Store state and actions
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const deleteSelectedNodes = useWorkflowStore((s) => s.deleteSelectedNodes);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const isSaving = useWorkflowStore((s) => s.isSaving);
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);

  const [leftPanelOpen, setLeftPanelOpen] = React.useState(true);
  const [historyPanelOpen, setHistoryPanelOpen] = React.useState(false);
  const [toolMode, setToolMode] = React.useState<'select' | 'pan'>('select');

  // Check for selected nodes
  const selectedNodes = nodes.filter((n) => n.selected);
  const hasSelectedNodes = selectedNodes.length > 0;

  // History functions
  const workflowId = useWorkflowStore((s) => s.workflowId);
  const startRun = useWorkflowStore((s) => s.startRun);
  const completeRun = useWorkflowStore((s) => s.completeRun);
  const addNodeToRun = useWorkflowStore((s) => s.addNodeToRun);
  const completeNodeRun = useWorkflowStore((s) => s.completeNodeRun);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  // Editable workflow name state
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState(workflowName);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Sync browser tab title with workflow name
  React.useEffect(() => {
    document.title = workflowName || 'untitled';
  }, [workflowName]);

  // Focus input when editing starts
  React.useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    if (editedName.trim()) {
      setWorkflowName(editedName.trim());
    } else {
      setEditedName(workflowName);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditedName(workflowName);
      setIsEditingName(false);
    }
  };

  // Add node at center of viewport
  const handleAddNode = React.useCallback(
    (type: 'text' | 'image' | 'video' | 'cropImage' | 'extractFrame' | 'llm') => {
      const viewport = rf.getViewport();
      const centerX = (-viewport.x + 400) / viewport.zoom;
      const centerY = (-viewport.y + 300) / viewport.zoom;
      addNode(type, { x: centerX, y: centerY });
    },
    [rf, addNode]
  );

  // Drag and drop handler
  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as
        | 'text'
        | 'image'
        | 'video'
        | 'cropImage'
        | 'extractFrame'
        | 'llm';
      if (!type) return;

      const position = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [rf, addNode]
  );

  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Load sample workflow
  const createAndSaveWorkflow = useWorkflowStore((s) => s.createAndSaveWorkflow);
  const handleLoadSample = React.useCallback(
    async (sample: 'simple' | 'product' | 'marketing') => {
      let workflow;
      if (sample === 'simple') {
        workflow = simpleTestWorkflow;
      } 
      // else if (sample === 'product') {
      //   workflow = productListingWorkflow;
      // } 
      else {
        workflow = marketingKitWorkflow;
      }

      const newId = await createAndSaveWorkflow(
        workflow.name,
        workflow.nodes as WorkflowNode[],
        workflow.edges as WorkflowEdge[]
      );

      if (newId) {
        window.history.replaceState(null, '', `/dashboard/workflow/${newId}`);
      }

      setTimeout(() => {
        rf.fitView({ padding: 0.2, duration: 300 });
      }, 100);
    },
    [rf, createAndSaveWorkflow]
  );

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace to delete selected nodes and edges
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        deleteSelectedNodes();
        useWorkflowStore.getState().deleteSelectedEdges();
      }

      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useWorkflowStore.getState().undo();
      }

      // Ctrl+Shift+Z or Ctrl+Y for redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        useWorkflowStore.getState().redo();
      }

      // Ctrl+S for instant save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useWorkflowStore.getState().saveWorkflow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedNodes]);

  // Run all nodes in the workflow
  const handleRunAll = React.useCallback(async () => {
    if (!workflowId || nodes.length === 0) return;

    // Filter to only connected nodes
    const connectedNodes = getConnectedNodes(nodes, edges);

    if (connectedNodes.length === 0) {
      toast.error('No connected nodes to run');
      return;
    }

    // Create execution plan with DAG validation
    const plan = createExecutionPlan(connectedNodes, edges);

    if (!plan.isValidDAG) {
      toast.error(`Invalid workflow: ${plan.error}`);
      return;
    }

    const nodeIds = connectedNodes.map((n) => n.id);
    const runId = await startRun(workflowId, 'full', nodeIds);

    if (!runId) return;

    const completedNodes = new Set<string>();
    let hasFailures = false;

    // Execute batches in parallel
    for (const batch of plan.batches) {
      const batchPromises = batch.nodeIds.map(async (nodeId) => {
        const node = connectedNodes.find(n => n.id === nodeId);
        if (!node) return;

        // Gather inputs for history
        const inputData = gatherNodeInputs(nodeId, connectedNodes, edges);

        const nodeRunId = await addNodeToRun(
          runId,
          nodeId,
          node.data.label || node.type || 'Node',
          node.type || 'unknown',
          inputData
        );

        if (nodeRunId) {
          try {
            // Set visual running state BEFORE execution
            updateNodeData(nodeId, { isProcessing: true, isLoading: true });

            // Execute the actual node via Trigger.dev
            const result = await executeNode(node, connectedNodes, edges, updateNodeData);

            // Clear running state
            updateNodeData(nodeId, { isProcessing: false, isLoading: false });

            if (result.success) {
              await completeNodeRun(nodeRunId, 'completed', result.output);
              completedNodes.add(nodeId);
            } else {
              await completeNodeRun(nodeRunId, 'failed', undefined, result.error);
              hasFailures = true;
            }
          } catch (error) {
            // Clear running state on error
            updateNodeData(nodeId, { isProcessing: false, isLoading: false });
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await completeNodeRun(nodeRunId, 'failed', undefined, errorMsg);
            hasFailures = true;
          }
        }
      });

      // Wait for all nodes in this batch to complete before moving to next
      await Promise.all(batchPromises);
    }

    // Complete the run
    const finalStatus = hasFailures
      ? (completedNodes.size === 0 ? 'failed' : 'partial')
      : 'completed';
    await completeRun(runId, finalStatus);

    toast.success(`Workflow run ${finalStatus}`);
  }, [workflowId, nodes, edges, startRun, addNodeToRun, completeNodeRun, completeRun, updateNodeData]);

  // Run selected nodes
  const handleRunSelected = React.useCallback(async () => {
    if (!workflowId || selectedNodes.length === 0) return;

    // Create execution plan with DAG validation for selected nodes
    const selectedNodeIds = selectedNodes.map(n => n.id);
    const plan = createExecutionPlan(nodes, edges, selectedNodeIds);

    if (!plan.isValidDAG) {
      toast.error(`Invalid selection: ${plan.error}`);
      return;
    }

    const scope = selectedNodes.length === 1 ? 'single' : 'selected';
    const runId = await startRun(workflowId, scope, selectedNodeIds);

    if (!runId) return;

    const completedNodes = new Set<string>();
    let hasFailures = false;

    // Execute batches in parallel
    for (const batch of plan.batches) {
      const batchPromises = batch.nodeIds.map(async (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Gather inputs for history
        const inputData = gatherNodeInputs(nodeId, nodes, edges);

        const nodeRunId = await addNodeToRun(
          runId,
          nodeId,
          node.data.label || node.type || 'Node',
          node.type || 'unknown',
          inputData
        );

        if (nodeRunId) {
          try {
            // Set visual running state BEFORE execution
            updateNodeData(nodeId, { isProcessing: true, isLoading: true });

            // Execute the actual node via Trigger.dev
            const result = await executeNode(node, nodes, edges, updateNodeData);

            // Clear running state
            updateNodeData(nodeId, { isProcessing: false, isLoading: false });

            if (result.success) {
              await completeNodeRun(nodeRunId, 'completed', result.output);
              completedNodes.add(nodeId);
            } else {
              await completeNodeRun(nodeRunId, 'failed', undefined, result.error);
              hasFailures = true;
            }
          } catch (error) {
            // Clear running state on error
            updateNodeData(nodeId, { isProcessing: false, isLoading: false });
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await completeNodeRun(nodeRunId, 'failed', undefined, errorMsg);
            hasFailures = true;
          }
        }
      });

      await Promise.all(batchPromises);
    }

    const finalStatus = hasFailures
      ? (completedNodes.size === 0 ? 'failed' : 'partial')
      : 'completed';
    await completeRun(runId, finalStatus);

    toast.success(`${scope === 'single' ? 'Node' : 'Selected nodes'} run ${finalStatus}`);
  }, [workflowId, nodes, edges, selectedNodes, startRun, addNodeToRun, completeNodeRun, completeRun, updateNodeData]);



  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-background">
      {/* Animation styles for connection line */}
      <style dangerouslySetInnerHTML={{ __html: connectionLineStyles }} />

      {/* Canvas */}
      <div ref={reactFlowWrapper} className="absolute inset-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={workflowNodeTypes as NodeTypes}
          isValidConnection={React.useCallback(
            (connection) => checkIsValidConnection(connection, nodes, edges),
            [nodes, edges]
          )}
          connectionLineComponent={CustomConnectionLine}
          fitView={false}
          panOnScroll
          zoomOnScroll
          zoomOnDoubleClick={false}
          panOnDrag={toolMode === 'pan'}
          nodesDraggable={toolMode === 'select'}
          nodesConnectable={toolMode === 'select'}
          elementsSelectable={toolMode === 'select'}
          selectionOnDrag={toolMode === 'select'}
          proOptions={{ hideAttribution: true }}
          edgeTypes={customEdgeTypes as EdgeTypes}
          defaultEdgeOptions={{
            type: 'custom',
            style: { stroke: '#D946EF', strokeWidth: 2 },
          }}
        >
          {/* Right Panel (Credits, Save, Run, History) */}
          <RightPanel
            isSaving={isSaving}
            isDirty={isDirty}
            onSave={saveWorkflow}
            onRunAll={handleRunAll}
            onRunSelected={handleRunSelected}
            hasSelectedNodes={hasSelectedNodes}
            isHistoryOpen={historyPanelOpen}
            onToggleHistory={() => setHistoryPanelOpen((v) => !v)}
          />

          {/* Left Panel (Toolbar + Slide-out) */}
          <LeftPanel
            isOpen={leftPanelOpen}
            onToggle={() => setLeftPanelOpen((v) => !v)}
            workflowName={workflowName}
            isEditingName={isEditingName}
            editedName={editedName}
            onEditedNameChange={setEditedName}
            onNameSubmit={handleNameSubmit}
            onNameKeyDown={handleNameKeyDown}
            onStartEditing={() => {
              setEditedName(workflowName);
              setIsEditingName(true);
            }}
            nameInputRef={nameInputRef}
            onAddNode={handleAddNode}
            onLoadSample={handleLoadSample}
          />

          {/* MiniMap */}
          <MiniMap
            position="bottom-right"
            style={{ marginRight: 16, marginBottom: 80 }}
            nodeColor="#8B5CF6"
            maskColor="rgba(0, 0, 0, 0.7)"
            pannable
            zoomable
          />

          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="hsl(var(--muted-foreground))"
          />
        </ReactFlow>

        <BottomToolbar
          toolMode={toolMode}
          setToolMode={setToolMode}
        />
      </div>

      {/* History Panel */}
      <WorkflowHistoryPanel
        isOpen={historyPanelOpen}
        onClose={() => setHistoryPanelOpen(false)}
      />
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

interface WorkflowBuilderProps {
  workflowId?: string;
}

export function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
  const loadWorkflow = useWorkflowStore((s) => s.loadWorkflow);
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const isLoading = useWorkflowStore((s) => s.isLoading);

  // Load workflow on mount
  React.useEffect(() => {
    if (workflowId && workflowId !== 'new') {
      loadWorkflow(workflowId);
    }
  }, [workflowId, loadWorkflow]);

  // Autosave effect - debounced save when isDirty changes
  React.useEffect(() => {
    if (!isDirty || !workflowId || workflowId === 'new') return;

    const timeoutId = setTimeout(() => {
      saveWorkflow();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isDirty, workflowId, saveWorkflow]);

  if (isLoading) {
    return (
      <div className="dark h-screen w-screen flex flex-col items-center justify-center bg-background gap-3">
        <Spinner className="size-8 text-primary" />
        <div className="text-foreground/60 text-sm">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="dark">
      <ReactFlowProvider>
        <BuilderInner />
      </ReactFlowProvider>
    </div>
  );
}
