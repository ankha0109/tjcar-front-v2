import React from "react";

export const CarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 17h14M5 17v-3.5l1.6-4.2A2 2 0 0 1 8.5 8h7a2 2 0 0 1 1.9 1.3L19 13.5V17M5 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M16 17v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
    <circle cx="8" cy="14.5" r="0.5" fill="currentColor" />
    <circle cx="16" cy="14.5" r="0.5" fill="currentColor" />
  </svg>
);
