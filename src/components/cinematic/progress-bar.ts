/** Create progress bar DOM and initialize GSAP scroll tracking */
export function createProgressBar(parent: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.id = 'progress-wrapper';
  wrapper.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3';
  wrapper.innerHTML = `
    <div class="w-2 h-2 border-l border-t border-white/20"></div>
    <div class="w-[200px] h-[2px] bg-white/10 relative overflow-hidden rounded-full">
      <div id="progress-bar" class="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan/60 to-cyan rounded-full" style="width: 0%; box-shadow: 0 0 8px rgba(148, 252, 255, 0.5);"></div>
    </div>
    <span id="progress-text" class="font-m text-[11px] tracking-[2px] text-white/60 w-10">000%</span>
    <div class="w-2 h-2 border-r border-b border-white/20"></div>
  `;
  parent.appendChild(wrapper);
  return wrapper;
}

export function initProgressBar(
  scrollContainer: HTMLElement,
): (() => void) {
  const gsapModule = import('gsap');
  const scrollTriggerModule = import('gsap/ScrollTrigger');

  let cleanup: (() => void) | null = null;

  Promise.all([gsapModule, scrollTriggerModule]).then(
    ([{ default: gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);

      const bar = document.getElementById('progress-bar');
      const text = document.getElementById('progress-text');
      const wrapper = document.getElementById('progress-wrapper');
      if (!bar || !text || !scrollContainer) return;

      // Start hidden — fade in after 2% scroll so cube section is clear
      if (wrapper) gsap.set(wrapper, { opacity: 0 });

      const fadeInSt = ScrollTrigger.create({
        trigger: scrollContainer,
        start: '0% top',
        end: '2% top',
        scrub: 2,
        onUpdate: (self) => {
          if (wrapper) gsap.set(wrapper, { opacity: self.progress });
        },
      });

      const setWidth = gsap.quickSetter(bar, 'width', '%');
      const setText = gsap.quickSetter(text, 'textContent');

      const st = ScrollTrigger.create({
        trigger: scrollContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
        onUpdate: (self) => {
          const progress = self.progress * 100;
          setWidth(progress);
          setText(Math.round(progress).toString().padStart(3, '0') + '%');
        },
      });

      // Fade out during transition zone (88-100%)
      if (wrapper) {
        gsap.to(wrapper, {
          opacity: 0,
          scrollTrigger: {
            trigger: scrollContainer,
            start: '88% top',
            end: '95% top',
            scrub: 2,
          },
        });
      }

      cleanup = () => { fadeInSt.kill(); st.kill(); };
    },
  );

  return () => {
    if (cleanup) cleanup();
  };
}
