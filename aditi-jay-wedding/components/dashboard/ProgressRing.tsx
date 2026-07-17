'use client';

import { motion } from 'framer-motion';

export default function ProgressRing({
  percent,
  size = 140,
  stroke = 12,
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const gradientId = `ring-gradient-${label.replace(/\s+/g, '-')}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7d2436" />
            <stop offset="100%" stopColor="#d99420" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gold-100 dark:text-maroon-800"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold gradient-text">{Math.round(percent)}%</span>
        <span className="text-[11px] text-maroon-400 dark:text-gold-200/70 mt-0.5">{label}</span>
        {sublabel && <span className="text-[10px] text-maroon-300">{sublabel}</span>}
      </div>
    </div>
  );
}
