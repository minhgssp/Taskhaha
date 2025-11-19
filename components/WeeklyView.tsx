import React, { useState, useMemo } from 'react';
import type { Task, TaskColor } from '../types.ts';
import { PlusIcon } from './Icons.tsx';

const isDateInPast = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDateParts = dateStr.split('-').map(p => parseInt(p, 10));
    const taskDate = new Date(taskDateParts[0], taskDateParts[1] - 1, taskDateParts[2]);
    return taskDate < today;
};

const colorMap: Record<TaskColor, string> = {
  red: 'bg-card-red-bg',
  yellow: 'bg-card-yellow-bg',
  teal: 'bg-card-teal-bg',
  pink: 'bg-card-pink-bg',
};

const getTaskCardBgColor = (task: Task): string => {
  if (task.status === 'DONE') {
    return 'bg-gray-200 text-secondary-text';
  }

  if (task.color && colorMap[task.color]) {
    return colorMap[task.color];
  }

  if (task.collection === 'Life') {
    return 'bg-card-blue-bg';
  }

  if (isDateInPast(task.dueDate)) {
    return 'bg-card-orange-bg';
  }

  return 'bg-card-green-bg';
};

interface WeeklyViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  weeklyViewDays: number;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddTaskForDate: (date: string) => void;
  showTagsOnTasks: boolean;
  layout: 'simple' | 'grid';
}

interface DayColumnProps {
  date: Date;
  tasks: Task[];
  isToday: boolean;
  onEditTask: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  isDraggingOver: boolean;
  onAddTask: () => void;
  showTagsOnTasks: boolean;
}

