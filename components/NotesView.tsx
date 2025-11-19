
import React, { useState, useEffect } from 'react';
import type { Note } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface NotesViewProps {
  notes: Note[];
  addNote: () => string;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, addNote, updateNote, deleteNote }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (notes.length > 0 && !notes.some(n => n.id === selectedNoteId)) {
      setSelectedNoteId(notes[0].id);
    } else if (notes.length === 0) {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]);


  const selectedNote = notes.find(note => note.id === selectedNoteId);

  const handleAddNote = () => {
    const newNoteId = addNote();
    setSelectedNoteId(newNoteId);
  };

  const handleDeleteNote = (e: React.MouseEvent, noteId: string, noteTitle: string) => {
    e.stopPropagation(); // Prevent selecting the note when clicking delete
    if (window.confirm(`Are you sure you want to delete "${noteTitle || 'Untitled Note'}"?`)) {
        deleteNote(noteId);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedNote) {
      updateNote(selectedNote.id, { title: e.target.value });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedNote) {
      updateNote(selectedNote.id, { content: e.target.value });
    }
  };


  return (
    <div className="flex h-full bg-surface rounded-lg overflow-hidden">
      <aside className="w-1/3 md:w-1/4 bg-gray-50 border-r border-divider flex flex-col">
        <div className="p-2 border-b border-divider flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary-text">Notes</h2>
          <button
            onClick={handleAddNote}
            className="p-2 text-secondary-text hover:bg-gray-200 hover:text-primary-text rounded-md transition-colors"
            aria-label="Create new note"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {notes.length > 0 ? (
            <ul>
              {notes.map(note => (
                <li
                  key={note.id}
                  className={`group relative flex justify-between items-center pr-2 transition-colors ${
                    selectedNoteId === note.id ? 'bg-accent text-white' : 'hover:bg-gray-200'
                  }`}
                >
                  <button
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`w-full text-left p-3 text-sm truncate ${
                      selectedNoteId === note.id ? 'text-white' : 'text-primary-text'
                    }`}
                  >
                    {note.title || 'Untitled Note'}
                  </button>
                   <button
                        onClick={(e) => handleDeleteNote(e, note.id, note.title)}
                        className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                            selectedNoteId === note.id ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-secondary-text hover:text-red-500 hover:bg-red-500/10'
                        }`}
                        aria-label={`Delete note ${note.title}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-secondary-text text-center">No notes yet.</p>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="p-3 border-b border-divider flex items-center flex-shrink-0">
              <input
                type="text"
                value={selectedNote.title}
                onChange={handleTitleChange}
                placeholder="Note title"
                className="w-full bg-transparent text-xl font-bold text-primary-text focus:outline-none"
              />
               <button
                  onClick={(e) => handleDeleteNote(e, selectedNote.id, selectedNote.title)}
                  className="p-2 rounded-full text-secondary-text hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  aria-label={`Delete note ${selectedNote.title}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <textarea
                value={selectedNote.content}
                onChange={handleContentChange}
                placeholder="Start writing..."
                className="w-full h-full bg-transparent p-4 text-primary-text focus:outline-none resize-none"
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-secondary-text">
              <p>Select a note to view</p>
              <p className="mt-2 text-sm">or</p>
              <button
                onClick={handleAddNote}
                className="mt-2 px-4 py-2 rounded-md bg-accent-dark hover:bg-indigo-800 text-white font-semibold text-sm transition-colors"
              >
                Create a New Note
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
