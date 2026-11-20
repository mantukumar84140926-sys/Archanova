"use client";

import Link from "next/link";
import {
  ArrowRight, BookOpen, Building2, CalendarCheck, GraduationCap,
  Users, Wallet, ShieldCheck, ClipboardList, Bell, Menu
} from "lucide-react";
import "./schoolverse.css";

const portals = [
  { icon: Building2, title: "School Admin", detail: "Admissions, staff, classes, fees and school settings." },
  { icon: GraduationCap, title: "Principal", detail: "Academic oversight, reports and school-wide updates." },
  { icon: Users, title: "Teachers", detail: "Attendance, homework, marks and class communication." },
  { icon: BookOpen, title: "Students", detail: "Timetable, homework, attendance and exam results." },
  { icon: Users, title: "Parents", detail: "Track your child’s learning, attendance and fee status." },
  { icon: Wallet, title: "Accountants", detail: "Fee plans, collections, dues and printable receipts." },
];

const modules = [
  { icon: Users, title: "Student & staff records", detail: "Manage admissions, guardians, teachers and staff." },
  { icon: CalendarCheck, title: "Attendance & timetable", detail: "Daily attendance and organised class schedules." },
  { icon: Wallet, title: "Fees & receipts", detail: "Fee structures, payment records and receipts." },
  { icon: ClipboardList, title: "Exams & report cards", detail: "Exam schedules, marks and student progress." },
  { icon: BookOpen, title: "Homework & learning", detail: "Share assignments and track student submissions." },
  { icon: Bell, title: "Notices & notifications", detail: "Keep parents, students and staff informed." },
];

export default function SchoolverseHome() {
  return (
    <main className="sv-page">
      <header className="sv-header">
        <Link href="/schoolverse" className="sv-brand">
          <span className="sv-brand-icon"><GraduationCap size={23} /></span>
          <span>SCHOOL<span>VERSE</span><small>SCHOOL MANAGEMENT, SIMPLIFIED</small></span>
        </Link>
        <nav className="sv-nav"><a href="#portals">Portals</a><a href="#modules">Features</a><a href="#security">Security</a></nav>
        <Link href="#get-started" className="sv-header-cta">Get started <ArrowRight size={16} /></Link>
        <button className="sv-menu" aria-label="Menu"><Menu /></button>
      </header>

      <section className="sv-hero">
        <div className="sv-hero-copy">
          <div className="sv-kicker"><span /> GLOBAL SCHOOL MANAGEMENT · FREE TO USE</div>
          <h1>Every school,<br /><em>in sync.</em></h1>
          <p>A global, free-to-use workspace for school teams, teachers, students and parents. Manage everyday school operations across countries, languages and time zones.</p>
          <div className="sv-actions"><a className="sv-primary" href="#portals">Explore the platform <ArrowRight size={17} /></a><a className="sv-secondary" href="#modules">See what’s included</a></div>
          <div className="sv-trust"><ShieldCheck size={18} /><span>School-wise data isolation · Global-ready by design</span></div>
        </div>
        <div className="sv-preview" aria-label="School management dashboard preview">
          <div className="sv-preview-top"><div><span className="sv-window-dot" /><span className="sv-window-dot" /><span className="sv-window-dot" /></div><span>School overview · Preview</span><span className="sv-live">DESIGN PREVIEW</span></div>
          <div className="sv-preview-body">
            <aside className="sv-mini-side"><div className="sv-mini-logo"><GraduationCap size={17} /></div><i /><i /><i /><i /><i /></aside>
            <div className="sv-mini-main">
              <div className="sv-mini-heading"><div><small>GOOD MORNING</small><b>School overview</b></div><span>Academic year 2026–27</span></div>
              <div className="sv-stat-grid"><div><small>Total students</small><b>—</b><span>Student records</span></div><div><small>Teachers</small><b>—</b><span>Staff records</span></div><div><small>Attendance</small><b>—</b><span>Today’s summary</span></div></div>
              <div className="sv-mini-lower"><div className="sv-mini-chart"><b>Attendance overview</b><div className="sv-chart-bars"><i /><i /><i /><i /><i /><i /><i /></div><small>Live data will appear after setup</small></div><div className="sv-mini-tasks"><b>Quick actions</b><span><Users size={13} /> Add student</span><span><CalendarCheck size={13} /> Mark attendance</span><span><Wallet size={13} /> Record a fee</span></div></div>
            </div>
          </div>
          <div className="sv-preview-note">Illustrative interface · No sample student data</div>
        </div>
      </section>

      <section className="sv-audience" id="portals">
        <div className="sv-section-head"><div className="sv-kicker"><span /> ONE GLOBAL PLATFORM, MANY ROLES</div><h2>Everyone has a place<br />in the <em>school community.</em></h2><p>Separate workspaces with permissions tailored to each role.</p></div>
        <div className="sv-portal-grid">{portals.map((portal) => { const Icon = portal.icon; return <article className="sv-portal-card" key={portal.title}><div className="sv-icon-tile"><Icon size={22} /></div><h3>{portal.title}</h3><p>{portal.detail}</p><span className="sv-card-arrow"><ArrowRight size={16} /></span></article>; })}</div>
      </section>

      <section className="sv-modules" id="modules"><div className="sv-section-head"><div className="sv-kicker"><span /> THE DAILY ESSENTIALS</div><h2>Less paperwork.<br /><em>More progress.</em></h2><p>Core modules designed to work together, from admission to report cards.</p></div><div className="sv-module-grid">{modules.map((module) => { const Icon = module.icon; return <article className="sv-module" key={module.title}><Icon size={21} /><div><h3>{module.title}</h3><p>{module.detail}</p></div></article>; })}</div></section>

      <section className="sv-security" id="security"><div><div className="sv-kicker"><span /> BUILT FOR SCHOOLS AROUND THE WORLD</div><h2>One platform.<br /><em>Private school data.</em></h2><p>Schools around the world get separate workspaces. Access is controlled by verified school memberships and database-level policies, not just hidden screens.</p></div><div className="sv-security-points"><span><ShieldCheck /> School-wise access controls</span><span><Users /> Role-based permissions</span><span><Building2 /> Separate school records</span></div></section>

      <section className="sv-cta" id="get-started"><div className="sv-cta-icon"><GraduationCap size={32} /></div><div><div className="sv-kicker">GLOBAL SCHOOL MANAGEMENT, FREE TO USE</div><h2>Better connected.<br /><em>Ready for what’s next.</em></h2><p>Designed for different countries, currencies, languages and school calendars. The web experience comes first, with Android to follow.</p></div><a href="#portals" className="sv-primary">Explore portals <ArrowRight size={17} /></a></section>
      <footer className="sv-footer"><Link href="/schoolverse" className="sv-brand"><span className="sv-brand-icon"><GraduationCap size={20} /></span><span>SCHOOL<span>VERSE</span></span></Link><small>© 2026 SCHOOLVERSE · Global school management, simplified.</small></footer>
    </main>
  );
}
