"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { useParams,useRouter } from "next/navigation";
import { Building2,CalendarCheck,BookOpen,Wallet,Users,ClipboardList,Bell,ArrowLeft,LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const labels:Record<string,string>={school_admin:"School Admin",principal:"Principal",teacher:"Teacher",student:"Student",parent:"Parent",accountant:"Accountant"};
const modules=[{name:"Students & staff",desc:"Admissions, profiles and staff records",icon:Users,href:"students",active:true},{name:"Attendance",desc:"Daily attendance and attendance history",icon:CalendarCheck,href:"attendance",active:true},{name:"Academics",desc:"Classes, sections, academic years and timetable",icon:BookOpen,href:"",active:false},{name:"Fees & invoices",desc:"Fee records, invoices and payment history",icon:Wallet,href:"",active:false},{name:"Exams & results",desc:"Assessments, marks and report cards",icon:ClipboardList,href:"",active:false},{name:"Notices",desc:"School announcements and updates",icon:Bell,href:"",active:false}];

export default function SchoolRoleWorkspace(){
 const params=useParams<{slug:string;role:string}>();const router=useRouter();const [school,setSchool]=useState<{id:string;name:string}|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{let live=true;(async()=>{try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/schoolverse/login");return;}
 const {data:membership,error:membershipError}=await supabase.from("school_memberships").select("school_id,role,status").eq("user_id",user.id).eq("role",params.role).eq("status","active");
 if(membershipError)throw membershipError;
 const {data:schools,error:schoolError}=await supabase.from("schools").select("id,name,slug").eq("slug",params.slug);
 if(schoolError)throw schoolError;
 const match=(membership??[]).find(m=>(schools??[]).some(s=>s.id===m.school_id));
 if(!match)throw new Error("You do not have access to this school workspace.");
 const selected=(schools??[]).find(s=>s.id===match.school_id);
 if(live&&selected)setSchool({id:selected.id,name:selected.name});
 }catch(e){if(live)setError(e instanceof Error?e.message:"Unable to open this workspace.");}finally{if(live)setLoading(false);}})();return()=>{live=false};},[params.role,params.slug,router]);
 async function signOut(){const supabase=createClient();await supabase.auth.signOut();router.replace("/schoolverse/login");}
 return <main className="sv-app-shell"><header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">SCHOOL<span>VERSE</span></Link><Link href="/schoolverse/dashboard" className="sv-app-back"><ArrowLeft size={15}/> All workspaces</Link></header>
 <section className="sv-app-content"><div className="sv-kicker"><span/> {labels[params.role]??"SCHOOL WORKSPACE"}</div>
 {loading&&<div className="sv-app-panel">Checking your school access…</div>}
 {error&&<div className="sv-auth-error" role="alert">{error}<p><Link href="/schoolverse/dashboard">Return to dashboard</Link></p></div>}
 {school&&<><h1>{school.name}</h1><p className="sv-auth-intro">{labels[params.role]??params.role} workspace · Secure school-specific access</p><div className="sv-app-panel"><h2>Your school workspace is connected</h2><p>The database foundation is live. These modules are being connected in stages; no demo student or payment data is shown.</p></div><div className="sv-workspace-grid">{modules.map(m=>{const Icon=m.icon;return <article className="sv-workspace-card" key={m.name}><div className="sv-icon-tile"><Icon size={22}/></div><h2>{m.name}</h2><p>{m.desc}</p>{m.active?<Link className="sv-module-status" href={`/schoolverse/school/${encodeURIComponent(params.slug)}/${params.role}/${m.href}`}>Open module →</Link>:<span className="sv-module-status">Setup in progress</span>}</article>})}</div><div className="sv-record-shortcut"><div><b>Student records</b><small>View and manage student admissions using your school permissions.</small></div><Link href={`/schoolverse/school/${encodeURIComponent(params.slug)}/${params.role}/students`}>Open student records →</Link></div></>}
 </section><footer className="sv-app-footer">© 2026 SCHOOLVERSE · A RITEX product <button onClick={signOut}><LogOut size={14}/> Sign out</button></footer></main>;
}
