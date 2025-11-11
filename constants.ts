import { Role, Status, User, Timesheet, LeaveRequest, Project, Task, TaskStatus, ProjectStatus } from './types';

export const USERS: User[] = [
  { 
    id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: Role.EMPLOYEE, managerId: 7, 
    password: 'admin', employeeId: 'E001', dob: '1995-08-15', phone: '123-456-7890', address: '123 Maple St, Springfield', designation: 'Software Engineer', profilePictureUrl: 'https://i.pravatar.cc/150?img=1',
    company: 'Timesheet Pro Inc.'
  },
  { 
    id: 2, name: 'Bob Williams', email: 'bob@example.com', role: Role.EMPLOYEE, managerId: 3, 
    password: 'admin', employeeId: 'E002', dob: '1992-05-20', phone: '234-567-8901', address: '456 Oak Ave, Springfield', designation: 'UI/UX Designer', profilePictureUrl: 'https://i.pravatar.cc/150?img=2',
    company: 'Timesheet Pro Inc.'
  },
  { 
    id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: Role.MANAGER, 
    password: 'admin', employeeId: 'M001', dob: '1985-11-10', phone: '345-678-9012', address: '789 Pine Ln, Springfield', designation: 'Engineering Manager', profilePictureUrl: 'https://i.pravatar.cc/150?img=3',
    company: 'Timesheet Pro Inc.'
  },
  { 
    id: 4, name: 'Diana Prince', email: 'diana@example.com', role: Role.ADMIN, 
    password: 'admin', employeeId: 'A001', dob: '1980-03-25', phone: '456-789-0123', address: '101 Justice Rd, Metropolis', designation: 'System Administrator', profilePictureUrl: 'https://i.pravatar.cc/150?img=4',
    company: 'Timesheet Pro Inc.'
  },
  { 
    id: 5, name: 'Eve Adams', email: 'eve@example.com', role: Role.EMPLOYEE, managerId: 7, 
    password: 'admin', employeeId: 'E003', dob: '1998-01-30', phone: '567-890-1234', address: '210 Garden Pl, Springfield', designation: 'QA Tester', profilePictureUrl: 'https://i.pravatar.cc/150?img=5',
    company: 'Timesheet Pro Inc.'
  },
  { 
    id: 6, name: 'Admin User', email: 'admin@gmail.com', role: Role.ADMIN, 
    password: 'admin', employeeId: 'A002', dob: '1970-01-01', phone: '999-999-9999', address: '1 Admin Way, System City', designation: 'Head Administrator', profilePictureUrl: 'https://i.pravatar.cc/150?img=6',
    company: 'Timesheet Pro Inc.'
  },
  { 
    id: 7, name: 'Frank Miller', email: 'frank@example.com', role: Role.TEAM_LEADER, managerId: 3,
    password: 'admin', employeeId: 'TL001', dob: '1990-02-01', phone: '678-901-2345', address: '321 Elm St, Springfield', designation: 'Team Leader', profilePictureUrl: 'https://i.pravatar.cc/150?img=7',
    company: 'Timesheet Pro Inc.'
  },
];

