import type { Node, Edge } from '@xyflow/react';

// ============================================================================
// Node Data Types
// ============================================================================

export interface TextNodeData {
    [key: string]: unknown;
    text: string;
    label?: string;
    isLocked?: boolean;
}

export interface ImageItem {
    imageUrl: string;
    imageBase64: string;
    fileName: string;
    width?: number;
    height?: number;
}

export interface ImageNodeData {
    [key: string]: unknown;
    images: ImageItem[];
    currentIndex: number;
    viewMode: 'single' | 'all';
    label?: string;
    isLocked?: boolean;
}

export interface LLMNodeData {
    [key: string]: unknown;
    model: GeminiModel;
    systemPrompt?: string;
    userMessage?: string;
    images?: string[]; // base64 encoded
    output?: string;
    isLoading?: boolean;
    error?: string;
    label?: string;
    isLocked?: boolean;
}

export interface VideoNodeData {
    [key: string]: unknown;
    videoUrl?: string;
    fileName?: string;
    duration?: number;
    isUploading?: boolean;
    uploadProgress?: number;
    label?: string;
    isLocked?: boolean;
}

export interface CropImageNodeData {
    [key: string]: unknown;
    inputImageUrl?: string;
    outputImageUrl?: string;
    previewDimensions?: { width: number; height: number };
    cropX: number;  // percentage 0-100
    cropY: number;  // percentage 0-100
    cropWidth: number;  // percentage 0-100
    cropHeight: number;  // percentage 0-100
    aspectRatio: 'custom' | '16:9' | '4:3' | '1:1' | '9:16' | '3:4';
    isProcessing?: boolean;
    label?: string;
    isLocked?: boolean;
}

export interface ExtractFrameNodeData {
    [key: string]: unknown;
    inputVideoUrl?: string;
    outputFrameUrl?: string;
    /** Timestamp in seconds (used when timestampPercent is not set or when we have duration) */
    timestamp: number;
    /** Optional: 0–100, extract frame at this percentage of video duration (e.g. 50 for "50%") */
    timestampPercent?: number;
    frameNumber?: number;
    videoDuration?: number;
    isProcessing?: boolean;
    label?: string;
    isLocked?: boolean;
}

// ============================================================================
// Workflow History Types
// ============================================================================

export type RunTaskStatus = 'running' | 'completed' | 'failed';
export type RunScope = 'full' | 'selected' | 'single';
export type RunStatus = 'running' | 'completed' | 'failed' | 'partial';

export interface RunTask {
    id: string;
    nodeId: string;
    nodeName: string;
    status: RunTaskStatus;
    startedAt: Date;
    completedAt?: Date;
    progress?: string; // e.g., "1/1", "2/3"
    error?: string;
}

export interface NodeRun {
    id: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: RunTaskStatus;
    startedAt: Date;
    completedAt?: Date;
    duration?: number; // in milliseconds
    inputData?: Record<string, unknown>;
    outputData?: Record<string, unknown>;
    error?: string;
}

export interface WorkflowRun {
    id: string;
    workflowId: string;
    runScope: RunScope;
    status: RunStatus;
    startedAt: Date;
    completedAt?: Date;
    duration?: number; // in milliseconds
    nodeCount: number;
    nodeRuns: NodeRun[];
}

// ============================================================================
// Gemini Models
// ============================================================================

export type GeminiModel =
    | 'gemini-2.5-flash'
    | 'gemini-1.5-flash'
    | 'gemini-1.5-pro'
    | 'gemini-1.0-pro';

export const GEMINI_MODELS: { value: GeminiModel; label: string }[] = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
];

// ============================================================================
// Node Type Definitions
// ============================================================================

export type TextFlowNode = Node<TextNodeData, 'text'>;
export type ImageFlowNode = Node<ImageNodeData, 'image'>;
export type VideoFlowNode = Node<VideoNodeData, 'video'>;
export type CropImageFlowNode = Node<CropImageNodeData, 'cropImage'>;
export type ExtractFrameFlowNode = Node<ExtractFrameNodeData, 'extractFrame'>;
export type LLMFlowNode = Node<LLMNodeData, 'llm'>;

export type WorkflowNode =
    | TextFlowNode
    | ImageFlowNode
    | VideoFlowNode
    | CropImageFlowNode
    | ExtractFrameFlowNode
    | LLMFlowNode;
export type WorkflowEdge = Edge;

// ============================================================================
// Handle Types
// ============================================================================

export const LLM_HANDLES = {
    SYSTEM_PROMPT: 'system_prompt',
    USER_MESSAGE: 'user_message',
    IMAGES: 'images',
    OUTPUT: 'output',
} as const;

export const TEXT_HANDLES = {
    OUTPUT: 'output',
} as const;

export const IMAGE_HANDLES = {
    OUTPUT: 'output',
} as const;

export const VIDEO_HANDLES = {
    OUTPUT: 'output',
} as const;

export const CROP_IMAGE_HANDLES = {
    IMAGE_INPUT: 'image_input',
    X_PERCENT: 'x_percent',
    Y_PERCENT: 'y_percent',
    WIDTH_PERCENT: 'width_percent',
    HEIGHT_PERCENT: 'height_percent',
    OUTPUT: 'output',
} as const;

export const EXTRACT_FRAME_HANDLES = {
    VIDEO_INPUT: 'video_input',
    OUTPUT: 'output',
} as const;

// ============================================================================
// API Types
// ============================================================================

export interface LLMRunRequest {
    model: GeminiModel;
    systemPrompt?: string;
    userMessage: string;
    images?: string[]; // base64 encoded without data URI prefix
}

// LLMRunResponse is exported from api.types.ts

// ============================================================================
// Workflow Persistence
// ============================================================================

export interface WorkflowData {
    id?: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    viewport?: { x: number; y: number; zoom: number };
}

// ============================================================================
// History for Undo/Redo
// ============================================================================

export interface HistoryState {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}
