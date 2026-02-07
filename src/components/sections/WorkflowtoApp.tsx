'use client';

import { useState, useEffect, useRef } from 'react';
import { workflowToAppData } from './data/workflowtoapp.data';

export default function WorkflowToApp() {
    const [isAppMode, setIsAppMode] = useState(false);
    const { subHeadline, headlineStart, headlineEnd, images, appMode } = workflowToAppData;
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            const triggerPoint = window.innerHeight * 0.75; // Trigger when section is 75% up the viewport

            // Logic: Switch to App Mode when user scrolls down
            // Reset to Workflow Mode when user scrolls up
            // Check if section top has crossed the trigger point
            if (rect.top < triggerPoint) {
                if (!isAppMode) setIsAppMode(true);
            } else {
                if (isAppMode) setIsAppMode(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isAppMode]);

    return (
        <section ref={sectionRef} className="w-full bg-white py-20 px-4 md:px-[5%] overflow-hidden">
            <div className="container mx-auto max-w-[1440px]">
                {/* Header Section */}
                <div className="mb-12 md:mb-20">
                    <p className="text-gray-600 text-sm md:text-base max-w-[400px] mb-8 md:mb-12 leading-relaxed">
                        {subHeadline}
                    </p>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                        <div className="flex items-center gap-4 md:gap-8 flex-wrap">
                            {/* Left Text */}
                            <h2
                                className={`text-[40px] md:text-[80px] leading-[1.1] tracking-[-0.03em] transition-colors duration-300 ${!isAppMode ? 'text-black' : 'text-[#a1a1a1]'
                                    }`}
                            >
                                {headlineStart}
                            </h2>

                            {/* Toggle Switch */}
                            <div
                                className="relative w-[100px] h-[52px] md:w-[140px] md:h-[72px] bg-[#f7ff9e] rounded-full p-2 transition-transform border-none outline-none focus:ring-2 ring-black/5 pointer-events-none"
                                aria-label="Toggle App Mode"
                            >
                                <div
                                    className={`absolute top-1/2 -translate-y-1/2 w-[36px] h-[36px] md:w-[56px] md:h-[56px] bg-black rounded-full shadow-sm transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isAppMode
                                        ? 'left-[calc(100%-44px)] md:left-[calc(100%-64px)]'
                                        : 'left-2 md:left-2'
                                        }`}
                                />
                            </div>

                            {/* Right Text */}
                            <h2
                                className={`text-[40px] md:text-[80px] leading-[1.1] tracking-[-0.03em] transition-colors duration-300 ${isAppMode ? 'text-black' : 'text-[#a1a1a1]'
                                    }`}
                            >
                                {headlineEnd}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Content Display */}
                <div className="relative w-full aspect-[16/9] md:aspect-[2/1] bg-[#f5f5f5] rounded-[24px] overflow-hidden">
                    {/* Workflow Image */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-500 ${!isAppMode ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        <img
                            src={images.workflow}
                            alt="Workflow View"
                            className="w-full h-full object-contain p-8 md:p-16"
                        />
                    </div>

                    {/* App Mode Image */}
                    <div
                        className={`absolute inset-0 transition-opacity duration-500 ${isAppMode ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        <img
                            src={images.app}
                            alt="App Mode View"
                            className="w-full h-full object-contain p-8 md:p-16"
                        />

                        {/* Optional Overlay UI for App Mode if needed based on data */}
                        {isAppMode && (
                            <div className="absolute inset-0 pointer-events-none" />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
