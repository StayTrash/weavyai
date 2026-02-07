import type {
    WorkflowNode,
    WorkflowEdge,
    TextNodeData,
    ImageNodeData,
    ImageItem,
} from '@/types/workflow.types';
import type { StateCreator } from './types';
import type { HistorySlice } from './historySlice';
import { getWorkflowById, updateWorkflow, createWorkflow } from '@/lib/actions';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Strip imageBase64 from image nodes before saving to database
 * to reduce storage size. The base64 data is loaded on-demand from URLs.
 */
function stripBase64FromNodes(nodes: WorkflowNode[]): WorkflowNode[] {
    return nodes.map((node) => {
        if (node.type === 'image') {
            const imageData = node.data as ImageNodeData;
            const cleanedImages: ImageItem[] = (imageData.images || []).map((img) => ({
                ...img,
                imageBase64: '', // Strip base64 data
            }));
            return {
                ...node,
                data: {
                    ...imageData,
                    images: cleanedImages,
                },
            } as WorkflowNode;
        }
        return node;
    });
}

// ============================================================================
// Persistence Slice Actions
// ============================================================================

export interface PersistenceSlice {
    // Workflow management
    setWorkflow: (id: string | null, name: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
    setWorkflowName: (name: string) => void;
    clearWorkflow: () => void;
    markClean: () => void;

    // Backend sync
    loadWorkflow: (id: string) => Promise<void>;
    saveWorkflow: () => Promise<boolean>;
    createAndSaveWorkflow: (name: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => Promise<string | null>;

    // Connected inputs helper
    getConnectedInputs: (nodeId: string) => {
        systemPrompt?: string;
        userMessage?: string;
        images: string[];
        imageUrls: string[];
    };

    // Output propagation
    propagateOutput: (sourceNodeId: string, output: string) => void;

    // Import/Export
    exportWorkflow: () => void;
    importWorkflow: (file: File) => Promise<boolean>;
}

export const createPersistenceSlice: StateCreator<PersistenceSlice> = (set, get) => ({
    setWorkflow: (id, name, nodes, edges) => {
        set({
            workflowId: id,
            workflowName: name,
            nodes,
            edges,
            undoStack: [],
            redoStack: [],
            isDirty: false,
        });
    },

    setWorkflowName: (name) => {
        set({ workflowName: name, isDirty: true });
    },

    clearWorkflow: () => {
        set({
            nodes: [],
            edges: [],
            workflowId: null,
            workflowName: 'untitled',
            undoStack: [],
            redoStack: [],
            isDirty: false,
        });
    },

    markClean: () => {
        set({ isDirty: false });
    },

    loadWorkflow: async (id) => {
        set({ isLoading: true });
        try {
            const response = await getWorkflowById({ id });
            if (response.workflow) {
                const { workflow } = response;
                // Cast through unknown for Prisma JSON to typed array conversion
                const nodes = (workflow.nodes as unknown as WorkflowNode[]) || [];
                const edges = (workflow.edges as unknown as WorkflowEdge[]) || [];
                set({
                    workflowId: workflow.id,
                    workflowName: workflow.name,
                    nodes,
                    edges,
                    undoStack: [],
                    redoStack: [],
                    isDirty: false,
                    isLoading: false,
                });
            } else {
                console.error('Failed to load workflow: No workflow data');
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Error loading workflow:', error);
            set({ isLoading: false });
        }
    },

    saveWorkflow: async () => {
        const state = get();
        const { workflowId, workflowName, nodes, edges, isDirty } = state;

        if (!workflowId || !isDirty) {
            return true;
        }

        set({ isSaving: true });
        try {
            // Strip imageBase64 before saving to reduce database storage
            const cleanedNodes = stripBase64FromNodes(nodes);

            await updateWorkflow({
                id: workflowId,
                name: workflowName,
                nodes: cleanedNodes as any,
                edges: edges as any,
            });

            set({ isDirty: false, isSaving: false });
            return true;
        } catch (error) {
            console.error('Error saving workflow:', error);
            set({ isSaving: false });
            return false;
        }
    },

    createAndSaveWorkflow: async (name, nodes, edges) => {
        set({ isSaving: true });
        try {
            const createResponse = await createWorkflow({ name });

            if (!createResponse.workflow) {
                console.error('Failed to create workflow');
                set({ isSaving: false });
                return null;
            }

            const workflowId = createResponse.workflow.id;

            // Strip imageBase64 before saving to reduce database storage
            const cleanedNodes = stripBase64FromNodes(nodes);

            await updateWorkflow({
                id: workflowId,
                nodes: cleanedNodes as any,
                edges: edges as any,
            });

            set({
                workflowId,
                workflowName: name,
                nodes,
                edges,
                undoStack: [],
                redoStack: [],
                isDirty: false,
                isSaving: false,
            });
            return workflowId;
        } catch (error) {
            console.error('Error creating workflow:', error);
            set({ isSaving: false });
            return null;
        }
    },

    getConnectedInputs: (nodeId) => {
        const state = get();
        const result: {
            systemPrompt?: string;
            userMessage?: string;
            images: string[];
            imageUrls: string[];
        } = { images: [], imageUrls: [] };

        const incomingEdges = state.edges.filter((e) => e.target === nodeId);

        for (const edge of incomingEdges) {
            const sourceNode = state.nodes.find((n) => n.id === edge.source);
            if (!sourceNode) continue;

            switch (edge.targetHandle) {
                case 'system_prompt':
                    if (sourceNode.type === 'text') {
                        result.systemPrompt = (sourceNode.data as TextNodeData).text;
                    }
                    break;
                case 'user_message':
                    if (sourceNode.type === 'text') {
                        result.userMessage = (sourceNode.data as TextNodeData).text;
                    }
                    break;
                case 'images':
                    // Handle ImageNode
                    if (sourceNode.type === 'image') {
                        const imageData = sourceNode.data as ImageNodeData;
                        for (const img of imageData.images || []) {
                            // Prefer base64 if available, otherwise use URL
                            if (img.imageBase64) {
                                result.images.push(img.imageBase64);
                            } else if (img.imageUrl) {
                                result.imageUrls.push(img.imageUrl);
                            }
                        }
                    }
                    // Handle CropImageNode
                    if (sourceNode.type === 'cropImage') {
                        const cropData = sourceNode.data as { outputImageUrl?: string };
                        if (cropData.outputImageUrl) {
                            result.imageUrls.push(cropData.outputImageUrl);
                        }
                    }
                    // Handle ExtractFrameNode
                    if (sourceNode.type === 'extractFrame') {
                        const frameData = sourceNode.data as { outputFrameUrl?: string };
                        if (frameData.outputFrameUrl) {
                            result.imageUrls.push(frameData.outputFrameUrl);
                        }
                    }
                    break;
            }
        }

        return result;
    },

    propagateOutput: (sourceNodeId, output) => {
        const state = get();
        const outgoingEdges = state.edges.filter((e) => e.source === sourceNodeId);

        for (const edge of outgoingEdges) {
            const targetNode = state.nodes.find((n) => n.id === edge.target);
            if (!targetNode) continue;

            if (targetNode.type === 'text') {
                set((s) => ({
                    nodes: s.nodes.map((node) =>
                        node.id === edge.target && node.type === 'text'
                            ? { ...node, data: { ...node.data, text: output } }
                            : node
                    ) as WorkflowNode[],
                }));
            }
        }
    },

    exportWorkflow: () => {
        const state = get();
        const workflowData = {
            name: state.workflowName,
            nodes: state.nodes,
            edges: state.edges,
            exportedAt: new Date().toISOString(),
            version: '1.0',
        };

        const jsonString = JSON.stringify(workflowData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${state.workflowName || 'workflow'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    importWorkflow: async (file: File) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.nodes || !Array.isArray(data.nodes)) {
                console.error('Invalid workflow: missing nodes array');
                return false;
            }
            if (!data.edges || !Array.isArray(data.edges)) {
                console.error('Invalid workflow: missing edges array');
                return false;
            }

            const state = get() as ReturnType<typeof get> & HistorySlice;
            state.pushToHistory();

            set({
                workflowName: data.name || 'Imported Workflow',
                nodes: data.nodes as WorkflowNode[],
                edges: data.edges as WorkflowEdge[],
                isDirty: true,
            });

            return true;
        } catch (error) {
            console.error('Error importing workflow:', error);
            return false;
        }
    },
});
