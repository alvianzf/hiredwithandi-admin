import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FiX, FiCheck } from "react-icons/fi";
import Papa from "papaparse";

export default function StudentsMgmt() {
  const { admin } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "" });
  const [uploadError, setUploadError] = useState("");

  const loadStudents = useCallback(() => {
    const allStudents = JSON.parse(localStorage.getItem('hwa_students') || '[]');
    if (admin) {
      const orgStudents = allStudents.filter(s => s.orgId === admin.orgId);
      setStudents(orgStudents.reverse());
    }
  }, [admin]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const saveStudents = (updatedStudentsList) => {
    // We update only the students for this organization, preserving others
    const allStudents = JSON.parse(localStorage.getItem('hwa_students') || '[]');
    const otherOrgsStudents = allStudents.filter(s => s.orgId !== admin?.orgId);
    
    // Combine and save
    const combined = [...updatedStudentsList, ...otherOrgsStudents];
    localStorage.setItem('hwa_students', JSON.stringify(combined));
    loadStudents();
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) return;

    const newEntry = {
      id: 'stu_' + Date.now(),
      orgId: admin.orgId,
      name: newStudent.name,
      email: newStudent.email,
      status: 'Active',
      // password is left as User#123 as requested by default
    };

    saveStudents([newEntry, ...students]);
    setNewStudent({ name: "", email: "" });
    setIsCreateModalOpen(false);
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

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { data } = results;
        if (!data || data.length === 0) {
          setUploadError("CSV is empty or invalid format.");
          return;
        }

        const newEntries = data.map((row, index) => {
          // Fallback reading standard email and name columns
          const email = row.email || row.Email;
          const name = row.name || row.Name || email?.split('@')[0] || "Unknown User";
          
          if (!email) return null;

          return {
            id: `stu_${Date.now()}_${index}`,
            orgId: admin.orgId,
            name,
            email,
            status: 'Active'
          };
        }).filter(Boolean); // remove nulls

        if (newEntries.length === 0) {
          setUploadError("Could not find valid 'email' column in CSV.");
          return;
        }

        saveStudents([...newEntries, ...students]);
      },
      error: (err) => {
        setUploadError(err.message);
      }
    });

    e.target.value = null; // reset file input
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary-yellow)]">
            Students & Members
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage users in {admin?.organization?.name}.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer bg-[var(--color-primary-yellow)] text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors shadow-sm inline-flex items-center">
            Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[var(--color-primary-red)] text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors shadow-sm"
          >
            Create User
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-500/20 text-red-500 text-sm rounded-lg">
          {uploadError}
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[var(--border-color)]">
          <input 
            type="text" 
            placeholder="Search students..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
          />
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-color)]">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-[var(--text-secondary)]">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className={`border-b border-[var(--border-color)] ${student.status === 'Disabled' ? 'opacity-50' : ''} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}>
                    <td className="p-4 font-medium">{student.name}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{student.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        student.status === 'Active' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center space-x-3 items-center">
                      <Link to={`/students/${student.id}`} className="text-blue-500 hover:text-blue-400 font-medium transition-colors">View</Link>
                      <button 
                        onClick={() => toggleStudentStatus(student.id)}
                        className={`${student.status === 'Active' ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'} font-medium transition-colors`}
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
        <div className="p-4 border-t border-[var(--border-color)] text-sm text-[var(--text-secondary)] text-center">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-black/10 dark:bg-white/5">
              <h3 className="text-xl font-bold">Create New Student</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-black/5 dark:bg-black/20 border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-yellow)] transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start space-x-2 mt-2">
                <div className="mt-1 text-yellow-500">
                  <FiCheck />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Default password <span className="font-mono bg-black/10 dark:bg-black/30 px-1 rounded mx-1">User#123</span> will be assigned to this new user.
                </p>
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
    </div>
  );
}
