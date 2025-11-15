import { User, Timesheet, LeaveRequest, Project, Task, Notification } from '../types';
import { USERS, TIMESHEETS, LEAVE_REQUESTS, PROJECTS, TASKS, NOTIFICATIONS } from '../constants';

export const LOCAL_STORAGE_KEY = 'timesheetAppData_cloudscale';
const SIMULATED_LATENCY = 200; // ms

// --- Database Simulation ---

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

const initialState: AppData = {
  users: USERS,
  timesheets: TIMESHEETS,
  leaveRequests: LEAVE_REQUESTS,
  projects: PROJECTS,
  tasks: TASKS,
  notifications: NOTIFICATIONS,
  bestEmployeeIds: [1, 5],
  bestEmployeeOfYearIds: [],
};

let db: AppData;

const loadDb = (): AppData => {
  try {
    const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if ('users' in parsed && 'projects' in parsed) {
        // Ensure notifications array exists for backward compatibility
        if (!parsed.notifications) {
          parsed.notifications = [];
        }

        // Migration from single bestEmployeeId to array bestEmployeeIds
        if (parsed.bestEmployeeId !== undefined) {
          parsed.bestEmployeeIds = parsed.bestEmployeeId ? [parsed.bestEmployeeId] : [];
          delete parsed.bestEmployeeId;
        }

        // Ensure bestEmployeeIds exists for older data structures
        if (!parsed.bestEmployeeIds) {
          parsed.bestEmployeeIds = [1, 5];
        }

        // Ensure bestEmployeeOfYearIds exists
        if (!parsed.bestEmployeeOfYearIds) {
            parsed.bestEmployeeOfYearIds = [];
        }
        
        return parsed;
      }
    }
    // If no valid data, initialize and save.
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return initialState;
  }
};

const saveDb = () => {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Error writing to localStorage", error);
  }
};

// Initialize DB on module load
db = loadDb();

// --- Simulated API ---

// Generic function to simulate an async call
const callApi = <T>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(data))); // Deep copy to prevent mutation issues
    }, SIMULATED_LATENCY);
  });
};

// --- API Methods ---

export const cloudscaleApi = {
  getAppData: (): Promise<AppData> => {
    // Re-load from storage in case another tab changed it.
    db = loadDb();
    return callApi(db);
  },
  
  updateTimesheets: (timesheets: Timesheet[]): Promise<Timesheet[]> => {
    db.timesheets = timesheets;
    saveDb();
    return callApi(db.timesheets);
  },
  
  updateLeaveRequests: (leaveRequests: LeaveRequest[]): Promise<LeaveRequest[]> => {
    db.leaveRequests = leaveRequests;
    saveDb();
    return callApi(db.leaveRequests);
  },
  
  updateProjects: (projects: Project[]): Promise<Project[]> => {
    db.projects = projects;
    saveDb();
    return callApi(db.projects);
  },
  
  updateTasks: (tasks: Task[]): Promise<Task[]> => {
    db.tasks = tasks;
    saveDb();
    return callApi(db.tasks);
  },
  
  updateUsers: (users: User[]): Promise<User[]> => {
    db.users = users;
    saveDb();
    return callApi(db.users);
  },
  
  updateNotifications: (notifications: Notification[]): Promise<Notification[]> => {
    db.notifications = notifications;
    saveDb();
    return callApi(db.notifications);
  },

  updateBestEmployees: (userIds: number[]): Promise<number[]> => {
    db.bestEmployeeIds = userIds;
    saveDb();
    return callApi(db.bestEmployeeIds);
  },
  
  updateBestEmployeeOfYear: (userIds: number[]): Promise<number[]> => {
    db.bestEmployeeOfYearIds = userIds;
    saveDb();
    return callApi(db.bestEmployeeOfYearIds);
  },

  login: (email: string, password?: string): Promise<User | null> => {
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
        return callApi(user);
    }
    return callApi(null);
  },
};
