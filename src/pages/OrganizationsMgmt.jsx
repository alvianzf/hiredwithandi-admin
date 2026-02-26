import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiBriefcase, FiUsers, FiSettings, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";

export default function OrganizationsMgmt() {
  const [organizations, setOrganizations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  
  // New Org State
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Edit Org State
  const [editOrgName, setEditOrgName] = useState("");
  const [newOrgAdminName, setNewOrgAdminName] = useState("");
  const [newOrgAdminEmail, setNewOrgAdminEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setOrganizations(JSON.parse(localStorage.getItem('hwa_organizations') || '[]'));
    setAdmins(JSON.parse(localStorage.getItem('hwa_admins') || '[]'));
  };

  const handleCreateOrg = (e) => {
    e.preventDefault();
    if (!orgName || !adminName || !adminEmail) return;

    const newOrgId = `org_${Date.now()}`;
    const newOrg = { id: newOrgId, name: orgName };
    
    const newAdmin = {
      id: `admin_${Date.now()}`,
      orgId: newOrgId,
      email: adminEmail,
      password: "User#123", // Default password rule
      name: adminName,
      role: "admin"
    };

    const updatedOrgs = [...organizations, newOrg];
    const updatedAdmins = [...admins, newAdmin];

    localStorage.setItem('hwa_organizations', JSON.stringify(updatedOrgs));
    localStorage.setItem('hwa_admins', JSON.stringify(updatedAdmins));

    setOrganizations(updatedOrgs);
    setAdmins(updatedAdmins);
    setIsModalOpen(false);
    
    // Reset
    setOrgName(""); setAdminName(""); setAdminEmail("");
  };

  const getAdminsForOrg = (orgId) => {
    return admins.filter(a => a.orgId === orgId);
  };

  const openManageModal = (org) => {
    setSelectedOrg(org);
    setEditOrgName(org.name);
    setIsManageModalOpen(true);
  };

  const handleUpdateOrg = (e) => {
    e.preventDefault();
    if (!selectedOrg || !editOrgName.trim()) return;

    const updatedOrgs = organizations.map(o => 
      o.id === selectedOrg.id ? { ...o, name: editOrgName } : o
    );

    localStorage.setItem('hwa_organizations', JSON.stringify(updatedOrgs));
    setOrganizations(updatedOrgs);

    if (newOrgAdminName && newOrgAdminEmail) {
      const newAdmin = {
        id: `admin_${Date.now()}`,
        orgId: selectedOrg.id,
        email: newOrgAdminEmail,
        password: "User#123",
        name: newOrgAdminName,
        role: "admin"
      };
      const updatedAdmins = [...admins, newAdmin];
      localStorage.setItem('hwa_admins', JSON.stringify(updatedAdmins));
      setAdmins(updatedAdmins);
    }

    setIsManageModalOpen(false);
    setSelectedOrg(null);
    setNewOrgAdminName("");
    setNewOrgAdminEmail("");
  };

  const removeAdmin = (adminId) => {
    const updatedAdmins = admins.filter(a => a.id !== adminId);
    localStorage.setItem('hwa_admins', JSON.stringify(updatedAdmins));
    setAdmins(updatedAdmins);
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
                <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-yellow)] text-black flex items-center justify-center text-sm">
                  {org.name.charAt(0)}
                </span>
                {org.name}
              </h3>
              
              <div className="space-y-3 z-10 flex-1">
                <div className="flex items-start gap-3">
                  <FiUsers className="text-[var(--text-secondary)] mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-2">Administrators ({orgAdmins.length})</p>
                    <div className="space-y-2">
                      {orgAdmins.length === 0 ? (
                        <p className="font-medium text-[var(--text-secondary)] italic text-sm">No admins assigned</p>
                      ) : (
                        orgAdmins.map(admin => (
                          <div key={admin.id} className="bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-[var(--border-color)]">
                            <p className="font-medium text-[var(--text-primary)] text-sm">{admin.name}</p>
                            <p className="text-xs text-blue-400">{admin.email}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-end z-10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="glass w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--color-primary-yellow)]">Onboard New Organization</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full"
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

      {/* Manage Settings Modal */}
      {isManageModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Manage Organization</h3>
              <button 
                onClick={() => setIsManageModalOpen(false)}
                className="text-[var(--text-secondary)] hover:text-red-500 transition-colors bg-white/5 p-2 rounded-full"
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
                      <button 
                        type="button"
                        onClick={() => removeAdmin(admin.id)}
                        className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                        title="Remove Admin"
                      >
                        <FiX size={16} />
                      </button>
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

              <div className="pt-6 flex justify-end gap-3">
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
