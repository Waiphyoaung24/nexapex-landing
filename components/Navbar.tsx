'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 w-full z-[100] bg-bg/80 backdrop-blur-xl border-b border-cyan-subtle transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">

                <Link
                    href="/"
                    className="group relative flex items-center cursor-pointer"
                >
                    <div className="relative h-14 w-14 transition-all duration-500 group-hover:drop-shadow-[0_0_20px_rgba(148,252,255,0.3)]">
                        <Image
                            src="/full_color_logo.png"
                            alt="NexApex Logo"
                            fill
                            sizes="56px"
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="font-d text-[13px] tracking-[3px] uppercase text-silver-light/80 ml-3 hidden sm:block transition-colors duration-300 group-hover:text-cyan">
                        Nex Apex
                    </span>
                </Link>

                <ul className="hidden md:flex gap-7 list-none m-0 p-0 items-center">
                    {[
                        { label: 'Services', href: '#services' },
                        { label: 'Process', href: '#process' },
                        { label: 'Work', href: '#work' },
                        { label: 'About', href: '#about' },
                    ].map((item) => (
                        <li key={item.label}>
                            <Link
                                href={item.href}
                                className="text-silver-dark no-underline font-m text-[11px] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative py-1 cursor-pointer hover:text-cyan
                           after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-cyan after:transition-all after:duration-400 after:ease-out hover:after:w-full"
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <Link
                            href="#contact"
                            className="font-m text-[11px] font-medium tracking-[1.5px] uppercase px-5 py-2 border border-cyan/30 text-cyan no-underline cursor-pointer transition-all duration-300 hover:bg-cyan/10 hover:border-cyan/60"
                        >
                            Contact
                        </Link>
                    </li>
                </ul>

            </div>
        </nav>
    );
}
