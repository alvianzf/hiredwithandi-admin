import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiX, FiCheck, FiSearch } from "react-icons/fi";

export default function PlatformUsers() {
  const [students, setStudents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [orgFilter, setOrgFilter] = useState("All");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const loadData = useCallback(() => {
    const allStudents = JSON.parse(localStorage.getItem('hwa_students') || '[]');
    const allOrgs = JSON.parse(localStorage.getItem('hwa_organizations') || '[]');
    setStudents(allStudents.reverse());
    setOrganizations(allOrgs);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveStudents = (updatedStudentsList) => {
    localStorage.setItem('hwa_students', JSON.stringify(updatedStudentsList));
    setStudents(updatedStudentsList);
  };

  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : "Unknown Org";
  };

  const openEditModal = (student) => {
    setEditStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleEditUser = (e) => {
    e.preventDefault();
    if (!editStudent || !editStudent.name || !editStudent.email) return;

    const updated = students.map(s => {
      if (s.id === editStudent.id) {
        return { ...s, name: editStudent.name, email: editStudent.email };
      }
      return s;
    });

    saveStudents(updated);
    setEditStudent(null);
    setIsEditModalOpen(false);
  };

  const toggleStudentStatus = (id) => {
    const updated = students.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Active' ? 'Disabled' : 'Active' };
      }
      return s;
    });
    saveStudents(updated);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    const matchesOrg = orgFilter === "All" || s.orgId === orgFilter;
    return matchesSearch && matchesStatus && matchesOrg;
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
          <p className="text-[var(--text-secondary)] mt-1">Superadmin: Oversee all students across every organization.</p>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row gap-4 bg-black/5 dark:bg-white/5">
          <div className="relative flex-1 md:w-1/3">
            <FiSearch className="absolute left-3 top-3.5 text-[var(--text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search all students..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors shadow-inner"
            />
          </div>
          
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors shadow-inner font-medium"
          >
            <option value="All">All Organizations</option>
            {organizations.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-red)] transition-colors shadow-inner font-medium"
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
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Organization</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Email</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)]">Status</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[var(--text-secondary)] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-[var(--text-secondary)]">
                    <p className="font-semibold text-lg">No students found.</p>
                    <p className="text-sm">Try relaxing your search or filter parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className={`border-b border-black/5 dark:border-white/5 ${student.status === 'Disabled' ? 'opacity-50 grayscale' : ''} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                    <td className="p-4 font-bold">{student.name}</td>
                    <td className="p-4 text-sm font-medium text-blue-500">{getOrgName(student.orgId)}</td>
                    <td className="p-4 text-[var(--text-secondary)] text-sm">{student.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        student.status === 'Active' 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                          : 'bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center space-x-3 items-center">
                      <button 
                        onClick={() => openEditModal(student)}
                        className="text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 font-bold transition-colors bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => toggleStudentStatus(student.id)}
                        className={`${student.status === 'Active' ? 'text-red-600 dark:text-red-500 hover:text-red-700' : 'text-green-600 dark:text-green-500 hover:text-green-700'} font-bold transition-colors bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg`}
                      >
                        {student.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-black/5 dark:bg-white/5 border-t border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] text-center">
          Showing {filteredStudents.length} of {students.length} global platform users
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-black/10 dark:bg-white/5">
              <h3 className="text-xl font-bold">Edit Platform Student</h3>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditStudent(null);
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
                  value={editStudent.name}
                  onChange={e => setEditStudent({...editStudent, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editStudent.email}
                  onChange={e => setEditStudent({...editStudent, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                />
              </div>

              <div className="pt-6 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditStudent(null);
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
