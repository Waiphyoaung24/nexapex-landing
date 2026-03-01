'use client';

import React from 'react';

export default function Footer() {
    return (
        <footer className="text-center py-20 px-12 border-t border-cyan-subtle">
            <img
                src="/outline_iconmark.png"
                alt="NexApex Icon"
                className="h-10 mx-auto mb-4 opacity-50"
            />
            <p className="font-m text-[11px] text-silver-dark tracking-[2px] uppercase">
                © {new Date().getFullYear()} NexApex. All rights reserved.
            </p>
        </footer>
    );
}
