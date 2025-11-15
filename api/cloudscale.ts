import { User, Timesheet, LeaveRequest, Project, Task, Notification, Status } from '../types';
import { USERS, TIMESHEETS, LEAVE_REQUESTS, PROJECTS, TASKS, NOTIFICATIONS } from '../constants';

export const LOCAL_STORAGE_KEY = 'timesheetProData';

interface AppData {
  users: User[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  tasks: Task[];
  notifications: Notification[];
  bestEmployeeIds: number[];
  bestEmployeeOfYearIds: number[];
}

const getInitialData = (): AppData => ({
  users: USERS,
  timesheets: TIMESHEETS,
  leaveRequests: LEAVE_REQUESTS,
  projects: PROJECTS,
  tasks: TASKS,
  notifications: NOTIFICATIONS,
  bestEmployeeIds: [],
  bestEmployeeOfYearIds: [],
});

// Helper to get all data from localStorage, initializing if it doesn't exist.
const getAppDataFromStorage = (): AppData => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      // A simple validation to ensure the data structure is roughly correct.
      if (data && data.users && data.timesheets && data.leaveRequests && data.projects) {
        return data;
      }
    }
  } catch (error) {
    console.error("Failed to parse data from localStorage, resetting.", error);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  
  // If no valid data, initialize with constants.
  const initialData = getInitialData();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

// Helper to save all data to localStorage.
const setAppDataToStorage = (data: AppData) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};


// The mock API using localStorage to simulate a backend.
export const cloudscaleApi = {
  getAppData: async (): Promise<AppData> => {
    // Simulate an async API call
    return Promise.resolve(getAppDataFromStorage());
  },
  
  updateTimesheets: async (timesheets: Timesheet[]): Promise<Timesheet[]> => {
    const appData = getAppDataFromStorage();
    appData.timesheets = timesheets;

    // Recalculate actualHours for projects whenever timesheets are updated
    // This keeps business logic in the "API layer"
    appData.projects = appData.projects.map(p => {
        const totalHours = appData.timesheets.reduce((projectSum, ts) => {
            if (ts.status !== Status.APPROVED) return projectSum;

            const workForThisProject = ts.projectWork.find(pw => pw.projectId === p.id);
            if (workForThisProject) {
                const hoursInTimesheet = workForThisProject.workEntries.reduce((workSum, entry) => workSum + entry.hours, 0);
                return projectSum + hoursInTimesheet;
            }
            return projectSum;
        }, 0);
        return { ...p, actualHours: totalHours };
    });

    setAppDataToStorage(appData);
    return Promise.resolve(timesheets);
  },
  
  updateLeaveRequests: async (leaveRequests: LeaveRequest[]): Promise<LeaveRequest[]> => {
    const appData = getAppDataFromStorage();
    appData.leaveRequests = leaveRequests;
    setAppDataToStorage(appData);
    return Promise.resolve(leaveRequests);
  },
  
  updateProjects: async (projects: Project[]): Promise<Project[]> => {
    const appData = getAppDataFromStorage();
    appData.projects = projects;
    setAppDataToStorage(appData);
    return Promise.resolve(projects);
  },
  
  updateTasks: async (tasks: Task[]): Promise<Task[]> => {
    const appData = getAppDataFromStorage();
    appData.tasks = tasks;
    setAppDataToStorage(appData);
    return Promise.resolve(tasks);
  },
  
  updateUsers: async (users: User[]): Promise<User[]> => {
    const appData = getAppDataFromStorage();
    appData.users = users;
    setAppDataToStorage(appData);
    return Promise.resolve(users);
  },
  
  updateNotifications: async (notifications: Notification[]): Promise<Notification[]> => {
    const appData = getAppDataFromStorage();
    appData.notifications = notifications;
    setAppDataToStorage(appData);
    return Promise.resolve(notifications);
  },

  updateBestEmployees: async (userIds: number[]): Promise<number[]> => {
    const appData = getAppDataFromStorage();
    appData.bestEmployeeIds = userIds;
    setAppDataToStorage(appData);
    return Promise.resolve(userIds);
  },
  
  updateBestEmployeeOfYear: async (userIds: number[]): Promise<number[]> => {
    const appData = getAppDataFromStorage();
    appData.bestEmployeeOfYearIds = userIds;
    setAppDataToStorage(appData);
    return Promise.resolve(userIds);
  },

  login: async (email: string, password?: string): Promise<User | null> => {
    const appData = getAppDataFromStorage();
    const user = appData.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    return Promise.resolve(user || null);
  },
};