const DayColumn: React.FC<DayColumnProps> = ({ date, tasks, isToday, onEditTask, onDragStart, onDrop, onDragOver, onDragLeave, isDraggingOver, onAddTask, showTagsOnTasks }) => {
  const dayName = date.toLocaleString('default', { weekday: 'short' });
  const dayNumber = date.getDate();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <div 
      className={`rounded-lg p-3 flex flex-col flex-1 transition-colors bg-surface ${isToday ? 'border-2 border-accent' : ''} ${isWeekend ? 'opacity-70' : ''} ${isDraggingOver ? 'bg-accent/10' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="text-center mb-3 flex-shrink-0 flex justify-between items-start">
        <div className="flex-1 text-center">
            <p className="text-sm text-secondary-text">{dayName}</p>
            <p className={`font-bold text-2xl ${isToday ? 'text-accent' : 'text-primary-text'}`}>{dayNumber}</p>
        </div>
        <button
            onClick={onAddTask}
            className="p-1 text-secondary-text hover:bg-gray-200 hover:text-primary-text rounded-full transition-colors"
            aria-label={`Add task for ${dayName}, ${dayNumber}`}
        >
            <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto h-full space-y-2 pr-1">
        {tasks
          .sort((a,b) => (a.dueTime || '').localeCompare(b.dueTime || ''))
          .map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, task.id)}
              onClick={() => onEditTask(task)}
              className={`${getTaskCardBgColor(task)} p-2 rounded-md cursor-pointer hover:brightness-95 transition-all active:cursor-grabbing`}
            >
              <div className="flex items-center space-x-2">
                {task.dueTime && <span className="text-xs font-bold text-secondary-text">{task.dueTime}</span>}
                <p className={`text-sm font-medium text-primary-text break-words ${task.status === 'DONE' ? 'line-through' : ''}`}>{task.title}</p>
              </div>
              {showTagsOnTasks && task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-1.5 py-0.5 bg-accent text-white text-xs font-semibold rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
        ))}
      </div>
    </div>
  );
};

const timeSlots = [
  { label: '5:30 - 7:30', start: '05:30', end: '07:30' },
  { label: '7:30 - 9:00', start: '07:30', end: '09:00' },
  { label: '9:00 - 12:00', start: '09:00', end: '12:00' },
  { label: 'Nghỉ trưa', start: '12:00', end: '13:30', isLunch: true },
  { label: '13:30 - 17:00', start: '13:30', end: '17:00' },
  { label: '17:00 - 19:00', start: '17:00', end: '19:00' },
  { label: '19:00 - 22:00', start: '19:00', end: '22:00' },
];

const timeToMinutes = (time: string): number => {
  if (!time || !time.includes(':')) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isTaskInSlot = (taskTime: string | undefined, slot: typeof timeSlots[0]): boolean => {
  if (!taskTime) return false;
  const taskMinutes = timeToMinutes(taskTime);
  const startMinutes = timeToMinutes(slot.start);
  const endMinutes = timeToMinutes(slot.end);
  return taskMinutes >= startMinutes && taskMinutes < endMinutes;
};

const WeeklyViewGrid: React.FC<Omit<WeeklyViewProps, 'layout'>> = ({ tasks, onEditTask, weeklyViewDays, onUpdateTask }) => {
    const today = new Date();
    const weekDates = useMemo(() => {
        const dates: Date[] = [];
        for (let i = -1; i <= weeklyViewDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [weeklyViewDays, today.getDate()]);

    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    const handleDrop = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            const newDueDate = date.toISOString().split('T')[0];
            onUpdateTask(taskId, { dueDate: newDueDate });
        }
        setDragOverDate(null);
    };

    const layoutState = useMemo(() => {
        return timeSlots.map(slot => {
            let hasTasksInRow = false;
            if (!slot.isLunch) {
                for (const date of weekDates) {
                    const formattedDate = date.toISOString().split('T')[0];
                    const tasksForDay = tasks.filter(t => t.dueDate === formattedDate);
                    if (tasksForDay.some(task => isTaskInSlot(task.dueTime, slot))) {
                        hasTasksInRow = true;
                        break;
                    }
                }
            }
            const isCollapsed = slot.isLunch || !hasTasksInRow;
            return { slot, isCollapsed };
        });
    }, [tasks, weekDates]);

    return (
        <div className="flex flex-col h-full bg-surface rounded-lg overflow-auto">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead className="sticky top-0 bg-surface z-10">
                    <tr>
                        <th className="w-24 p-2 border-b border-divider"></th> {/* Spacer */}
                        {weekDates.map(date => {
                            const isToday = today.toDateString() === date.toDateString();
                            return (
                                <th key={date.toISOString()} className="text-center p-2 border-b border-l border-divider">
                                    <p className="text-sm text-secondary-text">{date.toLocaleString('default', { weekday: 'short' })}</p>
                                    <p className={`font-bold text-2xl ${isToday ? 'text-accent' : 'text-primary-text'}`}>{date.getDate()}</p>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {layoutState.map(({ slot, isCollapsed }) => (
                        <tr key={slot.label} className="transition-all duration-300">
                            <td className={`align-middle text-center text-xs text-secondary-text border-b border-divider transition-all duration-300 ${isCollapsed ? 'h-8' : 'h-32'}`}>
                                <span className="font-medium">{slot.label}</span>
                            </td>
                            {weekDates.map(date => {
                                const formattedDate = date.toISOString().split('T')[0];
                                const tasksForDay = tasks.filter(t => t.dueDate === formattedDate);
                                const tasksInSlot = tasksForDay.filter(task => isTaskInSlot(task.dueTime, slot));
                                
                                return (
                                    <td
                                        key={formattedDate}
                                        className={`align-top border-b border-l border-divider p-1 transition-all duration-300 ${dragOverDate === formattedDate ? 'bg-accent/5' : ''} ${isCollapsed ? 'h-8' : 'h-32'}`}
                                        onDrop={(e) => handleDrop(e, date)}
                                        onDragOver={(e) => { handleDragOver(e); setDragOverDate(formattedDate); }}
                                        onDragLeave={() => setDragOverDate(null)}
                                    >
                                        {!isCollapsed && (
                                            <div className="h-full w-full overflow-y-auto space-y-1">
                                                {tasksInSlot
                                                    .sort((a,b) => (a.dueTime || '').localeCompare(b.dueTime || ''))
                                                    .map(task => (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                                        onClick={() => onEditTask(task)}
                                                        className={`p-1 rounded text-xs cursor-pointer hover:brightness-95 active:cursor-grabbing ${getTaskCardBgColor(task)}`}
                                                    >
                                                        <p className={`font-semibold text-primary-text truncate ${task.status === 'DONE' ? 'line-through' : ''}`}>
                                                            {task.dueTime} {task.title}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const WeeklyView: React.FC<WeeklyViewProps> = (props) => {
  const { tasks, onEditTask, weeklyViewDays, onUpdateTask, onAddTaskForDate, showTagsOnTasks, layout } = props;
  const today = new Date();
  const weekDates: Date[] = [];
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Loop from yesterday (-1) to the number of future days set by the user
  for (let i = -1; i <= weeklyViewDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    weekDates.push(date);
  }
  
  if (layout === 'grid') {
      return <WeeklyViewGrid {...props} />;
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const newDueDate = date.toISOString().split('T')[0];
      onUpdateTask(taskId, { dueDate: newDueDate });
    }
    setDragOverDate(null);
  };

  return (
    <div className="flex gap-4 h-full">
      {weekDates.map(date => {
        const formattedDate = date.toISOString().split('T')[0];
        const tasksForDay = tasks.filter(task => task.dueDate === formattedDate);
        const isToday = today.toDateString() === date.toDateString();

        return (
          <DayColumn
            key={formattedDate}
            date={date}
            tasks={tasksForDay}
            isToday={isToday}
            onEditTask={onEditTask}
            onAddTask={() => onAddTaskForDate(formattedDate)}
            onDragStart={handleDragStart}
            onDrop={(e) => handleDrop(e, date)}
            onDragOver={(e) => {
              handleDragOver(e);
              setDragOverDate(formattedDate);
            }}
            onDragLeave={() => setDragOverDate(null)}
            isDraggingOver={dragOverDate === formattedDate}
            showTagsOnTasks={showTagsOnTasks}
          />
        );
      })}
    </div>
  );
};