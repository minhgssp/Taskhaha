import React, { useState } from 'react';
import type { Task, Column, TaskStatus, TaskColor } from '../types.ts';

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
    return 'bg-gray-200 border border-divider text-secondary-text'; 
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


interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onClick: () => void;
  showTags: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onClick, showTags }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className={`${getTaskCardBgColor(task)} p-3 mb-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing transform hover:scale-105 transition-transform`}
    >
      <h4 className={`font-semibold text-primary-text ${task.status === 'DONE' ? 'line-through' : ''}`}>{task.title}</h4>
      {task.description && <p className={`text-sm mt-1 line-clamp-2 ${task.status === 'DONE' ? 'line-through text-secondary-text' : 'text-secondary-text'}`}>{task.description}</p>}
      {showTags && task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 bg-accent text-white text-xs font-semibold rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {task.dueDate && (
        <div className="text-xs text-secondary-text mt-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{task.dueDate}</span>
          {task.dueTime && <span className="ml-2 font-semibold">{task.dueTime}</span>}
        </div>
      )}
    </div>
  );
};

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
  isDraggingOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onEditTask: (task: Task) => void;
  showTagsOnTasks: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onDragStart, onDrop, isDraggingOver, onDragOver, onDragLeave, onEditTask, showTagsOnTasks }) => {
  return (
    <div
      onDrop={(e) => onDrop(e, column.id)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`rounded-lg p-4 w-full md:w-1/3 flex flex-col min-h-[300px] transition-colors ${isDraggingOver ? 'bg-accent/10' : ''}`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="font-bold text-lg text-primary-text">{column.title}</h3>
        <span className="text-sm bg-gray-200 text-secondary-text rounded-full px-2 py-1">{tasks.length}</span>
      </div>
      <div className="overflow-y-auto h-full pr-1">
        {tasks.sort((a, b) => a.order - b.order).map(task => (
          <TaskCard key={task.id} task={task} onDragStart={onDragStart} onClick={() => onEditTask(task)} showTags={showTagsOnTasks} />
        ))}
      </div>
    </div>
  );
};


interface KanbanBoardProps {
  columns: Column[];
  tasks: Task[];
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;
  onEditTask: (task: Task) => void;
  showTagsOnTasks: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, tasks, moveTask, onEditTask, showTagsOnTasks }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };
  
  const handleDragLeave = () => {
      setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      // Basic index calculation for dropping at the end. A more complex one could calculate position within the list.
      const tasksInColumn = tasks.filter(t => t.status === status).length;
      moveTask(draggedTaskId, status, tasksInColumn);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {columns.map(column => (
        <KanbanColumn
          key={column.id}
          column={column}
          tasks={tasks.filter(task => task.status === column.id)}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          isDraggingOver={dragOverColumn === column.id}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onEditTask={onEditTask}
          showTagsOnTasks={showTagsOnTasks}
        />
      ))}
    </div>
  );
};