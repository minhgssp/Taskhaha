import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Note, TaskStatus, Collection } from '../types';

interface AppData {
  tasks: Task[];
  notes: Note[];
}

const DEBOUNCE_DELAY = 1500; // 1.5 seconds

export const useDataManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FIX: Replaced NodeJS.Timeout with a browser-compatible type.
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref to hold the latest state to avoid stale state in timeout callbacks
  const latestDataRef = useRef<AppData>({ tasks, notes });
  useEffect(() => {
    latestDataRef.current = { tasks, notes };
  }, [tasks, notes]);


  // Fetch initial data from the server
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/data'); // Assuming API route is at /api/data
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data: AppData = await response.json();
        setTasks(data.tasks || []);
        setNotes(data.notes || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError("Could not load data from server. Please try again later.");
        // Fallback to empty state
        setTasks([]);
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debounced save function
  const saveData = useCallback((data: AppData) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        setError(null);
      } catch (err) {
        console.error("Error saving data:", err);
        setError("Failed to save changes. Please check your connection.");
      }
    }, DEBOUNCE_DELAY);
  }, []);

  // Centralized state update and trigger for saving
  const updateState = useCallback(<T extends keyof AppData>(stateKey: T, newState: AppData[T]) => {
    const newAppData: AppData = { ...latestDataRef.current, [stateKey]: newState };
    if (stateKey === 'tasks') {
        setTasks(newState as Task[]);
    } else if (stateKey === 'notes') {
        setNotes(newState as Note[]);
    }
    saveData(newAppData);
  }, [saveData]);

  // --- Task Management Functions ---
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'order'>): Promise<Task> => {
    return new Promise(resolve => {
        const currentTasks = latestDataRef.current.tasks;
        const maxId = currentTasks.length > 0 ? Math.max(...currentTasks.map(t => parseInt(t.id, 10) || 0)) : 0;
        const newOrder = currentTasks.filter(t => t.status === taskData.status).length;
        const newTask: Task = {
            ...taskData,
            id: (maxId + 1).toString(),
            order: newOrder,
        };
        updateState('tasks', [...currentTasks, newTask]);
        resolve(newTask);
    });
  }, [updateState]);

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    const newTasks = latestDataRef.current.tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    updateState('tasks', newTasks);
  }, [updateState]);

  const deleteTask = useCallback((taskId: string) => {
    const newTasks = latestDataRef.current.tasks.filter(task => task.id !== taskId);
    updateState('tasks', newTasks);
  }, [updateState]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus, newIndex: number) => {
    const currentTasks = latestDataRef.current.tasks;
    const taskToMove = currentTasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    const oldStatus = taskToMove.status;
    const filteredTasks = currentTasks.filter(t => t.id !== taskId);
    taskToMove.status = newStatus;

    const newColumnTasks = filteredTasks.filter(t => t.status === newStatus);
    newColumnTasks.splice(newIndex, 0, taskToMove);
    newColumnTasks.forEach((t, i) => t.order = i);
    
    const otherTasks = filteredTasks.filter(t => t.status !== newStatus);
    let result = [...otherTasks, ...newColumnTasks];

    if (oldStatus !== newStatus) {
        const oldColumnTasks = result.filter(t => t.status === oldStatus);
        oldColumnTasks.forEach((t, i) => t.order = i);
        // FIX: Corrected typo from oldOldStatus to oldStatus
        result = [...result.filter(t => t.status !== oldStatus), ...oldColumnTasks];
    }
    updateState('tasks', result);
  }, [updateState]);


  // --- Notes Management Functions ---
  const addNote = useCallback(() => {
    const currentNotes = latestDataRef.current.notes;
    const newId = (Math.max(...currentNotes.map(n => parseInt(n.id, 10)), 0) + 1).toString();
    const newNote: Note = {
      id: newId,
      title: `Ghi chú mới ${newId}`,
      content: ''
    };
    updateState('notes', [...currentNotes, newNote]);
    return newNote.id;
  }, [updateState]);

  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    const newNotes = latestDataRef.current.notes.map(note => 
      note.id === noteId ? { ...note, ...updates } : note
    );
    updateState('notes', newNotes);
  }, [updateState]);

  const deleteNote = useCallback((noteId: string) => {
    const newNotes = latestDataRef.current.notes.filter(note => note.id !== noteId);
    updateState('notes', newNotes);
  }, [updateState]);


  return { 
    tasks, 
    notes, 
    isLoading,
    error,
    addTask, 
    updateTask, 
    deleteTask, 
    moveTask,
    addNote,
    updateNote,
    deleteNote
  };
};