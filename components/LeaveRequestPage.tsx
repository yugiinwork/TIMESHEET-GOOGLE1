
import React, { useState, useMemo } from 'react';
import { LeaveRequest, Status, LeaveType, HalfDaySession, LeaveEntry, User, View } from '../types';

interface LeaveRequestPageProps {
  currentUser: User;
  users: User[];
  leaveRequests: LeaveRequest[];
  setLeaveRequests: (updater: React.SetStateAction<LeaveRequest[]>) => Promise<void>;
  onExport?: () => void;
  addToastNotification: (message: string, title?: string) => void;
  addNotification: (payload: { userId: number; title: string; message: string; linkTo?: View; }) => Promise<void>;
}

const emptyLeaveRequest = (userId: number): Omit<LeaveRequest, 'id'> => ({
  userId,
  leaveEntries: [{
      date: new Date().toISOString().split('T')[0],
      leaveType: 'Full Day',
  }],
  reason: '',
  status: Status.PENDING,
});

export const LeaveRequestPage: React.FC<LeaveRequestPageProps> = ({ currentUser, users, leaveRequests, setLeaveRequests, onExport, addToastNotification, addNotification }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Omit<LeaveRequest, 'id'> | LeaveRequest>(emptyLeaveRequest(currentUser.id));
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeaveRequests = useMemo(() => {
    if (!searchQuery) {
        return leaveRequests;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return leaveRequests.filter(req => req.reason.toLowerCase().includes(lowercasedQuery));
  }, [leaveRequests, searchQuery]);

  const openModal = (request?: LeaveRequest) => {
    setEditingRequest(request ? JSON.parse(JSON.stringify(request)) : emptyLeaveRequest(currentUser.id));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingRequest(prev => ({...prev, [name]: value}));
  };
  
  const handleEntryChange = (index: number, field: keyof LeaveEntry, value: string) => {
    setEditingRequest(prev => {
        const newEntries = [...prev.leaveEntries];
        const entry = {...newEntries[index]};
        (entry as any)[field] = value;
        
        if (field === 'leaveType' && value === 'Full Day') {
            delete entry.halfDaySession;
        } else if (field === 'leaveType' && value === 'Half Day' && !entry.halfDaySession) {
            entry.halfDaySession = 'First Half';
        }

        newEntries[index] = entry;
        return {...prev, leaveEntries: newEntries};
    })
  }
  
  const addEntry = () => {
    setEditingRequest(prev => ({
        ...prev,
        leaveEntries: [...prev.leaveEntries, {date: new Date().toISOString().split('T')[0], leaveType: 'Full Day'}]
    }))
  }

  const removeEntry = (index: number) => {
    setEditingRequest(prev => ({
        ...prev,
        leaveEntries: prev.leaveEntries.filter((_, i) => i !== index)
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRequest.leaveEntries.length === 0) {
        alert("Please add at least one leave day.");
        return;
    }
    if ('id' in editingRequest) {
      await setLeaveRequests(prev => prev.map(r => r.id === editingRequest.id ? (editingRequest as LeaveRequest) : r));
      addToastNotification('Your leave request has been updated.', 'Leave Request Updated');
    } else {
      const newRequest: LeaveRequest = {
        id: Date.now(),
        ...editingRequest,
      } as LeaveRequest;
      await setLeaveRequests(prev => [...prev, newRequest]);
      
      // For the manager/leader
      if (currentUser.managerId) {
        await addNotification({
            userId: currentUser.managerId,
            title: 'New Leave Request',
            message: `${currentUser.name} has submitted a leave request for approval.`,
            linkTo: 'TEAM_LEAVE',
        });
      }
    }
    closeModal();
  };
  
  const getStatusBadge = (status: Status) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case Status.PENDING: return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`;
        case Status.APPROVED: return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
        case Status.REJECTED: return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
    }
  }

  const getLeaveSummary = (req: LeaveRequest) => {
    if (req.leaveEntries.length === 0) return 'No dates';
    const sortedDates = req.leaveEntries.map(e => e.date).sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    
    let totalDays = 0;
    req.leaveEntries.forEach(e => {
        totalDays += e.leaveType === 'Full Day' ? 1 : 0.5;
    });

    const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
    return `${dateRange} (${totalDays} day${totalDays !== 1 ? 's' : ''})`;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Leave Requests</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative flex-grow">
                 <input
                     type="search"
                     placeholder="Search by reason..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                 />
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
             </div>
            {onExport && (
                 <button onClick={onExport} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 </button>
            )}
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
            >
              Request
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {filteredLeaveRequests.map(req => (
              <tr key={req.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {getLeaveSummary(req)}
                </td>
                <td className="px-6 py-4 text-sm max-w-sm truncate" title={req.reason}>{req.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStatusBadge(req.status)}>{req.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {req.status === Status.PENDING && (
                    <button onClick={() => openModal(req)} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
              {'id' in editingRequest ? 'Edit' : 'Request'} Leave
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Leave Dates</label>
                  <div className="space-y-2 mt-1">
                    {editingRequest.leaveEntries.map((entry, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                            <input type="date" value={entry.date} onChange={e => handleEntryChange(index, 'date', e.target.value)} className="md:col-span-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" />
                            <select value={entry.leaveType} onChange={e => handleEntryChange(index, 'leaveType', e.target.value)} className="md:col-span-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                                <option value="Full Day">Full Day</option>
                                <option value="Half Day">Half Day</option>
                            </select>
                            {entry.leaveType === 'Half Day' && (
                                <select value={entry.halfDaySession} onChange={e => handleEntryChange(index, 'halfDaySession', e.target.value)} className="md:col-span-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                                    <option value="First Half">First Half</option>
                                    <option value="Second Half">Second Half</option>
                                </select>
                            )}
                             <div className={`flex items-center ${entry.leaveType === 'Full Day' ? 'md:col-span-2 justify-end' : 'md:col-span-1 justify-end'}`}>
                                <button type="button" onClick={() => removeEntry(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">&times;</button>
                            </div>
                        </div>
                    ))}
                  </div>
                  <button type="button" onClick={addEntry} className="mt-2 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200">+ Add day</button>
               </div>
              
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Reason</label>
                  <textarea name="reason" value={editingRequest.reason} onChange={handleInputChange} rows={3} className="mt-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required></textarea>
                </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
