// src/components/InitialsAvatar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { getInitials, getInitialsColor } from '../lib/initials';

interface InitialsAvatarProps {
  name: string;
  size?: number;           // diameter in px, default 40
  teamColor?: string;      // override bg (when on pitch)
  outOfPosition?: boolean; // adds dashed outer ring
  animate?: boolean;       // enable whileHover scale (default true)
}

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  size = 40,
  teamColor,
  outOfPosition = false,
  animate = true,
}) => {
  const initials = getInitials(name);
  const { bg, ink } = getInitialsColor(name);
  const resolvedBg = teamColor ?? bg;
  const r = size / 2;
  const fontSize = size * 0.36;

  const svgEl = (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', flexShrink: 0 }}
      aria-label={name}
    >
      <defs>
        <filter id="ia-marker" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {/* Outer dashed ring for out-of-position */}
      {outOfPosition && (
        <circle
          cx={r} cy={r} r={r - 1}
          fill="none"
          stroke={ink}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.5}
          filter="url(#ia-marker)"
        />
      )}
      {/* Background circle */}
      <circle
        cx={r} cy={r} r={outOfPosition ? r - 5 : r - 1.5}
        fill={resolvedBg}
        stroke={ink}
        strokeWidth={1.5}
        strokeLinecap="round"
        filter="url(#ia-marker)"
        opacity={0.95}
      />
      {/* Initials text */}
      <text
        x={r} y={r}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Kalam', cursive"
        fontWeight="700"
        fontSize={fontSize}
        fill={ink}
        filter="url(#ia-marker)"
      >
        {initials}
      </text>
    </svg>
  );

  if (!animate) return svgEl;

  return (
    <motion.div
      style={{ display: 'inline-flex', cursor: 'default' }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {svgEl}
    </motion.div>
  );
};
