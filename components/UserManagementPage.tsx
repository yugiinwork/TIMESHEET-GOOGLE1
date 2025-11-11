
import React, { useState } from 'react';
import { User, Role } from '../types';

interface UserManagementPageProps {
  users: User[];
  setUsers: (updater: React.SetStateAction<User[]>) => Promise<void>;
  currentUser: User;
  onDeleteUser: (userId: number) => Promise<void>;
}

const emptyUser = (currentUser: User): Omit<User, 'id'> => ({
  name: '',
  email: '',
  role: Role.EMPLOYEE,
  password: 'admin',
  employeeId: '',
  dob: '',
  phone: '',
  address: '',
  designation: '',
  company: currentUser.company,
});

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, setUsers, currentUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Omit<User, 'id'> | User>(emptyUser(currentUser));
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const managersAndLeaders = users.filter(u => u.role === Role.MANAGER || u.role === Role.ADMIN || u.role === Role.TEAM_LEADER);

  const openModal = (user?: User) => {
    setEditingUser(user || emptyUser(currentUser));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['managerId'].includes(name);
    setEditingUser(prev => ({ ...prev, [name]: isNumberField ? (value ? Number(value) : undefined) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ('id' in editingUser) {
      await setUsers(prev => prev.map(u => u.id === editingUser.id ? (editingUser as User) : u));
    } else {
      const newUser: User = {
        id: Date.now(),
        ...editingUser,
      } as User;
      await setUsers(prev => [...prev, newUser]);
    }
    closeModal();
  };
  
  const handleDeleteConfirm = async () => {
    if (userToDelete) {
        await onDeleteUser(userToDelete.id);
        setUserToDelete(null);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">User Management</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
        >
          Create User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.designation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.company || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => openModal(user)} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200">Edit</button>
                      <button 
                        onClick={() => setUserToDelete(user)} 
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        disabled={user.id === currentUser.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">
              {'id' in editingUser ? 'Edit' : 'Create'} User
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" placeholder="Full Name" value={editingUser.name} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    <input type="text" name="designation" placeholder="Designation" value={editingUser.designation} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    <input type="text" name="company" placeholder="Company" value={editingUser.company || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-200 dark:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-md" disabled />
                    <input type="email" name="email" placeholder="Email" value={editingUser.email} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    <input type="password" name="password" placeholder="Password" value={editingUser.password || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required={'id' in editingUser ? false : true} />
                    <input type="text" name="employeeId" placeholder="Employee ID" value={editingUser.employeeId} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    <input type="tel" name="phone" placeholder="Phone Number" value={editingUser.phone} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                </div>
                 <div>
                    <input type="text" name="address" placeholder="Address" value={editingUser.address} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Date of Birth</label>
                        <input type="date" name="dob" value={editingUser.dob} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Role</label>
                        <select name="role" value={editingUser.role} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required>
                            {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>

                {(editingUser.role === Role.EMPLOYEE || editingUser.role === Role.TEAM_LEADER) && (
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Assign Manager</label>
                        <select name="managerId" value={(editingUser as User).managerId || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                            <option value="">None</option>
                            {managersAndLeaders
                                .filter(m => editingUser.role === Role.TEAM_LEADER ? m.role !== Role.TEAM_LEADER : true)
                                .map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                        </select>
                    </div>
                )}
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-sm shadow-xl">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Confirm Deletion</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Are you sure you want to delete the user "{userToDelete.name}"? This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setUserToDelete(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
                        Cancel
                    </button>
                    <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                        Delete User
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
