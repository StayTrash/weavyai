'use client';

import * as React from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type WorkflowState } from '@/stores/workflowStore';
import { urlToBase64 } from '@/lib/transloadit';
import {
  type LLMFlowNode,
  GEMINI_MODELS,
  LLM_HANDLES,
} from '@/types/workflow.types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Lock, Play, Sparkles, X } from 'lucide-react';

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
  output?: { output: string };
  error?: string;
  isCompleted: boolean;
  isFailed: boolean;
}

/**
 * LLMNode Component
 * 
 * A node for running LLM inference via Trigger.dev.
 * Features:
 * - Model selector dropdown
 * - Input handles for system_prompt, user_message, and images
 * - Output handle for LLM response
 * - Editable result text field
 * - Pulsating glow when running
 * - Run button with loading state
 * - Error display
 */
export function LLMNode({ id, data, selected }: NodeProps<LLMFlowNode>) {
  const updateNodeData = useWorkflowStore((s: WorkflowState) => s.updateNodeData);
  const getConnectedInputs = useWorkflowStore((s: WorkflowState) => s.getConnectedInputs);
  const propagateOutput = useWorkflowStore((s: WorkflowState) => s.propagateOutput);
  const addTask = useWorkflowStore((s: WorkflowState) => s.addTask);
  const updateTask = useWorkflowStore((s: WorkflowState) => s.updateTask);
  const edges = useWorkflowStore((s: WorkflowState) => s.edges);
  // Workflow history functions
  const workflowId = useWorkflowStore((s: WorkflowState) => s.workflowId);
  const startRun = useWorkflowStore((s: WorkflowState) => s.startRun);
  const addNodeToRun = useWorkflowStore((s: WorkflowState) => s.addNodeToRun);
  const completeNodeRun = useWorkflowStore((s: WorkflowState) => s.completeNodeRun);
  const completeRun = useWorkflowStore((s: WorkflowState) => s.completeRun);

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState(data.label || 'Run Any LLM');

  const displayLabel = data.label || 'Run Any LLM';
  const isLocked = data.isLocked || false;
  const isLoading = data.isLoading || false;

  // When an input handle has a connection, the corresponding manual field is disabled (value comes from connected node)
  const hasSystemPromptConnection = React.useMemo(
    () => edges.some((e) => e.target === id && e.targetHandle === LLM_HANDLES.SYSTEM_PROMPT),
    [edges, id]
  );
  const hasUserMessageConnection = React.useMemo(
    () => edges.some((e) => e.target === id && e.targetHandle === LLM_HANDLES.USER_MESSAGE),
    [edges, id]
  );

  const handleRename = () => {
    if (newLabel.trim()) {
      updateNodeData<LLMFlowNode>(id, { label: newLabel.trim() });
    }
    setRenameDialogOpen(false);
  };

  const toggleLock = () => {
    updateNodeData<LLMFlowNode>(id, { isLocked: !isLocked });
  };

  // Poll for task completion
  const pollTaskResult = async (runId: string): Promise<TriggerPollResponse> => {
    const maxAttempts = 120; // 2 minutes max
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

  const handleRun = async () => {
    updateNodeData<LLMFlowNode>(id, { isLoading: true, error: undefined });

    const taskId = addTask(id, displayLabel);

    // Start workflow history run for this individual node
    let runId: string | null = null;
    let nodeRunId: string | null = null;

    if (workflowId) {
      runId = await startRun(workflowId, 'single', [id]);
    }

    try {
      const inputs = getConnectedInputs(id);

      const systemPrompt = inputs.systemPrompt || data.systemPrompt;
      const userMessage = inputs.userMessage || data.userMessage || '';

      // Collect all images (base64 and URLs converted to base64)
      const allImages: string[] = inputs.images.length > 0 ? [...inputs.images] : (data.images ? [...data.images] : []);

      // Convert any connected image URLs to base64
      if (inputs.imageUrls && inputs.imageUrls.length > 0) {
        const urlPromises = inputs.imageUrls.map(url => urlToBase64(url));
        const base64Results = await Promise.all(urlPromises);
        base64Results.forEach(base64 => {
          if (base64) {
            allImages.push(base64);
          }
        });
      }

      // Record node run to history BEFORE validation to capture errors
      const inputData = {
        model: data.model,
        systemPrompt,
        userMessage: userMessage || '(not provided)',
        imageCount: allImages.length,
      };

      if (runId) {
        nodeRunId = await addNodeToRun(runId, id, displayLabel, 'llm', inputData);
      }

      // Validate user message AFTER recording to history
      if (!userMessage.trim()) {
        throw new Error('User message is required. Connect a Text node to the user_message input.');
      }

      // Trigger the Trigger.dev task
      const triggerResponse = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'llm',
          payload: {
            model: data.model,
            systemPrompt,
            userMessage,
            images: allImages,
          },
        }),
      });

      const triggerResult: TriggerTaskResponse = await triggerResponse.json();

      if (!triggerResult.success || !triggerResult.runId) {
        throw new Error(triggerResult.error || 'Failed to trigger LLM task');
      }

      // Poll for completion
      const pollResult = await pollTaskResult(triggerResult.runId);

      if (pollResult.isFailed) {
        throw new Error(pollResult.error || 'LLM task failed');
      }

      const output = pollResult.output?.output || '';

      updateNodeData<LLMFlowNode>(id, {
        output,
        isLoading: false,
        error: undefined,
      });

      updateTask(taskId, { status: 'completed', completedAt: new Date() });
      propagateOutput(id, output);

      // Complete node run and workflow run in history
      if (nodeRunId) {
        await completeNodeRun(nodeRunId, 'completed', { output });
      }
      if (runId) {
        await completeRun(runId, 'completed');
      }

    } catch (error) {
      const errorStr =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : typeof error === 'object' && error !== null && 'message' in error
              ? String((error as { message?: unknown }).message)
              : 'Unknown error';
      const safeError = errorStr && errorStr !== '[object Object]' ? errorStr : 'Task failed. See Trigger.dev dashboard for details.';

      updateNodeData<LLMFlowNode>(id, {
        isLoading: false,
        error: safeError,
      });

      updateTask(taskId, {
        status: 'failed',
        completedAt: new Date(),
        error: safeError,
      });

      // Record failure in history
      if (nodeRunId) {
        await completeNodeRun(nodeRunId, 'failed', undefined, safeError);
      }
      if (runId) {
        await completeRun(runId, 'failed');
      }
    }
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newOutput = e.target.value;
    updateNodeData<LLMFlowNode>(id, { output: newOutput });
    propagateOutput(id, newOutput);
  };

  return (
    <div className={cn("relative group/node", isLoading && "node-running-glow rounded-xl")}>
      {/* Input Handles */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-center gap-8" style={{ transform: 'translateX(-6px)' }}>
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id={LLM_HANDLES.SYSTEM_PROMPT}
          nodeId={id}
          label="system_prompt"
          color="magenta"
          style={{ position: 'relative', top: 0 }}
        />
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id={LLM_HANDLES.USER_MESSAGE}
          nodeId={id}
          label="user_message"
          color="magenta"
          style={{ position: 'relative', top: 0 }}
        />
        <HandleWithLabel
          type="target"
          position={Position.Left}
          id={LLM_HANDLES.IMAGES}
          nodeId={id}
          label="images"
          color="cyan"
          style={{ position: 'relative', top: 0 }}
        />
      </div>

      {/* Output Handle */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2" style={{ transform: 'translate(6px, -50%)' }}>
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id={LLM_HANDLES.OUTPUT}
          nodeId={id}
          label="output"
          color="green"
        />
      </div>

      <NodeShell
        title={displayLabel}
        icon={<Sparkles className="h-4 w-4" />}
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
        <div className="space-y-4">
          {/* Model Selector */}
          <div>
            <label className="text-xs text-foreground/60 mb-1 block">Model</label>
            <Select
              value={data.model}
              onValueChange={(value) =>
                updateNodeData<LLMFlowNode>(id, { model: value as LLMFlowNode['data']['model'] })
              }
            >
              <SelectTrigger className="nodrag w-full bg-muted/40">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {GEMINI_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System prompt: manual entry, disabled when connected */}
          <div>
            <label className="text-xs text-foreground/60 mb-1 block">System prompt (optional)</label>
            <Textarea
              value={hasSystemPromptConnection ? '' : (data.systemPrompt ?? '')}
              onChange={(e) => updateNodeData<LLMFlowNode>(id, { systemPrompt: e.target.value })}
              placeholder={hasSystemPromptConnection ? 'From connection' : 'Optional system instructions...'}
              className={cn(
                'nodrag min-h-14 resize-y bg-muted/40 text-sm',
                hasSystemPromptConnection && 'cursor-not-allowed opacity-60'
              )}
              disabled={hasSystemPromptConnection}
            />
          </div>

          {/* User message: manual entry, disabled when connected */}
          <div>
            <label className="text-xs text-foreground/60 mb-1 block">User message (required)</label>
            <Textarea
              value={hasUserMessageConnection ? '' : (data.userMessage ?? '')}
              onChange={(e) => updateNodeData<LLMFlowNode>(id, { userMessage: e.target.value })}
              placeholder={hasUserMessageConnection ? 'From connection' : 'Enter your message or connect a Text node...'}
              className={cn(
                'nodrag min-h-14 resize-y bg-muted/40 text-sm',
                hasUserMessageConnection && 'cursor-not-allowed opacity-60'
              )}
              disabled={hasUserMessageConnection}
            />
          </div>

          {/* Error Display */}
          {data.error && (
            <div
              className={cn(
                'rounded-lg p-3 text-sm',
                'bg-red-500/10 text-red-400 border border-red-500/30'
              )}
            >
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{typeof data.error === 'string' ? data.error : String(data.error)}</span>
              </div>
            </div>
          )}

          {/* Run Button */}
          <Button
            onClick={handleRun}
            disabled={isLoading}
            className="w-full bg-black hover:bg-black/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run
              </>
            )}
          </Button>

          {/* Result Output - Editable Text Field */}
          {(data.output || isLoading) && (
            <div>
              <label className="text-xs text-foreground/60 mb-1 block">Result</label>
              <Textarea
                value={data.output || ''}
                onChange={handleOutputChange}
                placeholder={isLoading ? 'Generating response...' : 'LLM output will appear here...'}
                className="nodrag min-h-25 max-h-50 resize-y bg-muted/40 text-sm"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
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
