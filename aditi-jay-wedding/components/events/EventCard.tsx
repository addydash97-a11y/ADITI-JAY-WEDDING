'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EVENT_COLOR_MAP, type WeddingEvent } from '@/lib/types';
import { format } from 'date-fns';
import { CalendarDays, MapPin } from 'lucide-react';

export default function EventCard({
  event,
  completion = 0,
}: {
  event: WeddingEvent;
  completion?: number;
}) {
  const colors = EVENT_COLOR_MAP[event.color_key] ?? EVENT_COLOR_MAP.mehendi;

  return (
    <Link href={`/events/${event.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="rounded-2xl overflow-hidden shadow-soft border border-white/10 h-full"
      >
        <div
          className="p-5 text-white h-full flex flex-col justify-between min-h-[160px]"
          style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
        >
          <div>
            <h3 className="font-display text-xl font-semibold">{event.name}</h3>
            {event.event_date && (
              <div className="flex items-center gap-1.5 text-xs mt-1 opacity-90">
                <CalendarDays size={13} />
                {format(new Date(event.event_date), 'd MMM yyyy')}
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-1.5 text-xs mt-0.5 opacity-90">
                <MapPin size={13} />
                {event.venue}
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1 opacity-90">
              <span>Progress</span>
              <span>{completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
