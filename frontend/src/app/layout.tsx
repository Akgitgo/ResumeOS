import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATS Resume Tailor",
  description: "Tailor your resume to any job description and beat 6 major ATS platforms.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
