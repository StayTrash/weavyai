/**
 * DAG Execution Utilities
 * 
 * Provides utilities for:
 * - Building dependency graphs from workflow edges
 * - Detecting cycles (DAG validation)
 * - Computing execution order with parallel batches
 */

import type { WorkflowNode, WorkflowEdge } from '@/types/workflow.types';

// ============================================================================
// Types
// ============================================================================

export interface DependencyGraph {
    /** Map from node ID to list of node IDs it depends on (upstream) */
    dependencies: Map<string, Set<string>>;
    /** Map from node ID to list of node IDs that depend on it (downstream) */
    dependents: Map<string, Set<string>>;
}

export interface ExecutionBatch {
    /** Nodes that can be executed in parallel */
    nodeIds: string[];
    /** Batch number (for ordering) */
    batchIndex: number;
}

export interface ExecutionPlan {
    /** Whether the graph is a valid DAG (no cycles) */
    isValidDAG: boolean;
    /** Error message if not valid */
    error?: string;
    /** Execution batches in order */
    batches: ExecutionBatch[];
    /** All node IDs in execution order (flattened) */
    executionOrder: string[];
}

// ============================================================================
// Graph Building
// ============================================================================

/**
 * Build a dependency graph from workflow edges
 */
export function buildDependencyGraph(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
): DependencyGraph {
    const dependencies = new Map<string, Set<string>>();
    const dependents = new Map<string, Set<string>>();

    // Initialize all nodes with empty sets
    for (const node of nodes) {
        dependencies.set(node.id, new Set());
        dependents.set(node.id, new Set());
    }

    // Build the graph from edges
    for (const edge of edges) {
        const { source, target } = edge;

        // target depends on source
        const targetDeps = dependencies.get(target);
        if (targetDeps) {
            targetDeps.add(source);
        }

        // source has target as dependent
        const sourceDeps = dependents.get(source);
        if (sourceDeps) {
            sourceDeps.add(target);
        }
    }

    return { dependencies, dependents };
}

// ============================================================================
// Cycle Detection
// ============================================================================

/**
 * Check if the graph contains a cycle using DFS
 * Returns the cycle path if found, empty array if no cycle
 */
export function detectCycle(graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    function dfs(nodeId: string): string[] | null {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        const deps = graph.dependents.get(nodeId) || new Set();
        for (const dep of deps) {
            if (!visited.has(dep)) {
                const cycle = dfs(dep);
                if (cycle) return cycle;
            } else if (recursionStack.has(dep)) {
                // Found a cycle - return the cycle portion of the path
                const cycleStart = path.indexOf(dep);
                return [...path.slice(cycleStart), dep];
            }
        }

        path.pop();
        recursionStack.delete(nodeId);
        return null;
    }

    for (const nodeId of graph.dependencies.keys()) {
        if (!visited.has(nodeId)) {
            const cycle = dfs(nodeId);
            if (cycle) return cycle;
        }
    }

    return [];
}

// ============================================================================
// Execution Planning
// ============================================================================

/**
 * Create an execution plan with parallel batches using Kahn's algorithm
 */
export function createExecutionPlan(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    selectedNodeIds?: string[]
): ExecutionPlan {
    // Filter to selected nodes if specified
    const targetNodes = selectedNodeIds
        ? nodes.filter(n => selectedNodeIds.includes(n.id))
        : nodes;

    const targetNodeIds = new Set(targetNodes.map(n => n.id));

    // Filter edges to only those between target nodes
    const relevantEdges = edges.filter(
        e => targetNodeIds.has(e.source) && targetNodeIds.has(e.target)
    );

    const graph = buildDependencyGraph(targetNodes, relevantEdges);

    // Check for cycles
    const cycle = detectCycle(graph);
    if (cycle.length > 0) {
        return {
            isValidDAG: false,
            error: `Cycle detected: ${cycle.join(' → ')}`,
            batches: [],
            executionOrder: [],
        };
    }

    // Kahn's algorithm for topological sort with batching
    const inDegree = new Map<string, number>();
    for (const nodeId of targetNodeIds) {
        const deps = graph.dependencies.get(nodeId) || new Set();
        // Only count dependencies that are in our target set
        const relevantDeps = new Set([...deps].filter(d => targetNodeIds.has(d)));
        inDegree.set(nodeId, relevantDeps.size);
    }

    const batches: ExecutionBatch[] = [];
    const executionOrder: string[] = [];
    const remaining = new Set(targetNodeIds);

    let batchIndex = 0;
    while (remaining.size > 0) {
        // Find all nodes with no remaining dependencies
        const batch: string[] = [];
        for (const nodeId of remaining) {
            if (inDegree.get(nodeId) === 0) {
                batch.push(nodeId);
            }
        }

        if (batch.length === 0) {
            // This shouldn't happen if cycle detection worked
            return {
                isValidDAG: false,
                error: 'Unable to compute execution order - possible hidden cycle',
                batches: [],
                executionOrder: [],
            };
        }

        // Add batch
        batches.push({ nodeIds: batch, batchIndex });
        executionOrder.push(...batch);

        // Remove these nodes and update in-degrees
        for (const nodeId of batch) {
            remaining.delete(nodeId);
            const deps = graph.dependents.get(nodeId) || new Set();
            for (const dep of deps) {
                if (remaining.has(dep)) {
                    inDegree.set(dep, (inDegree.get(dep) || 1) - 1);
                }
            }
        }

        batchIndex++;
    }

    return {
        isValidDAG: true,
        batches,
        executionOrder,
    };
}

/**
 * Get nodes that are ready to execute (all dependencies completed)
 */
export function getReadyNodes(
    graph: DependencyGraph,
    completedNodeIds: Set<string>,
    pendingNodeIds: Set<string>
): string[] {
    const ready: string[] = [];

    for (const nodeId of pendingNodeIds) {
        const deps = graph.dependencies.get(nodeId) || new Set();
        const allDepsCompleted = [...deps].every(dep => completedNodeIds.has(dep));
        if (allDepsCompleted) {
            ready.push(nodeId);
        }
    }

    return ready;
}

// ============================================================================
// Connected Nodes Filtering
// ============================================================================

/**
 * Get all nodes that are connected to at least one edge
 * This filters out orphan nodes that shouldn't be executed
 */
export function getConnectedNodes(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
): WorkflowNode[] {
    // If no edges, return empty array (no connected nodes)
    if (edges.length === 0) {
        return [];
    }

    const connectedNodeIds = new Set<string>();

    for (const edge of edges) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
    }

    return nodes.filter(node => connectedNodeIds.has(node.id));
}
