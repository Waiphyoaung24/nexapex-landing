import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initCubeScroll(): void {
  const section = document.getElementById('prelude-scroll');
  const logo = document.getElementById('prelude-logo');
  const lines = document.querySelectorAll<HTMLElement>('.prelude-line');
  if (!section || !logo || !lines.length) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
    },
  });

  // Logo scales in with glow intensification
  tl.to(logo, {
    scale: 1,
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out',
  }, 0);

  // Text lines stagger in from below
  lines.forEach((line, i) => {
    tl.to(line, {
      opacity: 1,
      y: 0,
      duration: 0.2,
      ease: 'power2.out',
    }, 0.2 + i * 0.1);
  });

  // Hold visible
  tl.to({}, { duration: 0.3 });

  // Everything fades out upward before cinematic hero
  tl.to(logo, {
    opacity: 0,
    y: -30,
    scale: 0.9,
    duration: 0.15,
    ease: 'power2.in',
  });
  tl.to(lines, {
    opacity: 0,
    y: -20,
    duration: 0.15,
    stagger: 0.02,
    ease: 'power2.in',
  }, '<');
}
