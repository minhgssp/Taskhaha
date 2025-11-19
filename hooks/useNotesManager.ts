
import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types';

const NOTES_STORAGE_KEY = 'zenith_notes';

const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Ghi chú Chào mừng',
    content: 'Chào mừng bạn đến với Ghi chú Zenith! Đây là không gian dành cho các ý tưởng, bản nháp hoặc bất cứ điều gì khác bạn muốn ghi lại.\n\nMọi thứ bạn viết ở đây đều được lưu tự động.'
  }
];

export const useNotesManager = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      return storedNotes ? JSON.parse(storedNotes) : initialNotes;
    } catch (error) {
      console.error("Error reading notes from localStorage:", error);
      return initialNotes;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving notes to localStorage:", error);
    }
  }, [notes]);

  const addNote = useCallback(() => {
    const newId = (Math.max(...notes.map(n => parseInt(n.id, 10)), 0) + 1).toString();
    const newNote: Note = {
      id: newId,
      title: `Ghi chú mới ${newId}`,
      content: ''
    };
    setNotes(prevNotes => [...prevNotes, newNote]);
    return newNote.id;
  }, [notes]);

  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  }, []);

  return { notes, addNote, updateNote, deleteNote };
};