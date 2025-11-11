
import React, { useState, useMemo } from 'react';
import { Timesheet, LeaveRequest, Status, User, Role, Project, Task, LeaveEntry } from '../types';

type ReviewItem = (Timesheet | LeaveRequest) & { id: number; userId: number; status: Status; approverId?: number };

interface ManagerReviewPageProps {
  title: string;
  items: ReviewItem[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (id: number, status: Status) => void;
  canApprove: boolean;
  projects: Project[];
  tasks: Task[];
  onExport?: () => void;
}

const getStatusBadge = (status: Status) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case Status.PENDING: return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`;
        case Status.APPROVED: return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
        case Status.REJECTED: return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
    }
};

const getLeaveEntryDetails = (entry: LeaveEntry) => {
    if (entry.leaveType === 'Half Day') {
        return `Half Day (${entry.halfDaySession})`
    }
    return 'Full Day';
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

const DetailsModal: React.FC<{item: ReviewItem, users: User[], projects: Project[], onClose: () => void}> = ({ item, users, projects, onClose }) => {
    const isTimesheet = (item: ReviewItem): item is Timesheet => 'projectWork' in item;
    const isLeave = (item: ReviewItem): item is LeaveRequest => 'leaveEntries' in item;

    const employee = users.find(u => u.id === item.userId);
    const approver = item.approverId ? users.find(u => u.id === item.approverId) : null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-2xl shadow-xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Request Details
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl">&times;</button>
            </div>
            <div className="space-y-4 text-sm">
                <p><strong className="text-slate-500 dark:text-slate-400 w-28 inline-block">Employee:</strong> {employee?.name}</p>
                <p><strong className="text-slate-500 dark:text-slate-400 w-28 inline-block">Status:</strong> <span className={getStatusBadge(item.status)}>{item.status}</span></p>
                {approver && <p><strong className="text-slate-500 dark:text-slate-400 w-28 inline-block">Processed By:</strong> {approver.name}</p>}
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                {isTimesheet(item) && (
                    <div className="space-y-4">
                        <p><strong className="text-slate-500 dark:text-slate-400 w-28 inline-block">Date:</strong> {item.date}</p>
                        <p><strong className="text-slate-500 dark:text-slate-400 w-28 inline-block">Time:</strong> {item.inTime} - {item.outTime}</p>
                        <p className="mt-2"><strong className="text-slate-500 dark:text-slate-400 block mb-1">Work Done Details:</strong></p>
                        <div className="space-y-3">
                            {item.projectWork.map((pw, pwIndex) => (
                                <div key={pwIndex} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <h4 className="font-semibold">{projects.find(p => p.id === pw.projectId)?.name || 'N/A'}</h4>
                                    <ul className="list-disc list-inside space-y-1 mt-1 pl-2">
                                        {pw.workEntries.map((entry, index) => (
                                            <li key={index}><strong>{entry.hours} hrs:</strong> {entry.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {isLeave(item) && (
                    <>
                        <p className="mt-2"><strong className="text-slate-500 dark:text-slate-400 block mb-1">Reason:</strong></p>
                        <p className="p-2 bg-slate-100 dark:bg-slate-700 rounded-md whitespace-pre-wrap mb-4">{item.reason}</p>
                        <p className="mt-2"><strong className="text-slate-500 dark:text-slate-400 block mb-1">Leave Dates:</strong></p>
                        <ul className="list-disc list-inside p-2 bg-slate-100 dark:bg-slate-700 rounded-md space-y-1">
                            {item.leaveEntries.map((entry, index) => (
                                <li key={index}><strong>{entry.date}:</strong> {getLeaveEntryDetails(entry)}</li>
                            ))}
                        </ul>
                    </>
                )}
                </div>
            </div>
             <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Close</button>
              </div>
          </div>
        </div>
    )
}

export const ManagerReviewPage: React.FC<ManagerReviewPageProps> = ({ title, items, users, currentUser, onUpdateStatus, canApprove, projects, onExport }) => {
  const [activeTab, setActiveTab] = useState<'Pending' | 'History'>('Pending');
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [designationFilter, setDesignationFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name_asc');

  const designations = useMemo(() => [...new Set(users.map(u => u.designation).filter(Boolean))], [users]);

  const getUserName = (userId: number) => users.find(u => u.id === userId)?.name || 'Unknown';
  const isTimesheet = (item: ReviewItem): item is Timesheet => 'projectWork' in item;
  const isLeave = (item: ReviewItem): item is LeaveRequest => 'leaveEntries' in item;
  
  const getTimesheetSummary = (item: Timesheet) => {
    const totalHours = item.projectWork.reduce((sum, pw) => sum + pw.workEntries.reduce((s, we) => s + we.hours, 0), 0);
    const projectNames = item.projectWork.map(pw => projects.find(p => p.id === pw.projectId)?.name || 'N/A').join(', ');
    return `${projectNames} (${totalHours} hrs)`;
  }

  const processedItems = useMemo(() => {
    const itemsWithUser = items.map(item => ({
      ...item,
      user: users.find(u => u.id === item.userId),
    })).filter(item => item.user);

    let filtered = itemsWithUser;

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item => {
            const userName = item.user!.name.toLowerCase();
            if (userName.includes(lowercasedQuery)) return true;

            if (isTimesheet(item)) {
                const summary = getTimesheetSummary(item as Timesheet).toLowerCase();
                if (summary.includes(lowercasedQuery)) return true;
            }
            if (isLeave(item)) {
                const reason = (item as LeaveRequest).reason.toLowerCase();
                if (reason.includes(lowercasedQuery)) return true;
            }
            return false;
        });
    }

    if (roleFilter) {
      filtered = filtered.filter(item => item.user!.role === roleFilter);
    }
    if (designationFilter) {
      filtered = filtered.filter(item => item.user!.designation === designationFilter);
    }

    filtered.sort((a, b) => {
      const [sortField, sortDir] = sortBy.split('_');
      const valA = sortField === 'name' ? a.user!.name.toLowerCase() : a.user!.employeeId;
      const valB = sortField === 'name' ? b.user!.name.toLowerCase() : b.user!.employeeId;
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, users, roleFilter, designationFilter, sortBy, searchQuery, projects]);

  const pendingItems = processedItems.filter(i => i.status === Status.PENDING);
  const historyItems = processedItems.filter(i => i.status !== Status.PENDING);

  const renderTable = (data: ReviewItem[], isHistory: boolean) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Status</th>
              {isHistory && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Processed By</th>}
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{getUserName(item.userId)}</div>
                    <div className="text-xs text-slate-500">{users.find(u=>u.id === item.userId)?.designation}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-sm truncate">
                  {isTimesheet(item) && (
                    <div title={getTimesheetSummary(item)}>{getTimesheetSummary(item)}</div>
                  )}
                  {isLeave(item) && (
                     <div title={item.reason}>
                        <span className="font-semibold">{getLeaveSummary(item)}: </span>
                        {item.reason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStatusBadge(item.status)}>{item.status}</span>
                </td>
                {isHistory && <td className="px-6 py-4 whitespace-nowrap text-sm">{item.approverId ? getUserName(item.approverId) : 'N/A'}</td>}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }} className="px-3 py-1 text-xs text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">View</button>
                  {canApprove && !isHistory && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(item.id, Status.APPROVED); }} className="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700">Approve</button>
                      <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(item.id, Status.REJECTED); }} className="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
             {data.length === 0 && (
                <tr>
                    <td colSpan={isHistory ? 5 : 4} className="text-center py-10 text-slate-500 dark:text-slate-400">
                        No {activeTab.toLowerCase()} requests found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{title}</h1>
         {onExport && (
             <button onClick={onExport} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 <span>Export</span>
             </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg mb-6">
          <div className="p-4 flex flex-wrap items-center gap-4 text-sm border-b border-slate-200 dark:border-slate-700">
             <div className="relative flex-grow min-w-[200px]">
                 <input
                     type="search"
                     placeholder="Search by name, project, reason..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                 />
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
             </div>
            <div className="flex-grow min-w-[150px]">
                <label htmlFor="role-filter" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                <select id="role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | '')} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                    <option value="">All Roles</option>
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div className="flex-grow min-w-[150px]">
                <label htmlFor="designation-filter" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Designation</label>
                <select id="designation-filter" value={designationFilter} onChange={e => setDesignationFilter(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                    <option value="">All Designations</option>
                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="flex-grow min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sort By</label>
                <div className="flex">
                    <select value={sortBy.split('_')[0]} onChange={e => setSortBy(`${e.target.value}_${sortBy.split('_')[1]}`)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-l-md">
                        <option value="name">Name</option>
                        <option value="empId">Employee ID</option>
                    </select>
                    <button onClick={() => setSortBy(`${sortBy.split('_')[0]}_asc`)} className={`px-3 py-2 border ${sortBy.endsWith('_asc') ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-600'}`}>▲</button>
                    <button onClick={() => setSortBy(`${sortBy.split('_')[0]}_desc`)} className={`px-3 py-2 border rounded-r-md ${sortBy.endsWith('_desc') ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-600'}`}>▼</button>
                </div>
            </div>
        </div>
        <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-6 px-4" aria-label="Tabs">
                <button onClick={() => setActiveTab('Pending')} className={`${activeTab === 'Pending' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                    Pending ({pendingItems.length})
                </button>
                <button onClick={() => setActiveTab('History')} className={`${activeTab === 'History' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                    History ({historyItems.length})
                </button>
            </nav>
        </div>
        {activeTab === 'Pending' ? renderTable(pendingItems, false) : renderTable(historyItems, true)}
      </div>

      {selectedItem && <DetailsModal item={selectedItem} users={users} projects={projects} onClose={() => setSelectedItem(null)}/>}
    </div>
  );
};
