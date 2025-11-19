import React, { useState, useEffect } from 'react';
import type { Task, Collection, TaskColor } from '../types.ts';
import { TrashIcon } from './Icons.tsx';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'order'>) => Promise<void>;
  onUpdate: (taskId: string, updates: Partial<Omit<Task, 'id' | 'order'>>) => void;
  onDelete?: (taskId: string) => void;
  taskToEdit?: Task | null;
  initialDate?: string; // For creating a task from a calendar view
}

const availableColors: readonly TaskColor[] = ['red', 'yellow', 'teal', 'pink'];
const colorMap: Record<TaskColor, string> = {
  red: 'bg-card-red-bg',
  yellow: 'bg-card-yellow-bg',
  teal: 'bg-card-teal-bg',
  pink: 'bg-card-pink-bg',
};


const emptyTask: Omit<Task, 'id' | 'order'> = {
  title: '',
  description: '',
  status: 'TODO',
  collection: 'Life',
  dueDate: '',
  dueTime: '',
  tags: [],
  color: undefined,
};

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onUpdate, onDelete, taskToEdit, initialDate }) => {
  const [task, setTask] = useState(emptyTask);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (taskToEdit) {
            setTask({
                title: taskToEdit.title,
                description: taskToEdit.description || '',
                status: taskToEdit.status,
                collection: taskToEdit.collection,
                dueDate: taskToEdit.dueDate || '',
                dueTime: taskToEdit.dueTime || '',
                tags: taskToEdit.tags || [],
                color: taskToEdit.color,
            });
        } else {
            setTask({ ...emptyTask, dueDate: initialDate || new Date().toISOString().split('T')[0] });
        }
    }
  }, [taskToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, '');
      if (newTag && !task.tags?.includes(newTag)) {
        setTask(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTask(prev => ({ ...prev, tags: (prev.tags || []).filter(tag => tag !== tagToRemove) }));
  };

  const handleSave = async () => {
    if (!task.title) {
        alert('Title is required.');
        return;
    }
    const taskDataToSave = {
        ...task,
        dueDate: task.dueDate || undefined,
        dueTime: task.dueTime || undefined,
        description: task.description || undefined,
        tags: task.tags?.length ? task.tags : undefined,
        color: task.color || undefined,
    };
    if (taskToEdit) {
      onUpdate(taskToEdit.id, taskDataToSave);
    } else {
      await onSave(taskDataToSave);
    }
    onClose();
  };
  
  const handleDelete = () => {
    if (taskToEdit && onDelete && window.confirm(`Are you sure you want to delete "${taskToEdit.title}"?`)) {
        onDelete(taskToEdit.id);
        onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-lg text-primary-text flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-primary-text">{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
          {taskToEdit && onDelete && (
            <button onClick={handleDelete} className="p-2 text-secondary-text hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10">
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-secondary-text mb-1">Title</label>
            <input type="text" name="title" id="title" value={task.title} onChange={handleChange} className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent" required />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-secondary-text mb-1">Description</label>
            <textarea name="description" id="description" value={task.description} onChange={handleChange} rows={4} className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="collection" className="block text-sm font-medium text-secondary-text mb-1">Collection</label>
                <select name="collection" id="collection" value={task.collection} onChange={handleChange} className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="Life" className="bg-surface">Life</option>
                    <option value="Work" className="bg-surface">Work</option>
                </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-secondary-text mb-1">Status</label>
              <select name="status" id="status" value={task.status} onChange={handleChange} className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="TODO" className="bg-surface">To Do</option>
                  <option value="IN_PROGRESS" className="bg-surface">In Progress</option>
                  <option value="DONE" className="bg-surface">Done</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-secondary-text mb-1">Due Date</label>
              <input type="date" name="dueDate" id="dueDate" value={task.dueDate} onChange={handleChange} className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label htmlFor="dueTime" className="block text-sm font-medium text-secondary-text mb-1">Due Time</label>
              <input type="time" name="dueTime" id="dueTime" value={task.dueTime} onChange={handleChange} className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">Color</label>
            <div className="flex items-center space-x-2">
                <button
                onClick={() => setTask(prev => ({ ...prev, color: undefined }))}
                className={`w-8 h-8 rounded-full border-2 ${!task.color ? 'border-accent' : 'border-transparent'} bg-gray-200 flex items-center justify-center text-secondary-text`}
                aria-label="Default color"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                {availableColors.map(color => (
                <button
                    key={color}
                    onClick={() => setTask(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${task.color === color ? 'border-accent' : 'border-transparent'} ${colorMap[color]}`}
                    aria-label={`Set color to ${color}`}
                />
                ))}
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-secondary-text mb-1">Tags (comma or enter to add)</label>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 rounded border border-divider">
              {task.tags?.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-accent text-white text-sm px-2 py-1 rounded-full">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="font-bold text-white/70 hover:text-white">×</button>
                </span>
              ))}
              <input 
                type="text" 
                value={tagInput}
                onChange={handleTagChange}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
                className="bg-transparent flex-grow focus:outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-primary-text transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-accent-dark hover:bg-indigo-800 text-white transition-colors">Save Task</button>
        </div>
      </div>
    </div>
  );
};