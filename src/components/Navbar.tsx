import React from 'react';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 w-full z-[100] bg-bg/80 backdrop-blur-[20px] border-b border-cyan-subtle transition-all duration-500" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-[60px]">

                <a
                    href="/"
                    className="group relative flex items-center cursor-pointer no-underline"
                >
                    <div className="relative h-10 w-10 transition-all duration-500 group-hover:drop-shadow-[0_0_20px_rgba(148,252,255,0.3)]" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
                        <img
                            src="/full_color_logo.png"
                            alt="NexApex Logo"
                            width={40}
                            height={40}
                            className="object-contain w-full h-full"
                        />
                    </div>
                    <span className="font-d text-[12px] tracking-[3px] uppercase text-sage/80 ml-3 hidden sm:block transition-colors duration-300 group-hover:text-cyan">
                        Nex Apex
                    </span>
                </a>

                <ul className="hidden md:flex gap-7 list-none m-0 p-0 items-center">
                    {[
                        { label: 'Services', href: '#services' },
                        { label: 'Process', href: '#process' },
                        { label: 'Work', href: '#work' },
                        { label: 'About', href: '#about' },
                    ].map((item) => (
                        <li key={item.label}>
                            <a
                                href={item.href}
                                className="text-dim no-underline font-m text-[11px] font-medium tracking-[1.5px] uppercase transition-all duration-300 relative py-1 cursor-pointer hover:text-cyan
                           after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-cyan after:transition-all after:duration-400 after:ease-out hover:after:w-full"
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                    <li>
                        <a
                            href="#contact"
                            className="font-m text-[11px] font-medium tracking-[1.5px] uppercase px-4 py-[6px] border border-cyan/30 text-cyan no-underline cursor-pointer transition-all duration-300 hover:bg-cyan/10 hover:border-cyan/60"
                        >
                            Contact
                        </a>
                    </li>
                </ul>

            </div>
        </nav>
    );
}
