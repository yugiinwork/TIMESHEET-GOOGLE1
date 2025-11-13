import React, { useState, useMemo } from 'react';
import { Timesheet, Status, Project, WorkEntry, Task, ProjectWork, User, Role } from '../types';

interface TimesheetPageProps {
  currentUser: User;
  users: User[];
  timesheets: Timesheet[];
  setTimesheets: (updater: React.SetStateAction<Timesheet[]>) => Promise<void>;
  projects: Project[];
  tasks: Task[];
  onExport?: () => void;
  addToastNotification: (message: string, title?: string) => void;
  addNotification: (payload: { userId: number; title: string; message: string; linkTo?: any; }) => Promise<void>;
}

// Simplified state for a flat list of work entries in the modal
type FlatModalWorkEntry = {
    projectId: number | ''; 
    description: string;
    hours: number;
};

type EditingTimesheetState = Omit<Timesheet, 'id' | 'userId' | 'status' | 'projectWork'> & {
    workEntries: FlatModalWorkEntry[];
    status: Status;
    id?: number; 
};

export const TimesheetPage: React.FC<TimesheetPageProps> = ({ currentUser, users, timesheets, setTimesheets, projects, tasks, onExport, addToastNotification, addNotification }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<EditingTimesheetState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const myProjects = useMemo(() => {
    if ([Role.ADMIN, Role.MANAGER, Role.TEAM_LEADER].includes(currentUser.role)) {
      return projects;
    }
    return projects.filter(p => 
      p.teamIds.includes(currentUser.id) ||
      p.managerId === currentUser.id ||
      p.teamLeaderId === currentUser.id
    );
  }, [projects, currentUser]);

  const filteredTimesheets = useMemo(() => {
    if (!searchQuery) {
        return timesheets;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return timesheets.filter(ts => {
        return ts.projectWork.some(pw => {
            const projectName = projects.find(p => p.id === pw.projectId)?.name.toLowerCase() || '';
            if (projectName.includes(lowercasedQuery)) return true;
            return pw.workEntries.some(we => we.description.toLowerCase().includes(lowercasedQuery));
        });
    });
  }, [timesheets, searchQuery, projects]);

  const openModal = (timesheetToEdit?: Timesheet) => {
    let initialWorkEntries: FlatModalWorkEntry[] = [{ projectId: '', description: '', hours: 0 }];

    if (timesheetToEdit) {
        const flattenedEntries = timesheetToEdit.projectWork.flatMap(pw => 
            pw.workEntries.map(we => ({
                projectId: pw.projectId,
                description: we.description,
                hours: we.hours
            }))
        );
        if (flattenedEntries.length > 0) {
            initialWorkEntries = flattenedEntries;
        }
    }
    
    const initialDate = timesheetToEdit ? timesheetToEdit.date : new Date().toISOString().split('T')[0];
    setEditingTimesheet({
        ...(timesheetToEdit || {
            inTime: '09:00',
            outTime: '17:00',
            status: Status.PENDING,
        }),
        date: initialDate,
        workEntries: initialWorkEntries,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTimesheet(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingTimesheet) return;
    const { name, value } = e.target;
    setEditingTimesheet(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleWorkEntryChange = (index: number, field: keyof FlatModalWorkEntry, value: string | number) => {
    if (!editingTimesheet) return;
    setEditingTimesheet(prev => {
        if (!prev) return null;
        const newWorkEntries = [...prev.workEntries];
        const entryToUpdate = { ...newWorkEntries[index] };
        
        let processedValue = value;
        if (field === 'hours') {
            processedValue = Number(value) < 0 ? 0 : Number(value);
        } else if (field === 'projectId') {
            processedValue = value === '' ? '' : Number(value);
        }

        (entryToUpdate as any)[field] = processedValue;
        
        newWorkEntries[index] = entryToUpdate;
        return {...prev, workEntries: newWorkEntries};
    });
  };
  
  const addWorkEntry = () => {
    if (!editingTimesheet) return;
    setEditingTimesheet(prev => {
        if (!prev) return null;
        // FIX: Explicitly type the new work entry to prevent TypeScript from widening the type of projectId from '' to string.
        const newEntry: FlatModalWorkEntry = { projectId: '', description: '', hours: 0 };
        const newWorkEntries = [...prev.workEntries, newEntry];
        return {...prev, workEntries: newWorkEntries};
    });
  };

  const removeWorkEntry = (index: number) => {
    if (!editingTimesheet) return;
    setEditingTimesheet(prev => {
        if (!prev) return null;
        const newWorkEntries = prev.workEntries.filter((_, i) => i !== index);
        // If all entries are removed, add a fresh empty one back
        if (newWorkEntries.length === 0) {
            // FIX: Explicitly type the new work entry to prevent TypeScript from widening the type of projectId from '' to string.
            const newEntry: FlatModalWorkEntry = { projectId: '', description: '', hours: 0 };
            return {...prev, workEntries: [newEntry]};
        }
        return {...prev, workEntries: newWorkEntries};
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimesheet) return;

    // Filter out invalid entries and group by project
    const workByProject = editingTimesheet.workEntries
        .filter(we => {
            const hasCoreInfo = we.hours > 0 && we.description.trim() !== '';
            if (!hasCoreInfo) return false;
            if (currentUser.role === Role.ADMIN) return true; // project is optional for admin
            return !!we.projectId; // project is required for others
        })
        .reduce((acc, current) => {
            const projectId = (current.projectId === '' && currentUser.role === Role.ADMIN) 
                ? 0 
                : current.projectId as number;

            if (!acc[projectId]) {
                acc[projectId] = [];
            }
            acc[projectId].push({ description: current.description, hours: current.hours });
            return acc;
        }, {} as Record<number, WorkEntry[]>);

    const finalProjectWork: ProjectWork[] = Object.entries(workByProject).map(([projectId, workEntries]) => ({
        projectId: Number(projectId),
        workEntries,
    }));

    if (finalProjectWork.length === 0) {
        let message = "Please enter at least one valid work entry with a project, description, and hours.";
        if (currentUser.role === Role.ADMIN) {
            message = "Please enter at least one valid work entry with a description and hours. Project is optional.";
        }
        alert(message);
        return;
    }

    const finalTimesheet = {
        id: editingTimesheet.id,
        date: editingTimesheet.date,
        inTime: editingTimesheet.inTime,
        outTime: editingTimesheet.outTime,
        status: editingTimesheet.status,
        userId: currentUser.id,
        projectWork: finalProjectWork,
    };
    
    if ('id' in editingTimesheet && editingTimesheet.id) {
      await setTimesheets(prev => prev.map(t => t.id === finalTimesheet.id ? (finalTimesheet as Timesheet) : t));
      addToastNotification(`Your timesheet for ${finalTimesheet.date} has been updated.`, 'Timesheet Updated');
    } else {
      const newTimesheet: Timesheet = {
        ...finalTimesheet,
        id: Date.now(),
      } as Timesheet;
      await setTimesheets(prev => [...prev, newTimesheet]);
      
      // For the manager/leader
      if (currentUser.managerId) {
        await addNotification({
            userId: currentUser.managerId,
            title: 'New Timesheet Submission',
            message: `${currentUser.name} has submitted a timesheet for review.`,
            linkTo: 'TEAM_TIMESHEETS',
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

  const getWorkSummary = (ts: Timesheet) => {
    const totalHours = ts.projectWork.reduce((sum, pw) => sum + pw.workEntries.reduce((s, we) => s + we.hours, 0), 0);
    const projectNames = ts.projectWork.map(pw => {
        if (pw.projectId === 0) {
            return 'General/Admin Tasks';
        }
        return projects.find(p => p.id === pw.projectId)?.name || 'Unknown Project'
    }).join(', ');
    return `${projectNames} (${totalHours} hrs)`;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Timesheets</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative flex-grow">
                 <input
                     type="search"
                     placeholder="Search..."
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
              Add New
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Work Summary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {filteredTimesheets.map(ts => (
              <tr key={ts.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ts.date}</td>
                <td className="px-6 py-4 text-sm max-w-sm truncate" title={getWorkSummary(ts)}>
                    {getWorkSummary(ts)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStatusBadge(ts.status)}>{ts.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {ts.status === Status.PENDING && (
                    <button onClick={() => openModal(ts)} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Timesheet Modal */}
      {isModalOpen && editingTimesheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-3xl max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
              {editingTimesheet.id ? 'Edit' : 'Add'} Timesheet for {editingTimesheet.date}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Date</label>
                      <input type="date" name="date" value={editingTimesheet.date} onChange={handleInputChange} className="mt-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">In-Time</label>
                        <input type="time" name="inTime" value={editingTimesheet.inTime} onChange={handleInputChange} className="mt-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Out-Time</label>
                        <input type="time" name="outTime" value={editingTimesheet.outTime} onChange={handleInputChange} className="mt-1 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    </div>
                </div>
                
                <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Work Entries</h3>
                    <div className="space-y-3">
                        {editingTimesheet.workEntries.map((entry, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                {currentUser.role !== Role.ADMIN && (
                                    <select 
                                        value={entry.projectId} 
                                        onChange={(e) => handleWorkEntryChange(index, 'projectId', e.target.value)}
                                        className="col-span-12 sm:col-span-4 p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                                        required
                                    >
                                        <option value="" disabled>Select Project</option>
                                        {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                )}
                                <input 
                                    type="text" 
                                    placeholder="Work description" 
                                    value={entry.description} 
                                    onChange={(e) => handleWorkEntryChange(index, 'description', e.target.value)} 
                                    className={`p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md ${
                                        currentUser.role === Role.ADMIN ? 'col-span-12 sm:col-span-9' : 'col-span-12 sm:col-span-5'
                                    }`} 
                                    required
                                />
                                <input 
                                    type="number" 
                                    placeholder="Hours" 
                                    value={entry.hours} 
                                    step="0.5" 
                                    min="0" 
                                    onChange={(e) => handleWorkEntryChange(index, 'hours', e.target.value)} 
                                    className="col-span-8 sm:col-span-2 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                                    required
                                />
                                <div className="col-span-4 sm:col-span-1 flex justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => removeWorkEntry(index)} 
                                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-center"
                                        aria-label="Remove work entry"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button 
                        type="button" 
                        onClick={addWorkEntry} 
                        className="mt-3 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200"
                    >
                        + Add Work Entry
                    </button>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};