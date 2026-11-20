"use client";

import { FormEvent,useCallback,useEffect,useState } from "react";
import Link from "next/link";
import { useParams,useRouter } from "next/navigation";
import { ArrowLeft,Plus,RefreshCw,Search,Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Student={id:string;admission_number:string;first_name:string;last_name:string|null;admission_date:string;status:string};
export default function StudentRecordsPage(){
 const params=useParams<{slug:string;role:string}>();const router=useRouter();
 const [schoolId,setSchoolId]=useState("");const [schoolName,setSchoolName]=useState("");
 const [rows,setRows]=useState<Student[]>([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");const [search,setSearch]=useState("");const [showForm,setShowForm]=useState(false);
 const [admission,setAdmission]=useState("");const [first,setFirst]=useState("");const [last,setLast]=useState("");
 const canManage=["school_admin","principal"].includes(params.role);
 const load=useCallback(async()=>{
  setError("");const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/schoolverse/login");return;}
  const {data:members,error:memberError}=await supabase.from("school_memberships").select("school_id,role").eq("user_id",user.id).eq("role",params.role).eq("status","active");
  if(memberError)throw memberError;
  const {data:schools,error:schoolError}=await supabase.from("schools").select("id,name,slug").eq("slug",params.slug);
  if(schoolError)throw schoolError;
  const school=(schools??[]).find(s=>(members??[]).some(m=>m.school_id===s.id));
  if(!school)throw new Error("You do not have access to this school.");
  setSchoolId(school.id);setSchoolName(school.name);
  const {data,error:studentsError}=await supabase.from("students").select("id,admission_number,first_name,last_name,admission_date,status").eq("school_id",school.id).order("admission_date",{ascending:false}).limit(200);
  if(studentsError)throw studentsError;setRows((data??[]) as Student[]);
 },[params.role,params.slug,router]);
 useEffect(()=>{let live=true;(async()=>{try{await load();}catch(e){if(live)setError(e instanceof Error?e.message:"Could not load student records.");}finally{if(live)setLoading(false);}})();return()=>{live=false};},[load]);
 async function addStudent(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!schoolId)return;setSaving(true);setError("");
  try{const supabase=createClient();const {error:insertError}=await supabase.from("students").insert({school_id:schoolId,admission_number:admission.trim(),first_name:first.trim(),last_name:last.trim()||null});
   if(insertError)throw insertError;setAdmission("");setFirst("");setLast("");setShowForm(false);await load();
  }catch(e){setError(e instanceof Error?e.message:"Could not save student. Check admission number and your school role.");}finally{setSaving(false);}
 }
 const filtered=rows.filter(s=>`${s.admission_number} ${s.first_name} ${s.last_name??""}`.toLowerCase().includes(search.toLowerCase()));
 return <main className="sv-app-shell"><header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">SCHOOL<span>VERSE</span></Link><Link href={`/schoolverse/school/${encodeURIComponent(params.slug)}/${params.role}`} className="sv-app-back"><ArrowLeft size={15}/> Workspace</Link></header>
 <section className="sv-app-content"><div className="sv-kicker"><span/> STUDENT MANAGEMENT</div><h1>Student records</h1><p className="sv-auth-intro">{schoolName||"Your school"} · Secure school records</p>
 {error&&<div className="sv-auth-error" role="alert">{error}</div>}
 <div className="sv-record-toolbar"><div className="sv-record-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or admission number"/></div><div className="sv-record-actions"><button onClick={()=>load()}><RefreshCw size={15}/> Refresh</button>{canManage&&<button className="sv-record-primary" onClick={()=>setShowForm(v=>!v)}><Plus size={16}/> Add student</button>}</div></div>
 {showForm&&canManage&&<form className="sv-record-form" onSubmit={addStudent}><h2>New student admission</h2><div><label>Admission number<input required value={admission} onChange={e=>setAdmission(e.target.value)} placeholder="e.g. STU-0001"/></label><label>First name<input required value={first} onChange={e=>setFirst(e.target.value)} placeholder="First name"/></label><label>Last name<input value={last} onChange={e=>setLast(e.target.value)} placeholder="Last name (optional)"/></label></div><button disabled={saving}>{saving?"Saving…":"Save student"}</button></form>}
 <div className="sv-record-table-wrap"><table className="sv-record-table"><thead><tr><th>Admission no.</th><th>Student name</th><th>Admission date</th><th>Status</th></tr></thead><tbody>
 {loading?<tr><td colSpan={4}>Loading student records…</td></tr>:filtered.length===0?<tr><td colSpan={4}>{rows.length===0?"No student records yet. Add your first student when your school admin access is active.":"No matching students found."}</td></tr>:filtered.map(s=><tr key={s.id}><td>{s.admission_number}</td><td>{s.first_name} {s.last_name??""}</td><td>{s.admission_date}</td><td><span className="sv-record-status">{s.status}</span></td></tr>)}
 </tbody></table></div><p className="sv-record-footnote"><Users size={15}/> Showing up to 200 student records. Access is enforced by database row-level security.</p>
 </section><footer className="sv-app-footer">© 2026 SCHOOLVERSE · A RITEX product</footer></main>;
}
