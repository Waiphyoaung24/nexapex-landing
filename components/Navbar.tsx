'use client';

import React from 'react';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 w-full z-[100] bg-bg/80 backdrop-blur-xl border-b border-cyan-subtle transition-all duration-300">
            <div className="max-w-7xl mx-auto px-12 flex items-center justify-between h-16">

                <Link href="/" className="h-6 opacity-85 hover:opacity-100 transition-opacity duration-300">
                    <img
                        src="/wordmark.png"
                        alt="NexApex Logo"
                        className="h-full object-contain"
                    />
                </Link>

                <ul className="hidden md:flex gap-7 list-none m-0 p-0">
                    {['Story', 'Logo', 'Colors', 'Typography', 'Usage'].map((item) => (
                        <li key={item}>
                            <Link
                                href={`#${item.toLowerCase()}`}
                                className="text-silver-dark no-underline font-m text-[11px] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative py-1 hover:text-cyan
                           after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-cyan after:transition-all after:duration-400 after:ease-out hover:after:w-full"
                            >
                                {item}
                            </Link>
                        </li>
                    ))}
                </ul>

            </div>
        </nav>
    );
}
