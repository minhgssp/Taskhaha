import React from 'react';
import type { Task, TaskStatus, TaskColor } from '../types';

interface TodoListViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  showTagsOnTasks: boolean;
}

const borderColorMap: Record<TaskColor, string> = {
  red: 'border-l-red-400',
  yellow: 'border-l-yellow-400',
  teal: 'border-l-teal-400',
  pink: 'border-l-pink-400',
};

export const TodoListView: React.FC<TodoListViewProps> = ({ tasks, onUpdateTask, onEditTask, showTagsOnTasks }) => {
  const groupedTasks = tasks.reduce((acc, task) => {
    const dueDate = task.dueDate || 'No Date';
    if (!acc[dueDate]) {
      acc[dueDate] = [];
    }
    acc[dueDate].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedGroupKeys = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    onUpdateTask(taskId, { status: newStatus });
  };
  
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-surface p-4 rounded-lg h-full flex flex-col">
      <div className="flex-grow overflow-y-auto pr-2">
        {sortedGroupKeys.map(dateKey => (
          <div key={dateKey} className="mb-6">
            <h3 className="text-lg font-bold text-primary-text mb-2 border-b border-divider pb-1">
              {dateKey === 'No Date' ? 'No Due Date' : dateFormatter.format(new Date(dateKey))}
            </h3>
            <div className="space-y-2">
              {groupedTasks[dateKey]
                .sort((a,b) => (a.dueTime || '').localeCompare(b.dueTime || ''))
                .map((task) => (
                <div
                  key={task.id}
                  className={`flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors group border-l-4 ${task.color && task.status !== 'DONE' ? borderColorMap[task.color] : 'border-l-transparent'}`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      {task.dueTime && (
                        <span className="text-sm font-semibold text-secondary-text bg-gray-200 px-2 py-1 rounded-md">{task.dueTime}</span>
                      )}
                      <span 
                        className={`text-primary-text font-medium cursor-pointer group-hover:text-accent transition-colors ${task.status === 'DONE' ? 'line-through' : ''}`}
                        onClick={() => onEditTask(task)}
                      >
                        {task.title}
                      </span>
                    </div>
                     {showTagsOnTasks && task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-2">
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
                  </div>
                  <div className="relative mt-4 md:mt-0">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      className={`w-full md:w-auto -webkit-appearance-none appearance-none bg-white border border-divider rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent`}
                    >
                      <option value="TODO" className="bg-surface">To Do</option>
                      <option value="IN_PROGRESS" className="bg-surface">In Progress</option>
                      <option value="DONE" className="bg-surface">Done</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary-text">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};