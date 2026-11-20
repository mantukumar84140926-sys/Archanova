import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SCHOOLVERSE — Global School Management, Free to Use",
  description: "A global-ready, free-to-use school management platform for school teams, teachers, students and parents.",
  applicationName: "SCHOOLVERSE",
  keywords: ["school management", "school ERP", "global education", "student information system", "school administration"],
  manifest: "/schoolverse.webmanifest",
  icons: { icon: "/schoolverse-icon.svg", apple: "/schoolverse-icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#101a2d",
  width: "device-width",
  initialScale: 1,
};

export default function SchoolverseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
