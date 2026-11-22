import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RITEX — School Management System",
  description: "RITEX School Management System — manage admissions, students, staff, attendance, fees, exams, homework and parent communication in one secure workspace.",
  applicationName: "RITEX"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}