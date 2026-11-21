"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarCheck, CalendarClock, Wallet, GraduationCap, Bell, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Student = { id: string; admission_number: string; first_name: string; last_name: string | null; class_id: string | null; section_id: string | null };
type Attendance = { student_id: string; attendance_date: string; status: string };
type Homework = { id: string; title: string; subject: string; due_date: string | null; class_id: string; section_id: string | null };
type Invoice = { id: string; student_id: string; invoice_number: string; total_minor: number; currency_code: string; due_date: string | null; status: string };
type Result = { id: string; student_id: string; subject: string; marks_obtained: number; max_marks: number; grade: string | null };
type Timetable = { id: string; subject: string; day_of_week: number; starts_at: string; ends_at: string; room: string | null };
type Notice = { id: string; title: string; body: string; published_at: string | null; audience: string };

const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudentParentPortalPage() {
  const params = useParams<{ slug: string; role: string }>();
  const router = useRouter();
  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/schoolverse/login"); return; }

    const { data: memberships, error: membershipError } = await supabase
      .from("school_memberships").select("school_id")
      .eq("user_id", user.id).eq("role", params.role).eq("status", "active");
    if (membershipError) throw membershipError;

    const { data: schools, error: schoolError } = await supabase
      .from("schools").select("id,slug").eq("slug", params.slug);
    if (schoolError) throw schoolError;
    const school = (schools ?? []).find((item) => (memberships ?? []).some((m) => m.school_id === item.id));
    if (!school) throw new Error("You do not have access to this school.");
    setSchoolId(school.id);

    const { data: studentRows, error: studentsError } = await supabase
      .from("students").select("id,admission_number,first_name,last_name,class_id,section_id")
      .eq("school_id", school.id).order("first_name");
    if (studentsError) throw studentsError;
    const linkedStudents = (studentRows ?? []) as Student[];
    setStudents(linkedStudents);
    const studentIds = linkedStudents.map((student) => student.id);
    if (studentIds.length === 0) {
      setAttendance([]); setHomework([]); setInvoices([]); setResults([]); setTimetable([]); setNotices([]);
      return;
    }

    const [attendanceRes, homeworkRes, invoiceRes, resultRes, timetableRes, noticeRes] = await Promise.all([
      supabase.from("attendance").select("student_id,attendance_date,status").eq("school_id", school.id).in("student_id", studentIds).order("attendance_date", { ascending: false }).limit(30),
      supabase.from("homework").select("id,title,subject,due_date,class_id,section_id").eq("school_id", school.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("fee_invoices").select("id,student_id,invoice_number,total_minor,currency_code,due_date,status").eq("school_id", school.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("exam_results").select("id,student_id,subject,marks_obtained,max_marks,grade").eq("school_id", school.id).limit(50),
      supabase.from("timetable_entries").select("id,subject,day_of_week,starts_at,ends_at,room").eq("school_id", school.id).order("day_of_week").order("starts_at").limit(100),
      supabase.from("school_notices").select("id,title,body,published_at,audience").eq("school_id", school.id).not("published_at", "is", null).order("published_at", { ascending: false }).limit(10),
    ]);
    const firstError = attendanceRes.error || homeworkRes.error || invoiceRes.error || resultRes.error || timetableRes.error || noticeRes.error;
    if (firstError) throw firstError;
    setAttendance((attendanceRes.data ?? []) as Attendance[]);
    setHomework((homeworkRes.data ?? []) as Homework[]);
    setInvoices((invoiceRes.data ?? []) as Invoice[]);
    setResults((resultRes.data ?? []) as Result[]);
    setTimetable((timetableRes.data ?? []) as Timetable[]);
    setNotices((noticeRes.data ?? []) as Notice[]);
  }, [params.role, params.slug, router]);

  useEffect(() => {
    let live = true;
    (async () => {
      try { await load(); }
      catch (e) { if (live) setError(e instanceof Error ? e.message : "Could not load your student portal."); }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [load]);

  const studentName = (id: string) => {
    const student = students.find((item) => item.id === id);
    return student ? [student.first_name, student.last_name].filter(Boolean).join(" ") : "Student";
  };
  const money = (minor: number, currency: string) => {
    try {
      const format = new Intl.NumberFormat("en-IN", { style: "currency", currency });
      return format.format(minor / 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2));
    } catch { return `${minor} ${currency}`; }
  };
  const portalHref = (module: string) => `/schoolverse/school/${encodeURIComponent(params.slug)}/${params.role}/${module}`;

  return <main className="sv-app-shell">
    <header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">SCHOOL<span>VERSE</span></Link><Link href={`/schoolverse/school/${encodeURIComponent(params.slug)}/${params.role}`} className="sv-app-back"><ArrowLeft size={15}/> Workspace</Link></header>
    <section className="sv-app-content">
      <div className="sv-kicker"><span/> {params.role === "parent" ? "PARENT PORTAL" : "STUDENT PORTAL"}</div>
      <h1>{params.role === "parent" ? "Your child’s school dashboard" : "My learning dashboard"}</h1>
      <p className="sv-auth-intro">A read-only view of linked school records. Your access is limited by your verified student or guardian relationship.</p>
      {error && <div className="sv-auth-error" role="alert">{error}</div>}
      {loading ? <div className="sv-app-panel">Loading your school information…</div> : students.length === 0 ? <div className="sv-app-panel"><h2>No linked student profile found</h2><p>{params.role === "parent" ? "Ask the school administrator to invite you and verify your relationship with the student." : "Ask your school administrator to link your login to your student admission record."}</p></div> : <>
        <div className="sv-workspace-grid">
          {students.map((student) => <article className="sv-workspace-card" key={student.id}>
            <div className="sv-icon-tile"><GraduationCap size={22}/></div><h2>{student.first_name} {student.last_name ?? ""}</h2>
            <p>Admission no. {student.admission_number}</p>
            <small>Student profile linked to this account</small>
          </article>)}
        </div>
        <div className="sv-workspace-grid">
          <article className="sv-workspace-card"><div className="sv-icon-tile"><CalendarCheck size={22}/></div><h2>Attendance</h2><p>{attendance.length} recent attendance records</p><Link className="sv-module-status" href={portalHref("attendance")}>View attendance →</Link></article>
          <article className="sv-workspace-card"><div className="sv-icon-tile"><BookOpen size={22}/></div><h2>Homework</h2><p>{homework.length} visible assignments</p><Link className="sv-module-status" href={portalHref("homework")}>View homework →</Link></article>
          <article className="sv-workspace-card"><div className="sv-icon-tile"><Wallet size={22}/></div><h2>Fees</h2><p>{invoices.length} linked invoices</p><Link className="sv-module-status" href={portalHref("fees")}>View fees →</Link></article>
          <article className="sv-workspace-card"><div className="sv-icon-tile"><GraduationCap size={22}/></div><h2>Exam results</h2><p>{results.length} published result entries</p><Link className="sv-module-status" href={portalHref("exams")}>View results →</Link></article>
          <article className="sv-workspace-card"><div className="sv-icon-tile"><CalendarClock size={22}/></div><h2>Timetable</h2><p>{timetable.length} scheduled periods</p><Link className="sv-module-status" href={portalHref("timetable")}>View timetable →</Link></article>
          <article className="sv-workspace-card"><div className="sv-icon-tile"><Bell size={22}/></div><h2>Notices</h2><p>{notices.length} published notices</p><Link className="sv-module-status" href={portalHref("notices")}>View notices →</Link></article>
        </div>
        <h2>Recent attendance</h2>
        <div className="sv-record-table-wrap"><table className="sv-record-table"><thead><tr><th>Student</th><th>Date</th><th>Status</th></tr></thead><tbody>
          {attendance.length ? attendance.slice(0,12).map((row,index)=><tr key={`${row.student_id}-${row.attendance_date}-${index}`}><td>{studentName(row.student_id)}</td><td>{row.attendance_date}</td><td>{row.status}</td></tr>) : <tr><td colSpan={3}>No attendance records available yet.</td></tr>}
        </tbody></table></div>
        <h2>Homework and upcoming work</h2>
        <div className="sv-notice-list">{homework.length ? homework.slice(0,8).map((task)=><article className="sv-app-panel" key={task.id}><div className="sv-notice-meta">{task.subject} · Due {task.due_date ?? "not set"}</div><h2>{task.title}</h2><small>Assigned class work</small></article>) : <div className="sv-app-panel">No homework available right now.</div>}</div>
        <h2>Fee invoices</h2>
        <div className="sv-record-table-wrap"><table className="sv-record-table"><thead><tr><th>Student</th><th>Invoice</th><th>Amount</th><th>Status</th><th>Due date</th></tr></thead><tbody>
          {invoices.length ? invoices.map((invoice)=><tr key={invoice.id}><td>{studentName(invoice.student_id)}</td><td>{invoice.invoice_number}</td><td>{money(Number(invoice.total_minor),invoice.currency_code)}</td><td>{invoice.status}</td><td>{invoice.due_date ?? "—"}</td></tr>) : <tr><td colSpan={5}>No fee invoices found.</td></tr>}
        </tbody></table></div>
        <h2>Published notices</h2>
        <div className="sv-notice-list">{notices.length ? notices.map((notice)=><article className="sv-app-panel" key={notice.id}><div className="sv-notice-meta">{notice.audience} · {notice.published_at ? new Date(notice.published_at).toLocaleDateString() : ""}</div><h2>{notice.title}</h2><p>{notice.body}</p></article>) : <div className="sv-app-panel">No published notices available.</div>}</div>
      </>}
      <button className="sv-secondary" onClick={()=>load()}><RefreshCw size={14}/> Refresh dashboard</button>
    </section>
    <footer className="sv-app-footer">© 2026 SCHOOLVERSE · A RITEX product</footer>
  </main>;
}
