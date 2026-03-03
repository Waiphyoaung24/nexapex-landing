import { useRef, useEffect } from 'react';

interface ProgressBarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ProgressBar({ containerRef }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gsapModule = import('gsap');
    const scrollTriggerModule = import('gsap/ScrollTrigger');

    Promise.all([gsapModule, scrollTriggerModule]).then(
      ([{ default: gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);

        if (!barRef.current || !textRef.current || !containerRef.current) return;

        const setWidth = gsap.quickSetter(barRef.current, 'width', '%');
        const setText = gsap.quickSetter(textRef.current, 'textContent');

        const st = ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress * 100;
            setWidth(progress);
            setText(
              Math.round(progress).toString().padStart(3, '0') + '%',
            );
          },
        });

        // Fade out progress bar during transition zone (88-100%)
        if (wrapperRef.current) {
          gsap.to(wrapperRef.current, {
            opacity: 0,
            scrollTrigger: {
              trigger: containerRef.current,
              start: '88% top',
              end: '95% top',
              scrub: true,
            },
          });
        }

        return () => {
          st.kill();
        };
      },
    );
  }, [containerRef]);

  return (
    <div
      ref={wrapperRef}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3"
    >
      {/* Left decorative corner */}
      <div className="w-2 h-2 border-l border-t border-white/20" />

      {/* Progress track */}
      <div className="w-[200px] h-[2px] bg-white/10 relative overflow-hidden rounded-full">
        <div
          ref={barRef}
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan/60 to-cyan rounded-full"
          style={{
            width: '0%',
            boxShadow: '0 0 8px rgba(148, 252, 255, 0.5)',
          }}
        />
      </div>

      {/* Percentage text */}
      <span
        ref={textRef}
        className="font-m text-[11px] tracking-[2px] text-white/60 w-10"
      >
        000%
      </span>

      {/* Right decorative corner */}
      <div className="w-2 h-2 border-r border-b border-white/20" />
    </div>
  );
}
