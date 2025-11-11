import React, { useState } from 'react';
import { User } from '../types';

interface SetBestEmployeeModalProps {
  users: User[];
  onClose: () => void;
  onSet: (userId: number) => void;
}

export const SetBestEmployeeModal: React.FC<SetBestEmployeeModalProps> = ({ users, onClose, onSet }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const handleSet = () => {
    if (selectedUserId) {
      onSet(selectedUserId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Set Employee of the Month</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl">&times;</button>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6">Select an employee to recognize their outstanding performance.</p>
        
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {users.map(user => (
                <label key={user.id} className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${selectedUserId === user.id ? 'bg-sky-50 border-sky-500 dark:bg-sky-900/50' : 'bg-white border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
                    <input 
                        type="radio" 
                        name="best-employee" 
                        className="h-4 w-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                        checked={selectedUserId === user.id}
                        onChange={() => setSelectedUserId(user.id)}
                    />
                    <img src={user.profilePictureUrl} alt={user.name} className="w-10 h-10 rounded-full mx-4 object-cover"/>
                    <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{user.designation}</div>
                    </div>
                </label>
            ))}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
            Cancel
          </button>
          <button 
            onClick={handleSet} 
            disabled={!selectedUserId}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Set Employee
          </button>
        </div>
      </div>
    </div>
  );
};
