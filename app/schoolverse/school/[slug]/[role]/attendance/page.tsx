"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, RefreshCw, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Student = { id: string; admission_number: string; first_name: string; last_name: string | null; class_id: string | null; section_id: string | null };
type AttendanceStatus = "present" | "absent" | "late" | "excused";
const choices: AttendanceStatus[] = ["present", "absent", "late", "excused"];
const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-"); };

export default function AttendancePage() {
  const params = useParams<{slug:string;role:string}>();
  const router = useRouter();
  const [schoolId,setSchoolId] = useState("");
  const [schoolName,setSchoolName] = useState("");
  const [students,setStudents] = useState<Student[]>([]);
  const [statuses,setStatuses] = useState<Record<string,AttendanceStatus>>({});
  const [date,setDate] = useState(today());
  const [session,setSession] = useState("full_day");
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const canMark = ["school_admin","principal","teacher"].includes(params.role);

  const load = useCallback(async () => {
    setError(""); setSuccess("");
    const supabase = createClient();
    const {data:{user}} = await supabase.auth.getUser();
    if(!user){router.replace("/schoolverse/login");return;}
    const {data:members,error:memberError} = await supabase.from("school_memberships").select("school_id,role").eq("user_id",user.id).eq("role",params.role).eq("status","active");
    if(memberError) throw memberError;
    const {data:schools,error:schoolError} = await supabase.from("schools").select("id,name,slug").eq("slug",params.slug);
    if(schoolError) throw schoolError;
    const school = (schools??[]).find(s=>(members??[]).some(m=>m.school_id===s.id));
    if(!school) throw new Error("You do not have access to this school.");
    setSchoolId(school.id); setSchoolName(school.name);
    const {data:studentRows,error:studentsError} = await supabase.from("students").select("id,admission_number,first_name,last_name,class_id,section_id").eq("school_id",school.id).eq("status","active").order("admission_number");
    if(studentsError) throw studentsError;
    const list = (studentRows??[]) as Student[];
    setStudents(list);
    const {data:attendanceRows,error:attendanceError} = await supabase.from("attendance").select("student_id,status").eq("school_id",school.id).eq("attendance_date",date).eq("session_key",session);
    if(attendanceError) throw attendanceError;
    const next:Record<string,AttendanceStatus> = {};
    for(const row of attendanceRows??[]) next[row.student_id] = row.status as AttendanceStatus;
    setStatuses(next);
  },[date,params.role,params.slug,router,session]);

  useEffect(()=>{let live=true;(async()=>{try{await load();}catch(e){if(live)setError(e instanceof Error?e.message:"Could not load attendance.");}finally{if(live)setLoading(false);}})();return()=>{live=false};},[load]);

  async function save() {
    if(!schoolId || !canMark) return;
    setSaving(true);setError("");setSuccess("");
    try {
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error("Please sign in again.");
      const payload=Object.entries(statuses).map(([student_id,status])=>({school_id:schoolId,student_id,attendance_date:date,session_key:session,status,marked_by:user.id}));
      if(payload.length===0) throw new Error("Select attendance status for at least one student.");
      const {error:upsertError}=await supabase.from("attendance").upsert(payload,{onConflict:"student_id,attendance_date,session_key"});
      if(upsertError) throw upsertError;
      setSuccess("Attendance saved successfully.");
      await load();
    } catch(e) { setError(e instanceof Error?e.message:"Could not save attendance."); }
    finally { setSaving(false); }
  }

  return <main className="sv-app-shell">
    <header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">SCHOOL<span>VERSE</span></Link><Link href={`/schoolverse/school/${encodeURIComponent(params.slug)}/${params.role}`} className="sv-app-back"><ArrowLeft size={15}/> Workspace</Link></header>
    <section className="sv-app-content">
      <div className="sv-kicker"><span/> ATTENDANCE MANAGEMENT</div><h1>Daily attendance</h1><p className="sv-auth-intro">{schoolName||"Your school"} · Mark and review student attendance</p>
      <div className="sv-record-toolbar sv-attendance-toolbar"><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Session<select value={session} onChange={e=>setSession(e.target.value)}><option value="full_day">Full day</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option></select></label><button onClick={()=>load()}><RefreshCw size={15}/> Refresh</button></div>
      {error&&<div className="sv-auth-error" role="alert">{error}</div>}{success&&<div className="sv-auth-success" role="status">{success}</div>}
      {!canMark&&<div className="sv-app-panel">Your role can view attendance records but cannot mark or change them.</div>}
      <div className="sv-record-table-wrap"><table className="sv-record-table"><thead><tr><th>Admission no.</th><th>Student</th><th>Attendance status</th></tr></thead><tbody>
        {loading?<tr><td colSpan={3}>Loading students…</td></tr>:students.length===0?<tr><td colSpan={3}>No active students found. Add student records first.</td></tr>:students.map(s=><tr key={s.id}><td>{s.admission_number}</td><td>{s.first_name} {s.last_name??""}</td><td><select disabled={!canMark} value={statuses[s.id]??""} onChange={e=>setStatuses(old=>({...old,[s.id]:e.target.value as AttendanceStatus}))}><option value="">Not marked</option>{choices.map(c=><option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}</select></td></tr>)}
      </tbody></table></div>
      {canMark&&<div className="sv-record-actions sv-attendance-save"><span><CalendarCheck size={15}/> {Object.keys(statuses).length} of {students.length} marked</span><button className="sv-record-primary" disabled={saving||loading||students.length===0} onClick={save}><Save size={16}/>{saving?"Saving…":"Save attendance"}</button></div>}
    </section><footer className="sv-app-footer">© 2026 SCHOOLVERSE · A RITEX product</footer>
  </main>;
}
