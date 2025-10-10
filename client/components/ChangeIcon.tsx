import React from 'react';

export const ChangeIcon = ({ change }: { change: number }) => {
    const isPositive = change >= 0;
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: isPositive ? 'none' : 'rotate(180deg)' }}
        >
            <path
                d="M12 4L12 20M12 4L18 10M12 4L6 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
