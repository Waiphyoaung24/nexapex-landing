import React, { useState, useEffect, useCallback } from 'react';

const NAV_ITEMS = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Products', href: '#work' },
  { label: 'About', href: '#about' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleNavClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[100] bg-bg/80 backdrop-blur-[20px] border-b border-cyan-subtle transition-all duration-500" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-[60px]">

          {/* Logo */}
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
              NexApex
            </span>
          </a>

          {/* Desktop navigation */}
          <ul className="hidden md:flex gap-7 list-none m-0 p-0 items-center">
            {NAV_ITEMS.map((item) => (
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

          {/* Hamburger button — mobile only */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center cursor-pointer bg-transparent border-none outline-none z-[110]"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            <div className="relative w-5 h-3.5">
              <span
                className="absolute left-0 w-full h-px bg-white transition-all duration-300 ease-out origin-center"
                style={{
                  top: isOpen ? '50%' : '0',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                }}
              />
              <span
                className="absolute left-0 top-1/2 w-full h-px bg-white transition-all duration-200 ease-out"
                style={{
                  opacity: isOpen ? 0 : 1,
                  transform: isOpen ? 'scaleX(0)' : 'scaleX(1)',
                }}
              />
              <span
                className="absolute left-0 w-full h-px bg-white transition-all duration-300 ease-out origin-center"
                style={{
                  bottom: isOpen ? 'auto' : '0',
                  top: isOpen ? '50%' : 'auto',
                  transform: isOpen ? 'rotate(-45deg)' : 'none',
                }}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className="fixed inset-0 z-[99] md:hidden transition-all duration-400"
        style={{
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0,
          transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-bg/95 backdrop-blur-[30px]"
          onClick={() => setIsOpen(false)}
        />

        {/* Menu content */}
        <div
          className="relative flex flex-col items-center justify-center h-full gap-1 px-8"
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        >
          {NAV_ITEMS.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              onClick={handleNavClick}
              className="block py-4 font-d text-2xl tracking-[4px] uppercase text-white/80 no-underline cursor-pointer transition-all duration-300 hover:text-cyan"
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.4s ${0.1 + i * 0.05}s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.4s ${0.1 + i * 0.05}s cubic-bezier(0.22, 0.61, 0.36, 1), color 0.3s`,
              }}
            >
              {item.label}
            </a>
          ))}

          {/* Contact CTA */}
          <a
            href="#contact"
            onClick={handleNavClick}
            className="mt-8 font-m text-sm font-medium tracking-[2px] uppercase px-8 py-3 border border-cyan/40 text-cyan no-underline cursor-pointer transition-all duration-300 hover:bg-cyan/10 hover:border-cyan/60 rounded-lg"
            style={{
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 0.4s ${0.1 + NAV_ITEMS.length * 0.05}s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.4s ${0.1 + NAV_ITEMS.length * 0.05}s cubic-bezier(0.22, 0.61, 0.36, 1), color 0.3s, background-color 0.3s, border-color 0.3s`,
            }}
          >
            Contact
          </a>

          {/* Decorative bottom line */}
          <div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent"
            style={{
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.6s 0.3s',
            }}
          />
        </div>
      </div>
    </>
  );
}
