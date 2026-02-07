/**
 * Clerk Webhook Handler
 * 
 * Syncs user data from Clerk to our database.
 * Handles user.created, user.updated, and user.deleted events.
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('❌ Missing CLERK_WEBHOOK_SECRET');
        return new Response('Missing webhook secret', { status: 500 });
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Missing svix headers', { status: 400 });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('❌ Error verifying webhook:', err);
        return new Response('Invalid signature', { status: 400 });
    }

    // Handle the event
    const eventType = evt.type;
    console.log(`📧 Webhook received: ${eventType}`);

    try {
        if (eventType === 'user.created' || eventType === 'user.updated') {
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;

            // Get primary email
            const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id);
            const email = primaryEmail?.email_address || email_addresses[0]?.email_address;

            if (!email) {
                console.error('❌ No email found for user:', id);
                return new Response('No email found', { status: 400 });
            }

            // Build name from first and last name, or use email prefix
            const name = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];

            // Upsert user in database
            await prisma.user.upsert({
                where: { clerkUserId: id },
                update: {
                    email,
                    name,
                    avatar: image_url || null,
                },
                create: {
                    clerkUserId: id,
                    email,
                    name,
                    avatar: image_url || null,
                },
            });

            console.log(`✅ User ${eventType === 'user.created' ? 'created' : 'updated'}:`, email);
        }

        if (eventType === 'user.deleted') {
            const { id } = evt.data;

            if (id) {
                // Delete user and cascade delete their workflows/folders
                await prisma.user.delete({
                    where: { clerkUserId: id },
                }).catch((err) => {
                    // User might not exist in our DB yet
                    console.log('User not found in database, skipping delete:', id);
                });

                console.log('✅ User deleted:', id);
            }
        }

        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return new Response('Error processing webhook', { status: 500 });
    }
}
