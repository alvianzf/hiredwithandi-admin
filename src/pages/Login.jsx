import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiLock, FiMail } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { login, admin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) {
      navigate("/");
    }
  }, [admin, navigate]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const success = login(email, password);
    if (!success) {
      setError("Invalid email or password");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="text-sm font-medium px-4 py-2 glass rounded-full"
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="max-w-md w-full space-y-8 glass p-8 rounded-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-primary-yellow)]">
            HiredWithAndi
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
            Admin Portal Login
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-[var(--text-secondary)]" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-primary)] focus:outline-none focus:ring-[var(--color-primary-yellow)] focus:border-[var(--color-primary-yellow)] focus:z-10 sm:text-sm transition-colors"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-[var(--text-secondary)]" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-primary)] focus:outline-none focus:ring-[var(--color-primary-yellow)] focus:border-[var(--color-primary-yellow)] focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-[var(--color-primary-yellow)] hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-yellow)] focus:ring-offset-[var(--bg-color)] transition-colors shadow-lg"
            >
              Sign in
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-4 mt-8">
          <p>Demo Credentials:</p>
          <p>test@example.com / User#123</p>
        </div>
      </div>
    </div>
  );
}
