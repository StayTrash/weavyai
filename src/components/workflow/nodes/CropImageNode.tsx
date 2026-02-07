'use client';

import * as React from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type WorkflowState } from '@/stores/workflowStore';
import { type CropImageFlowNode, CROP_IMAGE_HANDLES } from '@/types/workflow.types';
import {
    Crop,
    Lock,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import {
    NodeShell,
    HandleWithLabel,
    RenameDialog,
    NodeDropdownMenu,
} from '../primitives';

// Types for Trigger.dev task API
interface TriggerTaskResponse {
    success: boolean;
    runId: string;
    publicAccessToken?: string;
    error?: string;
}

interface TriggerPollResponse {
    runId: string;
    status: string;
    output?: { croppedImageUrl: string };
    error?: string | Record<string, unknown>;
    isCompleted: boolean;
    isFailed: boolean;
}

/** Normalize API error (string or object) to a string for Error(). Never throws. */
function toErrorMessage(err: string | Record<string, unknown> | undefined): string {
    try {
        if (err == null) return '';
        if (typeof err === 'string') return err;
        if (typeof err === 'object') {
            const msg = (err as { message?: unknown }).message;
            if (typeof msg === 'string') return msg;
            return JSON.stringify(err);
        }
        return String(err);
    } catch {
        return 'Task failed';
    }
}

function safeErrorMessage(err: unknown, fallback: string): string {
    const s = toErrorMessage(err as string | Record<string, unknown> | undefined);
    return (typeof s === 'string' && s) ? s : fallback;
}

const ASPECT_RATIOS: { value: CropImageFlowNode['data']['aspectRatio']; label: string }[] = [
    { value: 'custom', label: 'Custom' },
    { value: '16:9', label: '16:9' },
    { value: '4:3', label: '4:3' },
    { value: '1:1', label: '1:1' },
    { value: '9:16', label: '9:16' },
    { value: '3:4', label: '3:4' },
];

/**
 * CropImageNode Component
 * 
 * A node for cropping images via Trigger.dev.
 * Features:
 * - Input handle for image URL
 * - Configurable crop parameters (x%, y%, width%, height%)
 * - Aspect ratio selector
 * - Top: Input image preview with crop overlay
 * - Bottom: Output cropped image preview
 * - Pulsating glow when processing
 */
export function CropImageNode({ id, data, selected }: NodeProps<CropImageFlowNode>) {
    const updateNodeData = useWorkflowStore((s: WorkflowState) => s.updateNodeData);
    const edges = useWorkflowStore((s: WorkflowState) => s.edges);
    const nodes = useWorkflowStore((s: WorkflowState) => s.nodes);
    // Workflow history functions
    const workflowId = useWorkflowStore((s: WorkflowState) => s.workflowId);
    const startRun = useWorkflowStore((s: WorkflowState) => s.startRun);
    const addNodeToRun = useWorkflowStore((s: WorkflowState) => s.addNodeToRun);
    const completeNodeRun = useWorkflowStore((s: WorkflowState) => s.completeNodeRun);
    const completeRun = useWorkflowStore((s: WorkflowState) => s.completeRun);

    const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
    const [newLabel, setNewLabel] = React.useState(data.label || 'Crop');
    const [localDimensions, setLocalDimensions] = React.useState({ width: 0, height: 0 });

    const displayLabel = data.label || 'Crop';
    const isLocked = data.isLocked || false;
    const isProcessing = data.isProcessing || false;
    const inputImageUrl = data.inputImageUrl;
    const outputImageUrl = data.outputImageUrl;

    // Get connected image URL
    const connectedImageUrl = React.useMemo(() => {
        const incomingEdge = edges.find(
            (e) => e.target === id && e.targetHandle === CROP_IMAGE_HANDLES.IMAGE_INPUT
        );
        if (!incomingEdge) return null;

        const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
        if (!sourceNode) return null;

        // Handle different source node types
        if (sourceNode.type === 'image') {
            const imageData = sourceNode.data as { images?: { imageUrl: string }[] };
            return imageData.images?.[0]?.imageUrl || null;
        }
        if (sourceNode.type === 'extractFrame') {
            const frameData = sourceNode.data as { outputFrameUrl?: string };
            return frameData.outputFrameUrl || null;
        }
        if (sourceNode.type === 'cropImage') {
            const cropData = sourceNode.data as { outputImageUrl?: string };
            return cropData.outputImageUrl || null;
        }

        return null;
    }, [edges, nodes, id]);

    // Update inputImageUrl when connection changes
    React.useEffect(() => {
        if (connectedImageUrl && connectedImageUrl !== inputImageUrl) {
            updateNodeData<CropImageFlowNode>(id, {
                inputImageUrl: connectedImageUrl,
                outputImageUrl: undefined, // Reset output when input changes
            });
        }
    }, [connectedImageUrl, inputImageUrl, id, updateNodeData]);

    const handleRename = () => {
        if (newLabel.trim()) {
            updateNodeData<CropImageFlowNode>(id, { label: newLabel.trim() });
        }
        setRenameDialogOpen(false);
    };

    const toggleLock = () => {
        updateNodeData<CropImageFlowNode>(id, { isLocked: !isLocked });
    };

    const handleAspectRatioChange = (value: CropImageFlowNode['data']['aspectRatio']) => {
        updateNodeData<CropImageFlowNode>(id, { aspectRatio: value });

        // Adjust crop dimensions based on aspect ratio
        if (value !== 'custom' && localDimensions.width > 0 && localDimensions.height > 0) {
            const [w, h] = value.split(':').map(Number);
            const targetRatio = w / h;
            const imageRatio = localDimensions.width / localDimensions.height;

            let newWidth = 100;
            let newHeight = 100;

            if (targetRatio > imageRatio) {
                // Image is taller, fit to width
                newWidth = 100;
                newHeight = (100 * imageRatio) / targetRatio;
            } else {
                // Image is wider, fit to height
                newHeight = 100;
                newWidth = (100 * targetRatio) / imageRatio;
            }

            updateNodeData<CropImageFlowNode>(id, {
                cropX: (100 - newWidth) / 2,
                cropY: (100 - newHeight) / 2,
                cropWidth: newWidth,
                cropHeight: newHeight,
            });
        }
    };

    const handleReset = () => {
        updateNodeData<CropImageFlowNode>(id, {
            cropX: 0,
            cropY: 0,
            cropWidth: 100,
            cropHeight: 100,
            aspectRatio: 'custom',
            outputImageUrl: undefined,
        });
    };

    // Poll for task completion
    const pollTaskResult = async (runId: string): Promise<TriggerPollResponse> => {
        const maxAttempts = 180; // 3 minutes max
        const intervalMs = 1000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const response = await fetch(`/api/trigger?runId=${runId}`);
            const result: TriggerPollResponse = await response.json();

            if (result.isCompleted || result.isFailed) {
                return result;
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        throw new Error('Task timed out');
    };

    const handleCrop = async () => {
        if (!inputImageUrl) return;

        updateNodeData<CropImageFlowNode>(id, { isProcessing: true });

        // Start workflow history run for this individual node
        let runId: string | null = null;
        let nodeRunId: string | null = null;

        if (workflowId) {
            runId = await startRun(workflowId, 'single', [id]);
        }

        try {
            // Record node run to history before execution
            const inputData = {
                imageUrl: inputImageUrl,
                cropX: data.cropX,
                cropY: data.cropY,
                cropWidth: data.cropWidth,
                cropHeight: data.cropHeight,
            };

            if (runId) {
                nodeRunId = await addNodeToRun(runId, id, displayLabel, 'cropImage', inputData);
            }

            // Trigger the Trigger.dev task
            const triggerResponse = await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskType: 'crop-image',
                    payload: {
                        imageUrl: inputImageUrl,
                        cropX: data.cropX,
                        cropY: data.cropY,
                        cropWidth: data.cropWidth,
                        cropHeight: data.cropHeight,
                    },
                }),
            });

            const triggerResult: TriggerTaskResponse = await triggerResponse.json();

            if (!triggerResult.success || !triggerResult.runId) {
                throw new Error(safeErrorMessage(triggerResult.error, 'Failed to trigger crop task'));
            }

            // Poll for completion
            const pollResult = await pollTaskResult(triggerResult.runId);

            if (pollResult.isFailed) {
                throw new Error(safeErrorMessage(pollResult.error, 'Crop task failed'));
            }

            const croppedUrl = pollResult.output?.croppedImageUrl;

            if (croppedUrl) {
                updateNodeData<CropImageFlowNode>(id, {
                    outputImageUrl: croppedUrl,
                    isProcessing: false,
                });

                // Complete node run and workflow run in history
                if (nodeRunId) {
                    await completeNodeRun(nodeRunId, 'completed', { croppedImageUrl: croppedUrl });
                }
                if (runId) {
                    await completeRun(runId, 'completed');
                }
            } else {
                updateNodeData<CropImageFlowNode>(id, { isProcessing: false });
                if (nodeRunId) {
                    await completeNodeRun(nodeRunId, 'completed', {});
                }
                if (runId) {
                    await completeRun(runId, 'completed');
                }
            }
        } catch (error) {
            console.error('Crop error:', error);
            updateNodeData<CropImageFlowNode>(id, { isProcessing: false });

            // Record failure in history
            if (nodeRunId) {
                await completeNodeRun(nodeRunId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
            }
            if (runId) {
                await completeRun(runId, 'failed');
            }
        }
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setLocalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        updateNodeData<CropImageFlowNode>(id, {
            previewDimensions: { width: img.naturalWidth, height: img.naturalHeight },
        });
    };

    return (
        <div className={cn("relative group/node", isProcessing && "node-processing-glow rounded-xl")}>
            {/* Input Handle */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2" style={{ transform: 'translate(-6px, -50%)' }}>
                <HandleWithLabel
                    type="target"
                    position={Position.Left}
                    id={CROP_IMAGE_HANDLES.IMAGE_INPUT}
                    nodeId={id}
                    label="File*"
                    color="cyan"
                />
            </div>

            {/* Output Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2" style={{ transform: 'translate(6px, -50%)' }}>
                <HandleWithLabel
                    type="source"
                    position={Position.Right}
                    id={CROP_IMAGE_HANDLES.OUTPUT}
                    nodeId={id}
                    label="File"
                    color="green"
                />
            </div>

            <NodeShell
                title={displayLabel}
                icon={<Crop className="h-4 w-4" />}
                selected={selected}
                className="w-90"
                right={
                    <div className="flex items-center gap-1">
                        {isLocked && <Lock className="h-4 w-4 text-foreground/50" />}
                        <NodeDropdownMenu
                            nodeId={id}
                            label={displayLabel}
                            isLocked={isLocked}
                            onToggleLock={toggleLock}
                            onOpenRename={() => {
                                setNewLabel(displayLabel);
                                setRenameDialogOpen(true);
                            }}
                        />
                    </div>
                }
            >
                {/* TOP: Input Image Preview */}
                <div className="mb-3">
                    <label className="text-xs text-foreground/60 mb-1 block">Input Preview</label>
                    {inputImageUrl ? (
                        <div className="relative rounded-lg overflow-hidden bg-muted/40">
                            <img
                                src={inputImageUrl}
                                alt="Input Preview"
                                className="w-full max-h-37.5 object-contain"
                                onLoad={handleImageLoad}
                            />
                            {!outputImageUrl && data.cropWidth < 100 && (
                                <div
                                    className="absolute border-2 border-purple-500 bg-purple-500/10 pointer-events-none"
                                    style={{
                                        left: `${data.cropX}%`,
                                        top: `${data.cropY}%`,
                                        width: `${data.cropWidth}%`,
                                        height: `${data.cropHeight}%`,
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="rounded-lg bg-muted/20 p-4 text-center text-sm text-foreground/50">
                            Connect an image source
                        </div>
                    )}
                </div>

                {/* Crop Controls */}
                <div className="space-y-4">
                    {/* Aspect Ratio */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-foreground/60 w-20">Aspect ratio</label>
                        <Select
                            value={data.aspectRatio}
                            onValueChange={handleAspectRatioChange}
                        >
                            <SelectTrigger className="nodrag flex-1 bg-muted/40 h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ASPECT_RATIOS.map((ratio) => (
                                    <SelectItem key={ratio.value} value={ratio.value}>
                                        {ratio.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 px-2"
                        >
                            Reset
                        </Button>
                    </div>

                    {/* Dimensions Display */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-foreground/60 w-20">Dimensions</label>
                        <div className="flex items-center gap-2 flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-foreground/50">W</span>
                                <input
                                    type="number"
                                    value={Math.round(localDimensions.width * data.cropWidth / 100) || ''}
                                    readOnly
                                    className="nodrag w-16 bg-muted/40 rounded px-2 py-1 text-xs text-center"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-foreground/50">H</span>
                                <input
                                    type="number"
                                    value={Math.round(localDimensions.height * data.cropHeight / 100) || ''}
                                    readOnly
                                    className="nodrag w-16 bg-muted/40 rounded px-2 py-1 text-xs text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* X and Y Percent */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-foreground/60 w-20">Position</label>
                        <div className="flex items-center gap-2 flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-foreground/50">X%</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={Math.round(data.cropX)}
                                    onChange={(e) => {
                                        const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                        updateNodeData<CropImageFlowNode>(id, {
                                            cropX: value,
                                            outputImageUrl: undefined
                                        });
                                    }}
                                    className="nodrag w-16 bg-muted/40 rounded px-2 py-1 text-xs text-center"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-foreground/50">Y%</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={Math.round(data.cropY)}
                                    onChange={(e) => {
                                        const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                        updateNodeData<CropImageFlowNode>(id, {
                                            cropY: value,
                                            outputImageUrl: undefined
                                        });
                                    }}
                                    className="nodrag w-16 bg-muted/40 rounded px-2 py-1 text-xs text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Width and Height Percent */}
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-foreground/60 w-20">Crop Size</label>
                        <div className="flex items-center gap-2 flex-1">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-foreground/50">W%</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={Math.round(data.cropWidth)}
                                    onChange={(e) => {
                                        const value = Math.max(1, Math.min(100, parseInt(e.target.value) || 100));
                                        updateNodeData<CropImageFlowNode>(id, {
                                            cropWidth: value,
                                            outputImageUrl: undefined
                                        });
                                    }}
                                    className="nodrag w-16 bg-muted/40 rounded px-2 py-1 text-xs text-center"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-foreground/50">H%</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={Math.round(data.cropHeight)}
                                    onChange={(e) => {
                                        const value = Math.max(1, Math.min(100, parseInt(e.target.value) || 100));
                                        updateNodeData<CropImageFlowNode>(id, {
                                            cropHeight: value,
                                            outputImageUrl: undefined
                                        });
                                    }}
                                    className="nodrag w-16 bg-muted/40 rounded px-2 py-1 text-xs text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Apply Crop Button */}
                    {inputImageUrl && !outputImageUrl && (
                        <Button
                            onClick={handleCrop}
                            disabled={isProcessing}
                            className="w-full bg-black hover:bg-black/90 text-white"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Crop className="mr-2 h-4 w-4" />
                                    Apply Crop
                                </>
                            )}
                        </Button>
                    )}

                    {outputImageUrl && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reset & Crop Again
                        </Button>
                    )}
                </div>

                {/* BOTTOM: Output Image Preview */}
                {outputImageUrl && (
                    <div className="mt-4">
                        <label className="text-xs text-foreground/60 mb-1 block">Output Preview</label>
                        <div className="rounded-lg overflow-hidden bg-muted/40">
                            <img
                                src={outputImageUrl}
                                alt="Cropped Output"
                                className="w-full max-h-37.5 object-contain"
                            />
                        </div>
                    </div>
                )}
            </NodeShell>

            <RenameDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
                value={newLabel}
                onChange={setNewLabel}
                onSubmit={handleRename}
            />
        </div>
    );
}
