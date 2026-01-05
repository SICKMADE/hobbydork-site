import React from 'react';
import './spinner.module.css';

// HobbyDork Spinner: a simple animated logo spinner
export default function Spinner({ size = 48 }: { size?: number }) {
  return (
    <div
      className={`flex items-center justify-center spinner-size`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="#10B981"
          strokeWidth="4"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d="M24 4a20 20 0 0 1 20 20"
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="24"
          r="6"
          fill="#10B981"
          opacity="0.7"
        />
        <text
          x="24"
          y="29"
          textAnchor="middle"
          fontSize="8"
          fill="#10B981"
          fontWeight="bold"
          fontFamily="monospace"
        >
          HD
        </text>
      </svg>
    </div>
  );
}
