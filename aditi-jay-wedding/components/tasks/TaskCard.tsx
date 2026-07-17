'use client';

import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '@/lib/types';
import { getUrgency, URGENCY_COLORS, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarClock, AlertTriangle } from 'lucide-react';

const PRIORITY_DOT: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-green-500',
};

export default function TaskCard({
  task,
  index,
  onClick,
}: {
  task: Task;
  index: number;
  onClick: () => void;
}) {
  const urgency = getUrgency(task.due_date);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            'card p-3 mb-2 cursor-pointer text-sm',
            snapshot.isDragging && 'ring-2 ring-gold-400'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium leading-snug">{task.name}</span>
            <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[task.priority])} />
          </div>
          {task.category && (
            <span className="inline-block mt-1.5 text-[11px] text-gold-700 bg-gold-100 dark:bg-gold-900/40 dark:text-gold-300 px-2 py-0.5 rounded-full">
              {task.category}
            </span>
          )}
          <div className="flex items-center justify-between mt-2">
            {task.due_date ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border',
                  URGENCY_COLORS[urgency]
                )}
              >
                {urgency === 'critical' ? <AlertTriangle size={11} /> : <CalendarClock size={11} />}
                {format(new Date(task.due_date), 'd MMM')}
              </span>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-maroon-400">{task.completion}%</span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
