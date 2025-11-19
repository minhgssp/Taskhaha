import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Note, TaskStatus, AuthState } from '../types.ts';

interface AppData {
  tasks: Task[];
  notes: Note[];
}

const DEBOUNCE_DELAY = 1500; // 1.5 seconds
const GUEST_STORAGE_KEY = 'taskhaha_guest_data'; 
const isAiStudio = typeof window !== 'undefined' && !!(window as any).aistudio;

export const useDataManager = (authState: AuthState) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const latestDataRef = useRef<AppData>({ tasks, notes });
  useEffect(() => {
    latestDataRef.current = { tasks, notes };
  }, [tasks, notes]);

  // Fetch initial data based on auth state
  useEffect(() => {
    if (authState === 'pending') {
        setIsLoading(false);
        return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let data: AppData = { tasks: [], notes: [] };
        if (authState === 'guest' || isAiStudio) {
          // Guest mode or AI Studio: Use localStorage
          const localData = localStorage.getItem(GUEST_STORAGE_KEY);
          data = localData ? JSON.parse(localData) : { tasks: [], notes: [] };
        } else { // authState is 'premium'
          // Deployed Environment: Use API
          const response = await fetch('/api/data');
          if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }
          data = await response.json();
        }
        setTasks(data.tasks || []);
        setNotes(data.notes || []);
      } catch (err: any) {
        console.error("Error fetching initial data:", err);
        setError("Could not load data. Please try again later.");
        setTasks([]);
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authState]);

  // Debounced save function based on auth state
  const saveData = useCallback((data: AppData) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(async () => {
      if (authState === 'pending') return;
      try {
        setError(null);
        if (authState === 'guest' || isAiStudio) {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
        } else { // authState is 'premium'
          await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        }
      } catch (err) {
        console.error("Error saving data:", err);
        setError("Failed to save changes. Please check your connection.");
      }
    }, DEBOUNCE_DELAY);
  }, [authState]);

  const updateState = useCallback(<T extends keyof AppData>(stateKey: T, newState: AppData[T]) => {
    const newAppData: AppData = { ...latestDataRef.current, [stateKey]: newState };
    if (stateKey === 'tasks') setTasks(newState as Task[]);
    else if (stateKey === 'notes') setNotes(newState as Note[]);
    saveData(newAppData);
  }, [saveData]);

  // --- Task Management Functions (unchanged logic) ---
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
        result = [...result.filter(t => t.status !== oldStatus), ...oldColumnTasks];
    }
    updateState('tasks', result);
  }, [updateState]);


  // --- Notes Management Functions (unchanged logic) ---
  const addNote = useCallback(() => {
    const currentNotes = latestDataRef.current.notes;
    const newId = (Math.max(...currentNotes.map(n => parseInt(n.id, 10)), 0) + 1).toString();
    const newNote: Note = { id: newId, title: `Ghi chú mới ${newId}`, content: '' };
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
    tasks, notes, isLoading, error,
    addTask, updateTask, deleteTask, moveTask,
    addNote, updateNote, deleteNote
  };
};