export const TIMESHEETS: Timesheet[] = [
  { id: 1, userId: 1, date: '2023-10-26', inTime: '09:00', outTime: '17:00', projectWork: [{ projectId: 1, workEntries: [{description: 'Created new user authentication flow', hours: 5}, {description: 'Updated database schema for new fields', hours: 3}]}], status: Status.PENDING },
  { id: 2, userId: 2, date: '2023-10-26', inTime: '09:30', outTime: '17:30', projectWork: [{ projectId: 1, workEntries: [{description: 'Fixed bug Y in Project Management dashboard', hours: 8}]}], status: Status.APPROVED, approverId: 3 },
  { id: 3, userId: 1, date: '2023-10-25', inTime: '08:45', outTime: '16:50', projectWork: [{ projectId: 2, workEntries: [{description: 'Team meeting and planning for next sprint', hours: 8}]}], status: Status.REJECTED, approverId: 7 },
  { id: 4, userId: 3, date: '2023-10-26', inTime: '09:00', outTime: '18:00', projectWork: [{ projectId: 1, workEntries: [{description: 'Managerial duties, 1-on-1s, and project planning', hours: 9}]}], status: Status.APPROVED, approverId: 4 },
  { id: 5, userId: 7, date: '2023-10-26', inTime: '09:00', outTime: '17:30', projectWork: [{ projectId: 1, workEntries: [{description: 'Code review for auth feature', hours: 4}, {description: 'Team sync meeting', hours: 1.5}]}], status: Status.PENDING },
  { id: 6, userId: 1, date: '2023-10-27', inTime: '09:00', outTime: '18:00', projectWork: [{ projectId: 1, workEntries: [{description: 'Work on Phoenix feature A', hours: 4}]}, { projectId: 2, workEntries: [{description: 'Refactor DevOps pipeline script', hours: 4}]}], status: Status.PENDING },
];

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 1, userId: 1, leaveEntries: [{date: '2023-11-10', leaveType: 'Full Day'}, {date: '2023-11-11', leaveType: 'Full Day'}, {date: '2023-11-12', leaveType: 'Full Day'}], reason: 'Family vacation to the Grand Canyon.', status: Status.PENDING },
  { id: 2, userId: 2, leaveEntries: [{date: '2023-11-05', leaveType: 'Half Day', halfDaySession: 'First Half'}], reason: 'Doctor appointment.', status: Status.APPROVED, approverId: 3 },
  { id: 3, userId: 3, leaveEntries: [{date: '2023-12-24', leaveType: 'Full Day'}, {date: '2023-12-25', leaveType: 'Full Day'}, {date: '2023-12-26', leaveType: 'Full Day'}, {date: '2023-12-27', leaveType: 'Full Day'}, {date: '2023-12-28', leaveType: 'Full Day'}], reason: 'Holiday leave.', status: Status.PENDING },
  { id: 4, userId: 7, leaveEntries: [{date: '2023-11-20', leaveType: 'Full Day'}, {date: '2023-11-21', leaveType: 'Full Day'}], reason: 'Personal leave.', status: Status.APPROVED, approverId: 3 },
];

export const PROJECTS: Project[] = [
  { id: 1, name: 'Project Phoenix', description: 'A revolutionary new web application that will disrupt the market with its innovative features and user-centric design.', managerId: 3, teamLeaderId: 7, teamIds: [1, 2, 5, 7], customerName: 'Innovate Corp', jobName: 'Phoenix Web App', estimatedHours: 500, actualHours: 150, company: 'Timesheet Pro Inc.', status: ProjectStatus.IN_PROGRESS },
  { id: 2, name: 'Project Titan', description: 'Internal tooling improvements to streamline the development workflow and increase productivity across all teams.', managerId: 3, teamIds: [1, 5], customerName: 'Internal', jobName: 'DevOps Pipeline', estimatedHours: 200, actualHours: 75, company: 'Timesheet Pro Inc.', status: ProjectStatus.IN_PROGRESS },
];

export const TASKS: Task[] = [
    { id: 1, projectId: 1, title: 'Setup Authentication', description: 'Implement JWT-based authentication for the main application.', assignedTo: [1], status: 'Done' as TaskStatus, deadline: '2023-11-10', completionDate: '2023-10-20' },
    { id: 2, projectId: 1, title: 'Design Landing Page', description: 'Create mockups and final designs for the new marketing landing page.', assignedTo: [2], status: 'In Progress' as TaskStatus, deadline: '2023-11-20' },
    { id: 3, projectId: 1, title: 'Create Test Plan', description: 'Develop a comprehensive test plan for the Q4 release.', assignedTo: [5], status: 'To Do' as TaskStatus },
    { id: 4, projectId: 2, title: 'Upgrade CI/CD Pipeline', description: 'Migrate the existing pipeline to the new infrastructure.', assignedTo: [1], status: 'In Progress' as TaskStatus, deadline: '2023-11-15' },
    { id: 5, projectId: 2, title: 'End-to-end testing for Pipeline', description: 'Test the new CI/CD pipeline.', assignedTo: [5], status: 'To Do' as TaskStatus },
];