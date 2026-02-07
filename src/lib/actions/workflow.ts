'use server';

import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth-server';

export async function listWorkflows(input?: { folderId?: string | null }) {
    const user = await getAuthUser();
    const where: { userId: string; folderId?: string | null } = { userId: user.id };
    if (input?.folderId !== undefined) where.folderId = input.folderId;

    const workflows = await prisma.workflow.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            name: true,
            thumbnail: true,
            folderId: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return { workflows };
}

export async function getWorkflowById(input: { id: string }) {
    const user = await getAuthUser();
    const workflow = await prisma.workflow.findFirst({
        where: { id: input.id, userId: user.id },
    });
    if (!workflow) throw new Error('Workflow not found');
    return { workflow };
}

export async function createWorkflow(input: {
    name?: string;
    folderId?: string | null;
    nodes?: unknown[];
    edges?: unknown[];
}) {
    const user = await getAuthUser();
    const workflow = await prisma.workflow.create({
        data: {
            name: input.name ?? 'untitled',
            nodes: (input.nodes ?? []) as object[],
            edges: (input.edges ?? []) as object[],
            folderId: input.folderId ?? null,
            userId: user.id,
        },
    });
    console.log('✅ Workflow created:', workflow.id);
    return { workflow };
}

export async function updateWorkflow(input: {
    id: string;
    name?: string;
    folderId?: string | null;
    nodes?: unknown[];
    edges?: unknown[];
    thumbnail?: string;
}) {
    const user = await getAuthUser();
    const existing = await prisma.workflow.findFirst({
        where: { id: input.id, userId: user.id },
    });
    if (!existing) throw new Error('Workflow not found');

    const { id, ...rest } = input;
    const data: Parameters<typeof prisma.workflow.update>[0]['data'] = {};
    if (rest.name !== undefined) data.name = rest.name;
    if (rest.folderId !== undefined) data.folderId = rest.folderId;
    if (rest.nodes !== undefined) data.nodes = rest.nodes as object[];
    if (rest.edges !== undefined) data.edges = rest.edges as object[];
    if (rest.thumbnail !== undefined) data.thumbnail = rest.thumbnail;
    const workflow = await prisma.workflow.update({
        where: { id },
        data,
    });
    return { workflow };
}

export async function deleteWorkflow(input: { id: string }) {
    const user = await getAuthUser();
    const existing = await prisma.workflow.findFirst({
        where: { id: input.id, userId: user.id },
    });
    if (!existing) throw new Error('Workflow not found');
    await prisma.workflow.delete({ where: { id: input.id } });
    return { message: 'Workflow deleted successfully' };
}
