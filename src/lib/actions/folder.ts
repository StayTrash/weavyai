'use server';

import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth-server';

function formatFolder(folder: {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { workflows: number };
}) {
    return {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        fileCount: folder._count?.workflows ?? 0,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
    };
}

export async function listFolders(input?: { parentId?: string | null }) {
    const user = await getAuthUser();
    const where: { userId: string; parentId?: string | null } = { userId: user.id };
    if (input?.parentId !== undefined) {
        where.parentId = input.parentId;
    } else {
        where.parentId = null;
    }

    const folders = await prisma.folder.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { workflows: true } } },
    });
    return { folders: folders.map(formatFolder) };
}

export async function getFolderById(input: { id: string }) {
    const user = await getAuthUser();
    const folder = await prisma.folder.findFirst({
        where: { id: input.id, userId: user.id },
        include: { _count: { select: { workflows: true } } },
    });
    if (!folder) throw new Error('Folder not found');
    return { folder: formatFolder(folder) };
}

export async function createFolder(input: { name: string; parentId?: string | null }) {
    const user = await getAuthUser();
    if (input.parentId) {
        const parent = await prisma.folder.findFirst({
            where: { id: input.parentId, userId: user.id },
        });
        if (!parent) throw new Error('Parent folder not found');
    }

    const folder = await prisma.folder.create({
        data: {
            name: input.name,
            parentId: input.parentId ?? null,
            userId: user.id,
        },
    });
    console.log('✅ Folder created:', folder.id);
    return { folder: formatFolder({ ...folder, _count: { workflows: 0 } }) };
}

export async function updateFolder(input: {
    id: string;
    name?: string;
    parentId?: string | null;
}) {
    const user = await getAuthUser();
    const existing = await prisma.folder.findFirst({
        where: { id: input.id, userId: user.id },
    });
    if (!existing) throw new Error('Folder not found');

    const { id, ...data } = input;
    const folder = await prisma.folder.update({
        where: { id },
        data,
        include: { _count: { select: { workflows: true } } },
    });
    return { folder: formatFolder(folder) };
}

export async function deleteFolder(input: { id: string }) {
    const user = await getAuthUser();
    const existing = await prisma.folder.findFirst({
        where: { id: input.id, userId: user.id },
    });
    if (!existing) throw new Error('Folder not found');

    await prisma.workflow.updateMany({
        where: { userId: user.id, folderId: input.id },
        data: { folderId: null },
    });
    await prisma.folder.updateMany({
        where: { userId: user.id, parentId: input.id },
        data: { parentId: null },
    });
    await prisma.folder.delete({ where: { id: input.id } });
    return { message: 'Folder deleted successfully' };
}
