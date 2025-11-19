import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
  onClose: () => void;
  isCancellable: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, isCancellable }) => {
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        setApiKey('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    } else {
      alert('Please enter a valid API key.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        onClick={isCancellable ? onClose : undefined}
    >
      <div 
        className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-md text-primary-text flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-primary-text">Enter Your Gemini API Key</h2>
        <p className="text-sm text-secondary-text mb-4">
          To enable the AI Assistant, please provide your Google Gemini API key. Your key is stored securely in your browser's local storage and is never sent to our servers.
        </p>
        <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:text-accent-dark font-semibold mb-4">
          Get your API key from Google AI Studio &rarr;
        </a>
        
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-secondary-text mb-1">API Key</label>
          <input 
            type="password" 
            name="apiKey" 
            id="apiKey" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent" 
            required 
            placeholder="Enter your key here"
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          {isCancellable && (
             <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-primary-text transition-colors"
              >
                Cancel
              </button>
          )}
          <button 
            type="button" 
            onClick={handleSave} 
            className="px-4 py-2 rounded bg-accent-dark hover:bg-indigo-800 text-white transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};