import React, { useState, useMemo } from 'react';
import { Timesheet, Status, Project, WorkEntry, Task, ProjectWork, User } from '../types';

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

// Local state types for the modal to handle predefined vs. additional tasks
type ModalWorkEntry = WorkEntry & {
    isPredefined: boolean;
    taskId?: number;
};

type ModalProjectWork = {
    projectId: number;
    workEntries: ModalWorkEntry[];
};

type EditingTimesheetState = Omit<Timesheet, 'id' | 'userId' | 'projectWork'> & {
    projectWork: ModalProjectWork[];
    id?: number; 
};

export const TimesheetPage: React.FC<TimesheetPageProps> = ({ currentUser, users, timesheets, setTimesheets, projects, tasks, onExport, addToastNotification, addNotification }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<EditingTimesheetState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const myProjects = useMemo(() => {
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
    // 1. Find all assigned, non-done tasks for the current user
    const assignedTasks = tasks.filter(t => 
        t.assignedTo.includes(currentUser.id) && t.status !== 'Done'
    );

    // 2. Group tasks by project ID for easy lookup
    const tasksByProject = assignedTasks.reduce((acc, task) => {
        (acc[task.projectId] = acc[task.projectId] || []).push(task);
        return acc;
    }, {} as Record<number, Task[]>);

    // 3. Create the base structure from ALL projects the user is part of
    let projectWorkStructure: ModalProjectWork[] = myProjects.map(project => {
        const projectTasks = tasksByProject[project.id] || [];
        return {
            projectId: project.id,
            workEntries: projectTasks.map(task => ({
                description: `Task: ${task.title}`,
                hours: 0,
                isPredefined: true,
                taskId: task.id,
            }))
        };
    });

    // 4. If editing, merge the saved data
    if (timesheetToEdit) {
        timesheetToEdit.projectWork.forEach(savedPw => {
            let projectInStructure = projectWorkStructure.find(pws => pws.projectId === savedPw.projectId);

            // If project from saved timesheet doesn't exist in base structure (e.g., all its tasks are now 'Done'), add it back in.
            if (!projectInStructure) {
                projectInStructure = { projectId: savedPw.projectId, workEntries: [] };
                projectWorkStructure.push(projectInStructure);
            }

            savedPw.workEntries.forEach(savedWe => {
                // Try to find a matching predefined task entry to update its hours
                const predefinedEntry = projectInStructure!.workEntries.find(we => we.isPredefined && we.description === savedWe.description);

                if (predefinedEntry) {
                    predefinedEntry.hours = savedWe.hours;
                } else {
                    // It's an additional task, so add it to the list
                    projectInStructure!.workEntries.push({
                        ...savedWe,
                        isPredefined: false,
                    });
                }
            });
        });
    }
    
    // 5. Set the final state for the modal
    const initialDate = timesheetToEdit ? timesheetToEdit.date : new Date().toISOString().split('T')[0];
    setEditingTimesheet({
        ...(timesheetToEdit || { // or default values for a new timesheet
            inTime: '09:00',
            outTime: '17:00',
            status: Status.PENDING,
        }),
        date: initialDate,
        projectWork: projectWorkStructure,
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

  const handleWorkEntryChange = (pwIndex: number, weIndex: number, field: keyof WorkEntry, value: string | number) => {
    if (!editingTimesheet) return;
    setEditingTimesheet(prev => {
        if (!prev) return null;
        const newProjectWork = [...prev.projectWork];
        const newWorkEntries = [...newProjectWork[pwIndex].workEntries];
        const entryToUpdate = { ...newWorkEntries[weIndex] };
        
        (entryToUpdate as any)[field] = field === 'hours' ? Number(value) : value;
        newWorkEntries[weIndex] = entryToUpdate;
        newProjectWork[pwIndex] = { ...newProjectWork[pwIndex], workEntries: newWorkEntries };
        return {...prev, projectWork: newProjectWork};
    })
  }
  
  const addAdditionalTask = (pwIndex: number) => {
    if (!editingTimesheet) return;
    setEditingTimesheet(prev => {
        if (!prev) return null;
        const newProjectWork = [...prev.projectWork];
        newProjectWork[pwIndex].workEntries.push({ description: '', hours: 0, isPredefined: false });
        return {...prev, projectWork: newProjectWork};
    });
  }

  const removeAdditionalTask = (pwIndex: number, weIndex: number) => {
    if (!editingTimesheet) return;
    setEditingTimesheet(prev => {
        if (!prev) return null;
        const newProjectWork = [...prev.projectWork];
        newProjectWork[pwIndex].workEntries = newProjectWork[pwIndex].workEntries.filter((_, i) => i !== weIndex);
        return {...prev, projectWork: newProjectWork};
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimesheet) return;

    // Filter out tasks with 0 hours and clean the data for saving
    const finalProjectWork: ProjectWork[] = editingTimesheet.projectWork
        .map(pw => ({
            projectId: pw.projectId,
            workEntries: pw.workEntries
                .filter(we => we.hours > 0)
                .map(({ description, hours }) => ({ description, hours })), // Strip modal-only properties
        }))
        .filter(pw => pw.workEntries.length > 0);

    if (finalProjectWork.length === 0) {
        alert("Please enter hours for at least one task.");
        return;
    }
     if (finalProjectWork.some(pw => pw.workEntries.some(we => !we.description))) {
        alert("Please provide a description for all additional tasks.");
        return;
    }

    const finalTimesheet = {
        ...editingTimesheet,
        userId: currentUser.id,
        projectWork: finalProjectWork,
    };
    
    if ('id' in finalTimesheet) {
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
    const projectNames = ts.projectWork.map(pw => projects.find(p => p.id === pw.projectId)?.name || 'N/A').join(', ');
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
                
                <div className="space-y-4">
                  {editingTimesheet.projectWork.map((pw, pwIndex) => (
                    <div key={pw.projectId} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400 mb-2">{projects.find(p => p.id === pw.projectId)?.name}</h3>
                        <div className="space-y-2 mt-1">
                          {pw.workEntries.map((entry, weIndex) => (
                              <div key={weIndex} className="grid grid-cols-12 gap-2 items-center">
                                  {entry.isPredefined ? (
                                      <p className="col-span-8 text-sm py-2">{entry.description.replace('Task: ', '')}</p>
                                  ) : (
                                      <input type="text" placeholder="Additional task description" value={entry.description} onChange={(e) => handleWorkEntryChange(pwIndex, weIndex, 'description', e.target.value)} className="col-span-8 p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" />
                                  )}
                                  <input type="number" placeholder="Hours" value={entry.hours} step="0.5" min="0" onChange={(e) => handleWorkEntryChange(pwIndex, weIndex, 'hours', e.target.value)} className="col-span-3 w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" />
                                  {!entry.isPredefined &&
                                    <button type="button" onClick={() => removeAdditionalTask(pwIndex, weIndex)} className="col-span-1 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-center">&times;</button>
                                  }
                              </div>
                          ))}
                        </div>
                         <button type="button" onClick={() => addAdditionalTask(pwIndex)} className="mt-3 text-sm text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200">+ Add Additional Task</button>
                    </div>
                  ))}
                   {editingTimesheet.projectWork.length === 0 && (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-4">You are not assigned to any projects. Add work manually if needed.</p>
                   )}
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