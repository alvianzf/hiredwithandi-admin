import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiX, FiCheck, FiUploadCloud, FiExternalLink } from "react-icons/fi";
import Papa from "papaparse";
import { toast } from "sonner";
import api from "../utils/api";
import Swal from 'sweetalert2';

export default function MembersMgmt() {
  const { admin } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("");
  const [batches, setBatches] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const limit = 10;
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", batchId: "" });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvBatchId, setCsvBatchId] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [isBatchesModalOpen, setIsBatchesModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");

  const loadBatches = useCallback(async () => {
    if (admin?.orgId) {
      try {
        const res = await api.get(`/organizations/${admin.orgId}/batches`);
        setBatches(res.data.data || []);
      } catch {
        console.error("Failed to load batches");
      }
    }
  }, [admin]);

  const loadMembers = useCallback(async (page = 1) => {
    if (admin) {
      try {
        const res = await api.get('/members', {
          params: {
            page,
            limit,
            batchId: batchFilter || undefined
          }
        });
        setMembers(res.data.data);
        setTotalMembers(res.data.meta.total);
        setCurrentPage(res.data.meta.page);
      } catch {
        toast.error("Failed to load members");
      }
    }
  }, [admin, batchFilter]);

  useEffect(() => {
    loadBatches();
    loadMembers(1);
  }, [loadBatches, loadMembers]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    try {
      await api.post(`/organizations/${admin.orgId}/batches`, { name: newBatchName });
      toast.success("Batch created successfully");
      setNewBatchName("");
      loadBatches();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to create batch");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newMember.email) return;

    try {
      await api.post('/users', {
        name: newMember.name,
        email: newMember.email,
        batchId: newMember.batchId || undefined,
        role: "MEMBER",
        orgId: admin.orgId
      });
      toast.success("Member created successfully");
      loadMembers();
      setNewMember({ name: "", email: "", batchId: "" });
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to create member");
    }
  };

  const openEditModal = (member) => {
    setEditMember({ 
      ...member, 
      batchId: member.batch?.id || member.batchId || ""
    });
    setIsEditModalOpen(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editMember || !editMember.name || !editMember.email) return;

    try {
      await api.patch(`/users/${editMember.id}`, {
        name: editMember.name,
        email: editMember.email,
        batchId: editMember.batchId || null
      });
      toast.success("Member updated successfully");
      loadMembers();
      setEditMember(null);
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to update member");
    }
  };

  const toggleMemberStatus = async (member) => {
    const newStatus = member.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const action = member.status === 'ACTIVE' ? 'disable' : 'enable';

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} ${member.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffb800',
      cancelButtonColor: '#ea4335',
      confirmButtonText: `Yes, ${action} them!`
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/users/${member.id}`, { status: newStatus });
        toast.success(`Member ${action}d successfully`);
        loadMembers();
      } catch {
        toast.error(`Failed to ${action} member`);
      }
    }
  };

  const handleResetPassword = async (member) => {
    const result = await Swal.fire({
      title: `Reset Password?`,
      text: `This will clear ${member.name}'s password and force them to set up a new one on their next login. Are you sure?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea4335',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, reset it!`
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/users/${member.id}/reset-password`);
        toast.success(`Password reset for ${member.name}`);
      } catch {
        toast.error(`Failed to reset password`);
      }
    }
  };

  const toggleBatchStatus = async (batch) => {
    const newStatus = batch.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const action = batch.status === 'ACTIVE' ? 'disable' : 'enable';

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} the batch "${batch.name}"? This will automatically ${action} all members inside this batch.`,
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
        loadBatches();
        loadMembers(); // reload members to reflect cascaded status changes
      } catch {
        toast.error(`Failed to ${action} batch`);
      }
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data } = results;
        if (!data || data.length === 0) {
          setUploadError("CSV is empty or format is invalid. Make sure it has 'name' and 'email' headers.");
          return;
        }

        const newEntries = data.map((row, index) => {
          const email = row.email || row.Email;
          const name = row.name || row.Name || email?.split('@')[0] || "Unknown User";
          if (!email) return null;

          return {
            id: `stu_${Date.now()}_${index}`,
            orgId: admin.orgId,
            name,
            email,
            batchId: csvBatchId || undefined,
            status: 'Active'
          };
        }).filter(Boolean);

        if (newEntries.length === 0) {
          setUploadError("Could not find a valid 'email' column. Please check your CSV structure.");
          return;
        }

        try {
          await api.post('/batch-members', {
            orgId: admin.orgId,
            members: newEntries
          });
          
          loadMembers();
          setUploadSuccess(`Successfully imported ${newEntries.length} members!`);
          setTimeout(() => {
            setIsCsvModalOpen(false);
            setUploadSuccess("");
          }, 2000);
        } catch (error) {
          setUploadError(error.response?.data?.error?.message || "Failed to batch upload members");
        }
      },
      error: (err) => {
        setUploadError(err.message);
      }
    });

    e.target.value = null; // reset file input so the same file can be chosen again
  };

  const filteredMembers = members.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(totalMembers / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary-yellow)]">
            Members & Batches
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage users in {admin?.organization?.name || "your organization"}.</p>
        </div>
        
        {!admin?.isDisabled && (
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setIsBatchesModalOpen(true)}
              className="bg-black/10 dark:bg-white/10 text-[var(--text-primary)] px-4 py-2 rounded-lg font-medium hover:bg-black/20 dark:hover:bg-white/20 transition-colors shadow-sm inline-flex items-center"
            >
              Manage Batches
            </button>
            <button 
              onClick={() => setIsCsvModalOpen(true)}
              className="bg-[var(--color-primary-yellow)] text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors shadow-sm inline-flex items-center"
            >
              <FiUploadCloud className="mr-2" size={18} />
              Upload CSV
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[var(--color-primary-red)] text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors shadow-sm"
            >
              Create User
            </button>
          </div>
        )}
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Search members..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-styled w-full md:w-48"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
          </select>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="select-styled w-full md:w-56"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)]">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Batch</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Last Logged In</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[var(--text-secondary)]">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className={`border-b border-[var(--border-color)] ${member.status === 'DISABLED' ? 'opacity-50' : ''} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                    <td className="p-4 font-medium">{member.name}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{member.email}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{member.batch?.name || "-"}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        member.status === 'ACTIVE' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      }) : 'Never'}
                    </td>
                    <td className="p-4 flex justify-center space-x-4 items-center">
                      <Link 
                        to={`/members/${member.id}`}
                        className="text-[var(--color-primary-yellow)] hover:underline font-medium flex items-center gap-1 transition-colors"
                      >
                        <FiExternalLink size={14} /> View
                      </Link>
                      {!admin?.isDisabled && (
                        <>
                          <button 
                            onClick={() => openEditModal(member)}
                            className="text-neutral-400 hover:text-white font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleResetPassword(member)}
                            className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
                          >
                            Reset Pwd
                          </button>
                          <button 
                            onClick={() => toggleMemberStatus(member)}
                            className={`${member.status === 'ACTIVE' ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'} font-medium transition-colors`}
                          >
                            {member.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div className="text-[var(--text-secondary)]">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalMembers)} of {totalMembers} members
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => loadMembers(currentPage - 1)}
              className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border-color)] disabled:opacity-50 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => loadMembers(i + 1)}
                className={`w-8 h-8 rounded-lg border transition-all ${
                  currentPage === i + 1
                    ? "bg-[var(--color-primary-yellow)] text-black border-[var(--color-primary-yellow)] font-bold shadow-lg"
                    : "bg-black/5 dark:bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => loadMembers(currentPage + 1)}
              className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-[var(--border-color)] disabled:opacity-50 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Create User Modal */}
      {isCreateModalOpen && (
        <div onClick={() => setIsCreateModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-black/10 dark:bg-white/5">
              <h3 className="text-xl font-bold">Create New Member</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name (Optional)</label>
                <input 
                  type="text" 
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newMember.email}
                  onChange={e => setNewMember({...newMember, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign to Batch (Optional)</label>
                <select
                  value={newMember.batchId}
                  onChange={e => setNewMember({...newMember, batchId: e.target.value})}
                  className="select-styled w-full"
                >
                  <option value="">None</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary-yellow)] text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit User Modal */}
      {isEditModalOpen && editMember && (
        <div onClick={() => { setIsEditModalOpen(false); setEditMember(null); }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-black/10 dark:bg-white/5">
              <h3 className="text-xl font-bold">Edit Member</h3>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditMember(null);
                }} 
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editMember.name}
                  onChange={e => setEditMember({...editMember, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editMember.email}
                  onChange={e => setEditMember({...editMember, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign to Batch</label>
                <select
                  value={editMember.batchId || ""}
                  onChange={e => setEditMember({...editMember, batchId: e.target.value})}
                  className="select-styled w-full"
                >
                  <option value="">None</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditMember(null);
                  }}
                  className="px-4 py-2 font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[var(--color-primary-yellow)] text-black px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CSV Upload Modal */}
      {isCsvModalOpen && (
        <div onClick={() => { setIsCsvModalOpen(false); setUploadError(""); setUploadSuccess(""); }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-black/10 dark:bg-white/5">
              <h3 className="text-xl font-bold">Batch Upload Members</h3>
              <button 
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setUploadError("");
                  setUploadSuccess("");
                }} 
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="bg-black/5 dark:bg-black/20 p-4 rounded-lg border border-[var(--border-color)]">
                <h4 className="font-semibold mb-2">CSV Structure Required:</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  Your CSV must contain a header row. The bare minimum required column is <strong>email</strong>. An optional <strong>name</strong> column is supported.
                </p>
                <div className="bg-[var(--bg-color)] p-3 rounded font-mono text-xs overflow-x-auto shadow-inner border border-[var(--border-color)]">
                  name,email<br/>
                  John Doe,john.doe@example.com<br/>
                  Jane Smith,jane@example.com
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-500 text-sm rounded-lg flex items-start space-x-2">
                  <FiX className="mt-0.5 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/50 text-green-500 text-sm rounded-lg flex items-start space-x-2">
                  <FiCheck className="mt-0.5 flex-shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Assign to Batch (Optional)</label>
                <select
                  value={csvBatchId}
                  onChange={e => setCsvBatchId(e.target.value)}
                  className="select-styled w-full"
                >
                  <option value="">None</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center items-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-[var(--border-color)] border-dashed rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUploadCloud className="w-10 h-10 text-[var(--text-secondary)] mb-3" />
                    <p className="mb-2 text-sm text-[var(--text-secondary)]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-[var(--text-secondary)] opacity-70">CSV files only</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                </label>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. Manage Batches Modal */}
      {isBatchesModalOpen && (
        <div onClick={() => setIsBatchesModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-black/10 dark:bg-white/5">
              <h3 className="text-xl font-bold">Manage Batches</h3>
              <button 
                onClick={() => setIsBatchesModalOpen(false)} 
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 border-b border-[var(--border-color)]">
              <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Create New Batch</h4>
              <form onSubmit={handleCreateBatch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Spring 2025"
                  value={newBatchName}
                  onChange={e => setNewBatchName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newBatchName.trim()}
                  className="bg-[var(--color-primary-yellow)] text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </form>
            </div>

            <div className="p-0 overflow-y-auto flex-1">
              {batches.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">
                  No batches found for this organization.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)]">
                      <th className="p-4 font-semibold">Batch Name</th>
                      <th className="p-4 font-semibold text-center">Members</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(batch => (
                      <tr key={batch.id} className={`border-b border-[var(--border-color)] ${batch.status === 'DISABLED' ? 'opacity-50' : ''}`}>
                        <td className="p-4 font-medium">{batch.name}</td>
                        <td className="p-4 text-center">
                          <span className="bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold">
                            {batch._count?.users || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${
                            batch.status === 'ACTIVE' 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {batch.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {!admin?.isDisabled && (
                            <button 
                              onClick={() => toggleBatchStatus(batch)}
                              className={`${batch.status === 'ACTIVE' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'} px-3 py-1.5 rounded-lg font-medium transition-colors`}
                            >
                              {batch.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                            </button>
                          )}
                          {admin?.isDisabled && (
                            <span className="text-xs text-[var(--text-secondary)] font-medium italic">Read-only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
