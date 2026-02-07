/**
 * Server-side auth helper only.
 * Use from server actions; do not import from client.
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export interface AuthUser {
    id: string;
    clerkUserId: string;
    email: string;
    name: string;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function getAuthUser(): Promise<AuthUser> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        throw new Error('Authentication required');
    }

    let user = await prisma.user.findUnique({
        where: { clerkUserId },
    });

    if (!user) {
        try {
            const clerk = await clerkClient();
            const clerkUser = await clerk.users.getUser(clerkUserId);
            const primaryEmail = clerkUser.emailAddresses.find(
                (e) => e.id === clerkUser.primaryEmailAddressId
            );
            const email = primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

            if (!email) {
                throw new Error('No email found for user');
            }

            const name =
                [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
                email.split('@')[0];

            user = await prisma.user.create({
                data: {
                    clerkUserId,
                    email,
                    name,
                    avatar: clerkUser.imageUrl ?? null,
                },
            });
            console.log('✅ Auto-created user:', email);
        } catch (err) {
            console.error('❌ Failed to auto-create user:', err);
            throw new Error('User not found. Please sign out and sign in again.');
        }
    }

    return user as AuthUser;
}
