import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiBriefcase, FiUsers, FiSettings, FiCheck, FiX, FiAlertCircle, FiEdit, FiTrash2, FiKey } from "react-icons/fi";
import { toast } from "sonner";
import Swal from "sweetalert2";
import api from "../utils/api";
import Tooltip from "../components/Tooltip";

export default function OrganizationsMgmt() {
  const [organizations, setOrganizations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [batches, setBatches] = useState([]);
  
  // Admin Edit State
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Edit Org State
  const [editOrgName, setEditOrgName] = useState("");
  const [newOrgAdminName, setNewOrgAdminName] = useState("");
  const [newOrgAdminEmail, setNewOrgAdminEmail] = useState("");

  // Create Batch State
  const [newBatchName, setNewBatchName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgRes, usersRes] = await Promise.all([
        api.get("/organizations"),
        api.get("/users")
      ]);
      setOrganizations(orgRes.data.data);
      setAdmins(usersRes.data.data.filter(u => u.role === "ADMIN"));
    } catch {
      toast.error("Failed to load organizations");
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgName || !adminName || !adminEmail) return;

    try {
      const orgRes = await api.post("/organizations", { name: orgName });
      const newOrg = orgRes.data.data;

      await api.post("/users", {
        name: adminName,
        email: adminEmail,
        role: "ADMIN",
        orgId: newOrg.id
      });

      toast.success("Organization onboarded successfully");
      loadData();
      setIsModalOpen(false);
      setOrgName(""); setAdminName(""); setAdminEmail("");
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to create organization");
    }
  };

  const getAdminsForOrg = (orgId) => {
    return admins.filter(a => a.orgId === orgId);
  };

  const openManageModal = async (org) => {
    setSelectedOrg(org);
    setEditOrgName(org.name);
    setIsManageModalOpen(true);
    await loadBatches(org.id);
  };

  const loadBatches = async (orgId) => {
    try {
      const res = await api.get(`/organizations/${orgId}/batches`);
      setBatches(res.data.data);
    } catch {
      toast.error("Failed to load batches");
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim() || !selectedOrg) return;
    try {
      await api.post(`/organizations/${selectedOrg.id}/batches`, { name: newBatchName });
      toast.success("Batch created successfully");
      setNewBatchName("");
      loadBatches(selectedOrg.id);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to create batch");
    }
  };

  const handleEditBatchName = async (batch) => {
    const { value: newName } = await Swal.fire({
      title: 'Rename Batch',
      input: 'text',
      inputLabel: 'New Batch Name',
      inputValue: batch.name,
      showCancelButton: true,
      confirmButtonColor: '#ffb800',
      cancelButtonColor: '#6B7280',
      inputValidator: (value) => {
        if (!value) {
          return 'Batch name cannot be empty!'
        }
      }
    });

    if (newName && newName !== batch.name) {
      try {
        await api.patch(`/batches/${batch.id}`, { name: newName });
        toast.success("Batch renamed successfully");
        if (selectedOrg) loadBatches(selectedOrg.id);
      } catch (error) {
        toast.error(error.response?.data?.error?.message || "Failed to rename batch");
      }
    }
  };

  const toggleBatchStatus = async (batch) => {
    const newStatus = batch.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const action = batch.status === 'ACTIVE' ? 'disable' : 'enable';

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} batch "${batch.name}"? This will also ${action} all member accounts in this batch.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffb800',
      cancelButtonColor: '#ea4335',
      confirmButtonText: `Yes, ${action} it!`
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/batches/${batch.id}`, { status: newStatus });
        toast.success(`Batch ${action}d successfully`);
        if (selectedOrg) loadBatches(selectedOrg.id);
      } catch {
        toast.error(`Failed to ${action} batch`);
      }
    }
  };

  const handleDeleteBatch = async (batchId, batchName) => {
    const result = await Swal.fire({
      title: 'Delete Batch?',
      text: `Are you sure you want to delete "${batchName}"? Users in this batch will be unassigned.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
      background: 'rgba(23, 23, 23, 0.9)',
      color: '#fff',
      customClass: {
        popup: 'rounded-2xl border border-[var(--border-color)] backdrop-blur-md',
      }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/batches/${batchId}`);
        toast.success("Batch deleted");
        loadBatches(selectedOrg.id);
      } catch {
        toast.error("Failed to delete batch");
      }
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !editOrgName.trim()) return;

    try {
      if (editOrgName !== selectedOrg.name) {
        await api.patch(`/organizations/${selectedOrg.id}`, { name: editOrgName });
      }

      if (newOrgAdminName && newOrgAdminEmail) {
        await api.post("/users", {
          name: newOrgAdminName,
          email: newOrgAdminEmail,
          role: "ADMIN",
          orgId: selectedOrg.id
        });
      }

      toast.success("Organization updated");
      loadData();
      setIsManageModalOpen(false);
      setSelectedOrg(null);
      setNewOrgAdminName("");
      setNewOrgAdminEmail("");
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to update organization");
    }
  };

  const openEditAdminModal = (admin) => {
    setEditingAdmin({ ...admin });
    setIsEditAdminModalOpen(true);
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin?.name || !editingAdmin?.email) return;

    try {
      await api.patch(`/users/${editingAdmin.id}`, {
        name: editingAdmin.name,
        email: editingAdmin.email
      });
      toast.success("Administrator updated");
      loadData();
      setIsEditAdminModalOpen(false);
      setEditingAdmin(null);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to update admin");
    }
  };

  const removeAdmin = async (adminId) => {
    try {
      await api.patch(`/users/${adminId}`, { status: "DISABLED" });
      toast.success("Admin disabled successfully");
      loadData();
    } catch {
      toast.error("Failed to remove admin");
    }
  };

  const handleResetPassword = async (admin) => {
    const result = await Swal.fire({
      title: `Reset Password?`,
      text: `This will clear ${admin.name}'s password and force them to set up a new one on their next login. Are you sure?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea4335',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, reset it!`
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/users/${admin.id}/reset-password`);
        toast.success(`Password reset for ${admin.name}`);
      } catch {
        toast.error(`Failed to reset password`);
      }
    }
  };

  const handleToggleOrgStatus = async (orgToggle = selectedOrg) => {
    if (!orgToggle) return;
    const newStatus = orgToggle.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${newStatus.toLowerCase()} ${orgToggle.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#eab308',
      cancelButtonColor: 'rgba(255, 255, 255, 0.1)',
      confirmButtonText: 'Yes, proceed!',
      background: 'rgba(23, 23, 23, 0.9)',
      color: '#fff',
      customClass: {
        popup: 'rounded-2xl border border-[var(--border-color)] backdrop-blur-md',
        cancelButton: 'text-white border border-[var(--border-color)]',
      }
    });
    if (!result.isConfirmed) return;

    try {
      await api.patch(`/organizations/${orgToggle.id}`, { status: newStatus });
      toast.success(`Organization ${newStatus.toLowerCase()}`);
      loadData();
      if (selectedOrg && selectedOrg.id === orgToggle.id) {
        setIsManageModalOpen(false);
        setSelectedOrg(null);
        setBatches([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to update organization status");
    }
  };

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return;
    const result = await Swal.fire({
      title: 'CRITICAL WARNING',
      text: `Are you sure you want to permanently delete ${selectedOrg.name}? This will remove all associated users and data. This action cannot be undone.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'rgba(255, 255, 255, 0.1)',
      confirmButtonText: 'Yes, delete permanently!',
      background: 'rgba(23, 23, 23, 0.9)',
      color: '#fff',
      customClass: {
        popup: 'rounded-2xl border border-[var(--border-color)] backdrop-blur-md',
        cancelButton: 'text-white border border-[var(--border-color)]',
      }
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/organizations/${selectedOrg.id}`);
      toast.success("Organization deleted permanently");
      loadData();
      setIsManageModalOpen(false);
      setSelectedOrg(null);
      setBatches([]);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to delete organization");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--color-primary-yellow)] flex items-center mb-2 transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[var(--color-primary-yellow)] flex items-center gap-3">
            <FiBriefcase /> Organizations
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage platform tenants and their administrative owners.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-primary-yellow)] text-black px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
        >
          <FiPlus /> New Organization
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {organizations.map(org => {
          const orgAdmins = getAdminsForOrg(org.id);
          return (
            <div key={org.id} className="glass p-6 rounded-2xl flex flex-col shadow-lg border-t border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-yellow)] rounded-full mix-blend-multiply filter blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
              
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-4 pb-4 border-b border-[var(--border-color)] flex items-center gap-2 z-10">
                <span className={`w-8 h-8 rounded-lg text-black flex items-center justify-center text-sm ${org.status === 'DISABLED' ? 'bg-gray-500' : 'bg-[var(--color-primary-yellow)]'}`}>
                  {org.name.charAt(0)}
                </span>
                <span className={org.status === 'DISABLED' ? 'line-through opacity-50' : ''}>{org.name}</span>
                {org.status === 'DISABLED' && <span className="ml-auto text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full uppercase font-bold tracking-wider">Disabled</span>}
              </h3>
              
              <div className="space-y-3 z-10 flex-1">
                <div className="flex items-start gap-3">
                  <FiUsers className="text-[var(--text-secondary)] mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-2">Administrators ({orgAdmins.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {orgAdmins.length === 0 ? (
                        <p className="font-medium text-[var(--text-secondary)] italic text-sm">No admins assigned</p>
                      ) : (
                        orgAdmins.map(admin => (
                          <button 
                            key={admin.id} 
                            onClick={() => openEditAdminModal(admin)}
                            className="bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-left hover:border-[var(--color-primary-yellow)] hover:bg-[var(--color-primary-yellow)]/5 transition-all group/admin"
                          >
                            <p className="font-bold text-[var(--text-primary)] text-xs group-hover/admin:text-[var(--color-primary-yellow)]">{admin.name}</p>
                            <p className="text-[10px] text-[var(--text-secondary)] truncate max-w-[120px]">{admin.email}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-between items-center z-10 gap-4">
                <button 
                  onClick={() => handleToggleOrgStatus(org)}
                  className={`text-sm flex items-center gap-2 font-medium transition-colors ${org.status === 'ACTIVE' ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'}`}
                  data-tooltip={org.status === 'ACTIVE' ? 'Disable org' : 'Enable org'}
                >
                  {org.status === 'ACTIVE' ? <FiX size={14} /> : <FiAlertCircle size={14} />} 
                  {org.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                </button>
                <button 
                  onClick={() => openManageModal(org)}
                  className="text-sm flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-primary-yellow)] transition-colors"
                >
                  <FiSettings size={14} /> Manage Settings
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--color-primary-yellow)]">Onboard New Organization</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full"
                data-tooltip="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrg} className="p-6 space-y-6">
              
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-sm text-[var(--text-primary)]">
                <FiAlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <p>Creating an organization requires creating an initial Administrative user to manage it. Their password will default to <strong className="font-mono bg-black/20 px-1 rounded">User#123</strong>.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Organization Details</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                  placeholder="e.g. University of Example"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
                <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Primary Admin Details</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                    placeholder="Admin Name"
                  />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                    placeholder="admin@example.edu"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-[var(--color-primary-yellow)] text-black hover:bg-[#e6a600] flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                >
                  <FiCheck /> Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {isEditAdminModalOpen && editingAdmin && (
        <div onClick={() => { setIsEditAdminModalOpen(false); setEditingAdmin(null); }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--color-primary-yellow)]">Edit Administrator</h3>
              <button 
                onClick={() => { setIsEditAdminModalOpen(false); setEditingAdmin(null); }}
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full"
                data-tooltip="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({...editingAdmin, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({...editingAdmin, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditAdminModalOpen(false); setEditingAdmin(null); }}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-[var(--color-primary-yellow)] text-black hover:bg-[#e6a600] flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                >
                  <FiCheck /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isManageModalOpen && selectedOrg && (
        <div onClick={() => setIsManageModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Manage Organization</h3>
              <button 
                onClick={() => setIsManageModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full"
                data-tooltip="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateOrg} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Organization Name</label>
                <input
                  type="text"
                  required
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                  placeholder="Organization Name"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Current Administrators</label>
                <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
                  {getAdminsForOrg(selectedOrg.id).map(admin => (
                    <div key={admin.id} className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-[var(--border-color)]">
                      <div>
                        <p className="font-medium text-[var(--text-primary)] text-sm">{admin.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{admin.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <Tooltip text="Reset password" position="bottom">
                          <button 
                            type="button"
                            onClick={() => handleResetPassword(admin)}
                            className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                          >
                            <FiKey size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Remove admin access" position="bottom">
                          <button 
                            type="button"
                            onClick={() => removeAdmin(admin.id)}
                            className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                          >
                            <FiX size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>

                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Add New Administrator (Optional)</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newOrgAdminName}
                    onChange={(e) => setNewOrgAdminName(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                    placeholder="New Admin Name"
                  />
                  <input
                    type="email"
                    value={newOrgAdminEmail}
                    onChange={(e) => setNewOrgAdminEmail(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                    placeholder="new.admin@example.com"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Organization Batches</label>
                <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
                  {batches.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] italic">No batches configured</p>
                  ) : (
                    batches.map(batch => (
                      <div key={batch.id} className={`flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-[var(--border-color)] ${batch.status === 'DISABLED' ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-xs ${batch.status === 'DISABLED' ? 'bg-orange-500' : 'bg-[var(--color-primary-yellow)]'}`}>
                            {batch.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                            {batch.name}
                            {batch.status === 'DISABLED' && <span className="text-[10px] bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded uppercase font-black">Disabled</span>}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] font-medium">
                            {batch._count?.users || 0} members
                          </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Tooltip text="Rename batch" position="bottom">
                            <button 
                              type="button"
                              onClick={() => handleEditBatchName(batch)}
                              className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors"
                            >
                              <FiEdit size={14} />
                            </button>
                          </Tooltip>
                          <Tooltip text={batch.status === 'ACTIVE' ? 'Disable batch' : 'Enable batch'} position="bottom">
                            <button 
                              type="button"
                              onClick={() => toggleBatchStatus(batch)}
                              className={`p-2 rounded-lg transition-colors ${batch.status === 'ACTIVE' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                            >
                              {batch.status === 'ACTIVE' ? <FiX size={16} /> : <FiCheck size={16} />}
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete batch" position="bottom">
                            <button 
                              type="button"
                              onClick={() => handleDeleteBatch(batch.id, batch.name)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Create New Batch</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm rounded-xl border border-[var(--border-color)] bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--color-primary-yellow)] focus:border-transparent transition-all"
                    placeholder="e.g. Fall 2024"
                  />
                  <button
                    type="button"
                    onClick={handleCreateBatch}
                    disabled={!newBatchName.trim()}
                    className="px-4 py-2 bg-[var(--color-primary-yellow)] text-black font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shrink-0"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                <label className="block text-xs font-bold text-red-500 mb-2 uppercase tracking-wide">Danger Zone</label>
                <div className="flex gap-3">
                  <Tooltip text={selectedOrg.status === 'ACTIVE' ? 'Disable org & members' : 'Re-enable org'} className="flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleOrgStatus()}
                      className="flex-1 py-2 rounded-xl text-sm font-bold border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      {selectedOrg.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                  </Tooltip>
                  <Tooltip text="Permanently delete — cannot be undone" className="flex-1">
                    <button 
                      onClick={handleDeleteOrg}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiTrash2 size={18} /> Delete
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-[var(--border-color)] mt-6">
                <button
                  type="button"
                  onClick={() => setIsManageModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-[var(--color-primary-yellow)] text-black hover:bg-[#e6a600] flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
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
