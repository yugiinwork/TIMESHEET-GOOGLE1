
import React, { useState, useMemo } from 'react';
import { Project, User, Role, ProjectStatus } from '../types';

interface ProjectManagementPageProps {
  projects: Project[];
  setProjects: (updater: React.SetStateAction<Project[]>) => Promise<void>;
  users: User[];
  currentUser: User;
  onSetBestEmployee: () => void;
  onExport?: () => void;
}

const emptyProject = (managerId: number, company: string): Omit<Project, 'id'> => ({
  name: '',
  description: '',
  managerId: managerId,
  teamLeaderId: undefined,
  teamIds: [],
  customerName: '',
  jobName: '',
  estimatedHours: 0,
  actualHours: 0,
  company: company,
  status: ProjectStatus.NOT_STARTED,
});

export const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({ projects, setProjects, users, currentUser, onSetBestEmployee, onExport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Omit<Project, 'id'> | Project>(emptyProject(currentUser.id, currentUser.company || ''));
  const [searchQuery, setSearchQuery] = useState('');
  
  const managers = users.filter(u => u.role === Role.MANAGER || u.role === Role.ADMIN);
  const teamLeaders = users.filter(u => u.role === Role.TEAM_LEADER);
  const employees = users.filter(u => u.role === Role.EMPLOYEE);
  const canEdit = [Role.ADMIN, Role.MANAGER, Role.TEAM_LEADER].includes(currentUser.role);
  const canSetBestEmployee = [Role.MANAGER, Role.TEAM_LEADER].includes(currentUser.role);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) {
      return projects;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowercasedQuery) ||
      project.customerName.toLowerCase().includes(lowercasedQuery) ||
      project.jobName.toLowerCase().includes(lowercasedQuery)
    );
  }, [projects, searchQuery]);

  const openModal = (project?: Project) => {
    setEditingProject(project || emptyProject(currentUser.id, currentUser.company || ''));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumberField = ['managerId', 'teamLeaderId', 'estimatedHours', 'actualHours'].includes(name);
    
    let processedValue: string | number | undefined = value;
    if (isNumberField) {
        processedValue = value ? Number(value) : undefined;
    }

    setEditingProject(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const options = e.target.options;
      const value: number[] = [];
      for (let i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
          value.push(Number(options[i].value));
        }
      }
      setEditingProject(prev => ({...prev, teamIds: value}));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
        ...editingProject,
        managerId: Number(editingProject.managerId),
        teamLeaderId: editingProject.teamLeaderId ? Number(editingProject.teamLeaderId) : undefined,
        company: currentUser.company || '',
    }

    if ('id' in projectData) {
      await setProjects(prev => prev.map(p => p.id === projectData.id ? (projectData as Project) : p));
    } else {
      const newProject: Project = {
        id: Date.now(),
        ...projectData,
      } as Project;
      await setProjects(prev => [...prev, newProject]);
    }
    closeModal();
  };
  
  const getStatusBadge = (status: ProjectStatus) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
        case ProjectStatus.NOT_STARTED: return `${baseClasses} bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200`;
        case ProjectStatus.IN_PROGRESS: return `${baseClasses} bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300`;
        case ProjectStatus.ON_HOLD: return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`;
        case ProjectStatus.COMPLETED: return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Project Management</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-grow">
                 <input
                     type="search"
                     placeholder="Search projects..."
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
            {canSetBestEmployee && (
                 <button
                    onClick={onSetBestEmployee}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </button>
            )}
            {canEdit && (
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
              >
                Create
              </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 flex flex-col">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-sky-600 dark:text-sky-400">{project.name}</h2>
              <span className={getStatusBadge(project.status)}>{project.status}</span>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{project.jobName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customer: {project.customerName}</p>
            
            <div className="grid grid-cols-2 gap-4 my-4 text-center">
                <div>
                    <div className="text-xs text-slate-400">Estimated Hours</div>
                    <div className="text-lg font-bold">{project.estimatedHours}</div>
                </div>
                 <div>
                    <div className="text-xs text-slate-400">Actual Hours</div>
                    <div className="text-lg font-bold">{project.actualHours}</div>
                </div>
            </div>

            <p className="mt-2 flex-grow text-slate-700 dark:text-slate-300 text-sm">{project.description}</p>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-sm">Team:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                    {project.teamIds.map(id => users.find(u => u.id === id)).filter(Boolean).map(member => (
                        <div key={member!.id} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-full pr-3 py-0.5">
                            <img src={member!.profilePictureUrl || `https://picsum.photos/seed/${member!.id}/32`} alt={member!.name} className="w-6 h-6 rounded-full" />
                            <span className="text-xs">{member!.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            {canEdit && (
              <div className="mt-6 text-right">
                <button onClick={() => openModal(project)} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 text-sm font-medium">
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && canEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
              {'id' in editingProject ? 'Edit' : 'Create'} Project
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Project Name" value={editingProject.name} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Status</label>
                    <select name="status" value={editingProject.status} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                        {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="customerName" placeholder="Customer Name" value={editingProject.customerName} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                <input type="text" name="jobName" placeholder="Job Name" value={editingProject.jobName} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Hours</label>
                    <input type="number" name="estimatedHours" value={editingProject.estimatedHours} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Actual Hours (Auto-calculated)</label>
                    <input type="number" name="actualHours" value={editingProject.actualHours} className="w-full p-2 bg-slate-200 dark:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-md" disabled />
                 </div>
              </div>
              <textarea name="description" placeholder="Description" value={editingProject.description} onChange={handleInputChange} rows={3} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required></textarea>
                {currentUser.role !== Role.TEAM_LEADER && (
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Manager</label>
                        <select name="managerId" value={editingProject.managerId} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required>
                            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Team Leader</label>
                    <select name="teamLeaderId" value={editingProject.teamLeaderId || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                        <option value="">None</option>
                        {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.name}</option>)}
                    </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Team Members</label>
                  <select name="teamIds" multiple value={editingProject.teamIds.map(String)} onChange={handleTeamChange} className="w-full p-2 h-32 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                    {[...teamLeaders, ...employees].map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                  </select>
                </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
