'use server';

import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth-server';

export async function createRun(input: {
    workflowId: string;
    runScope: 'full' | 'selected' | 'single';
    nodeCount: number;
}) {
    await getAuthUser();
    const run = await prisma.workflowRun.create({
        data: {
            workflowId: input.workflowId,
            runScope: input.runScope,
            status: 'running',
            nodeCount: input.nodeCount,
        },
    });
    return { run };
}

export async function updateRun(input: {
    runId: string;
    status: 'running' | 'completed' | 'failed' | 'partial';
    completedAt?: Date;
    duration?: number;
}) {
    await getAuthUser();
    const run = await prisma.workflowRun.update({
        where: { id: input.runId },
        data: {
            status: input.status,
            completedAt: input.completedAt ?? new Date(),
            duration: input.duration,
        },
    });
    return { run };
}

export async function addNodeRun(input: {
    workflowRunId: string;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    inputData?: Record<string, unknown>;
}) {
    await getAuthUser();
    const nodeRun = await prisma.nodeRun.create({
        data: {
            workflowRunId: input.workflowRunId,
            nodeId: input.nodeId,
            nodeName: input.nodeName,
            nodeType: input.nodeType,
            status: 'running',
            inputData: (input.inputData ?? undefined) as object | undefined,
        },
    });
    return { nodeRun };
}

export async function updateNodeRun(input: {
    nodeRunId: string;
    status: 'running' | 'completed' | 'failed';
    completedAt?: Date;
    duration?: number;
    outputData?: Record<string, unknown>;
    error?: string;
}) {
    await getAuthUser();
    const nodeRun = await prisma.nodeRun.update({
        where: { id: input.nodeRunId },
        data: {
            status: input.status,
            completedAt: input.completedAt ?? new Date(),
            duration: input.duration,
            outputData: (input.outputData ?? undefined) as object | undefined,
            error: input.error,
        },
    });
    return { nodeRun };
}

export async function getRunsByWorkflow(input: {
    workflowId: string;
    limit?: number;
}) {
    await getAuthUser();
    const runs = await prisma.workflowRun.findMany({
        where: { workflowId: input.workflowId },
        orderBy: { startedAt: 'desc' },
        take: input.limit ?? 50,
        include: {
            nodeRuns: { orderBy: { startedAt: 'asc' } },
        },
    });
    return { runs };
}

export async function getRunDetails(input: { runId: string }) {
    await getAuthUser();
    const run = await prisma.workflowRun.findUnique({
        where: { id: input.runId },
        include: {
            nodeRuns: { orderBy: { startedAt: 'asc' } },
        },
    });
    return { run };
}

export async function deleteRun(input: { runId: string }) {
    await getAuthUser();
    await prisma.workflowRun.delete({ where: { id: input.runId } });
    return { success: true };
}

export async function clearWorkflowHistory(input: { workflowId: string }) {
    await getAuthUser();
    await prisma.workflowRun.deleteMany({
        where: { workflowId: input.workflowId },
    });
    return { success: true };
}
