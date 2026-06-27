"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, Eye, EyeOff, Sun, Moon, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export default function SignUp() {
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [emailVerified, setEmailVerified] = useState(false);
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpToken, setEmailOtpToken] = useState("");

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!email.trim() || !email.includes("@")) throw new Error("Please enter a valid email address.");

      const res = await fetch("http://127.0.0.1:8000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Failed to send OTP to email.`);

      setEmailOtpToken(data.otp_token);
      setShowEmailOtpInput(true);
      setSuccess(`OTP sent to your email!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!emailOtp.trim()) throw new Error("Please enter the OTP.");

      const res = await fetch("http://127.0.0.1:8000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: emailOtp.trim(), otp_token: emailOtpToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Verification failed.`);

      setEmailVerified(true);
      setShowEmailOtpInput(false);
      setSuccess(`Email verified!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!name.trim()) { setError("Please enter your full name."); setLoading(false); return; }
    if (!emailVerified) {
      setError("Please verify Email before signing up.");
      setLoading(false);
      return;
    }
    
    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length < 5 || cleanMobile.length > 15) {
      setError("Please enter a valid mobile number.");
      setLoading(false);
      return;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
    if (!passwordPattern.test(password)) {
      setError("Password must contain lowercase, uppercase, digit, and special char, length 8-15.");
      setLoading(false);
      return;
    }

    try {
      const cleanMobile = mobile.replace(/\D/g, "");
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: cleanMobile,
          password: password,
          email_otp: emailOtp.trim(),
          email_otp_token: emailOtpToken
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      setSuccess("Account registered successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 transition-colors duration-300">
      
      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Floating Theme Selector (Top Right) */}
      {mounted && (
        <button 
          onClick={toggleTheme} 
          className="absolute top-6 right-6 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
        </button>
      )}

      {/* Sign Up Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col gap-6 mt-10 mb-10">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/Logo.png" 
              alt="CVCraft AI Logo" 
              width={42} 
              height={42} 
              className="rounded-none object-contain bg-slate-950 p-1 border border-slate-800/40"
            />
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent">
              CVCraft AI
            </span>
          </Link>
          <p className="text-sm text-slate-400 font-medium">Create your free account to build professional resumes.</p>
        </div>

        {/* Card Form */}
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-200 dark:border-red-950 bg-red-100/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-950 bg-emerald-100/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-pulse">
                <CheckCircle size={16} className="flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Uday Hese"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  disabled={emailVerified}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
                />
                {!emailVerified && email && email.includes("@") && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSendOtp}
                    className="absolute right-2 text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[60px]"
                  >
                    {loading ? (
                      <span className="w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "Verify"
                    )}
                  </button>
                )}
                {emailVerified && (
                  <div className="absolute right-3 flex items-center text-emerald-500">
                    <CheckCircle size={18} />
                  </div>
                )}
              </div>
            </div>

            {/* Email OTP Input (conditional) */}
            {showEmailOtpInput && !emailVerified && (
              <div className="flex flex-col gap-1 mt-[-8px] ml-4 border-l-2 border-indigo-500/30 pl-4 py-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Enter Email OTP</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="6-digit OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleVerifyOtp}
                    className="text-xs font-bold bg-emerald-500 text-white px-4 py-2 rounded-xl shadow hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                  >
                    {loading ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mobile Number</label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                  <Phone size={16} />
                </div>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="absolute inset-y-0 left-9 bg-transparent border-r border-slate-200 dark:border-slate-800 text-sm focus:outline-none pl-2 pr-1 text-slate-600 dark:text-slate-300 z-10 appearance-none"
                  style={{ width: "60px" }}
                >
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+61">+61 (AU)</option>
                </select>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-[100px] pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="•••••••• (8-15 chars, 1 uppercase, 1 special)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!success || !emailVerified}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-indigo-500 text-white shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Registering..." : "Sign Up"} <ArrowRight size={16} />
            </button>

          </form>
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-slate-400 font-medium">
          Already have an account?{" "}
          <Link href="/signin" className="text-emerald-500 font-bold hover:underline">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}
