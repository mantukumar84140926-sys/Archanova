import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SCHOOLVERSE — School Management, Simplified",
  description: "A connected school management platform for school teams, teachers, students and parents.",
  applicationName: "SCHOOLVERSE",
};

export default function SchoolverseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
