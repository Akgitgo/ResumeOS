"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Bot, 
  FileSpreadsheet, 
  Code, 
  Target, 
  Zap, 
  ShieldCheck, 
  Sun, 
  Moon, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  Sparkles,
  Users,
  Award
} from "lucide-react";

export default function Home() {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const faqData = [
    {
      q: "Is CVCraft AI free?",
      a: "Yes. You can create your first resume for free, with premium features available for advanced customization."
    },
    {
      q: "Can I edit my resume later?",
      a: "Absolutely. Save your resume details in your profile and update or regenerate it anytime."
    },
    {
      q: "Does it generate Overleaf code?",
      a: "Yes. CVCraft AI generates clean, fully editable LaTeX code that is 100% compatible with Overleaf."
    },
    {
      q: "Is the resume ATS-friendly?",
      a: "Yes. Every template and style structure in CVCraft AI is mathematically optimized to pass Applicant Tracking Systems used by major global recruiters."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Background Radial Glows (Apple-style Magnus Background) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[150px] pointer-events-none" />


      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-900/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent">
            CVCraft AI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a href="#why-choose" className="hover:text-emerald-500 transition-colors">Why Us</a>
          <a href="#how-it-works" className="hover:text-emerald-500 transition-colors">How It Works</a>
          <a href="#features" className="hover:text-emerald-500 transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-emerald-500 transition-colors">Testimonials</a>
          <a href="#faq" className="hover:text-emerald-500 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle */}
          {mounted && (
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
          )}

          <Link 
            href="/signin" 
            className="text-sm font-semibold hover:text-emerald-500 transition-colors hidden sm:block"
          >
            Sign In
          </Link>

          <Link 
            href="/signup" 
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-indigo-500 text-white shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center flex flex-col items-center gap-8">
        
        {/* Large Centered Logo with Apple-style Gradient Glow */}
        <div className="relative group mb-2">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-30 blur-md group-hover:opacity-60 transition duration-300 pointer-events-none" />
          <Image 
            src="/Logo.png" 
            alt="CVCraft AI Logo" 
            width={96} 
            height={96} 
            className="relative rounded-none object-contain shadow-2xl border border-slate-800 bg-slate-950 p-1.5"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={12} /> Powered by llama-3.3-70b
        </div>

        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-100 dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
          Build Professional <br />
          <span className="bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">
            ATS-Friendly Resumes
          </span> with AI
        </h1>

        <p className="max-w-2xl text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium">
          Create beautiful, recruiter-ready resumes in minutes. CVCraft AI transforms your experience into polished, ATS-optimized resumes and generates clean, production-ready LaTeX/Overleaf code with just a few clicks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link 
            href="/signup" 
            className="flex-1 px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-500 to-indigo-500 text-white shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Create Resume for Free <ArrowRight size={18} />
          </Link>
          <a 
            href="#features" 
            className="flex-1 px-8 py-4 rounded-xl text-base font-bold border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
          >
            View Templates
          </a>
        </div>
      </section>

      {/* Trusted By Banner */}
      <section className="px-6 py-8 border-y border-slate-200/60 dark:border-slate-900/60 bg-slate-100/50 dark:bg-slate-900/20 text-center">
        <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-4">Trusted By Professionals In</p>
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <span>Students</span> • <span>Software Engineers</span> • <span>Data Scientists</span> • <span>AI Engineers</span> • <span>Product Managers</span> • <span>Career Switchers</span>
        </div>
      </section>

      {/* Why Choose CVCraft AI Section */}
      <section id="why-choose" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">Why Choose CVCraft AI?</h2>
          <p className="text-slate-400 mt-3 font-medium">Smart tooling engineered to get you hired.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature Card 1 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Bot size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">🤖 AI-Powered Resume Writing</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate impactful bullet points, professional summaries, and tailored resumes using advanced AI algorithms.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">📄 ATS-Optimized Templates</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Every resume is designed to pass Applicant Tracking Systems while maintaining a clean, modern, and readable layout.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Code size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">📝 Overleaf & LaTeX Generator</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Instantly generate professional LaTeX code that is fully compatible with Overleaf and extremely easy to customize.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">🎯 Job-Specific Resume Tailoring</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Customize your resume based on a job description to improve relevance and increase your interview callback rate.
            </p>
          </div>

          {/* Feature Card 5 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">⚡ One-Click PDF Export</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Download high-quality, professional PDF resumes locally in seconds, ready to attach to job applications.
            </p>
          </div>

          {/* Feature Card 6 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">🔒 Privacy First</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Your personal information stays secure. We never sell, share, or analyze your resume data for third parties.
            </p>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-6 py-24 border-t border-slate-200/60 dark:border-slate-900/60 bg-slate-100/30 dark:bg-slate-900/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold font-sans">How It Works</h2>
            <p className="text-slate-400 mt-3 font-medium">Build your resume in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Enter Your Details</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Add your education, experience, projects, skills, achievements, and optionally upload a profile photo.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Let AI Do the Work</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Our AI writes professional, quantified bullet points, aligns templates, and optimizes formatting for maximum ATS compliance.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Export Your Resume</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                Download your resume directly as a high-quality PDF, or copy the generated LaTeX/Overleaf source code for manual editing.
              </p>
            </div>

            {/* Connecting Line (Only visible on medium and larger screens) */}
            <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />

          </div>
        </div>
      </section>

      {/* Grid Features & Targets */}
      <section id="features" className="px-6 py-24 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              A Feature-Rich Studio Designed for Your Success
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              We provide tools to cover every aspect of the modern application cycle, ensuring your resume speaks directly to what recruiters are looking for.
            </p>

            <ul className="space-y-4">
              {[
                "AI Resume Generator",
                "AI Resume Rewriter",
                "ATS Score Checker",
                "Job Description Optimizer",
                "Resume Grammar & Spelling Fixer",
                "AI Cover Letter Generator",
                "Overleaf Code Generator",
                "Multiple Professional Templates",
                "Export to PDF & LaTeX",
                "Real-Time Resume Preview"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 font-semibold text-sm">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
            
            {/* Who is it for */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/40 dark:bg-slate-900/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <h3 className="text-xl font-bold">Who Is It For?</h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[
                  "College Students",
                  "Fresh Graduates",
                  "Software Engineers",
                  "AI & ML Engineers",
                  "Data Scientists",
                  "Full-Stack Developers",
                  "Product Managers",
                  "Experienced Professionals"
                ].map((tag) => (
                  <span key={tag} className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Why Recruiters love it */}
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/40 dark:bg-slate-900/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Award size={20} />
                </div>
                <h3 className="text-xl font-bold">Why Recruiters Love It</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500" /> Clean and professional layouts</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500" /> ATS-friendly formatting</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500" /> Strong action-oriented content</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500" /> Consistent structure</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500" /> Easy to customize</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 size={14} className="text-emerald-500" /> Industry-standard templates</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-24 border-t border-slate-200/60 dark:border-slate-900/60 bg-slate-100/30 dark:bg-slate-900/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">What Developers Say</h2>
            <p className="text-slate-400 mt-3 font-medium">Hear from professionals who accelerated their job search.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "I built a professional resume in less than 10 minutes and landed multiple interview calls.",
                author: "Software Engineer Intern",
                initials: "JD"
              },
              {
                text: "The Overleaf export saved me hours of formatting. I can customize anything I want.",
                author: "AI Engineer",
                initials: "AM"
              },
              {
                text: "Perfect for students and developers who want clean, professional, ATS-optimized resumes.",
                author: "Data Scientist",
                initials: "TS"
              }
            ].map((t, idx) => (
              <div key={idx} className="p-8 rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between h-64 hover:scale-[1.02] transition-transform duration-300">
                <p className="text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-800/80 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow">
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{t.author}</h4>
                    <span className="text-xs text-slate-400 font-medium">Verified User</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-6 py-24 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">Frequently Asked Questions</h2>
          <p className="text-slate-400 mt-3 font-medium">Clear answers to common questions.</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqData.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="rounded-2xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-900/20 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-base md:text-lg hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={20} 
                    className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[200px] border-t border-slate-200 dark:border-slate-800/80" : "max-h-0"}`}
                >
                  <p className="px-6 py-5 text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="px-6 py-24 max-w-5xl mx-auto text-center relative z-10">
        <div className="p-10 md:p-16 rounded-3xl border border-slate-200 dark:border-slate-900 bg-gradient-to-br from-white to-slate-100/50 dark:from-slate-900 dark:to-slate-950 shadow-2xl relative overflow-hidden flex flex-col items-center gap-6">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-emerald-500/5 dark:bg-emerald-500/2 blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Ready to Build Your Dream Resume?
          </h2>
          <p className="max-w-xl text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">
            Join thousands of students and professionals creating ATS-friendly, LaTeX-compatible resumes with AI.
          </p>

          <Link 
            href="/signup" 
            className="px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-500 to-indigo-500 text-white shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
          >
            Create Your Resume Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-slate-200/60 dark:border-slate-900/60 bg-white dark:bg-slate-950 text-center text-xs text-slate-400 font-medium flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <Image src="/Logo.png" alt="Logo" width={24} height={24} className="rounded-none object-contain bg-slate-950 p-0.5 border border-slate-800/40" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">CVCraft AI</span>
        </div>
        <p>© {new Date().getFullYear()} CVCraft AI. All rights reserved. Your career, crafted beautifully.</p>
      </footer>

    </div>
  );
}
