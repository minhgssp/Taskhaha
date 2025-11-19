import React, { useState } from 'react';
import type { Task, TaskColor } from '../types.ts';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

const getTaskColorClass = (task: Task): string => {
  if (task.status === 'DONE') {
    return 'bg-gray-200 text-secondary-text hover:bg-gray-300';
  }

  if (task.color && colorMap[task.color]) {
    return `${colorMap[task.color]} text-primary-text hover:brightness-95`;
  }

  if (task.collection === 'Life') {
    return 'bg-card-blue-bg text-primary-text hover:brightness-95';
  }

  if (isDateInPast(task.dueDate)) {
    return 'bg-card-orange-bg text-primary-text hover:brightness-95';
  }

  return 'bg-card-green-bg text-primary-text hover:brightness-95';
};

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onEditTask, onUpdateTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const getWeekStart = (date: Date) => {
    const newDate = new Date(date);
    const day = newDate.getDay();
    const diff = newDate.getDate() - day;
    return new Date(newDate.setDate(diff));
  };

  const startDate = getWeekStart(currentDate);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 20); // 3 weeks (21 days) - 1

  const headerDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });
  
  const headerText = `${headerDateFormatter.format(startDate)} - ${headerDateFormatter.format(endDate)}, ${endDate.getFullYear()}`;

  const changeWeek = (offset: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + (offset * 7));
        return newDate;
    });
  };

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

  const renderCells = () => {
    const cells = [];
    let day = new Date(startDate);
    
    for (let i = 0; i < 21; i++) {
        const currentDateInLoop = new Date(day);
        const formattedDay = currentDateInLoop.toISOString().split('T')[0];
        const tasksForDay = tasks
            .filter(task => task.dueDate === formattedDay)
            .sort((a, b) => (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59'));
        const isToday = new Date().toDateString() === day.toDateString();
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const isDraggingOver = dragOverDate === formattedDay;

        cells.push(
            <div
                key={day.toString()}
                className={`border-t border-l border-divider p-2 flex flex-col min-h-32 transition-colors ${isWeekend ? 'bg-gray-50' : 'bg-surface'} ${isDraggingOver ? 'bg-accent/10' : ''}`}
                onDrop={(e) => handleDrop(e, currentDateInLoop)}
                onDragOver={(e) => {
                    handleDragOver(e);
                    setDragOverDate(formattedDay);
                }}
                onDragLeave={() => setDragOverDate(null)}
            >
                <div className={`text-right text-sm mb-1 ${isToday ? 'bg-accent-dark text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto' : ''}`}>
                    {day.getDate()}
                </div>
                <div className="flex-grow space-y-1 overflow-y-auto">
                    {tasksForDay.map(task => (
                    <div 
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`text-xs p-1 rounded cursor-pointer active:cursor-grabbing flex space-x-1 transition-colors ${getTaskColorClass(task)}`}
                        onClick={() => onEditTask(task)}
                    >
                        {task.dueTime && <strong className="flex-shrink-0">{task.dueTime}</strong>}
                        <span className={`line-clamp-2 ${task.status === 'DONE' ? 'line-through' : ''}`}>{task.title}</span>
                    </div>
                    ))}
                </div>
            </div>
        );
        day.setDate(day.getDate() + 1);
    }
    return cells;
  };
  
  return (
    <div className="bg-surface p-4 rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <button onClick={() => changeWeek(-1)} className="p-1 rounded hover:bg-gray-100">&lt;</button>
        <h2 className="text-lg font-bold text-primary-text text-center">{headerText}</h2>
        <button onClick={() => changeWeek(1)} className="p-1 rounded hover:bg-gray-100">&gt;</button>
      </div>
      <div className="grid grid-cols-7 flex-grow">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-semibold text-secondary-text p-2 border-b border-divider">{day}</div>
        ))}
        {renderCells()}
      </div>
    </div>
  );
};