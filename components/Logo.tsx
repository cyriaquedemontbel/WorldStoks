import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SkyBet Logo"
    >
      <title>SkyBet Logo</title>
      {/* Cloud Shape */}
      <path 
        className="fill-primary dark:fill-primary-dark transition-colors"
        d="M75,35 A25,25 0 0,0 25,35 A20,20 0 0,0 25,75 L75,75 A20,20 0 0,0 75,35 Z"
      />
      {/* Bar chart "sun rays" inside the cloud */}
      <g className="transition-colors">
        <rect x="35" y="45" width="10" height="20" className="fill-white dark:fill-slate-900" rx="2" />
        <rect x="50" y="35" width="10" height="30" className="fill-white dark:fill-slate-900" rx="2" />
        <rect x="65" y="50" width="10" height="15" className="fill-white dark:fill-slate-900" rx="2" />
      </g>
    </svg>
  );
};

export default Logo;