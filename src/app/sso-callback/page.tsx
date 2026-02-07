'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import Link from 'next/link';

/**
 * SSO Callback Page
 *
 * Handles the OAuth redirect callback from Clerk.
 * Shows a polished loading state while redirecting to dashboard.
 */
export default function SSOCallbackPage() {
    return (
        <div
            className="relative flex min-h-screen w-full flex-col items-center justify-center"
            style={{
                backgroundImage: `
          linear-gradient(to bottom, transparent 50%, #ffffff 100%),
          linear-gradient(to bottom, rgba(219, 226, 231, 0.5) 0%, rgba(219, 226, 231, 0.7) 30%, rgba(255, 255, 255, 0.9) 100%),
          url(https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681ccdbeb607e939f7db68fa_BG%20NET%20Hero.avif),
          linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
        `,
                backgroundSize: '100% 100%, cover, cover, 10px 10px, 10px 10px',
                backgroundPosition: 'center bottom, center center, center top, 0 0, 0 0',
                backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat, repeat',
            }}
        >
            {/* Weavy Logo */}
            <Link href="/" className="absolute left-0 top-0 z-10 p-4 md:p-6">
                <img
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/2f5fd82e-0e64-4bc1-b8bd-486911a2d083-weavy-ai/assets/svgs/682350d42a7c97b440a58480_Nav_20left_20item_20-_20D-1.svg"
                    alt="Weavy Logo"
                    className="h-10 w-auto invert"
                />
            </Link>

            {/* Loading Card */}
            <div className="flex flex-col items-center rounded-2xl border border-white/50 bg-white/80 px-12 py-10 shadow-xl backdrop-blur-sm">
                {/* Animated Spinner */}
                <div className="relative mb-6">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-[#5d8190]" />
                    <div className="absolute inset-0 animate-pulse rounded-full bg-[#5d8190]/10" />
                </div>

                <h3 className="mb-2 text-center text-2xl font-medium text-gray-900">
                    Signing you in...
                </h3>
                <p className="max-w-[280px] text-center text-sm text-gray-500">
                    Please wait while we redirect you to your dashboard
                </p>
            </div>

            {/* Hidden Clerk callback handler */}
            <div className="hidden">
                <AuthenticateWithRedirectCallback />
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 right-8 text-xs text-gray-500">
                © 2026 Weavy. All rights reserved.
            </div>
        </div>
    );
}
