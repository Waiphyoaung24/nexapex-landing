import React from 'react';

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
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(26,38,48,0.6), #0e1418 70%)' }}
        >
            {/* 3D Background Placeholder container */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {children}
            </div>

            <div className="relative z-10 text-center flex flex-col items-center max-w-4xl mx-auto px-6">

                {logoSrc && (
                    <div className="relative w-48 h-48 mb-12 animate-float" style={{ filter: 'drop-shadow(0 0 50px rgba(148,252,255,0.1)) drop-shadow(0 0 120px rgba(148,252,255,0.06))' }}>
                        <img
                            src={logoSrc}
                            alt="NexApex"
                            width={192}
                            height={192}
                            className="object-contain w-full h-full"
                        />
                    </div>
                )}

                {/* Eyebrow/Pre-title */}
                <div className="font-m text-[11px] tracking-[6px] uppercase text-dim mb-5 opacity-0 animate-fade-up [animation-delay:300ms]">
                    NexApex Experience
                </div>

                <h1 className="font-d font-extrabold tracking-widest text-gradient mb-4 opacity-0 animate-fade-up [animation-delay:500ms]"
                    style={{ fontSize: 'clamp(32px, 5vw, 58px)', letterSpacing: '2px' }}
                >
                    {title}
                </h1>

                {subtitle && (
                    <p className="font-b text-lg md:text-xl text-dim tracking-widest uppercase opacity-0 animate-fade-up [animation-delay:700ms]">
                        {subtitle}
                    </p>
                )}
            </div>

            {showLine && (
                <div className="absolute bottom-10 left-1/2 w-px h-20 bg-gradient-to-b from-cyan to-transparent animate-pulse-line -translate-x-1/2" />
            )}
        </section>
    );
}
