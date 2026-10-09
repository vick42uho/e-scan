"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface YanheeLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-14 h-14",
};

export function YanheeLogo({
  size = "md",
  className,
  showText = false,
  ...props
}: YanheeLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeMap[size], "shrink-0 transition-transform duration-200 hover:scale-105 drop-shadow-sm")}
        {...props}
      >
        <defs>
          {/* Background Squircle Gradient */}
          <linearGradient id="yh-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Medical Cross Gradient */}
          <linearGradient id="yh-cross-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Document Sheet Gradient */}
          <linearGradient id="yh-doc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Glowing Scan Laser Gradient */}
          <linearGradient id="yh-laser-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="25%" stopColor="#22D3EE" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#67E8F9" stopOpacity="1" />
            <stop offset="75%" stopColor="#22D3EE" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>

          {/* Soft Drop Shadow Filter */}
          <filter id="yh-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0284C7" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer Beveled Squircle Container */}
        <rect
          x="6"
          y="6"
          width="116"
          height="116"
          rx="26"
          fill="url(#yh-bg-grad)"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="2.5"
        />

        {/* Inner Accent Ring */}
        <rect
          x="10"
          y="10"
          width="108"
          height="108"
          rx="22"
          fill="none"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="1.5"
        />

        {/* Stylized Medical Cross (Symbol of Healthcare & Hospital Trust) */}
        <g opacity="0.9">
          {/* Vertical Bar */}
          <rect x="50" y="24" width="28" height="80" rx="7" fill="url(#yh-cross-grad)" />
          {/* Horizontal Bar */}
          <rect x="24" y="50" width="80" height="28" rx="7" fill="url(#yh-cross-grad)" />
        </g>

        {/* Layered Digital Document (Folded Medical Chart) */}
        <g filter="url(#yh-glow)">
          {/* Back Document Layer (Subtle tilt) */}
          <rect
            x="49"
            y="35"
            width="40"
            height="56"
            rx="6"
            fill="#94A3B8"
            opacity="0.55"
            transform="rotate(6 69 63)"
          />

          {/* Front White Document Sheet */}
          <path
            d="M40 30 C40 26.686 42.686 24 46 24 H72 L88 40 V96 C88 99.314 85.314 102 82 102 H46 C42.686 102 40 99.314 40 96 V30 Z"
            fill="url(#yh-doc-grad)"
          />
          {/* Folded Corner */}
          <path
            d="M72 24 V36 C72 38.209 73.791 40 76 40 H88 Z"
            fill="#CBD5E1"
          />

          {/* Clinical Document Content Lines */}
          <rect x="48" y="47" width="28" height="4" rx="2" fill="#0284C7" />
          <rect x="48" y="57" width="32" height="3.5" rx="1.75" fill="#64748B" />
          <rect x="48" y="66" width="26" height="3.5" rx="1.75" fill="#64748B" />
          <rect x="48" y="75" width="30" height="3.5" rx="1.75" fill="#64748B" />
          <rect x="48" y="85" width="20" height="3" rx="1.5" fill="#0EA5E9" />
        </g>

        {/* High-Tech Glowing Laser Scan Beam (e-Scan Core Element) */}
        <g>
          {/* Laser Line */}
          <rect x="18" y="62" width="92" height="4" rx="2" fill="url(#yh-laser-grad)" />
          {/* Central Laser Intense Glow Core */}
          <circle cx="64" cy="64" r="5" fill="#A5F3FC" />
          <circle cx="64" cy="64" r="2.5" fill="#FFFFFF" />
          {/* Sparkles / Optics Nodes */}
          <circle cx="32" cy="64" r="1.5" fill="#67E8F9" opacity="0.9" />
          <circle cx="96" cy="64" r="1.5" fill="#67E8F9" opacity="0.9" />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Yanhee <span className="text-cyan-300 font-extrabold">e-Scan</span>
          </span>
          <span className="text-[10px] text-blue-200/80 tracking-wide">
            Yanhee Hospital DMS
          </span>
        </div>
      )}
    </div>
  );
}
