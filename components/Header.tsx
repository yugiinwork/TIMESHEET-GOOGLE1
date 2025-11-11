

import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  theme: string;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, theme, onToggleTheme }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-end items-center border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onToggleTheme} 
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
        <div className="text-right">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
          <p className="text-sm text-sky-600 dark:text-sky-400">{user.role}</p>
        </div>
        <img
          className="h-10 w-10 rounded-full object-cover"
          src={user.profilePictureUrl || `https://picsum.photos/seed/${user.id}/100`}
          alt="User Avatar"
        />
      </div>
    </header>
  );
};