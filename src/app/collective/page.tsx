'use client';

import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { COLLECTIVE_NODES } from './data/collective.data';

export default function CollectivePage() {
    return (
        <main className="min-h-screen bg-background flex flex-col">
            <Navbar hideOnFooter={false} />

            <div className="flex-grow flex flex-col justify-center px-6 md:px-12 lg:px-24 py-20 mt-20">
                <div className="max-w-7xl mx-auto w-full">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-foreground mb-12">
                        Artist Collective Program
                    </h1>

                    <div className="flex flex-col lg:flex-row justify-between items-end gap-12 lg:gap-24">
                        <div className="w-full lg:w-1/2 space-y-8">
                            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-sans">
                                A global crew of artists, designers, engineers, and filmmakers who don't
                                treat AI like a hack – they treat it like clay, its messy, powerful, and meant
                                to be molded.
                            </p>
                            <p className="text-lg md:text-xl text-foreground/90 leading-relaxed font-sans">
                                This collective lives in the guts of it all – the process, the craft, the "what
                                if I break it?" moments. They're not just using Weavy – they're shaping it.
                            </p>

                            <p className="text-sm md:text-base text-muted-foreground mt-8">
                                This is the Artist Collective. Earned. Not automated.
                            </p>
                        </div>

                        <div className="w-full lg:w-auto">
                            <Button
                                className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 text-2xl px-16 py-8 h-auto w-full lg:w-auto rounded-md whitespace-nowrap"
                            >
                                Apply now
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-6 md:px-12 lg:px-24 pb-20">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COLLECTIVE_NODES.map((node, index) => (
                        <div key={node.id} className="flex flex-col gap-3">
                            <div
                                className={`group relative w-full overflow-hidden rounded-lg bg-background hover:bg-[#FDFFA8] transition-colors duration-500 ease-out ${index === 1 || index === 2 ? 'aspect-[2/3]' :
                                    index === 4 ? 'aspect-[4/3]' : 'aspect-square'
                                    }`}
                            >
                                {/* Hover Content */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 z-10 pointer-events-none group-hover:pointer-events-auto">
                                    {/* Social Icons (Placeholder SVG if Lucide not available or just use text if unsure, but assuming icons) */}
                                    <div className="flex gap-4">
                                        {/* Simple SVG Icons for generic use to avoid import issues if not sure */}
                                        {node.data.socials && (
                                            <>
                                                <a href={node.data.socials.linkedin} className="text-black hover:opacity-70 transition-opacity">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                                                </a>
                                                <a href={node.data.socials.instagram} className="text-black hover:opacity-70 transition-opacity">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                                </a>
                                            </>
                                        )}
                                    </div>

                                    {/* Text Content */}
                                    {(node.data.bio || node.data.description) && (
                                        <div className="mt-auto text-black pb-4 pr-12">
                                            {node.data.bio && (
                                                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 text-black/60">
                                                    {node.data.bio}
                                                </h3>
                                            )}
                                            {node.data.description && (
                                                <p className="text-[13px] md:text-[14px] leading-snug font-normal">
                                                    {node.data.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Image Container */}
                                <div className="absolute top-0 right-0 w-full h-full transition-all duration-500 ease-in-out group-hover:w-[50%] group-hover:h-[50%] z-0">
                                    {(node.type === 'imageNode' && 'image' in node.data) && (
                                        <img
                                            src={node.data.image as string}
                                            alt={(node.data.label as string) || 'Collective Art'}
                                            className="object-cover w-full h-full"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Artist Profile Section (For all items with avatar) */}
                            {node.data.avatar && (
                                <div className="flex items-center gap-3 mt-1">
                                    <img
                                        src={node.data.avatar}
                                        alt={node.data.label as string}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                    <div className="flex flex-col">
                                        <h3 className="text-sm text-foreground font-normal leading-tight">
                                            {node.data.label as string}
                                        </h3>
                                        {node.data.role && (
                                            <p className="text-[10px] font-normal tracking-wider uppercase text-[#0F172A]/70 mt-1">
                                                {node.data.role}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </main>
    );
}
