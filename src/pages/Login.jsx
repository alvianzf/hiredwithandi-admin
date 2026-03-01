import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiLock, FiMail } from "react-icons/fi";

export default function Login() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasExistingPassword, setHasExistingPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { login, checkEmail, setupPassword, admin } = useAuth();
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

  const handleNext = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");
    
    // Check if the email exists and if it has a password
    const result = await checkEmail(email);
    setIsLoading(false);

    if (result && result.exists) {
      setHasExistingPassword(result.hasPassword);
      setStep(2);
    } else {
      setError("Account not found. Please contact your administrator.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError("");
    
    let success = false;
    if (hasExistingPassword) {
      success = await login(email, password);
    } else {
      success = await setupPassword(email, password);
    }
    
    setIsLoading(false);
    if (!success) {
      setError("Authentication failed. Please try again.");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] bg-doodle flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary-yellow)] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-primary-red)] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>

      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="text-xs font-bold uppercase tracking-wider px-5 py-2.5 glass rounded-full hover:scale-105 transition-transform"
        >
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 glass p-10 rounded-3xl relative z-10 border-t border-l border-white/20 dark:border-white/10 shadow-2xl">
        <div className="text-center flex flex-col items-center">
          <img src="/lwa-logo.png" alt="LWA" className="w-24 h-24 mb-6 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <h2 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)] font-medium">
            Sign in to access the organizational console
          </p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={step === 1 ? handleNext : handleSubmit}>
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            {step === 1 && (
              <div className="relative group animate-in fade-in slide-in-from-bottom-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-[var(--text-secondary)] group-focus-within:text-[var(--color-primary-yellow)] transition-colors" size={20} />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  className="appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border-2 border-transparent bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:outline-none focus:bg-[var(--bg-color)] focus:border-[var(--color-primary-yellow)] sm:text-sm transition-all duration-300 shadow-inner placeholder-[var(--text-secondary)]"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
                <div className="mb-2 flex items-center justify-between text-sm px-1">
                  <span className="text-[var(--text-secondary)] font-medium">{email}</span>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="text-[var(--color-primary-yellow)] hover:text-[#e6a600] transition-colors font-bold"
                  >
                    Change
                  </button>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="text-[var(--text-secondary)] group-focus-within:text-[var(--color-primary-yellow)] transition-colors" size={20} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    autoFocus
                    className="appearance-none rounded-xl relative block w-full px-4 py-4 pl-12 border-2 border-transparent bg-black/5 dark:bg-white/5 text-[var(--text-primary)] focus:outline-none focus:bg-[var(--bg-color)] focus:border-[var(--color-primary-yellow)] sm:text-sm transition-all duration-300 shadow-inner placeholder-[var(--text-secondary)]"
                    placeholder={hasExistingPassword ? "Password" : "Create a New Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {!hasExistingPassword && (
                  <p className="mt-2 text-xs text-[var(--text-secondary)] px-1">
                    Your account has been created by a Superadmin. Please set a secure password to continue.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-4 px-4 text-base font-bold rounded-xl text-black bg-[var(--color-primary-yellow)] hover:bg-[#e6a600] focus:outline-none focus:ring-4 focus:ring-yellow-500/50 transition-all duration-300 shadow-[0_0_20px_rgba(255,184,0,0.4)] hover:shadow-[0_0_25px_rgba(255,184,0,0.6)] transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? 'Loading...' 
                : step === 1 
                  ? 'Continue →' 
                  : !hasExistingPassword 
                    ? 'Create Password & Sign In' 
                    : 'Sign into Dashboard'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl text-center text-xs text-[var(--text-secondary)]">
            <p className="font-semibold mb-2 uppercase tracking-wide text-[10px]">Demo Access Credentials</p>
            <div className="flex flex-col space-y-1 font-mono">
              <span className="text-[var(--text-primary)]">Admin: test@example.com / User#123</span>
              <span className="text-[var(--text-primary)]">Global: superadmin@example.com / Superadmin#123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
