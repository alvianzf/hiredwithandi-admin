import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiX, FiCheck, FiSearch, FiUserPlus, FiShield } from "react-icons/fi";
import { toast } from "sonner";
import api from "../utils/api";

export default function PlatformUsers() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [orgFilter, setOrgFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Org Admin", orgId: "" });

  const loadData = useCallback(async () => {
    try {
      const [usersRes, orgRes] = await Promise.all([
        api.get("/users"),
        api.get("/organizations")
      ]);
      setUsers(usersRes.data.data.map(u => ({
        ...u, 
        systemRole: u.role === 'SUPERADMIN' ? 'Superadmin' : u.role === 'ADMIN' ? 'Org Admin' : 'Student'
      })));
      setOrganizations(orgRes.data.data);
    } catch {
      toast.error("Failed to load platform data");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getOrgName = (user) => {
    if (user.role === "SUPERADMIN") return "System (Global)";
    return user.organization?.name || "Unknown Org";
  };

  const openEditModal = (user) => {
    setEditUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editUser || !editUser.name || !editUser.email) return;

    try {
      await api.patch(`/users/${editUser.id}`, {
        name: editUser.name,
        email: editUser.email
      });
      toast.success("User updated");
      loadData();
      setEditUser(null);
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to update user");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    if (newUser.role === "Org Admin" && !newUser.orgId) return;

    try {
      await api.post("/users", {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role === "Superadmin" ? "SUPERADMIN" : "ADMIN",
        orgId: newUser.role === "Superadmin" ? undefined : newUser.orgId
      });
      
      toast.success(`${newUser.role} created successfully`);
      loadData();
      setIsCreateModalOpen(false);
      setNewUser({ name: "", email: "", role: "Org Admin", orgId: "" });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to create user");
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      const currentStatus = user.status || 'ACTIVE';
      const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await api.patch(`/users/${user.id}`, { status: newStatus });
      toast.success(`User ${newStatus.toLowerCase()} successfully`);
      loadData();
    } catch {
      toast.error("Failed to change user status");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || 
                          u.email?.toLowerCase().includes(search.toLowerCase());
    const currentStatus = u.status || 'ACTIVE';
    const matchesStatus = statusFilter === "All" || currentStatus === statusFilter.toUpperCase();
    const matchesOrg = orgFilter === "All" || (u.role === 'SUPERADMIN' && orgFilter === 'sys') || u.orgId === orgFilter;
    const matchesRole = roleFilter === "All" || u.systemRole === roleFilter;
    return matchesSearch && matchesStatus && matchesOrg && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link to="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--color-primary-yellow)] flex items-center mb-2 transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-primary-red)]">
            Platform Users
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Superadmin: Oversee all platform members (Students, Admins, Superadmins).</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-primary-red)] text-white px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
        >
          <FiUserPlus /> Add User
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[var(--border-color)] grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/5 dark:bg-white/5">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors shadow-inner"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors shadow-inner font-medium"
          >
            <option value="All">All Roles</option>
            <option value="Student">Student</option>
            <option value="Org Admin">Org Admin</option>
            <option value="Superadmin">Superadmin</option>
          </select>

          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors shadow-inner font-medium"
          >
            <option value="All">All Organizations</option>
            <option value="sys">System (Global)</option>
            {organizations.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors shadow-inner font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>
        
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/10 dark:bg-white/10 border-b border-[var(--border-color)] text-sm">
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Name</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Role</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Organization</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Email</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Last Login</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-[var(--text-secondary)]">
                    <p className="font-semibold text-lg">No users found.</p>
                    <p className="text-sm">Try relaxing your search or filter parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const currentStatus = user.status || 'ACTIVE';
                  return (
                    <tr key={user.id} className={`border-b border-black/5 dark:border-white/5 ${currentStatus === 'DISABLED' ? 'opacity-50 grayscale' : ''} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                      <td className="p-4 font-bold">{user.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${
                          user.systemRole === 'Superadmin' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                          user.systemRole === 'Org Admin' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                          'bg-gray-500/20 text-[var(--text-secondary)]'
                        }`}>
                          {user.systemRole}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-[var(--text-primary)]">{getOrgName(user)}</td>
                      <td className="p-4 text-[var(--text-secondary)] text-sm">{user.email}</td>
                      <td className="p-4 text-[var(--text-secondary)] text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                          currentStatus === 'ACTIVE' 
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center space-x-3 items-center">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 font-bold transition-colors bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => toggleUserStatus(user)}
                          className={`${currentStatus === 'ACTIVE' ? 'text-red-600 dark:text-red-500 hover:text-red-700' : 'text-green-600 dark:text-green-500 hover:text-green-700'} font-bold transition-colors bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg`}
                        >
                          {currentStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] text-center">
          Showing {filteredUsers.length} of {users.length} global platform users
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div onClick={() => setIsCreateModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--color-primary-red)] flex items-center gap-2"><FiShield /> Add User</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Administrative Role</label>
                <select 
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors font-bold"
                >
                  <option value="Org Admin">Organizational Admin</option>
                  <option value="Superadmin">Global Superadmin</option>
                </select>
              </div>

              {newUser.role === "Org Admin" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Assign to Organization</label>
                  <select 
                    required
                    value={newUser.orgId}
                    onChange={e => setNewUser({...newUser, orgId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors"
                  >
                    <option value="" disabled>Select an Organization</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors"
                  placeholder="Admin Name"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="pt-6 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 font-bold rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary-red)] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 transition-transform scale-100 hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <FiCheck /> Create {newUser.role}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editUser && (
        <div onClick={() => { setIsEditModalOpen(false); setEditUser(null); }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-black/10 dark:bg-white/5">
              <h3 className="text-xl font-bold">Edit User</h3>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditUser(null);
                }} 
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editUser.name}
                  onChange={e => setEditUser({...editUser, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editUser.email}
                  onChange={e => setEditUser({...editUser, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                />
              </div>

              <div className="pt-6 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditUser(null);
                  }}
                  className="px-5 py-2.5 font-bold rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary-yellow)] text-black px-6 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-transform scale-100 hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <FiCheck /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
