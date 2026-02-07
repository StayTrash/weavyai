/**
 * Run History Slice
 * 
 * Manages workflow run history state including:
 * - Current active run tracking
 * - Historical runs list
 * - Node-level execution details
 */

import type { WorkflowRun, NodeRun, RunScope, RunStatus, RunTaskStatus } from '@/types/workflow.types';
import type { StateCreator } from './types';
import {
    getRunsByWorkflow,
    createRun,
    updateRun,
    addNodeRun,
    updateNodeRun,
    clearWorkflowHistory,
} from '@/lib/actions';

// ============================================================================
// Run History Slice
// ============================================================================

export interface RunHistorySlice {
    // State
    workflowRuns: WorkflowRun[];
    currentRun: WorkflowRun | null;
    isLoadingHistory: boolean;

    // Actions
    loadWorkflowHistory: (workflowId: string) => Promise<void>;
    startRun: (workflowId: string, scope: RunScope, nodeIds: string[]) => Promise<string | null>;
    completeRun: (runId: string, status: RunStatus) => Promise<void>;
    addNodeToRun: (runId: string, nodeId: string, nodeName: string, nodeType: string, inputData?: Record<string, unknown>) => Promise<string | null>;
    completeNodeRun: (nodeRunId: string, status: RunTaskStatus, outputData?: Record<string, unknown>, error?: string) => Promise<void>;
    clearHistory: (workflowId: string) => Promise<void>;
}

