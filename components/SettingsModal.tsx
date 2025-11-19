import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './Icons.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (systemNote: string, rules: string) => void;
  initialSystemNote: string;
  initialRules: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSystemNote, initialRules }) => {
  const [systemNote, setSystemNote] = useState('');
  const [rules, setRules] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSystemNote(initialSystemNote);
      setRules(initialRules);
    }
  }, [isOpen, initialSystemNote, initialRules]);

  if (!isOpen) return null;
  
  const handleSave = () => {
    onSave(systemNote, rules);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl text-primary-text flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-primary-text flex-shrink-0">AI Assistant Settings</h2>
        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="systemNote" className="block text-sm font-medium text-secondary-text">
                        System Note (About You)
                    </label>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                    Provide info about yourself for the AI to remember.
                </p>
                <textarea
                id="systemNote"
                value={systemNote}
                onChange={(e) => setSystemNote(e.target.value)}
                rows={5}
                className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g., I am a project manager for the 'Zenith' project. I prefer concise answers."
                />
            </div>
            <div>
                <label htmlFor="rules" className="block text-sm font-medium text-secondary-text mb-1">
                    Rules &amp; Requirements
                </label>
                 <p className="text-xs text-gray-400 mb-2">
                    Set specific rules for the AI to follow. You can also ask it to update these during a chat.
                </p>
                <textarea
                id="rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={5}
                className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g., Always respond in Vietnamese. When creating tasks, if no deadline is given, set it for 3 days from today."
                />
            </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-primary-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded bg-accent-dark hover:bg-indigo-800 text-white transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};