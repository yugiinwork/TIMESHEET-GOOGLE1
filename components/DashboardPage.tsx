
import React from 'react';
import { User, Role, Timesheet, LeaveRequest, Project, Status } from '../types';
import { BestEmployeeWidget } from './BestEmployeeWidget';

interface DashboardPageProps {
  currentUser: User;
  users: User[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  bestEmployeeId: number | null;
  setView: (view: any) => void;
}

const StatsCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, users, timesheets, leaveRequests, projects, bestEmployeeId, setView }) => {
    
    // --- Stat Calculations ---
    const myPendingTimesheets = timesheets.filter(t => t.userId === currentUser.id && t.status === Status.PENDING).length;
    const myApprovedLeaveDays = leaveRequests
        .filter(l => l.userId === currentUser.id && l.status === Status.APPROVED)
        .reduce((total, req) => {
            req.leaveEntries.forEach(entry => {
                if (entry.leaveType === 'Full Day') total += 1;
                else total += 0.5;
            });
            return total;
        }, 0);
    const myProjectsCount = projects.filter(p => p.teamIds.includes(currentUser.id) || p.managerId === currentUser.id || p.teamLeaderId === currentUser.id).length;

    const isManagerial = [Role.ADMIN, Role.MANAGER, Role.TEAM_LEADER].includes(currentUser.role);
    
    let teamMembersCount = 0;
    let pendingApprovals = 0;
    
    if (isManagerial) {
        if (currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGER) {
            teamMembersCount = users.length;
            pendingApprovals = timesheets.filter(t => t.status === Status.PENDING).length + leaveRequests.filter(l => l.status === Status.PENDING).length;
        } else { // Team Leader
            const teamMemberIds = users.filter(u => u.managerId === currentUser.id).map(u => u.id);
            teamMembersCount = teamMemberIds.length;
            pendingApprovals = timesheets.filter(t => teamMemberIds.includes(t.userId) && t.status === Status.PENDING).length + leaveRequests.filter(l => teamMemberIds.includes(l.userId) && l.status === Status.PENDING).length;
        }
    }

    const myRecentActivity = [
        ...timesheets.filter(t => t.userId === currentUser.id).map(t => ({...t, type: 'Timesheet', date: t.date})),
        ...leaveRequests.filter(l => l.userId === currentUser.id).map(l => ({...l, type: 'Leave', date: l.leaveEntries[0]?.date || ''}))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const teamPendingActivity = isManagerial ? [
        ...timesheets.filter(t => t.status === Status.PENDING && (currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGER ? true : users.find(u=>u.id === t.userId)?.managerId === currentUser.id)).map(t => ({...t, type: 'Timesheet', date: t.date})),
        ...leaveRequests.filter(l => l.status === Status.PENDING && (currentUser.role === Role.ADMIN || currentUser.role === Role.MANAGER ? true : users.find(u=>u.id === l.userId)?.managerId === currentUser.id)).map(l => ({...l, type: 'Leave', date: l.leaveEntries[0]?.date || ''}))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5) : [];

    const getStatusBadge = (status: Status) => {
        const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
        switch (status) {
            case Status.PENDING: return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`;
            case Status.APPROVED: return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
            case Status.REJECTED: return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
        }
    }
    
    const ICONS = {
        TIMESHEET: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        LEAVE: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        PROJECT: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
        TEAM: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        APPROVAL: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome back, {currentUser.name}!</h1>
                <p className="text-slate-500 dark:text-slate-400">Here's your dashboard overview for today.</p>
            </div>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${isManagerial ? 5 : 3} gap-6`}>
                <StatsCard title="Pending Timesheets" value={myPendingTimesheets} icon={ICONS.TIMESHEET} color="bg-yellow-500" />
                <StatsCard title="Approved Leave Days" value={myApprovedLeaveDays} icon={ICONS.LEAVE} color="bg-green-500" />
                <StatsCard title="My Projects" value={myProjectsCount} icon={ICONS.PROJECT} color="bg-sky-500" />
                {isManagerial && (
                    <>
                        <StatsCard title={currentUser.role === Role.TEAM_LEADER ? "Team Members" : "Total Users"} value={teamMembersCount} icon={ICONS.TEAM} color="bg-indigo-500" />
                        <StatsCard title="Pending Approvals" value={pendingApprovals} icon={ICONS.APPROVAL} color="bg-red-500" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">My Recent Activity</h2>
                        <ul className="space-y-3">
                            {myRecentActivity.map(item => (
                                <li key={`${item.type}-${item.id}`} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                        <span className={`mr-3 p-1.5 rounded-full ${item.type === 'Timesheet' ? 'bg-sky-100 dark:bg-sky-900' : 'bg-green-100 dark:bg-green-900'}`}>
                                            {item.type === 'Timesheet' ? 
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> :
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            }
                                        </span>
                                        <p>{item.type} for {item.date}</p>
                                    </div>
                                    <span className={getStatusBadge(item.status)}>{item.status}</span>
                                </li>
                            ))}
                            {myRecentActivity.length === 0 && <p className="text-sm text-slate-500">No recent activity.</p>}
                        </ul>
                    </div>
                     {isManagerial && (
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold mb-4">Team Pending Approvals</h2>
                             <ul className="space-y-3">
                                {teamPendingActivity.map(item => (
                                     <li key={`${item.type}-${item.id}`} className="flex items-center justify-between text-sm">
                                         <div>
                                            <span className="font-semibold">{users.find(u => u.id === item.userId)?.name}</span>
                                            <span className="text-slate-500"> - {item.type} for {item.date}</span>
                                         </div>
                                        <button onClick={() => setView(item.type === 'Timesheet' ? 'TEAM_TIMESHEETS' : 'TEAM_LEAVE')} className="px-3 py-1 text-xs text-white bg-sky-600 rounded-md hover:bg-sky-700">Review</button>
                                     </li>
                                ))}
                                 {teamPendingActivity.length === 0 && <p className="text-sm text-slate-500">No pending approvals.</p>}
                             </ul>
                         </div>
                     )}
                </div>
                <div className="space-y-6">
                    <BestEmployeeWidget bestEmployeeId={bestEmployeeId} users={users} />
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Project Overview</h2>
                        <ul className="space-y-4">
                            {projects.slice(0, 4).map(p => {
                                const progress = p.estimatedHours > 0 ? Math.min(Math.round((p.actualHours / p.estimatedHours) * 100), 100) : 0;
                                return (
                                    <li key={p.id}>
                                        <div className="flex justify-between items-center text-sm font-semibold mb-1">
                                            <span className="text-slate-700 dark:text-slate-200">{p.name}</span>
                                            <span className="text-sky-600 dark:text-sky-400">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div className="bg-sky-500 h-2 rounded-full" style={{width: `${progress}%`}}></div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
