import React from 'react';
import { IconName } from '../types';

interface IconProps {
  icon: IconName;
  className?: string;
}

// A simple map of icon names to SVG paths
const ICONS: Record<IconName, JSX.Element> = {
  sun: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  ),
  rain: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 15a4 4 0 004 4h9a5 5 0 10-.2-9.999A5.002 5.002 0 0013 3a5 5 0 00-10 0c0 1.667.667 3.167 1.667 4.167M8 19v1M12 19v1M16 19v1"
    />
  ),
  wind: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8V4m0 4h4m0-4H8m4 8v4m0-4H8m4-4h4m-4 4v4m0-4h4m-4-4H8"
    />
  ),
  temperature: (
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9 11.25v2.25c0 .621.504 1.125 1.125 1.125h1.5c.621 0 1.125-.504 1.125-1.125V11.25m-3.75 0V9a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0115 9v2.25m-3.75 0h3.75M9 15v.75a3 3 0 003 3h.01a3 3 0 003-3v-.75m-6 0h6" 
    />
  ),
  storm: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  ),
  snow: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 16.657L13.414 12.414m4.243 4.243L12 13.414m5.657 3.243L13.414 12m-1.414-1.414L6.343 16.657m1.414-1.414L12 13.414m-4.243-4.243L10.586 12m-4.243-4.243L12 10.586m-1.414-1.414L6.343 6.343"
    />
  ),
  cyclone: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 4.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 4.75zM12 17.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM5.5 12a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zM17.5 12a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zM8.086 8.086a.75.75 0 00-1.06 1.06l1.06-1.06zM15.914 15.914a.75.75 0 001.06-1.06l-1.06 1.06zM8.086 15.914a.75.75 0 001.06 1.06l-1.06-1.06zM15.914 8.086a.75.75 0 00-1.06-1.06l1.06 1.06z" />
  ),
  tsunami: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm3.938 1.828a.75.75 0 011.06-1.06l2.122 2.121 2.12-2.121a.75.75 0 011.061 1.06l-2.12 2.122 2.12 2.12a.75.75 0 01-1.06 1.061L12 16.251l-2.121 2.12a.75.75 0 01-1.06-1.06l2.12-2.12-2.12-2.12z" 
    />
  ),
  ticket: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M16.5 6v.75a3.375 3.375 0 01-3.375 3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 013.375-3.375H16.5m-3.375 0h1.125a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v-1.5a2.25 2.25 0 012.25-2.25H13.5m0 0V3.75m0 2.25V3.75m0 2.25v.008M5.25 6H9m-3.75 3H9m-3.75 3H9m3.75 3v-4.5m0 4.5h-3.75m3.75 0V15m0-3.75V9m0 2.25V9m0 2.25v.008" 
    />
  ),
};

export const Icon: React.FC<IconProps> = ({ icon, className }) => {
  const iconSvg = ICONS[icon] || undefined;
  if (!iconSvg) {
      // Fallback for icons not in the new IconName type, though this shouldn't happen with TS
    const fallbackIcon = <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            {fallbackIcon}
        </svg>
    )
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      {iconSvg}
    </svg>
  );
};