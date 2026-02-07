'use client';

import { useState } from 'react';
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import MonthlyCreditTable from './data/MonthlyCreditTable';
import PricingFAQ from './data/PricingFAQ';

export default function CollectivePage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

    return (
        <main className="relative w-full min-h-screen bg-[#bed3e2] overflow-visible z-50"
            style={{
                backgroundImage: `
          linear-gradient(to bottom, transparent 50%, #ffffff 100%),
          linear-gradient(rgba(232, 232, 227, 0.7), rgba(232, 232, 227, 0.2)),
          url(https://cdn.prod.website-files.com/681b040781d5b5e278a69989/681ccdbeb607e939f7db68fa_BG%20NET%20Hero.avif),
          linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
        `,
                backgroundSize: '100% 100%, cover, 100% auto, 10px 10px, 10px 10px',
                backgroundPosition: 'center bottom, center center, center top, 0 0, 0 0',
                backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat, repeat',
            }}>
            <Navbar />
            <div className="relative z-10 w-full max-w-7xl mx-auto px-20 py-20 flex flex-col items-center">
                <h1 className="mt-20 text-5xl md:text-6xl font-normal text-black mb-10 text-center tracking-tight">
                    Choose the best plan for you
                </h1>

                {/* Toggle */}
                <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-sm border border-black/5 mb-16">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-sm text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-black text-white shadow-sm' : 'hover:bg-white/80'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annually')}
                        className={`px-6 py-2 rounded-sm text-sm font-medium transition-colors ${billingCycle === 'annually' ? 'bg-black text-white shadow-sm' : 'hover:bg-white/80'}`}
                    >
                        Annually -20%
                    </button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {/* Free Plan */}
                    {/* Free Plan */}
                    <div className="bg-[#fcfbf9] rounded-sm p-6 border border-black/10 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-2xl font-normal mb-1">Free</h3>
                        <p className="text-gray-500 text-sm mb-4 h-8">Explore Weavy's possibilities</p>

                        <div className="mb-4">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-semibold">$0</span>
                                <span className="text-gray-500 ml-2 text-sm">/ Month</span>
                            </div>
                            <div className={`text-xs text-gray-400 mt-1 ${billingCycle === 'monthly' ? 'invisible' : ''}`}>billed annually as $0</div>
                        </div>

                        <button className="w-full py-2 bg-[#1a1a1a] text-white rounded-sm font-normal mb-4 hover:bg-black transition-colors">
                            Start free
                        </button>

                        <div className="mb-4 pb-4 border-b border-black/100">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-lg leading-none">✶</span>
                                <div>
                                    <span className="font-semibold text-black">150</span> monthly credits
                                    <div className="text-xs text-gray-400 mt-1">= 375 images or 25 sec video</div>
                                </div>
                            </div>
                        </div>

                        <ul className="space-y-2 text-sm flex-1">
                            {['Full access to all AI models', 'Professional-grade editing tools', 'Workflow collaboration feature', 'Commercial license', '5 workflows'].map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Starter Plan */}
                    {/* Starter Plan */}
                    <div className="bg-[#fcfbf9] rounded-sm p-6 border border-black/10 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-2xl font-normal mb-1">Starter</h3>
                        <p className="text-gray-500 text-sm mb-4 h-8">For creators producing content occasionally</p>

                        <div className="mb-4">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-semibold">$<AnimatedNumber value={billingCycle === 'annually' ? 19 : 24} /></span>
                                <span className="text-gray-500 ml-2 text-sm">/ Month</span>
                            </div>
                            <div className={`text-xs text-gray-400 mt-1 ${billingCycle === 'monthly' ? 'invisible' : ''}`}>billed annually as $228</div>
                        </div>

                        <button className="w-full py-2 bg-[#1a1a1a] text-white rounded-sm font-medium mb-4 hover:bg-black transition-colors">
                            Get this plan
                        </button>

                        <div className="mb-4 pb-4 border-b border-black/100">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-lg leading-none">✶</span>
                                <div>
                                    <span className="font-semibold text-black">1,500</span> monthly credits
                                    <div className="text-xs text-gray-400 mt-1">= 3,750 images or 417 sec video</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs font-semibold text-gray-900 mb-2">Everything in Free, plus -</div>
                        <ul className="space-y-2 text-sm flex-1">
                            {['Unlimited workflows', 'Top up at $10 for 1,000 credits'].map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Professional Plan */}
                    {/* Professional Plan */}
                    <div className="bg-[#ececec] rounded-sm p-6 border-2 border-black/100 relative flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
                        <div className="absolute -top-3 right-8 bg-[#e8ff8c] px-3 py-1 text-xs font-semibold rounded-sm">
                            Most popular
                        </div>
                        <h3 className="text-2xl font-normal mb-1">Professional</h3>
                        <p className="text-gray-500 text-sm mb-4 h-8">For professionals generating media daily</p>

                        <div className="mb-4">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-semibold">$<AnimatedNumber value={billingCycle === 'annually' ? 36 : 45} /></span>
                                <span className="text-gray-500 ml-2 text-sm">/ Month</span>
                            </div>
                            <div className={`text-xs text-gray-400 mt-1 ${billingCycle === 'monthly' ? 'invisible' : ''}`}>billed annually as $432</div>
                        </div>

                        <button className="w-full py-2 bg-[#1a1a1a] text-white rounded-sm font-medium mb-4 hover:bg-black transition-colors">
                            Get this plan
                        </button>

                        <div className="mb-4 pb-4 border-b border-black/100">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-lg leading-none">✶</span>
                                <div>
                                    <span className="font-semibold text-black">4,000</span> monthly credits
                                    <div className="text-xs text-gray-400 mt-1">= 10,000 images or 1,111 sec video</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs font-semibold text-gray-900 mb-2">Everything in Starter, plus -</div>
                        <ul className="space-y-2 text-sm flex-1">
                            <li className="flex items-start gap-3">
                                <svg className="w-5 h-5 flex-shrink-0 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-600">3-month credit rollover</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <svg className="w-5 h-5 flex-shrink-0 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-600 flex items-center gap-2 flex-wrap">
                                    Top up at $10 for 1,200 credits
                                    <span className="bg-black text-white text-[10px] px-1.5 rounded">Gain +20%</span>
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Team Plan */}
                    {/* Team Plan */}
                    <div className="bg-[#fcfbf9] rounded-sm p-6 border border-black/10 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-2xl font-normal mb-1">Team</h3>
                        <p className="text-gray-500 text-sm mb-4 h-8">For in-house and agency visual teams</p>

                        <div className="mb-4">
                            <div className="flex items-baseline">
                                <span className="text-4xl font-semibold">$<AnimatedNumber value={billingCycle === 'annually' ? 48 : 60} /></span>
                                <span className="text-gray-500 ml-2 text-sm">/ User / Month</span>
                            </div>
                            <div className={`text-xs text-gray-400 mt-1 ${billingCycle === 'monthly' ? 'invisible' : ''}`}>billed annually as $576</div>
                        </div>

                        <button className="w-full py-2 bg-[#1a1a1a] text-white rounded-sm font-medium mb-4 hover:bg-black transition-colors">
                            Get this plan
                        </button>

                        <div className="mb-4 pb-4 border-b border-black/100">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-lg leading-none">✶</span>
                                <div>
                                    <span className="font-semibold text-black">4,500</span> monthly credits / user
                                    <div className="text-xs text-gray-400 mt-1">= 11,250 images or 1,250 sec video</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs font-semibold text-gray-900 mb-2">Everything in Pro, plus -</div>
                        <ul className="space-y-2 text-sm flex-1">
                            {['Unified billing', 'Shared credit pool for maximal efficiency', 'Workspace file sharing', 'Team credits management'].map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Enterprise Solution */}
                <div className="w-full mt-6 bg-[#fcfbf9] rounded-sm p-8 border border-black/10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col items-start gap-6 max-w-md mx-auto">
                        <h3 className="text-xl font-normal text-black leading-tight">
                            Looking for an<br />enterprise solution?
                        </h3>
                        <button className="px-18 py-2 bg-[#1a1a1a] text-white rounded-sm font-normal hover:bg-black transition-colors">
                            Contact us
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 max-w-lg w-full">
                        <p className="text-gray-900 text-sm font-medium">Our Enterprise plan contains everything in Team plus:</p>
                        <ul className="space-y-1 text-sm">
                            {['Custom credit allocation', 'Team training', 'Premium customer support on Slack', 'Your own API keys', 'Run workflows through API - coming soon'].map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <svg className="w-5 h-5 flex-shrink-0 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-600">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <MonthlyCreditTable />
            <PricingFAQ />
            <Footer />
        </main>
    );
}