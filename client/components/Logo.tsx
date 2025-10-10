import React from 'react';

export const Logo = ({ onClick }: { onClick: () => void }) => (
    <div className="logo" onClick={onClick} style={{ cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 14H6V10H8V14ZM12 16H10V8H12V16ZM16 12H14V10H16V12Z" fill="currentColor" />
        </svg>
        <span>WorldStocks</span>
    </div>
);
