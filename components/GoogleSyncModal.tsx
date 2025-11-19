import React, { useState } from 'react';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onSave: (clientId: string) => void;
  onClose: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ isOpen, onSave, onClose }) => {
  const [clientId, setClientId] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (clientId.trim()) {
      onSave(clientId.trim());
    } else {
      alert('Please enter a valid Client ID.');
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
        onClick={onClose}
    >
      <div 
        className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-lg text-primary-text flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-primary-text">Connect to Google Calendar</h2>
        <p className="text-sm text-secondary-text mb-4">
          To sync with Google Calendar, you need to provide an OAuth 2.0 Client ID from your own Google Cloud project. This ensures that you have full control over the application's access to your data.
        </p>
        <a href="https://developers.google.com/workspace/guides/create-credentials#oauth-client-id" target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:text-accent-dark font-semibold mb-4">
          How to get an OAuth Client ID &rarr;
        </a>
        
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-secondary-text mb-1">Your Google Client ID</label>
          <input 
            type="text" 
            name="clientId" 
            id="clientId" 
            value={clientId} 
            onChange={(e) => setClientId(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-gray-100 p-2 rounded border border-divider focus:outline-none focus:ring-2 focus:ring-accent" 
            required 
            placeholder="Enter your Client ID here"
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
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
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
