/**
 * Node Executor
 * 
 * Handles execution of workflow nodes by:
 * 1. Gathering inputs from connected source nodes
 * 2. Calling the appropriate Trigger.dev task
 * 3. Returning the output data
 */

import type { WorkflowNode, WorkflowEdge } from '@/types/workflow.types';

interface TriggerTaskResponse {
    success: boolean;
    runId: string;
    error?: string;
}

interface TriggerPollResponse {
    runId: string;
    status: string;
    output?: Record<string, unknown>;
    error?: string;
    isCompleted: boolean;
    isFailed: boolean;
}

/**
 * Poll for Trigger.dev task completion
 */
async function pollTaskResult(runId: string, maxAttempts = 180): Promise<TriggerPollResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(`/api/trigger?runId=${runId}`);
        const result: TriggerPollResponse = await response.json();

        if (result.isCompleted || result.isFailed) {
            return result;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Task timed out');
}

/**
 * Gather input data for a node from its connected sources
 */
export function gatherNodeInputs(
    nodeId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return inputs;

    // Find all incoming edges
    const incomingEdges = edges.filter(e => e.target === nodeId);

    for (const edge of incomingEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;

        // Extract output based on source node type
        if (sourceNode.type === 'image') {
            const imageData = sourceNode.data as { images?: { imageUrl: string }[] };
            inputs[`source_${sourceNode.id}_imageUrl`] = imageData.images?.[0]?.imageUrl;
        } else if (sourceNode.type === 'video') {
            const videoData = sourceNode.data as { videoUrl?: string };
            inputs[`source_${sourceNode.id}_videoUrl`] = videoData.videoUrl;
        } else if (sourceNode.type === 'text') {
            const textData = sourceNode.data as { text?: string };
            inputs[`source_${sourceNode.id}_text`] = textData.text;
        } else if (sourceNode.type === 'cropImage') {
            const cropData = sourceNode.data as { outputImageUrl?: string };
            inputs[`source_${sourceNode.id}_imageUrl`] = cropData.outputImageUrl;
        } else if (sourceNode.type === 'extractFrame') {
            const frameData = sourceNode.data as { outputFrameUrl?: string };
            inputs[`source_${sourceNode.id}_imageUrl`] = frameData.outputFrameUrl;
        } else if (sourceNode.type === 'llm') {
            const llmData = sourceNode.data as { output?: string };
            inputs[`source_${sourceNode.id}_text`] = llmData.output;
        }
    }

    return inputs;
}

/**
 * Gather LLM-specific inputs by handle type
 * This properly distinguishes between system_prompt, user_message, and images handles
 */
export function gatherLLMInputs(
    nodeId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
): { systemPrompt?: string; userMessage?: string; imageUrls: string[] } {
    const result: { systemPrompt?: string; userMessage?: string; imageUrls: string[] } = { imageUrls: [] };

    // Find all incoming edges to this LLM node
    const incomingEdges = edges.filter(e => e.target === nodeId);

    for (const edge of incomingEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;

        // Check which handle this edge connects to
        switch (edge.targetHandle) {
            case 'system_prompt':
                if (sourceNode.type === 'text') {
                    const textData = sourceNode.data as { text?: string };
                    result.systemPrompt = textData.text;
                } else if (sourceNode.type === 'llm') {
                    const llmData = sourceNode.data as { output?: string };
                    result.systemPrompt = llmData.output;
                }
                break;
            case 'user_message':
                if (sourceNode.type === 'text') {
                    const textData = sourceNode.data as { text?: string };
                    result.userMessage = textData.text;
                } else if (sourceNode.type === 'llm') {
                    const llmData = sourceNode.data as { output?: string };
                    result.userMessage = llmData.output;
                }
                break;
            case 'images':
                if (sourceNode.type === 'image') {
                    const imageData = sourceNode.data as { images?: { imageUrl: string }[] };
                    const urls = (imageData.images || [])
                        .map(img => img.imageUrl)
                        .filter((url): url is string => !!url);
                    result.imageUrls.push(...urls);
                } else if (sourceNode.type === 'cropImage') {
                    const cropData = sourceNode.data as { outputImageUrl?: string };
                    if (cropData.outputImageUrl) {
                        result.imageUrls.push(cropData.outputImageUrl);
                    }
                } else if (sourceNode.type === 'extractFrame') {
                    const frameData = sourceNode.data as { outputFrameUrl?: string };
                    if (frameData.outputFrameUrl) {
                        result.imageUrls.push(frameData.outputFrameUrl);
                    }
                }
                break;
        }
    }

    return result;
}

/**
 * Execute a single node via Trigger.dev
 */
