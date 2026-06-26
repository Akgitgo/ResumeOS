"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  User, 
  FileText, 
  Code, 
  Settings, 
  LogOut, 
  Upload, 
  Sparkles, 
  Eye, 
  Download, 
  Plus, 
  Trash2, 
  Sun, 
  Moon, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Award,
  BadgeAlert,
  Loader2,
  ListRestart
} from "lucide-react";

// JWT decoder helper
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Layout Tab selection
  const [activeTab, setActiveTab] = useState<"profile" | "builder">("profile");
  const [profileSubTab, setProfileSubTab] = useState<"personal" | "skills" | "experience" | "projects" | "education" | "others">("personal");

  // Conversational Workspace States
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview");

  // Load state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Available resume templates
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("standard_ats");

  // Profile data state
  const [profile, setProfile] = useState<any>({
    full_name: "",
    email: "",
    mobile: "",
    profile_photo_url: "",
    profile_links: [],
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    languages: []
  });

  // Generator inputs
  const [jobDescription, setJobDescription] = useState("");
  const [userInstruction, setUserInstruction] = useState("");
  const [contextNote, setContextNote] = useState("");

  // LaTeX workspace states
  const [latexCode, setLatexCode] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Version control state (localStorage-backed)
  type LatexVersion = { v: number; ts: string; label: string; latex: string };
  const [latexVersions, setLatexVersions] = useState<LatexVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Photo uploading state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    // 1. Theme Configuration
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Auth checking & Session loading
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const payload = decodeJwt(token);
    if (!payload || !payload.user_id) {
      localStorage.removeItem("token");
      router.push("/signin");
      return;
    }

    setUserId(payload.user_id);
    fetchData(payload.user_id);

    // 3. Load saved LaTeX versions from localStorage
    const saved = localStorage.getItem(`cvcraft_versions_${payload.user_id}`);
    if (saved) {
      try { setLatexVersions(JSON.parse(saved)); } catch {}
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

  const logOut = () => {
    localStorage.removeItem("token");
    router.push("/signin");
  };

  // API Call: Fetch templates and profile details
  const fetchData = async (uid: string) => {
    try {
      setLoading(true);
      // Fetch templates
      const tempRes = await fetch("http://127.0.0.1:8000/api/templates");
      if (tempRes.ok) {
        const tempData = await tempRes.json();
        setTemplates(tempData);
      }

      const token = localStorage.getItem("token");
      // Fetch user profile
      const profRes = await fetch(`http://127.0.0.1:8000/api/users/${uid}/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        // Ensure arrays are initialized
        setProfile({
          full_name: profData.full_name || "",
          email: profData.email || "",
          mobile: profData.mobile || "",
          profile_photo_url: profData.profile_photo_url ? `${profData.profile_photo_url}?t=${new Date().getTime()}` : "",
          profile_links: profData.profile_links || [],
          experience: profData.experience || [],
          education: profData.education || [],
          projects: profData.projects || [],
          skills: profData.skills || [],
          certifications: profData.certifications || [],
          achievements: profData.achievements || [],
          languages: profData.languages || []
        });
        if (profData.template_id) {
          setSelectedTemplateId(profData.template_id);
        }
      } else {
        setStatusMessage({ type: "error", text: "Failed to load user profile." });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Connection error loading dashboard data." });
    } finally {
      setLoading(false);
    }
  };

  // API Call: Save profile details
  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload = {
        ...profile,
        template_id: selectedTemplateId
      };
      
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update profile.");
      }

      setProfile(data.data);
      setStatusMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save profile details." });
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (file: File, maxWidth = 250, maxHeight = 250, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context is null"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas toBlob returned null"));
              }
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // API Call: Profile image uploading
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    setUploadingPhoto(true);
    setStatusMessage(null);

    try {
      // Compress the image client-side to keep upload size small (~20KB) and load times instant
      const compressedBlob = await compressImage(file, 250, 250, 0.85);
      const fd = new FormData();
      const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      fd.append("file", compressedBlob, `${originalName}.jpg`);

      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}/upload-photo`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to upload photo.");
      }
      
      // Update local profile photo with cache-buster parameter
      setProfile((prev: any) => ({
        ...prev,
        profile_photo_url: `${data.profile_photo_url}?t=${new Date().getTime()}`
      }));
      setStatusMessage({ type: "success", text: "Avatar photo updated successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Photo upload failed." });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // API Call: Generate or refine LaTeX resume via Chat Conversational AI
  const handleGenerateResume = async (instructionOverride?: string) => {
    if (!userId) return;

    // First generation uses userInstruction; subsequent turns use chatInput
    const isFirstGeneration = chatHistory.length === 0;
    const promptToSend = instructionOverride || (isFirstGeneration ? userInstruction : chatInput);

    // Don't allow empty follow-up messages
    if (!promptToSend && !isFirstGeneration) return;

    setGenerating(true);
    setStatusMessage(null);

    // Immediately add user message to chat history (visible UI update)
    let updatedHistory = [...chatHistory];
    if (promptToSend) {
      const userMessage = isFirstGeneration
        ? `Job: ${jobDescription ? jobDescription.slice(0, 80) + "..." : "(no job description)"}\n\nPrompt: ${promptToSend}`
        : promptToSend;
      updatedHistory = [...chatHistory, { role: "user" as const, content: userMessage }];
      setChatHistory(updatedHistory);
      if (!isFirstGeneration) {
        setChatInput("");
      }
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}/generate-resume`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          job_description: jobDescription,
          user_instruction: promptToSend || "",
          context_note: contextNote,
          existing_latex: latexCode,
          template_id: selectedTemplateId,
          messages: updatedHistory
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "AI Workspace failed.");
      }

      setLatexCode(data.latex_code);

      // Save version snapshot
      const vLabel = isFirstGeneration ? "Initial Resume" : (chatInput.slice(0, 40) || "AI Update");
      if (userId) saveVersion(data.latex_code, vLabel, userId);
      
      // Append bot response to chat history
      setChatHistory(prev => [
        ...prev, 
        { role: "assistant" as const, content: data.message || "Resume updated successfully." }
      ]);

      setStatusMessage({ type: "success", text: "Resume tailored successfully!" });
      
      // Compile immediately to preview
      handleCompilePdf(data.latex_code);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to generate tailored resume." });
    } finally {
      setGenerating(false);
    }
  };


  // Save a version snapshot to state + localStorage
  const saveVersion = (latex: string, label: string, uid: string) => {
    setLatexVersions(prev => {
      const next: { v: number; ts: string; label: string; latex: string }[] = [
        ...prev,
        { v: prev.length + 1, ts: new Date().toLocaleTimeString(), label, latex }
      ];
      localStorage.setItem(`cvcraft_versions_${uid}`, JSON.stringify(next));
      return next;
    });
  };

  const handleResetChat = () => {
    setChatHistory([]);
    setChatInput("");
    setJobDescription("");
    setUserInstruction("");
    setLatexCode("");
    setPdfBlobUrl(null);
    setLatexVersions([]);
    setShowVersionHistory(false);
    if (userId) localStorage.removeItem(`cvcraft_versions_${userId}`);
    setStatusMessage({ type: "success", text: "New chat session started." });
  };

  const restoreVersion = (v: { v: number; ts: string; label: string; latex: string }) => {
    setLatexCode(v.latex);
    handleCompilePdf(v.latex);
    setShowVersionHistory(false);
    setStatusMessage({ type: "success", text: `Restored to v${v.v}: ${v.label}` });
  };

  // API Call: Compile LaTeX source to PDF
  const handleCompilePdf = async (codeToCompile = latexCode) => {
    if (!userId || !codeToCompile.trim()) return;
    setCompiling(true);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}/compile-pdf`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ latex_code: codeToCompile })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "PDF Compilation failed.");
      }

      const pdfBlob = await res.blob();
      const localUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(localUrl);
      setStatusMessage({ type: "success", text: "PDF compiled successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Compilation failed. Check your LaTeX code syntax." });
    } finally {
      setCompiling(false);
    }
  };

  // Array handlers helper functions
  const addArrayItem = (key: string, defaultObj: any) => {
    setProfile((prev: any) => ({
      ...prev,
      [key]: [...(prev[key] || []), defaultObj]
    }));
  };

  const removeArrayItem = (key: string, idx: number) => {
    setProfile((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateArrayField = (key: string, idx: number, field: string, val: any) => {
    setProfile((prev: any) => {
      const updatedList = [...prev[key]];
      updatedList[idx] = {
        ...updatedList[idx],
        [field]: val
      };
      return {
        ...prev,
        [key]: updatedList
      };
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col">
      
      {/* Header Dashboard Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Image src="/Logo.png" alt="Logo" width={32} height={32} className="rounded-none object-contain bg-slate-950 p-1 border border-slate-800/40" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent">CVCraft AI Studio</span>
        </div>

        {/* User Quick Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <h4 className="font-bold text-sm tracking-tight">{profile.full_name || "User Account"}</h4>
              <span className="text-xs text-slate-400 font-medium">Standard Account</span>
            </div>
            {/* Avatar Circle Container */}
            <div className="relative w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow flex items-center justify-center overflow-hidden">
              {profile.profile_photo_url ? (
                <Image 
                  src={profile.profile_photo_url} 
                  alt="Avatar" 
                  fill
                  className="object-cover"
                />
              ) : (
                <User size={18} className="text-slate-400" />
              )}
            </div>
          </div>

          <button onClick={toggleTheme} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
            {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
          </button>

          <button onClick={logOut} className="p-2 rounded-lg border border-red-200 dark:border-red-950/40 hover:bg-red-500/10 text-red-500 transition-colors" title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Studio Panel */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-4 md:pb-0 md:pr-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-3 transition-colors ${activeTab === "profile" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "hover:bg-slate-100 dark:hover:bg-slate-900/60"}`}
          >
            <User size={18} /> My Profile Info
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-3 transition-colors ${activeTab === "builder" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "hover:bg-slate-100 dark:hover:bg-slate-900/60"}`}
          >
            <Sparkles size={18} /> Resume Generator
          </button>
        </aside>

        {/* Dynamic Studio Window */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-900 p-6 shadow-sm">
          
          {/* Status Message Handler */}
          {statusMessage && (
            <div className={`mb-6 flex items-start gap-2.5 p-3.5 rounded-xl border ${statusMessage.type === "success" ? "border-emerald-200 dark:border-emerald-950 bg-emerald-100/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" : "border-red-200 dark:border-red-950 bg-red-100/50 dark:bg-red-950/20 text-red-600 dark:text-red-400"} text-xs font-semibold`}>
              {statusMessage.type === "success" ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
              <span className="flex-1">{statusMessage.text}</span>
              <button onClick={() => setStatusMessage(null)} className="font-bold underline hover:opacity-80">Close</button>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
              <Loader2 size={36} className="animate-spin text-emerald-500" />
              <p className="text-sm font-semibold">Loading data from CVCraft AI database...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE INFO EDIT PANELS */}
              {activeTab === "profile" && (
                <div className="flex flex-col gap-6 flex-1">
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold">Personal Profile</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Define your background details. This is fed directly to the AI for resume tailoring.</p>
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      Save Profile Info
                    </button>
                  </div>

                  {/* Profile sub-navigation menu */}
                  <div className="flex gap-2 border-b border-slate-100 dark:border-slate-900 pb-2 overflow-x-auto">
                    {[
                      { id: "personal", label: "Personal Info" },
                      { id: "skills", label: "Skills & Languages" },
                      { id: "experience", label: "Experience" },
                      { id: "projects", label: "Projects" },
                      { id: "education", label: "Education" },
                      { id: "others", label: "Certifications & Awards" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setProfileSubTab(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${profileSubTab === tab.id ? "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Sub-Tab 1.1: Personal Info & Avatar Uploader */}
                  {profileSubTab === "personal" && (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar Image Uploader Card */}
                        <div className="w-full md:w-1/3 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center gap-4 text-center">
                          <div className="relative w-28 h-28 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center overflow-hidden">
                            {profile.profile_photo_url ? (
                              <Image 
                                src={profile.profile_photo_url} 
                                alt="Avatar" 
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <User size={38} className="text-slate-300" />
                            )}
                            {uploadingPhoto && (
                              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                                <Loader2 className="animate-spin" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-sm">Avatar Profile Photo</h4>
                            <p className="text-xs text-slate-400 mt-1">Upload JPEG/PNG image to save in public Storage.</p>
                          </div>

                          <input 
                            type="file" 
                            accept="image/*"
                            ref={photoInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                          >
                            <Upload size={14} /> Upload Picture
                          </button>
                        </div>

                        {/* Text Fields */}
                        <div className="flex-1 w-full grid sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase text-slate-400">Full Name</label>
                            <input 
                              type="text" 
                              value={profile.full_name} 
                              onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase text-slate-400">Email Address</label>
                            <input 
                              type="email" 
                              value={profile.email} 
                              onChange={(e) => setProfile({...profile, email: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase text-slate-400">Mobile Phone</label>
                            <input 
                              type="text" 
                              value={profile.mobile} 
                              onChange={(e) => setProfile({...profile, mobile: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-xs font-bold uppercase text-slate-400">Contact / Profile Links</label>
                            <div className="flex flex-col gap-2 mt-1">
                              {profile.profile_links.map((link: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <input 
                                    type="text" 
                                    placeholder="Platform (e.g. GitHub)" 
                                    value={link.platform} 
                                    onChange={(e) => updateArrayField("profile_links", idx, "platform", e.target.value)}
                                    className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="URL (e.g. https://github.com/username)" 
                                    value={link.url} 
                                    onChange={(e) => updateArrayField("profile_links", idx, "url", e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => removeArrayItem("profile_links", idx)} 
                                    className="text-red-500 hover:text-red-600 p-2"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                              <button 
                                type="button" 
                                onClick={() => addArrayItem("profile_links", { platform: "", url: "" })}
                                className="px-4 py-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/40 text-slate-400 hover:text-slate-300 transition-colors w-full mt-1"
                              >
                                <Plus size={14} /> Add Profile Link
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-Tab 1.2: Skills & Languages */}
                  {profileSubTab === "skills" && (
                    <div className="flex flex-col gap-6">
                      
                      {/* Skills Section */}
                      <div>
                        <h3 className="text-lg font-bold mb-3">Skills Inventory</h3>
                        <div className="flex flex-col gap-4">
                          {profile.skills.map((skill: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/20 relative">
                              <button 
                                type="button" 
                                onClick={() => removeArrayItem("skills", idx)}
                                className="absolute top-4 right-4 text-red-500 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                              
                              <div className="grid gap-3 max-w-xl">
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-bold uppercase text-slate-400">Category Name</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Programming Languages" 
                                    value={skill.category} 
                                    onChange={(e) => updateArrayField("skills", idx, "category", e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-bold uppercase text-slate-400">Items (Comma-separated)</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Python, Java, SQL, JavaScript" 
                                    value={skill.items ? skill.items.join(", ") : ""} 
                                    onChange={(e) => updateArrayField("skills", idx, "items", e.target.value.split(",").map((s: string) => s.trim()))}
                                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <button 
                            type="button" 
                            onClick={() => addArrayItem("skills", { category: "", items: [] })}
                            className="px-4 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/40 text-slate-400 hover:text-slate-300 transition-colors w-full"
                          >
                            <Plus size={14} /> Add Skill Group
                          </button>
                        </div>
                      </div>

                      {/* Languages Section */}
                      <div className="border-t border-slate-100 dark:border-slate-900 pt-6">
                        <h3 className="text-lg font-bold mb-3">Languages Spoken</h3>
                        <div className="flex flex-col gap-3">
                          {profile.languages.map((lang: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text" 
                                placeholder="Language (e.g. English)" 
                                value={lang.language} 
                                onChange={(e) => updateArrayField("languages", idx, "language", e.target.value)}
                                className="w-1/3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                              <input 
                                type="text" 
                                placeholder="Proficiency (e.g. Professional / Native)" 
                                value={lang.proficiency} 
                                onChange={(e) => updateArrayField("languages", idx, "proficiency", e.target.value)}
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                              <button 
                                type="button" 
                                onClick={() => removeArrayItem("languages", idx)} 
                                className="text-red-500 hover:text-red-600 p-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => addArrayItem("languages", { language: "", proficiency: "" })}
                            className="px-4 py-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/40 text-slate-400 hover:text-slate-300 transition-colors w-full mt-1"
                          >
                            <Plus size={14} /> Add Language
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Sub-Tab 1.3: Work History Experience */}
                  {profileSubTab === "experience" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Experience History</h3>
                        <button 
                          type="button" 
                          onClick={() => addArrayItem("experience", { company: "", role: "", location: "", start_date: "", end_date: "", description: [] })}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors"
                        >
                          <Plus size={14} /> Add Job
                        </button>
                      </div>

                      {profile.experience.map((exp: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/20 relative flex flex-col gap-4">
                          <button 
                            type="button" 
                            onClick={() => removeArrayItem("experience", idx)}
                            className="absolute top-5 right-5 text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Company Name</label>
                              <input 
                                type="text" 
                                value={exp.company} 
                                onChange={(e) => updateArrayField("experience", idx, "company", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Role / Position</label>
                              <input 
                                type="text" 
                                value={exp.role} 
                                onChange={(e) => updateArrayField("experience", idx, "role", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Location</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Pune, India (or Remote)" 
                                value={exp.location} 
                                onChange={(e) => updateArrayField("experience", idx, "location", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Start Date</label>
                                <input 
                                  type="text" 
                                  placeholder="YYYY-MM-DD"
                                  value={exp.start_date} 
                                  onChange={(e) => updateArrayField("experience", idx, "start_date", e.target.value)}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">End Date</label>
                                <input 
                                  type="text" 
                                  placeholder="YYYY-MM-DD (or Present)" 
                                  value={exp.end_date} 
                                  onChange={(e) => updateArrayField("experience", idx, "end_date", e.target.value)}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Bullet points description */}
                          <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-900 pt-3">
                            <label className="text-xs font-bold text-slate-400">Responsibilities (One bullet point per line)</label>
                            <textarea 
                              placeholder="Describe your achievements and impact..." 
                              value={exp.description ? exp.description.join("\n") : ""} 
                              onChange={(e) => updateArrayField("experience", idx, "description", e.target.value.split("\n"))}
                              className="h-28 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-mono"
                            />
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-Tab 1.4: Projects */}
                  {profileSubTab === "projects" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Projects Profile</h3>
                        <button 
                          type="button" 
                          onClick={() => addArrayItem("projects", { title: "", role: "", description: "", technologies: [], github_url: "", live_url: "", start_date: "", end_date: "" })}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors"
                        >
                          <Plus size={14} /> Add Project
                        </button>
                      </div>

                      {profile.projects.map((proj: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/20 relative flex flex-col gap-4">
                          <button 
                            type="button" 
                            onClick={() => removeArrayItem("projects", idx)}
                            className="absolute top-5 right-5 text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Project Title</label>
                              <input 
                                type="text" 
                                value={proj.title} 
                                onChange={(e) => updateArrayField("projects", idx, "title", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Role / Tech Stack Name</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Full Stack Developer"
                                value={proj.role} 
                                onChange={(e) => updateArrayField("projects", idx, "role", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">GitHub Repository URL</label>
                              <input 
                                type="text" 
                                value={proj.github_url} 
                                onChange={(e) => updateArrayField("projects", idx, "github_url", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Live Project URL</label>
                              <input 
                                type="text" 
                                value={proj.live_url} 
                                onChange={(e) => updateArrayField("projects", idx, "live_url", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1 sm:col-span-2">
                              <label className="text-xs font-bold text-slate-400">Technologies Used (Comma-separated)</label>
                              <input 
                                type="text" 
                                placeholder="e.g. React, Next.js, FastAPI, PostgreSQL" 
                                value={proj.technologies ? proj.technologies.join(", ") : ""} 
                                onChange={(e) => updateArrayField("projects", idx, "technologies", e.target.value.split(",").map((s: string) => s.trim()))}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-900 pt-3">
                            <label className="text-xs font-bold text-slate-400">Project Description</label>
                            <textarea 
                              placeholder="Describe the problem, solution, and result of your project..." 
                              value={proj.description} 
                              onChange={(e) => updateArrayField("projects", idx, "description", e.target.value)}
                              className="h-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-sans"
                            />
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-Tab 1.5: Education */}
                  {profileSubTab === "education" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Education History</h3>
                        <button 
                          type="button" 
                          onClick={() => addArrayItem("education", { degree: "", specialization: "", institution: "", location: "", cgpa: 0, start_year: 0, end_year: 0 })}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-colors"
                        >
                          <Plus size={14} /> Add Education
                        </button>
                      </div>

                      {profile.education.map((edu: any, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/20 relative flex flex-col gap-4">
                          <button 
                            type="button" 
                            onClick={() => removeArrayItem("education", idx)}
                            className="absolute top-5 right-5 text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Institution / University</label>
                              <input 
                                type="text" 
                                value={edu.institution} 
                                onChange={(e) => updateArrayField("education", idx, "institution", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Degree / Qualification</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Bachelor of Technology"
                                value={edu.degree} 
                                onChange={(e) => updateArrayField("education", idx, "degree", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-400">Specialization / Major</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Computer Science"
                                value={edu.specialization} 
                                onChange={(e) => updateArrayField("education", idx, "specialization", e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Grade / CGPA</label>
                                <input 
                                  type="text" 
                                  value={edu.cgpa} 
                                  onChange={(e) => updateArrayField("education", idx, "cgpa", e.target.value)}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Start Year</label>
                                <input 
                                  type="number" 
                                  value={edu.start_year || ""} 
                                  onChange={(e) => updateArrayField("education", idx, "start_year", parseInt(e.target.value))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">End Year</label>
                                <input 
                                  type="number" 
                                  value={edu.end_year || ""} 
                                  onChange={(e) => updateArrayField("education", idx, "end_year", parseInt(e.target.value))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-Tab 1.6: Certifications & Achievements */}
                  {profileSubTab === "others" && (
                    <div className="flex flex-col gap-6">
                      
                      {/* Certifications Section */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-bold">Certifications</h3>
                          <button 
                            type="button" 
                            onClick={() => addArrayItem("certifications", { name: "", issuer: "", issue_date: "", credential_id: "", credential_url: "" })}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/85 transition-colors"
                          >
                            <Plus size={12} /> Add Cert
                          </button>
                        </div>
                        <div className="flex flex-col gap-4">
                          {profile.certifications.map((cert: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/20 relative grid sm:grid-cols-2 gap-3 pt-8">
                              <button 
                                type="button" 
                                onClick={() => removeArrayItem("certifications", idx)}
                                className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>

                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Certification Name</label>
                                <input 
                                  type="text" 
                                  value={cert.name} 
                                  onChange={(e) => updateArrayField("certifications", idx, "name", e.target.value)}
                                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Issuer / Organization</label>
                                <input 
                                  type="text" 
                                  value={cert.issuer} 
                                  onChange={(e) => updateArrayField("certifications", idx, "issuer", e.target.value)}
                                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Issue Date (YYYY-MM-DD)</label>
                                <input 
                                  type="text" 
                                  value={cert.issue_date} 
                                  onChange={(e) => updateArrayField("certifications", idx, "issue_date", e.target.value)}
                                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Verification URL</label>
                                <input 
                                  type="text" 
                                  value={cert.credential_url} 
                                  onChange={(e) => updateArrayField("certifications", idx, "credential_url", e.target.value)}
                                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Achievements Section */}
                      <div className="border-t border-slate-100 dark:border-slate-900 pt-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-bold">Notable Achievements</h3>
                          <button 
                            type="button" 
                            onClick={() => addArrayItem("achievements", { title: "", organization: "", year: "", description: "" })}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-900/85 transition-colors"
                          >
                            <Plus size={12} /> Add Achievement
                          </button>
                        </div>
                        <div className="flex flex-col gap-4">
                          {profile.achievements.map((ach: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/20 relative flex flex-col gap-3 pt-8">
                              <button 
                                type="button" 
                                onClick={() => removeArrayItem("achievements", idx)}
                                className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>

                              <div className="grid sm:grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1 sm:col-span-2">
                                  <label className="text-xs font-bold text-slate-400">Achievement Title</label>
                                  <input 
                                    type="text" 
                                    value={ach.title} 
                                    onChange={(e) => updateArrayField("achievements", idx, "title", e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs font-bold text-slate-400">Year / Date</label>
                                  <input 
                                    type="text" 
                                    value={ach.year} 
                                    onChange={(e) => updateArrayField("achievements", idx, "year", e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-400">Short Description</label>
                                <input 
                                  type="text" 
                                  value={ach.description} 
                                  onChange={(e) => updateArrayField("achievements", idx, "description", e.target.value)}
                                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: AI RESUME GENERATOR / INTERACTIVE CHAT STUDIO */}
              {activeTab === "builder" && (
                <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">

                  {/* ── LEFT PANE ─────────────────────────────────────── */}
                  <div className="flex-1 flex flex-col gap-4">
                    {chatHistory.length === 0 ? (
                      /* ── STEP 0: Job description only ── */
                      <div className="flex flex-col gap-5">
                        <div className="border-b border-slate-100 dark:border-slate-900 pb-4">
                          <h2 className="text-2xl font-bold">Resume Generator</h2>
                          <p className="text-xs text-slate-400 mt-0.5">Paste the job description — the AI will tailor your resume to it.</p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Job Description</label>
                          <textarea
                            autoFocus
                            placeholder="Paste the full job description here (required)..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="h-44 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm font-sans focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all resize-none leading-relaxed"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Instructions <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                          <textarea
                            placeholder="e.g. Highlight React and FastAPI skills. Keep it to 1 page. Move Education to the bottom."
                            value={userInstruction}
                            onChange={(e) => setUserInstruction(e.target.value)}
                            className="h-24 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-sm font-sans focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all resize-none leading-relaxed"
                          />
                        </div>
                        <button
                          onClick={() => handleGenerateResume()}
                          disabled={generating || !jobDescription.trim()}
                          className="self-start px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-indigo-500 text-white hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-xl"
                        >
                          {generating
                            ? <><Loader2 size={16} className="animate-spin" /> Building Resume...</>
                            : <><Sparkles size={16} /> Generate Resume</>}
                        </button>
                        {generating && (
                          <p className="text-xs text-slate-400 pl-1 animate-pulse">AI is tailoring your resume — this may take 10–20 seconds...</p>
                        )}
                      </div>

                    ) : (
                      /* ── ACTIVE CHAT ── */
                      <div className="flex flex-col h-full border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">

                        {/* Chat header */}
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Resume Chat</span>
                          </div>
                          <button
                            onClick={handleResetChat}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-950/40 text-red-500 hover:bg-red-500/10 transition-colors text-xs font-semibold flex items-center gap-1.5"
                          >
                            <ListRestart size={12} /> New Chat
                          </button>
                        </div>

                        {/* Message timeline */}
                        <div className="flex-1 p-4 overflow-y-auto max-h-[400px] flex flex-col gap-3">
                          {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "self-end flex-row-reverse max-w-[80%]" : "self-start max-w-[86%]"}`}>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs ${msg.role === "user" ? "bg-indigo-500" : "bg-slate-900 border border-slate-800"}`}>
                                {msg.role === "user"
                                  ? <User size={13} />
                                  : <Image src="/Logo.png" alt="AI" width={14} height={14} className="object-contain" />}
                              </div>
                              <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                msg.role === "user"
                                  ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-100"
                                  : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {generating && (
                            <div className="self-start flex gap-2.5 max-w-[86%]">
                              <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                                <Image src="/Logo.png" alt="AI" width={14} height={14} className="object-contain" />
                              </div>
                              <div className="px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 flex items-center gap-2">
                                <Loader2 size={11} className="animate-spin text-emerald-500" /> Updating resume...
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Chat input */}
                        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                          <div className="flex gap-2 items-end">
                            <textarea
                              placeholder="Ask changes... e.g. 'Add Python to skills', 'Make summary punchier'"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleGenerateResume();
                                }
                              }}
                              disabled={generating}
                              rows={2}
                              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-sans focus:ring-1 focus:ring-emerald-500 outline-none resize-none leading-relaxed disabled:opacity-50"
                            />
                            <button
                              onClick={() => handleGenerateResume()}
                              disabled={generating || !chatInput.trim()}
                              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 text-white hover:scale-105 active:scale-95 transition disabled:opacity-40 flex-shrink-0"
                            >
                              {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1.5 pl-1">Enter to send · Shift+Enter for new line · Powered by Llama 3.3 70B</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── RIGHT PANE: Preview & Code ───────────────────── */}
                  <div className="w-full lg:w-[50%] flex flex-col gap-3">

                    {/* Controls row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Mode toggle */}
                      <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950">
                        <button onClick={() => setPreviewMode("preview")} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${previewMode === "preview" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                          <Eye size={11} /> Preview
                        </button>
                        <button onClick={() => setPreviewMode("code")} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${previewMode === "code" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                          <Code size={11} /> Code
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1.5 items-center flex-wrap">

                        {/* Version history pill */}
                        {latexCode && latexVersions.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={() => setShowVersionHistory(v => !v)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition flex items-center gap-1.5"
                            >
                              <FolderKanban size={11} /> v{latexVersions.length}
                            </button>
                            {showVersionHistory && (
                              <div className="absolute right-0 top-8 z-50 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
                                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Version History</span>
                                  <button onClick={() => setShowVersionHistory(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                  {[...latexVersions].reverse().map(ver => (
                                    <button
                                      key={ver.v}
                                      onClick={() => restoreVersion(ver)}
                                      className="w-full text-left px-3 py-2 hover:bg-emerald-500/5 border-b border-slate-100 dark:border-slate-900 last:border-0 transition-colors"
                                    >
                                      <span className="text-xs font-bold text-emerald-500">v{ver.v}</span>
                                      <span className="text-xs text-slate-600 dark:text-slate-300 ml-1.5 truncate">{ver.label}</span>
                                      <span className="block text-[10px] text-slate-400 mt-0.5">{ver.ts}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => handleCompilePdf()}
                          disabled={compiling || !latexCode.trim()}
                          className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
                        >
                          {compiling ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
                          Compile
                        </button>

                        {pdfBlobUrl && (
                          <a
                            href={pdfBlobUrl}
                            download={`Resume_${new Date().toISOString().slice(0,10)}.pdf`}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition flex items-center gap-1.5"
                          >
                            <Download size={11} /> Export PDF
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Display panel */}
                    <div className="flex-1 min-h-[460px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center">
                      {compiling && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 text-white">
                          <Loader2 size={28} className="animate-spin text-emerald-400" />
                          <p className="text-xs font-semibold">Running pdflatex engine...</p>
                        </div>
                      )}

                      {previewMode === "preview" ? (
                        pdfBlobUrl ? (
                          <iframe src={`${pdfBlobUrl}#view=FitH`} className="w-full h-full border-none rounded-2xl bg-white" title="Resume PDF Preview" />
                        ) : (
                          <div className="text-center p-8 flex flex-col items-center gap-3 text-slate-400">
                            <BadgeAlert size={40} className="text-slate-300 dark:text-slate-600" />
                            <div>
                              <h4 className="font-bold text-sm text-slate-500 dark:text-slate-400">No Preview Yet</h4>
                              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Generate a resume, then click <strong>Compile</strong> to preview.</p>
                            </div>
                          </div>
                        )
                      ) : (
                        latexCode ? (
                          <textarea
                            value={latexCode}
                            onChange={(e) => setLatexCode(e.target.value)}
                            className="w-full h-full p-4 bg-transparent font-mono text-xs focus:ring-0 outline-none leading-relaxed resize-none text-slate-800 dark:text-slate-300 min-h-[460px]"
                            spellCheck={false}
                          />
                        ) : (
                          <div className="text-center p-8 flex flex-col items-center gap-3 text-slate-400">
                            <Code size={40} className="text-slate-300 dark:text-slate-600" />
                            <div>
                              <h4 className="font-bold text-sm text-slate-500 dark:text-slate-400">LaTeX Code Appears Here</h4>
                              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Paste a job description and generate your first resume.</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* Footer copyright section */}
      <footer className="px-6 py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-center text-xs text-slate-400 font-medium">
        <p>© {new Date().getFullYear()} CVCraft AI Studio. All rights reserved. Recruiter-friendly styling via LaTeX.</p>
      </footer>

    </div>
  );
}
