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
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[220px] px-3 py-2 bg-slate-900 text-slate-200 text-xs font-medium text-center rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] select-none">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
};

export default Tooltip;