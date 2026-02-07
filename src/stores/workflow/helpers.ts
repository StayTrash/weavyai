import type {
    TextNodeData,
    ImageNodeData,
    LLMNodeData,
    VideoNodeData,
    CropImageNodeData,
    ExtractFrameNodeData,
    GeminiModel,
} from '@/types/workflow.types';

// ============================================================================
// ID Generators
// ============================================================================

let nodeIdCounter = 0;

export const generateNodeId = () => `node_${Date.now()}_${++nodeIdCounter}`;

export const generateEdgeId = (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string
) => `e_${source}_${sourceHandle || 's'}_${target}_${targetHandle || 't'}`;

export const generateTaskId = () => `task_${Date.now()}_${++nodeIdCounter}`;

// ============================================================================
// Node Type Definition
// ============================================================================

export type NodeType = 'text' | 'image' | 'video' | 'cropImage' | 'extractFrame' | 'llm';

// ============================================================================
// Default Node Data
// ============================================================================

export const getDefaultNodeData = (
    type: NodeType
): TextNodeData | ImageNodeData | VideoNodeData | CropImageNodeData | ExtractFrameNodeData | LLMNodeData => {
    switch (type) {
        case 'text':
            return { text: '', label: 'Text' };
        case 'image':
            return { images: [], currentIndex: 0, viewMode: 'single' as const, label: 'File' };
        case 'video':
            return { label: 'File' };
        case 'cropImage':
            return {
                cropX: 0,
                cropY: 0,
                cropWidth: 100,
                cropHeight: 100,
                aspectRatio: 'custom' as const,
                label: 'Crop'
            };
        case 'extractFrame':
            return { timestamp: 0, label: 'Extract Video Frame' };
        case 'llm':
            return { model: 'gemini-2.5-flash' as GeminiModel, label: 'Run Any LLM' };
    }
};

