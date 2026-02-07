import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/sections/Navbar';

export default function DemoPage() {
    return (
        <main
            className="h-screen w-full bg-center bg-no-repeat flex items-center justify-center relative overflow-hidden"
            style={{
                backgroundImage: "url('https://images.typeform.com/images/vDBLGfjmr6jj/image/default-firstframe.png')",
                backgroundSize: '100% 100%',
            }}
        >
            <Navbar />
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 p-12 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl max-w-lg mx-4 text-center transform hover:scale-[1.02] transition-transform duration-500">
                <h1 className="text-5xl md:text-7xl font-normal text-white mb-6 drop-shadow-xl tracking-tight">
                    In The Making
                </h1>
                <p className="text-xl text-white/90 mb-10 font-light tracking-wide leading-relaxed">
                    We are weaving something extraordinary for you.
                    <br />
                    Experience the magic perfectly unfolded.
                </p>
                <Link
                    href="/"
                    className="inline-block px-10 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium backdrop-blur-md border border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
                >
                    Return Home
                </Link>
            </div>      
        </main>
        
    );
}
