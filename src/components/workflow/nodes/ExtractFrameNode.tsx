'use client';

import * as React from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type WorkflowState } from '@/stores/workflowStore';
import { type ExtractFrameFlowNode, EXTRACT_FRAME_HANDLES } from '@/types/workflow.types';
import {
    Film,
    Lock,
    Loader2,
    Pause,
    Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    output?: { frameImageUrl: string };
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

/**
 * ExtractFrameNode Component
 * 
 * A node for extracting a single frame from a video via Trigger.dev.
 * Features:
 * - Input handle for video URL
 * - Top: Video preview with seek capability
 * - Bottom: Extracted frame preview
 * - Frame number and timecode display
 * - Pulsating glow when processing
 * - Extract button to capture frame
 * - Output handle for extracted frame image URL
 */
export function ExtractFrameNode({ id, data, selected }: NodeProps<ExtractFrameFlowNode>) {
    const updateNodeData = useWorkflowStore((s: WorkflowState) => s.updateNodeData);
    const edges = useWorkflowStore((s: WorkflowState) => s.edges);
    const nodes = useWorkflowStore((s: WorkflowState) => s.nodes);
    // Workflow history functions
    const workflowId = useWorkflowStore((s: WorkflowState) => s.workflowId);
    const startRun = useWorkflowStore((s: WorkflowState) => s.startRun);
    const addNodeToRun = useWorkflowStore((s: WorkflowState) => s.addNodeToRun);
    const completeNodeRun = useWorkflowStore((s: WorkflowState) => s.completeNodeRun);
    const completeRun = useWorkflowStore((s: WorkflowState) => s.completeRun);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
    const [newLabel, setNewLabel] = React.useState(data.label || 'Extract Video Frame');
    const [currentTime, setCurrentTime] = React.useState(data.timestamp || 0);
    const [duration, setDuration] = React.useState(data.videoDuration || 0);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [timecodeInput, setTimecodeInput] = React.useState('');
    /** User-facing timestamp: seconds (e.g. "30") or percentage (e.g. "50%") */
    const [timestampInput, setTimestampInput] = React.useState(
        data.timestampPercent != null ? `${data.timestampPercent}%` : String(data.timestamp ?? 0)
    );

    const displayLabel = data.label || 'Extract Video Frame';
    const isLocked = data.isLocked || false;
    const isProcessing = data.isProcessing || false;
    const inputVideoUrl = data.inputVideoUrl;
    const outputFrameUrl = data.outputFrameUrl;

    // Get connected video URL
    const connectedVideoUrl = React.useMemo(() => {
        const incomingEdge = edges.find(
            (e) => e.target === id && e.targetHandle === EXTRACT_FRAME_HANDLES.VIDEO_INPUT
        );
        if (!incomingEdge) return null;

        const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
        if (!sourceNode) return null;

        // Handle video source node
        if (sourceNode.type === 'video') {
            const videoData = sourceNode.data as { videoUrl?: string };
            return videoData.videoUrl || null;
        }

        return null;
    }, [edges, nodes, id]);

    // Update inputVideoUrl when connection changes
    React.useEffect(() => {
        if (connectedVideoUrl && connectedVideoUrl !== inputVideoUrl) {
            updateNodeData<ExtractFrameFlowNode>(id, {
                inputVideoUrl: connectedVideoUrl,
                outputFrameUrl: undefined, // Reset output when input changes
                timestamp: 0,
                timestampPercent: undefined,
            });
            setTimestampInput('0');
        }
    }, [connectedVideoUrl, inputVideoUrl, id, updateNodeData]);

    const handleRename = () => {
        if (newLabel.trim()) {
            updateNodeData<ExtractFrameFlowNode>(id, { label: newLabel.trim() });
        }
        setRenameDialogOpen(false);
    };

    const toggleLock = () => {
        updateNodeData<ExtractFrameFlowNode>(id, { isLocked: !isLocked });
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);
            updateNodeData<ExtractFrameFlowNode>(id, {
                timestamp: time,
                frameNumber: Math.round(time * 30), // Assuming 30fps
            });
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setDuration(dur);
            updateNodeData<ExtractFrameFlowNode>(id, { videoDuration: dur });
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
            updateNodeData<ExtractFrameFlowNode>(id, {
                timestamp: time,
                frameNumber: Math.round(time * 30),
                outputFrameUrl: undefined, // Clear previous extraction
            });
        }
    };

    // Poll for task completion
    const pollTaskResult = async (runId: string): Promise<TriggerPollResponse> => {
        const maxAttempts = 300; // 5 minutes max
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

    const handleExtractFrame = async () => {
        if (!inputVideoUrl) return;

        updateNodeData<ExtractFrameFlowNode>(id, { isProcessing: true });

        // Start workflow history run for this individual node
        let runId: string | null = null;
        let nodeRunId: string | null = null;

        if (workflowId) {
            runId = await startRun(workflowId, 'single', [id]);
        }

        // Resolve timestamp: seconds or percentage of duration
        const durationSec = data.videoDuration ?? duration;
        const timestampSeconds =
            data.timestampPercent != null && durationSec > 0
                ? (durationSec * data.timestampPercent) / 100
                : (data.timestamp ?? currentTime);

        try {
            // Record node run to history before execution
            const inputData = {
                videoUrl: inputVideoUrl,
                timestamp: timestampSeconds,
                timestampPercent: data.timestampPercent,
            };

            if (runId) {
                nodeRunId = await addNodeToRun(runId, id, displayLabel, 'extractFrame', inputData);
            }

            // Trigger the Trigger.dev task (seconds; task may also accept timestampPercent for batch)
            const triggerResponse = await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskType: 'extract-frame',
                    payload: {
                        videoUrl: inputVideoUrl,
                        timestamp: timestampSeconds,
                        ...(data.timestampPercent != null && { timestampPercent: data.timestampPercent }),
                    },
                }),
            });

            const triggerResult: TriggerTaskResponse = await triggerResponse.json();

            if (!triggerResult.success || !triggerResult.runId) {
                throw new Error(safeErrorMessage(triggerResult.error, 'Failed to trigger extract frame task'));
            }

            // Poll for completion
            const pollResult = await pollTaskResult(triggerResult.runId);

            if (pollResult.isFailed) {
                throw new Error(safeErrorMessage(pollResult.error, 'Extract frame task failed'));
            }

            const frameUrl = pollResult.output?.frameImageUrl;

            if (frameUrl) {
                updateNodeData<ExtractFrameFlowNode>(id, {
                    outputFrameUrl: frameUrl,
                    isProcessing: false,
                });

                // Complete node run and workflow run in history
                if (nodeRunId) {
                    await completeNodeRun(nodeRunId, 'completed', { frameImageUrl: frameUrl });
                }
                if (runId) {
                    await completeRun(runId, 'completed');
                }
            } else {
                updateNodeData<ExtractFrameFlowNode>(id, { isProcessing: false });
                if (nodeRunId) {
                    await completeNodeRun(nodeRunId, 'completed', {});
                }
                if (runId) {
                    await completeRun(runId, 'completed');
                }
            }
        } catch (error) {
            console.error('Frame extraction error:', error);
            updateNodeData<ExtractFrameFlowNode>(id, { isProcessing: false });

            // Record failure in history
            if (nodeRunId) {
                await completeNodeRun(nodeRunId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
            }
            if (runId) {
                await completeRun(runId, 'failed');
            }
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 100);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const parseTimecode = (timecode: string): number | null => {
        // Parse formats like "00:02.05" or "2.05" or "125" (seconds)
        const parts = timecode.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const secondsParts = parts[1].split('.');
            const seconds = parseInt(secondsParts[0]) || 0;
            const ms = parseInt(secondsParts[1] || '0') / 100;
            return minutes * 60 + seconds + ms;
        } else if (parts.length === 1) {
            return parseFloat(parts[0]) || 0;
        }
        return null;
    };

    /** Parse timestamp input: seconds (e.g. "30", "1.5") or percentage (e.g. "50%") */
    const parseTimestampInput = (value: string): { seconds?: number; percent?: number } => {
        const trimmed = value.trim();
        if (!trimmed) return {};
        if (trimmed.endsWith('%')) {
            const num = parseFloat(trimmed.slice(0, -1));
            if (!Number.isNaN(num) && num >= 0 && num <= 100) {
                return { percent: num };
            }
            return {};
        }
        const seconds = parseFloat(trimmed);
        if (!Number.isNaN(seconds) && seconds >= 0) {
            return { seconds };
        }
        return {};
    };

    const handleTimecodeChange = (value: string) => {
        setTimecodeInput(value);
    };

    const handleTimecodeSubmit = () => {
        const time = parseTimecode(timecodeInput);
        if (time !== null && time >= 0 && time <= duration) {
            if (videoRef.current) {
                videoRef.current.currentTime = time;
            }
            setCurrentTime(time);
            updateNodeData<ExtractFrameFlowNode>(id, {
                timestamp: time,
                frameNumber: Math.round(time * 30),
                outputFrameUrl: undefined,
            });
        }
        setTimecodeInput('');
    };

    /** Apply timestamp input (seconds or "50%"); updates node data and optionally seeks video */
    const handleTimestampInputApply = () => {
        const parsed = parseTimestampInput(timestampInput);
        if (parsed.percent !== undefined) {
            updateNodeData<ExtractFrameFlowNode>(id, {
                timestampPercent: parsed.percent,
                timestamp: duration > 0 ? (duration * parsed.percent) / 100 : 0,
                outputFrameUrl: undefined,
            });
            setCurrentTime(duration > 0 ? (duration * parsed.percent) / 100 : 0);
            if (videoRef.current && duration > 0) {
                videoRef.current.currentTime = (duration * parsed.percent) / 100;
            }
        } else if (parsed.seconds !== undefined) {
            const time = Math.min(parsed.seconds, duration || parsed.seconds);
            updateNodeData<ExtractFrameFlowNode>(id, {
                timestamp: time,
                timestampPercent: undefined,
                frameNumber: Math.round(time * 30),
                outputFrameUrl: undefined,
            });
            setCurrentTime(time);
            if (videoRef.current) {
                videoRef.current.currentTime = time;
            }
        }
    };

    return (
        <div className={cn("relative group/node", isProcessing && "node-processing-glow rounded-xl")}>
            {/* Input Handle */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2" style={{ transform: 'translate(-6px, -50%)' }}>
                <HandleWithLabel
                    type="target"
                    position={Position.Left}
                    id={EXTRACT_FRAME_HANDLES.VIDEO_INPUT}
                    nodeId={id}
                    label="Video"
                    color="cyan"
                />
            </div>

            {/* Output Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2" style={{ transform: 'translate(6px, -50%)' }}>
                <HandleWithLabel
                    type="source"
                    position={Position.Right}
                    id={EXTRACT_FRAME_HANDLES.OUTPUT}
                    nodeId={id}
                    label="File"
                    color="green"
                />
            </div>

            <NodeShell
                title={displayLabel}
                icon={<Film className="h-4 w-4" />}
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
                {/* TOP: Video Preview */}
                <div className="mb-3">
                    <label className="text-xs text-foreground/60 mb-1 block">Video Preview</label>
                    {inputVideoUrl ? (
                        <div className="relative rounded-lg overflow-hidden bg-black">
                            <video
                                ref={videoRef}
                                src={inputVideoUrl}
                                className="w-full max-h-37.5 object-contain"
                                muted
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onSeeked={handleTimeUpdate}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={() => setIsPlaying(false)}
                            />
                            <button
                                type="button"
                                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                                onClick={() => {
                                    if (videoRef.current) {
                                        if (videoRef.current.paused) {
                                            videoRef.current.play();
                                        } else {
                                            videoRef.current.pause();
                                        }
                                    }
                                }}
                            >
                                {isPlaying ? (
                                    <Pause className="h-12 w-12 text-white" />
                                ) : (
                                    <Play className="h-12 w-12 text-white" />
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-lg bg-muted/20 p-4 text-center text-sm text-foreground/50">
                            Connect a video source
                        </div>
                    )}
                </div>

                {/* Video Controls */}
                {inputVideoUrl && (
                    <div className="space-y-4">
                        {/* Time Display */}
                        <div className="flex items-center justify-between text-xs text-foreground/60">
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>

                        {/* Seek Bar */}
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.01}
                            value={currentTime}
                            onChange={handleSeek}
                            className="nodrag w-full h-1 bg-muted rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
                        />

                        {/* Timestamp: seconds or percentage (e.g. 50%) */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-foreground/50">Timestamp</span>
                            <input
                                type="text"
                                value={timestampInput}
                                onChange={(e) => setTimestampInput(e.target.value)}
                                onBlur={handleTimestampInputApply}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleTimestampInputApply();
                                    }
                                }}
                                placeholder="0 or 50%"
                                className="nodrag flex-1 min-w-0 bg-muted/40 rounded px-2 py-1 text-center text-foreground/70"
                            />
                        </div>

                        {/* Frame Info */}
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-foreground/50">Frame</span>
                                <input
                                    type="number"
                                    value={data.frameNumber || Math.round(currentTime * 30)}
                                    onChange={(e) => {
                                        const frame = parseInt(e.target.value) || 0;
                                        const time = frame / 30;
                                        if (videoRef.current) {
                                            videoRef.current.currentTime = time;
                                        }
                                        setCurrentTime(time);
                                        updateNodeData<ExtractFrameFlowNode>(id, {
                                            timestamp: time,
                                            frameNumber: frame,
                                        });
                                    }}
                                    className="nodrag w-16 bg-muted/40 rounded px-2 py-1 text-center"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-foreground/50">Timecode</span>
                                <input
                                    type="text"
                                    value={timecodeInput || formatTime(currentTime)}
                                    onChange={(e) => handleTimecodeChange(e.target.value)}
                                    onBlur={handleTimecodeSubmit}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleTimecodeSubmit();
                                        }
                                    }}
                                    onFocus={() => setTimecodeInput(formatTime(currentTime))}
                                    placeholder="00:00.00"
                                    className="nodrag w-20 bg-muted/40 rounded px-2 py-1 text-center text-foreground/70"
                                />
                            </div>
                        </div>

                        {/* Extract Button */}
                        <Button
                            onClick={handleExtractFrame}
                            disabled={isProcessing}
                            className="w-full bg-black hover:bg-black/90 text-white"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Extracting...
                                </>
                            ) : (
                                <>
                                    <Film className="mr-2 h-4 w-4" />
                                    Extract Frame
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* BOTTOM: Extracted Frame Preview */}
                {outputFrameUrl && (
                    <div className="mt-4">
                        <label className="text-xs text-foreground/60 mb-1 block">Extracted Frame</label>
                        <div className="relative rounded-lg overflow-hidden bg-muted/40">
                            <img
                                src={outputFrameUrl}
                                alt="Extracted frame"
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
