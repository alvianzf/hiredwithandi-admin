import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiX, FiCheck, FiSearch, FiUserPlus, FiShield, FiKey } from "react-icons/fi";
import { toast } from "sonner";
import api from "../utils/api";
import Swal from 'sweetalert2';
import CustomSelect from "../components/CustomSelect";

export default function PlatformUsers() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [orgFilter, setOrgFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [batches, setBatches] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit, setLimit] = useState(10);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Org Admin", orgId: "" });

  const loadData = useCallback(async (page = 1) => {
    try {
      const [usersRes, orgRes] = await Promise.all([
        api.get("/users", {
          params: {
            page,
            limit,
            search: search || undefined,
            role: roleFilter,
            orgId: orgFilter,
            batchId: batchFilter !== "All" ? batchFilter : undefined,
            status: statusFilter
          }
        }),
        api.get("/organizations")
      ]);
      const usersData = usersRes.data.data || [];
      const usersMeta = usersRes.data?.meta || {};
      setUsers(usersData.map(u => ({
        ...u, 
        systemRole: u.role === 'SUPERADMIN' ? 'Superadmin' : u.role === 'ADMIN' ? 'Org Admin' : 'Member'
      })));
      setTotalUsers(usersMeta.total ?? usersData.length);
      setCurrentPage(usersMeta.page || page);
      setOrganizations(orgRes.data.data);
    } catch (err) {
      console.error("PlatformUsers Load Error:", err);
      toast.error("Failed to load platform data");
    }
  }, [search, roleFilter, orgFilter, batchFilter, statusFilter, limit]);

  const loadBatches = useCallback(async () => {
    if (orgFilter === "All" || orgFilter === "sys") {
      setBatches([]);
      setBatchFilter("All");
      return;
    }
    try {
      const res = await api.get(`/organizations/${orgFilter}/batches`);
      setBatches(res.data.data || []);
    } catch (err) {
      console.error("Failed to load batches", err);
      setBatches([]);
    }
  }, [orgFilter]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

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
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const action = user.status === 'ACTIVE' ? 'disable' : 'enable';
    
    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} ${user.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffb800',
      cancelButtonColor: '#ea4335',
      confirmButtonText: `Yes, ${action} them!`
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/users/${user.id}`, { status: newStatus });
        toast.success(`User ${action}d successfully`);
        loadData(); // Changed from fetchUsers() to loadData()
      } catch {
        toast.error(`Failed to ${action} user`);
      }
    }
  };

  const handleResetPassword = async (user) => {
    const result = await Swal.fire({
      title: `Reset Password?`,
      text: `This will clear ${user.name}'s password and force them to set up a new one on their next login. Are you sure?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea4335',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, reset it!`
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/users/${user.id}/reset-password`);
        toast.success(`Password reset for ${user.name}`);
      } catch {
        toast.error(`Failed to reset password`);
      }
    }
  }

  const getOrgName = (user) => {
    if (user.role === "SUPERADMIN") return "System (Global)";
    return user.organization?.name || "Unknown Org";
  };

  const totalPages = Math.ceil(totalUsers / limit);

  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm py-3 px-4 bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)] first:border-t-0 last:border-b-0">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="text-[var(--text-secondary)]">
          Showing {totalUsers === 0 ? 0 : ((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} global platform users
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)] whitespace-nowrap">Show:</span>
          <CustomSelect
            value={String(limit)}
            onChange={(val) => {
              const newLimit = Number(val);
              setLimit(newLimit);
              setCurrentPage(1);
              loadData(1);
            }}
            className="w-20 text-xs"
            options={[10, 25, 50, 100].map(v => ({ value: String(v), label: String(v) }))}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          disabled={currentPage === 1}
          onClick={() => loadData(currentPage - 1)}
          className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border-color)] disabled:opacity-50 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, i) => (
          (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage)) && (
            <button
              key={i + 1}
              onClick={() => loadData(i + 1)}
              className={`w-8 h-8 rounded-lg border transition-all ${
                currentPage === i + 1
                  ? "bg-[var(--color-primary-red)] text-white border-[var(--color-primary-red)] font-bold shadow-lg"
                  : "bg-black/5 dark:bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10"
              }`}
            >
              {i + 1}
            </button>
          )
        ))}
        {totalPages > 5 && currentPage < totalPages - 2 && <span className="text-[var(--text-secondary)]">...</span>}
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => loadData(currentPage + 1)}
          className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border-color)] disabled:opacity-50 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

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
          <p className="text-[var(--text-secondary)] mt-1">Superadmin: Oversee all platform members (Members, Admins, Superadmins).</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-primary-red)] text-white px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
        >
          <FiUserPlus /> Add Administrator
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[var(--border-color)] space-y-4 bg-black/5 dark:bg-white/5">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-all shadow-inner text-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CustomSelect
              value={roleFilter}
              onChange={setRoleFilter}
              className="w-full"
              options={[
                { value: "All", label: "All Roles" },
                { value: "Member", label: "Member" },
                { value: "Org Admin", label: "Org Admin" },
                { value: "Superadmin", label: "Superadmin" },
              ]}
            />

            <CustomSelect
              value={orgFilter}
              onChange={setOrgFilter}
              className="w-full"
              options={[
                { value: "All", label: "All Organizations" },
                { value: "sys", label: "System (Global)" },
                ...organizations.map(o => ({ value: o.id, label: o.name }))
              ]}
            />

            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full"
              options={[
                { value: "All", label: "All Statuses" },
                { value: "Active", label: "Active" },
                { value: "Disabled", label: "Disabled" },
              ]}
            />

            <CustomSelect
              value={batchFilter}
              onChange={setBatchFilter}
              disabled={orgFilter === "All" || orgFilter === "sys"}
              className="w-full"
              options={[
                { value: "All", label: "All Batches" },
                ...batches.map(b => ({ value: b.id, label: b.name }))
              ]}
            />
          </div>
        </div>
        
        <PaginationControls />

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/10 dark:bg-white/10 border-b border-[var(--border-color)] text-sm">
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Name</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Role</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Organization</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)] text-center">Batch</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Email</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Last Login</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
               {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-[var(--text-secondary)]">
                    <p className="font-semibold text-lg">No users found.</p>
                    <p className="text-sm">Try relaxing your search or filter parameters.</p>
                  </td>
                </tr>
              ) : (
                users.map(user => {
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
                      <td className="p-4 text-center">
                        {user.batch?.name ? (
                          <span className="bg-[var(--color-primary-yellow)]/10 text-[var(--color-primary-yellow)] px-3 py-1 rounded-full text-xs font-bold border border-[var(--color-primary-yellow)]/20">
                            {user.batch.name}
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] italic text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 font-medium">{user.email}</td>
                      <td className="p-4 text-[var(--text-secondary)] text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                          currentStatus === 'ACTIVE' 
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                            : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                        }`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center space-x-3 items-center">
                        <button
                          onClick={() => openEditModal(user)}
                          className="cursor-pointer text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 font-bold transition-colors bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg"
                          data-tooltip="Edit user details"
                        >
                          Edit
                        </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="cursor-pointer bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                            data-tooltip="Reset user's password"
                          >
                            <FiKey size={14} /> Reset
                          </button>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`cursor-pointer ${currentStatus === 'ACTIVE' ? 'text-red-600 dark:text-red-500 hover:text-red-700' : 'text-green-600 dark:text-green-500 hover:text-green-700'} font-bold transition-colors bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg`}
                          data-tooltip={currentStatus === 'ACTIVE' ? 'Disable user' : 'Enable user'}
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
        <PaginationControls />
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div onClick={() => setIsCreateModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--color-primary-red)] flex items-center gap-2"><FiShield /> Add Administrator</h3>
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
                <CustomSelect
                  value={newUser.role}
                  onChange={(val) => setNewUser({...newUser, role: val})}
                  className="w-full"
                  options={[
                    { value: "Org Admin", label: "Organizational Admin" },
                    { value: "Superadmin", label: "Global Superadmin" },
                  ]}
                />
              </div>

              {newUser.role === "Org Admin" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Assign to Organization</label>
                  <CustomSelect
                    value={newUser.orgId}
                    onChange={(val) => setNewUser({...newUser, orgId: val})}
                    className="w-full"
                    options={[
                      { value: "", label: "Select an Organization" },
                      ...organizations.map(o => ({ value: o.id, label: o.name }))
                    ]}
                  />
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
