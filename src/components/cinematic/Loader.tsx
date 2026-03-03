import { useEffect, useState } from 'react';

interface LoaderProps {
  isLoading: boolean;
}

export default function Loader({ isLoading }: LoaderProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-bg transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Brand mark */}
      <div className="w-16 h-16 mb-8 opacity-40">
        <img
          src="/full_color_logo.png"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Loading bar */}
      <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan/60 to-cyan rounded-full"
          style={{
            animation: 'loaderBar 1.5s ease-in-out infinite',
            boxShadow: '0 0 8px rgba(148, 252, 255, 0.5)',
          }}
        />
      </div>

      {/* Label */}
      <p className="font-m text-[10px] tracking-[3px] uppercase text-dim mt-4">
        Loading Experience
      </p>
    </div>
  );
}
