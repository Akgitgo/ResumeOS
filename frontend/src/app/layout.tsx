import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CVCraft AI - Build Professional ATS-Friendly Resumes",
  description: "Create beautiful, recruiter-ready resumes in minutes. CVCraft AI transforms your experience into polished, ATS-optimized resumes and LaTeX code.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