export async function executeNode(
    node: WorkflowNode,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    updateNodeData: <T extends WorkflowNode>(id: string, data: Partial<T['data']>) => void
): Promise<{ success: boolean; output?: Record<string, unknown>; error?: string }> {
    const inputs = gatherNodeInputs(node.id, nodes, edges);

    // Source nodes don't need execution - they just provide data
    // Return meaningful output for history display
    if (node.type === 'image') {
        const imageData = node.data as { images?: { imageUrl: string }[] };
        const imageUrl = imageData.images?.[0]?.imageUrl;
        return {
            success: true,
            output: {
                type: 'image',
                imageUrl: imageUrl || 'No image uploaded'
            }
        };
    }

    if (node.type === 'video') {
        const videoData = node.data as { videoUrl?: string };
        return {
            success: true,
            output: {
                type: 'video',
                videoUrl: videoData.videoUrl || 'No video uploaded'
            }
        };
    }

    if (node.type === 'text') {
        const textData = node.data as { text?: string };
        return {
            success: true,
            output: {
                type: 'text',
                text: textData.text || ''
            }
        };
    }

    try {
        let taskType: string;
        let payload: Record<string, unknown>;

        if (node.type === 'cropImage') {
            const data = node.data as {
                inputImageUrl?: string;
                cropX: number;
                cropY: number;
                cropWidth: number;
                cropHeight: number;
            };

            // Get connected image URL
            const imageUrl = data.inputImageUrl || Object.values(inputs).find(v =>
                typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'))
            );

            if (!imageUrl) {
                return { success: false, error: 'No input image connected' };
            }

            taskType = 'crop-image';
            payload = {
                imageUrl,
                cropX: data.cropX,
                cropY: data.cropY,
                cropWidth: data.cropWidth,
                cropHeight: data.cropHeight,
            };
        } else if (node.type === 'extractFrame') {
            const data = node.data as {
                inputVideoUrl?: string;
                timestamp: number;
                timestampPercent?: number;
                videoDuration?: number;
            };

            // Get connected video URL
            const videoUrl = data.inputVideoUrl || Object.values(inputs).find(v =>
                typeof v === 'string' && (v.startsWith('http') || v.startsWith('blob:'))
            );

            if (!videoUrl) {
                return { success: false, error: 'No input video connected' };
            }

            // Resolve timestamp: use seconds; if percentage and we have duration, compute seconds
            const durationSec = data.videoDuration;
            const timestampSeconds =
                data.timestampPercent != null && durationSec != null && durationSec > 0
                    ? (durationSec * data.timestampPercent) / 100
                    : data.timestamp ?? 0;

            taskType = 'extract-frame';
            payload = {
                videoUrl,
                timestamp: timestampSeconds,
                ...(data.timestampPercent != null && { timestampPercent: data.timestampPercent }),
            };
        } else if (node.type === 'llm') {
            const data = node.data as {
                model: string;
                systemPrompt?: string;
                userMessage?: string;
                images?: string[];
            };

            // Use handle-based input gathering for proper validation
            const llmInputs = gatherLLMInputs(node.id, nodes, edges);

            // Get user message - must be connected via user_message handle
            const userMessage = llmInputs.userMessage || data.userMessage || '';

            if (!userMessage.trim()) {
                return { success: false, error: 'User message is required. Connect a Text node to the user_message input.' };
            }

            // Get system prompt from handle or node data
            const systemPrompt = llmInputs.systemPrompt || data.systemPrompt;

            // Get images from handle or node data
            const images = llmInputs.imageUrls.length > 0 ? llmInputs.imageUrls : data.images;

            taskType = 'llm';
            payload = {
                model: data.model,
                systemPrompt,
                userMessage,
                images,
            };
        } else {
            // Exhaustive check - TypeScript knows this is unreachable if all node types are handled
            const exhaustiveCheck: never = node;
            return { success: false, error: `Unknown node type: ${String((exhaustiveCheck as WorkflowNode).type)}` };
        }

        // Trigger the task
        const triggerResponse = await fetch('/api/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskType, payload }),
        });

        const triggerResult: TriggerTaskResponse = await triggerResponse.json();

        if (!triggerResult.success || !triggerResult.runId) {
            return { success: false, error: triggerResult.error || 'Failed to trigger task' };
        }

        // Poll for completion
        const pollResult = await pollTaskResult(triggerResult.runId);

        if (pollResult.isFailed) {
            return { success: false, error: pollResult.error || 'Task failed' };
        }

        // Update node data with output
        if (node.type === 'cropImage' && pollResult.output) {
            updateNodeData(node.id, {
                outputImageUrl: (pollResult.output as { croppedImageUrl?: string }).croppedImageUrl,
                isProcessing: false,
            });
        } else if (node.type === 'extractFrame' && pollResult.output) {
            updateNodeData(node.id, {
                outputFrameUrl: (pollResult.output as { frameImageUrl?: string }).frameImageUrl,
                isProcessing: false,
            });
        } else if (node.type === 'llm' && pollResult.output) {
            updateNodeData(node.id, {
                output: (pollResult.output as { output?: string }).output,
                isLoading: false,
            });
        }

        return { success: true, output: pollResult.output };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMsg };
    }
}
