
import { User, Timesheet, LeaveRequest, Project, Task } from '../types';
import { USERS, TIMESHEETS, LEAVE_REQUESTS, PROJECTS, TASKS } from '../constants';

const LOCAL_STORAGE_KEY = 'timesheetAppData_cloudscale';
const SIMULATED_LATENCY = 200; // ms

// --- Database Simulation ---

interface AppData {
  users: User[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  tasks: Task[];
  bestEmployeeId: number | null;
}

const initialState: AppData = {
  users: USERS,
  timesheets: TIMESHEETS,
  leaveRequests: LEAVE_REQUESTS,
  projects: PROJECTS,
  tasks: TASKS,
  bestEmployeeId: 1,
};

let db: AppData;

const loadDb = (): AppData => {
  try {
    const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      if ('users' in parsed && 'projects' in parsed) {
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

  updateBestEmployee: (userId: number): Promise<number> => {
    db.bestEmployeeId = userId;
    saveDb();
    return callApi(db.bestEmployeeId!);
  },

  login: (email: string, password?: string): Promise<User | null> => {
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
        return callApi(user);
    }
    return callApi(null);
  },
};
