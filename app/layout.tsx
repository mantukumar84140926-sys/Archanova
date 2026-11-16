import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJEDUVERSE — A Universe of Free Learning",
  description: "Free learning for every student. Explore school, college and competitive exam resources in Hindi and English.",
  applicationName: "AJEDUVERSE"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}