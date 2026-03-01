'use client';

import React from 'react';
import Image from 'next/image';

interface HeroSectionProps {
    id: string;
    title: string;
    subtitle?: string;
    logoSrc?: string;
    children?: React.ReactNode;
    showLine?: boolean;
}

export default function HeroSection({
    id,
    title,
    subtitle,
    logoSrc,
    children,
    showLine = true,
}: HeroSectionProps) {
    return (
        <section
            id={id}
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden border-b border-cyan-subtle"
        >
            {/* 3D Background Placeholder container */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {children}
            </div>

            <div className="relative z-10 text-center flex flex-col items-center max-w-4xl mx-auto px-6">

                {logoSrc && (
                    <div className="relative w-48 h-48 mb-12 animate-float filter drop-shadow-[0_0_60px_var(--color-cyan-glow)] drop-shadow-[0_0_120px_var(--color-cyan-subtle)]">
                        <Image
                            src={logoSrc}
                            alt="NexApex"
                            fill
                            sizes="192px"
                            className="object-contain"
                            priority
                        />
                    </div>
                )}

                {/* Eyebrow/Pre-title */}
                <div className="font-m text-[11px] tracking-[6px] uppercase text-silver-dark mb-5 opacity-0 animate-fade-up [animation-delay:300ms]">
                    NexApex Experience
                </div>

                <h1 className="font-d text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-widest text-gradient mb-4 opacity-0 animate-fade-up [animation-delay:500ms]">
                    {title}
                </h1>

                {subtitle && (
                    <p className="font-b text-lg md:text-xl text-silver-dark tracking-widest uppercase opacity-0 animate-fade-up [animation-delay:700ms]">
                        {subtitle}
                    </p>
                )}
            </div>

            {showLine && (
                <div className="absolute bottom-10 left-1/2 w-px h-20 bg-gradient-to-b from-cyan to-transparent animate-pulse-line -translate-x-1/2"></div>
            )}
        </section>
    );
}
