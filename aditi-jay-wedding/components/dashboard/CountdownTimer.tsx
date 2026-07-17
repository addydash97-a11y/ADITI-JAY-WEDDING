'use client';

import { useEffect, useState } from 'react';
import { getCountdown } from '@/lib/utils';

export default function CountdownTimer() {
  const [time, setTime] = useState(getCountdown());

  useEffect(() => {
    const id = setInterval(() => setTime(getCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: 'Days', value: time.days },
    { label: 'Hours', value: time.hours },
    { label: 'Minutes', value: time.minutes },
    { label: 'Seconds', value: time.seconds },
  ];

  return (
    <div className="flex gap-3">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex flex-col items-center justify-center bg-maroon-gold text-white rounded-2xl px-4 py-3 min-w-[64px] shadow-gold"
        >
          <span className="font-display text-2xl font-bold tabular-nums">
            {String(u.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] uppercase tracking-wide opacity-80">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
