import React, { useState } from 'react';
import type { AuthState } from '../types.ts';
import { SyncIcon } from './Icons.tsx';

interface LoginModalProps {
  onLoginSuccess: (state: AuthState) => void;
  onShowError: (message: string, type: 'error') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onShowError }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePremiumLogin = async () => {
    if (!password) {
        onShowError('Password cannot be empty.', 'error');
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        if (response.ok) {
            onLoginSuccess('premium');
        } else {
            const data = await response.json();
            onShowError(data.error || 'Invalid password.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        onShowError('An error occurred. Please try again.', 'error');
    } finally {
        setIsLoading(false);
        setPassword('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePremiumLogin();
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-main flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-2xl p-8 w-full max-w-sm text-primary-text flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to TaskHaha</h1>
        <p className="text-secondary-text mb-8 text-center">Choose your access mode to continue.</p>

        <div className="w-full space-y-4">
            <button
                onClick={() => onLoginSuccess('guest')}
                className="w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-primary-text font-semibold transition-colors text-center"
            >
                Continue as Guest
            </button>

            {!showPassword && (
                <button
                    onClick={() => setShowPassword(true)}
                    className="w-full px-4 py-3 rounded-lg bg-accent-dark hover:bg-indigo-800 text-white font-semibold transition-colors text-center"
                >
                    Login as Premium
                </button>
            )}

            {showPassword && (
                <div className="space-y-3 pt-4 border-t border-divider">
                     <p className="text-sm text-secondary-text text-center">Enter the premium access password.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Password"
                        autoFocus
                        className="w-full bg-gray-100 p-3 rounded-lg border border-divider focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                        onClick={handlePremiumLogin}
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-lg bg-accent-dark hover:bg-indigo-800 text-white font-semibold transition-colors flex items-center justify-center disabled:bg-gray-400"
                    >
                        {isLoading ? <SyncIcon className="w-6 h-6 animate-spin" /> : 'Enter'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};