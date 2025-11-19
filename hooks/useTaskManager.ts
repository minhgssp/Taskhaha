import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus } from '../types';

const TASK_STORAGE_KEY = 'zenith_tasks';

const getRelativeDate = (dayOffset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
};

const initialTasks: Task[] = [
    { id: '1', title: 'Thiết kế giao diện dashboard chính', description: 'Tạo mockups và hướng dẫn phong cách cho dashboard của Zenith Taskboard.', status: 'IN_PROGRESS', collection: 'Work', order: 0, tags: ['thiet-ke', 'ui'], dueDate: getRelativeDate(0), dueTime: '14:00' },
    { id: '2', title: 'Phát triển component bảng Kanban', description: 'Triển khai chức năng kéo và thả cho các công việc giữa các cột.', status: 'TODO', collection: 'Work', order: 0, tags: ['phat-trien', 'frontend'], dueDate: getRelativeDate(2) },
    { id: '3', title: 'Cài đặt dịch vụ API Gemini', description: 'Tích hợp dịch vụ backend để giao tiếp với API Gemini của Google.', status: 'TODO', collection: 'Work', order: 1, tags: ['backend', 'api'], dueDate: getRelativeDate(3) },
    { id: '4', title: 'Viết tài liệu cho API', description: '', status: 'TODO', collection: 'Work', order: 2, tags: ['tai-lieu'] },
    { id: '5', title: 'Kiểm thử tính năng kéo-thả', description: 'Đảm bảo tính năng hoạt động mượt mà trên tất cả các trình duyệt được hỗ trợ.', status: 'DONE', collection: 'Work', order: 0, tags: ['kiem-thu', 'qa'], dueDate: getRelativeDate(-1) },
];

export const useTaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const storedTasks = localStorage.getItem(TASK_STORAGE_KEY);
      if (storedTasks) {
        // Simple validation and migration for old tasks without a collection
        const parsed: Task[] = JSON.parse(storedTasks);
        if (Array.isArray(parsed)) {
            return parsed.map(task => ({ ...task, collection: task.collection || 'Work' }));
        }
      }
    } catch (error) {
      console.error("Error reading tasks from localStorage", error);
    }
    return initialTasks;
  });

  useEffect(() => {
    try {
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks to localStorage", error);
    }
  }, [tasks]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'order'>): Promise<Task> => {
    return new Promise(resolve => {
        setTasks(prevTasks => {
            const maxId = prevTasks.length > 0 ? Math.max(...prevTasks.map(t => parseInt(t.id, 10) || 0)) : 0;
            const newOrder = prevTasks.filter(t => t.status === taskData.status).length;
            const newTask: Task = {
              ...taskData,
              id: (maxId + 1).toString(),
              order: newOrder,
            };
            resolve(newTask);
            return [...prevTasks, newTask];
        });
    });
  }, []);


  const updateTask = useCallback((taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus, newIndex: number) => {
    setTasks(currentTasks => {
        const taskToMove = currentTasks.find(t => t.id === taskId);
        if (!taskToMove) return currentTasks;

        const oldStatus = taskToMove.status;
        
        // Remove task from its original position
        const filteredTasks = currentTasks.filter(t => t.id !== taskId);

        // Update task's status
        taskToMove.status = newStatus;
        
        // Find tasks in the new column and insert the moved task
        const newColumnTasks = filteredTasks.filter(t => t.status === newStatus);
        newColumnTasks.splice(newIndex, 0, taskToMove);

        // Reorder the new column
        newColumnTasks.forEach((t, i) => t.order = i);
        
        // Get tasks not in the new column
        const otherTasks = filteredTasks.filter(t => t.status !== newStatus);
        
        let result = [...otherTasks, ...newColumnTasks];

        // If moved to a different column, reorder the old column as well
        if (oldStatus !== newStatus) {
            const oldColumnTasks = result.filter(t => t.status === oldStatus);
            oldColumnTasks.forEach((t, i) => t.order = i);
            result = [...result.filter(t => t.status !== oldStatus), ...oldColumnTasks];
        }

        return result;
    });
  }, []);

  return { tasks, addTask, updateTask, deleteTask, moveTask, setTasks };
};