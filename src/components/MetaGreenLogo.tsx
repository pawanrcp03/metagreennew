import React from 'react';
import { useLogos } from '@/src/context/LogoContext';
import { useAuth } from '@/src/context/AuthContext';

interface MetaGreenLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSub?: string;
  variant?: 'light' | 'dark' | 'auto';
  inverted?: boolean;
}

export const MetaGreenLogo: React.FC<MetaGreenLogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true,
  textSub,
  variant = 'auto',
  inverted = false
}) => {
  const { logos } = useLogos();
  const { user } = useAuth();

  const dimensions = {
    sm: { width: 140, height: 42, iconSize: 32, fontSize: 16 },
    md: { width: 220, height: 60, iconSize: 48, fontSize: 22 },
    lg: { width: 320, height: 90, iconSize: 72, fontSize: 30 },
    xl: { width: 450, height: 130, iconSize: 100, fontSize: 42 },
  }[size];

  const isDarkMode = variant === 'dark' || inverted;
  const customLogo = user?.companyLogo || user?.vendorAccount?.companyLogo || logos.companyLogo;
  const companyTitle = user?.companyName || user?.vendorAccount?.companyName || logos.companyName || 'METAGREEN';
  const subText = textSub || logos.tagline || 'SOLAR SOFTWARE SOLUTIONS';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {customLogo ? (
        <img 
          src={customLogo} 
          alt={companyTitle} 
          style={{ height: dimensions.iconSize, maxHeight: dimensions.iconSize }}
          className="w-auto object-contain rounded-md drop-shadow-sm shrink-0" 
        />
      ) : (
        /* METAGREEN Icon SVG */
        <svg 
          width={dimensions.iconSize} 
          height={dimensions.iconSize} 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-sm"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>

            <linearGradient id="mGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>

            <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>

          {/* Top Arch */}
          <path 
            d="M 35,80 A 65,65 0 0,1 165,80" 
            fill="none" 
            stroke="url(#arcGrad)" 
            strokeWidth="6" 
            strokeLinecap="round" 
          />

          {/* Sun & Rays */}
          <circle cx="100" cy="72" r="20" fill="url(#sunGrad)" />
          {/* Sun Rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
            <line
              key={i}
              x1="100"
              y1="72"
              x2={100 + 28 * Math.cos((deg * Math.PI) / 180)}
              y2={72 + 28 * Math.sin((deg * Math.PI) / 180)}
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          ))}

          {/* Left M Shape */}
          <path 
            d="M 40,85 L 62,85 L 82,120 L 102,90 L 102,140 L 80,140 L 80,115 L 62,145 L 40,110 Z" 
            fill="url(#mGrad)" 
          />

          {/* Solar Panel Grid under M */}
          <g transform="translate(38, 128) skewX(-20) scale(0.9, 0.5)">
            <rect x="0" y="0" width="60" height="40" fill="url(#panelGrad)" rx="3" stroke="#ffffff" strokeWidth="2" />
            <line x1="20" y1="0" x2="20" y2="40" stroke="#ffffff" strokeWidth="2" />
            <line x1="40" y1="0" x2="40" y2="40" stroke="#ffffff" strokeWidth="2" />
            <line x1="0" y1="13" x2="60" y2="13" stroke="#ffffff" strokeWidth="2" />
            <line x1="0" y1="26" x2="60" y2="26" stroke="#ffffff" strokeWidth="2" />
          </g>

          {/* Right G Shape */}
          <path 
            d="M 160,95 C 160,82 145,72 128,72 C 108,72 95,88 95,112 C 95,138 110,152 135,152 C 152,152 162,142 162,125 L 130,125 L 130,108 L 175,108 L 175,135 C 175,158 158,168 132,168 C 98,168 78,145 78,112 C 78,78 102,55 136,55 C 158,55 174,68 178,82 Z" 
            fill="url(#gGrad)" 
          />
        </svg>
      )}

      {/* Company Text Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center font-black tracking-tight leading-none" style={{ fontSize: dimensions.fontSize }}>
            <span className={isDarkMode ? "text-white" : "text-[#0F172A]"}>{companyTitle}</span>
          </div>
          {subText && (
            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
