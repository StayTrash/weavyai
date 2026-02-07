'use client';

import * as React from 'react';
import {
    ChevronDown,
    ChevronRight,
    Check,
    Clock,
    Loader2,
    Play,
    Trash2,
    X,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/stores/workflowStore';
import type { WorkflowRun, NodeRun, RunScope, RunStatus } from '@/types/workflow.types';
import { Button } from '@/components/ui/button';

interface WorkflowHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * WorkflowHistoryPanel Component
 * 
 * Right sidebar showing list of all workflow runs with:
 * - Timestamp, status badge, duration, scope
 * - Expandable node-level execution details
 * - Color-coded status indicators
 */
export function WorkflowHistoryPanel({ isOpen, onClose }: WorkflowHistoryPanelProps) {
    const workflowRuns = useWorkflowStore((s) => s.workflowRuns);
    const isLoadingHistory = useWorkflowStore((s) => s.isLoadingHistory);
    const workflowId = useWorkflowStore((s) => s.workflowId);
    const loadWorkflowHistory = useWorkflowStore((s) => s.loadWorkflowHistory);
    const clearHistory = useWorkflowStore((s) => s.clearHistory);

    const [expandedRunIds, setExpandedRunIds] = React.useState<Set<string>>(new Set());

    // Load history when panel opens
    React.useEffect(() => {
        if (isOpen && workflowId) {
            loadWorkflowHistory(workflowId);
        }
    }, [isOpen, workflowId, loadWorkflowHistory]);

    const toggleExpand = (runId: string) => {
        setExpandedRunIds((prev) => {
            const next = new Set(prev);
            if (next.has(runId)) {
                next.delete(runId);
            } else {
                next.add(runId);
            }
            return next;
        });
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        const seconds = (ms / 1000).toFixed(1);
        return `${seconds}s`;
    };

    const getScopeLabel = (scope: RunScope) => {
        switch (scope) {
            case 'full':
                return 'Full Workflow';
            case 'selected':
                return 'Selected Nodes';
            case 'single':
                return 'Single Node';
        }
    };

    const getStatusBadge = (status: RunStatus) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                        <Check className="h-3 w-3" />
                        Success
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                        <X className="h-3 w-3" />
                        Failed
                    </span>
                );
            case 'partial':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        <AlertCircle className="h-3 w-3" />
                        Partial
                    </span>
                );
            case 'running':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running
                    </span>
                );
        }
    };

    const getNodeStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <Check className="h-4 w-4 text-green-400" />;
            case 'failed':
                return <X className="h-4 w-4 text-red-400" />;
            case 'running':
                return <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />;
            default:
                return <Clock className="h-4 w-4 text-foreground/40" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed right-0 top-0 h-full w-95 bg-card border-l border-border shadow-xl z-50 flex flex-col"
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <h2 className="text-lg font-semibold">Workflow History</h2>
                </div>
                <div className="flex items-center gap-2">
                    {workflowRuns.length > 0 && workflowId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearHistory(workflowId)}
                            className="text-foreground/60 hover:text-red-400"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-muted/40"
                    >
                        <X className="h-5 w-5 text-foreground/60" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                    </div>
                ) : workflowRuns.length === 0 ? (
                    <div className="py-12 text-center text-foreground/50">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-foreground/20" />
                        <p className="text-sm">No runs yet</p>
                        <p className="text-xs mt-1 text-foreground/40">
                            Click "Run All" to execute the workflow
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {workflowRuns.map((run, index) => (
                            <RunEntry
                                key={run.id}
                                run={run}
                                runNumber={workflowRuns.length - index}
                                isExpanded={expandedRunIds.has(run.id)}
                                onToggle={() => toggleExpand(run.id)}
                                formatTime={formatTime}
                                formatDuration={formatDuration}
                                getScopeLabel={getScopeLabel}
                                getStatusBadge={getStatusBadge}
                                getNodeStatusIcon={getNodeStatusIcon}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface RunEntryProps {
    run: WorkflowRun;
    runNumber: number;
    isExpanded: boolean;
    onToggle: () => void;
    formatTime: (date: Date) => string;
    formatDuration: (ms?: number) => string;
    getScopeLabel: (scope: RunScope) => string;
    getStatusBadge: (status: RunStatus) => React.ReactNode;
    getNodeStatusIcon: (status: string) => React.ReactNode;
}

function RunEntry({
    run,
    runNumber,
    isExpanded,
    onToggle,
    formatTime,
    formatDuration,
    getScopeLabel,
    getStatusBadge,
    getNodeStatusIcon,
}: RunEntryProps) {
    return (
        <div className="bg-background/30">
            {/* Run Header */}
            <button
                onClick={onToggle}
                className="w-full p-3 flex items-start gap-3 hover:bg-muted/20 transition-colors text-left"
            >
                <div className="mt-0.5">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-foreground/50" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-foreground/50" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                            Run #{runNumber}
                        </span>
                        {getStatusBadge(run.status)}
                    </div>
                    <div className="text-xs text-foreground/50 mt-1">
                        {formatTime(run.startedAt)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-foreground/40">
                        <span>{getScopeLabel(run.runScope)}</span>
                        <span>•</span>
                        <span>{run.nodeCount} node{run.nodeCount !== 1 ? 's' : ''}</span>
                        {run.duration && (
                            <>
                                <span>•</span>
                                <span>{formatDuration(run.duration)}</span>
                            </>
                        )}
                    </div>
                </div>
            </button>

            {/* Node Details */}
            {isExpanded && run.nodeRuns.length > 0 && (
                <div className="pl-8 pr-3 pb-3 space-y-1">
                    {run.nodeRuns.map((nodeRun) => (
                        <NodeRunEntry
                            key={nodeRun.id}
                            nodeRun={nodeRun}
                            formatDuration={formatDuration}
                            getNodeStatusIcon={getNodeStatusIcon}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface NodeRunEntryProps {
    nodeRun: NodeRun;
    formatDuration: (ms?: number) => string;
    getNodeStatusIcon: (status: string) => React.ReactNode;
}

function NodeRunEntry({ nodeRun, formatDuration, getNodeStatusIcon }: NodeRunEntryProps) {
    const [showInput, setShowInput] = React.useState(false);
    const [showOutput, setShowOutput] = React.useState(false);

    return (
        <div className="rounded-md bg-muted/30 p-2">
            <div className="flex items-center gap-2">
                {getNodeStatusIcon(nodeRun.status)}
                <span className="text-sm text-foreground truncate flex-1">
                    {nodeRun.nodeName}
                </span>
                <span className="text-xs text-foreground/40">
                    {formatDuration(nodeRun.duration)}
                </span>
            </div>

            {nodeRun.error && (
                <div className="mt-1 text-xs text-red-400 pl-6">
                    Error: {nodeRun.error}
                </div>
            )}

            {/* Input Data */}
            {nodeRun.inputData && Object.keys(nodeRun.inputData).length > 0 && (
                <div className="mt-1 pl-6">
                    <button
                        onClick={() => setShowInput(!showInput)}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                        {showInput ? 'Hide input' : 'Show input'}
                    </button>
                    {showInput && (
                        <div className="mt-1 text-xs text-foreground/60 bg-cyan-500/10 rounded p-2 max-h-24 overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-all">
                                {JSON.stringify(nodeRun.inputData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* Output Data */}
            {nodeRun.outputData && (
                <div className="mt-1 pl-6">
                    <button
                        onClick={() => setShowOutput(!showOutput)}
                        className="text-xs text-purple-400 hover:text-purple-300"
                    >
                        {showOutput ? 'Hide output' : 'Show output'}
                    </button>
                    {showOutput && (
                        <div className="mt-1 text-xs text-foreground/60 bg-muted/40 rounded p-2 max-h-24 overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-all">
                                {JSON.stringify(nodeRun.outputData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
