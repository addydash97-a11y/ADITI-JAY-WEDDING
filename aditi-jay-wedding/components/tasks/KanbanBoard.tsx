'use client';

import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { TASK_STATUSES, type Task, type TaskStatus } from '@/lib/types';
import TaskCard from './TaskCard';
import { cn } from '@/lib/utils';

const COLUMN_STYLES: Record<TaskStatus, string> = {
  'Not Started': 'border-t-gray-400',
  'In Progress': 'border-t-blue-400',
  Waiting: 'border-t-yellow-400',
  Blocked: 'border-t-red-400',
  Completed: 'border-t-emerald2-500',
  Cancelled: 'border-t-gray-300',
};

export default function KanbanBoard({
  tasks,
  onStatusChange,
  onTaskClick,
}: {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}) {
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    if (newStatus !== result.source.droppableId) {
      onStatusChange(result.draggableId, newStatus);
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="min-w-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-semibold">{status}</h3>
                <span className="text-xs text-maroon-400 bg-gold-100 dark:bg-maroon-800 rounded-full px-2 py-0.5">
                  {columnTasks.length}
                </span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'rounded-2xl border-t-4 bg-white/50 dark:bg-maroon-900/30 p-2 min-h-[200px] transition-colors',
                      COLUMN_STYLES[status],
                      snapshot.isDraggingOver && 'bg-gold-50 dark:bg-maroon-800/50'
                    )}
                  >
                    {columnTasks.map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} onClick={() => onTaskClick(task)} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
