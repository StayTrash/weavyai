'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * AnimatedNumber component
 * 
 * Animates a number from its current value to a new `value` prop.
 * Uses requestAnimationFrame for smooth counting.
 * 
 * @param {number} value - The target number to animate to.
 * @param {number} duration - Animation duration in ms (default: 500ms).
 */
export default function AnimatedNumber({ value, duration = 500 }: { value: number, duration?: number }) {
    const [displayValue, setDisplayValue] = useState(value);
    const frameRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = displayValue;
        const endValue = value;
        startTimeRef.current = null;

        if (startValue === endValue) return;

        const animate = (currentTime: number) => {
            if (startTimeRef.current === null) startTimeRef.current = currentTime;
            const progress = Math.min((currentTime - startTimeRef.current) / duration, 1);

            // Easing function (easeOutQuad) for smoother animation
            const easeOutQuad = (t: number) => t * (2 - t);
            const easeProgress = easeOutQuad(progress);

            const current = Math.round(startValue + (endValue - startValue) * easeProgress);
            setDisplayValue(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [value, duration]); // Dependency on value triggers animation when it changes

    return <>{displayValue}</>;
}