// Helper to generate a temporary ID for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createRunHistorySlice: StateCreator<RunHistorySlice> = (set, get) => ({
    workflowRuns: [],
    currentRun: null,
    isLoadingHistory: false,

    loadWorkflowHistory: async (workflowId) => {
        set({ isLoadingHistory: true });
        try {
            const result = await getRunsByWorkflow({
                workflowId,
                limit: 50,
            });

            const runs: WorkflowRun[] = result.runs.map((run) => ({
                id: run.id,
                workflowId: run.workflowId,
                runScope: run.runScope as RunScope,
                status: run.status as RunStatus,
                startedAt: new Date(run.startedAt),
                completedAt: run.completedAt ? new Date(run.completedAt) : undefined,
                duration: run.duration || undefined,
                nodeCount: run.nodeCount,
                nodeRuns: run.nodeRuns.map((nr) => ({
                    id: nr.id,
                    nodeId: nr.nodeId,
                    nodeName: nr.nodeName,
                    nodeType: nr.nodeType,
                    status: nr.status as RunTaskStatus,
                    startedAt: new Date(nr.startedAt),
                    completedAt: nr.completedAt ? new Date(nr.completedAt) : undefined,
                    duration: nr.duration || undefined,
                    inputData: nr.inputData as Record<string, unknown> | undefined,
                    outputData: nr.outputData as Record<string, unknown> | undefined,
                    error: nr.error || undefined,
                })),
            }));

            set({ workflowRuns: runs, isLoadingHistory: false });
        } catch (error) {
            console.error('Failed to load workflow history:', error);
            set({ isLoadingHistory: false });
        }
    },

    startRun: async (workflowId, scope, nodeIds) => {
        const tempId = generateTempId();
        const now = new Date();

        // Optimistic update
        const tempRun: WorkflowRun = {
            id: tempId,
            workflowId,
            runScope: scope,
            status: 'running',
            startedAt: now,
            nodeCount: nodeIds.length,
            nodeRuns: [],
        };

        set((state) => ({
            currentRun: tempRun,
            workflowRuns: [tempRun, ...state.workflowRuns],
        }));

        try {
            const result = await createRun({
                workflowId,
                runScope: scope,
                nodeCount: nodeIds.length,
            });

            // Update with real ID
            const realRun: WorkflowRun = {
                ...tempRun,
                id: result.run.id,
            };

            set((state) => ({
                currentRun: realRun,
                workflowRuns: state.workflowRuns.map((r) =>
                    r.id === tempId ? realRun : r
                ),
            }));

            return result.run.id;
        } catch (error) {
            console.error('Failed to create run:', error);
            // Keep the optimistic update for offline support
            return tempId;
        }
    },

    completeRun: async (runId, status) => {
        const now = new Date();
        const state = get();
        const run = state.workflowRuns.find((r) => r.id === runId);
        const duration = run ? now.getTime() - new Date(run.startedAt).getTime() : 0;

        // Update local state
        set((state) => ({
            currentRun: null,
            workflowRuns: state.workflowRuns.map((r) =>
                r.id === runId
                    ? { ...r, status, completedAt: now, duration }
                    : r
            ),
        }));

        // Sync to database
        if (!runId.startsWith('temp_')) {
            try {
                await updateRun({
                    runId,
                    status,
                    completedAt: now,
                    duration,
                });
            } catch (error) {
                console.error('Failed to update run:', error);
            }
        }
    },

    addNodeToRun: async (runId, nodeId, nodeName, nodeType, inputData) => {
        const tempNodeId = generateTempId();
        const now = new Date();

        // Optimistic update
        const tempNodeRun: NodeRun = {
            id: tempNodeId,
            nodeId,
            nodeName,
            nodeType,
            status: 'running',
            startedAt: now,
            inputData,
        };

        set((state) => ({
            currentRun: state.currentRun
                ? {
                    ...state.currentRun,
                    nodeRuns: [...state.currentRun.nodeRuns, tempNodeRun],
                }
                : null,
            workflowRuns: state.workflowRuns.map((r) =>
                r.id === runId
                    ? { ...r, nodeRuns: [...r.nodeRuns, tempNodeRun] }
                    : r
            ),
        }));

        // Skip DB update for temp runs
        if (runId.startsWith('temp_')) {
            return tempNodeId;
        }

        try {
            const result = await addNodeRun({
                workflowRunId: runId,
                nodeId,
                nodeName,
                nodeType,
                inputData,
            });

            // Update with real ID
            set((state) => ({
                currentRun: state.currentRun
                    ? {
                        ...state.currentRun,
                        nodeRuns: state.currentRun.nodeRuns.map((nr) =>
                            nr.id === tempNodeId ? { ...nr, id: result.nodeRun.id } : nr
                        ),
                    }
                    : null,
                workflowRuns: state.workflowRuns.map((r) =>
                    r.id === runId
                        ? {
                            ...r,
                            nodeRuns: r.nodeRuns.map((nr) =>
                                nr.id === tempNodeId ? { ...nr, id: result.nodeRun.id } : nr
                            ),
                        }
                        : r
                ),
            }));

            return result.nodeRun.id;
        } catch (error) {
            console.error('Failed to add node run:', error);
            return tempNodeId;
        }
    },

    completeNodeRun: async (nodeRunId, status, outputData, error) => {
        const now = new Date();

        // Find the node run to calculate duration
        const state = get();
        let nodeRun: NodeRun | undefined;
        for (const run of state.workflowRuns) {
            nodeRun = run.nodeRuns.find((nr) => nr.id === nodeRunId);
            if (nodeRun) break;
        }
        const duration = nodeRun ? now.getTime() - new Date(nodeRun.startedAt).getTime() : 0;

        // Update local state
        set((state) => ({
            currentRun: state.currentRun
                ? {
                    ...state.currentRun,
                    nodeRuns: state.currentRun.nodeRuns.map((nr) =>
                        nr.id === nodeRunId
                            ? { ...nr, status, completedAt: now, duration, outputData, error }
                            : nr
                    ),
                }
                : null,
            workflowRuns: state.workflowRuns.map((r) => ({
                ...r,
                nodeRuns: r.nodeRuns.map((nr) =>
                    nr.id === nodeRunId
                        ? { ...nr, status, completedAt: now, duration, outputData, error }
                        : nr
                ),
            })),
        }));

        // Sync to database
        if (!nodeRunId.startsWith('temp_')) {
            try {
                await updateNodeRun({
                    nodeRunId,
                    status,
                    completedAt: now,
                    duration,
                    outputData,
                    error,
                });
            } catch (err) {
                console.error('Failed to update node run:', err);
            }
        }
    },

    clearHistory: async (workflowId) => {
        set({ workflowRuns: [], currentRun: null });

        try {
            await clearWorkflowHistory({ workflowId });
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    },
});
