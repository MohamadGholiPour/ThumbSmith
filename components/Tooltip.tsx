import React, { ReactNode } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, className = '' }) => {
  return (
    <div className={`group relative flex items-center justify-center ${className}`}>
      {children}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[220px] px-3 py-1.5 bg-black/90 backdrop-blur text-white text-[10px] font-bold uppercase tracking-wide text-center rounded-md border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-[100] select-none translate-y-2 group-hover:translate-y-0">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
      </div>
    </div>
  );
};

export default Tooltip;