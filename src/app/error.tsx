'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

/**
 * Global Error Page
 *
 * Catches runtime errors and displays a user-friendly error message
 * matching the Weavy website theme.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

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

            {/* Error Card */}
            <div className="flex flex-col items-center rounded-2xl border border-white/50 bg-white/80 px-12 py-10 shadow-xl backdrop-blur-sm">
                {/* Error Icon */}
                <div className="relative mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/10" />
                </div>

                <h3 className="mb-2 text-center text-2xl font-medium text-gray-900">
                    Something went wrong
                </h3>
                <p className="mb-6 max-w-[320px] text-center text-sm text-gray-500">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#333] hover:shadow-md active:scale-[0.98]"
                    >
                        <Home className="h-4 w-4" />
                        Go Home
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 right-8 text-xs text-gray-500">
                © 2026 Weavy. All rights reserved.
            </div>
        </div>
    );
}
