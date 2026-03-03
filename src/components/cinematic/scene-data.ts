export type TextPosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right';

export interface ScenePerspective {
  title: string;
  subtitle: string;
  position: TextPosition;
  camera: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  scrollProgress: { start: number; end: number };
  hideText?: boolean;
  isHero?: boolean;
}

export const scenePerspectives: ScenePerspective[] = [
  {
    title: 'THE APEX OF\nINTELLIGENCE',
    subtitle: 'NEXAPEX',
    position: 'center',
    camera: { x: 0, y: 0, z: 12 },
    target: { x: 0, y: 0, z: 0 },
    scrollProgress: { start: 0, end: 11.9 },
    isHero: true,
  },
  {
    title: 'INTELLIGENCE',
    subtitle: 'Systems That Learn, Adapt & Decide',
    position: 'left',
    camera: { x: 8, y: 1, z: 8 },
    target: { x: 0, y: 0, z: 0 },
    scrollProgress: { start: 11.9, end: 23.7 },
  },
  {
    title: 'INTEGRATION',
    subtitle: 'Connecting Digital Systems to Physical Operations',
    position: 'right',
    camera: { x: 12, y: 2, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    scrollProgress: { start: 23.7, end: 35.6 },
  },
  {
    title: 'OPTIMIZATION',
    subtitle: 'Data-Driven Decisions at Every Layer',
    position: 'top-left',
    camera: { x: 5, y: 8, z: 5 },
    target: { x: 0, y: -1, z: 0 },
    scrollProgress: { start: 35.6, end: 45.8 },
  },
  {
    title: '',
    subtitle: '',
    position: 'top-right',
    camera: { x: -2, y: 10, z: 3 },
    target: { x: 0, y: -1, z: 0 },
    scrollProgress: { start: 45.8, end: 52.5 },
    hideText: true,
  },
  {
    title: 'AUTOMATION',
    subtitle: 'From Factory Floor to Cloud Infrastructure',
    position: 'center',
    camera: { x: -8, y: 2, z: -6 },
    target: { x: 0, y: 0, z: 0 },
    scrollProgress: { start: 52.5, end: 62.7 },
  },
  {
    title: 'PRECISION',
    subtitle: 'Technical Excellence From the Ground Up',
    position: 'bottom-right',
    camera: { x: -6, y: -2, z: 8 },
    target: { x: 0, y: 1, z: 0 },
    scrollProgress: { start: 62.7, end: 69.5 },
  },
  {
    title: 'NEX APEX',
    subtitle: 'Reach the Peak',
    position: 'top',
    camera: { x: 0, y: 6, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    scrollProgress: { start: 69.5, end: 77.9 },
  },
  {
    title: '',
    subtitle: '',
    position: 'center',
    camera: { x: 8, y: 3, z: -6 },
    target: { x: 0, y: 0, z: 0 },
    scrollProgress: { start: 77.9, end: 88 },
    hideText: true,
  },
  {
    title: '',
    subtitle: '',
    position: 'center',
    camera: { x: 2, y: 1, z: 14 },
    target: { x: 0, y: 0, z: 0 },
    scrollProgress: { start: 88, end: 100 },
    hideText: true,
  },
];

export function getPositionClasses(position: TextPosition): string {
  switch (position) {
    case 'center':
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
    case 'left':
      return 'left-[8vw] top-1/2 -translate-y-1/2';
    case 'right':
      return 'right-[8vw] top-1/2 -translate-y-1/2 max-md:left-1/2 max-md:-translate-x-1/2 max-md:right-auto';
    case 'top':
      return 'top-[20vh] left-1/2 -translate-x-1/2 text-center';
    case 'top-left':
      return 'top-[20vh] max-md:top-[25vh] left-[8vw] max-md:left-6';
    case 'top-right':
      return 'top-[20vh] max-md:top-[25vh] right-[8vw] max-md:right-6 flex flex-col items-end';
    case 'bottom':
      return 'bottom-[20vh] left-1/2 -translate-x-1/2 text-center';
    case 'bottom-left':
      return 'bottom-[20vh] left-[8vw] max-md:left-6 flex flex-col items-start text-left';
    case 'bottom-right':
      return 'bottom-[20vh] right-[8vw] max-md:right-6 flex flex-col items-end text-right';
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center';
  }
}
