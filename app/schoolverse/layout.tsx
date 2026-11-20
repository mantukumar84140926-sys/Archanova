import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SCHOOLVERSE — Global School Management, Free to Use",
  description: "A global-ready, free-to-use school management platform for school teams, teachers, students and parents.",
  applicationName: "SCHOOLVERSE",
  keywords: ["school management", "school ERP", "global education", "student information system", "school administration"],
};

export default function SchoolverseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
