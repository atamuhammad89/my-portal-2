import React from "react";

export function CallAutomateLogoIcon({ className = "w-8 h-8", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="c-gradient-sidebar" x1="256" y1="50" x2="256" y2="462" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A855F7" />
          <stop offset="0.5" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="robot-cyan-sidebar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      <path
        d="M385 130C345 85 290 60 230 60C120 60 35 150 35 260C35 370 120 460 230 460C300 460 365 425 410 375"
        stroke="url(#c-gradient-sidebar)"
        strokeWidth="82"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M325 190C305 160 270 145 230 145C165 145 110 195 110 260C110 325 165 375 230 375C270 375 305 360 325 330"
        fill="#000000"
      />
      <g transform="translate(148, 160) scale(0.92)">
        <path d="M35 125C35 45 185 45 185 125" stroke="#1e293b" strokeWidth="14" fill="none" strokeLinecap="round" />
        <rect x="30" y="85" width="160" height="135" rx="45" fill="url(#robot-cyan-sidebar)" stroke="#1e293b" strokeWidth="8" />
        <rect x="48" y="105" width="124" height="95" rx="28" fill="white" />
        <g stroke="#1e293b" strokeWidth="8" strokeLinecap="round" fill="none">
          <path d="M78 142C82 138 92 138 96 142" />
          <path d="M124 142C128 138 138 138 142 142" />
          <path d="M95 175C105 185 135 185 145 175" />
        </g>
      </g>
    </svg>
  );
}
