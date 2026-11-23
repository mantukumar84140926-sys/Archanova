"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, GraduationCap, Users, Wallet, BookOpen, ShieldCheck, LogOut, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Membership={school_id:string;role:string;status:string;schools:{name:string;slug:string;country_code:string;currency_code:string;default_locale:string;timezone:string}|null};
type Application={id:string;school_name:string;status:string;created_at:string};
const roleNames:Record<string,string>={school_admin:"School Admin",principal:"Principal",teacher:"Teacher",student:"Student",parent:"Parent",accountant:"Accountant"};
const roleIcons:Record<string,typeof Building2>={school_admin:Building2,principal:ShieldCheck,teacher:GraduationCap,student:BookOpen,parent:Users,accountant:Wallet};
const inviteRoles=[{value:"teacher",label:"Teacher"},{value:"student",label:"Student"},{value:"parent",label:"Parent"},{value:"accountant",label:"Accountant"},{value:"principal",label:"Principal"}];

export default function SchoolverseDashboardPage(){
 const router=useRouter();
 const [email,setEmail]=useState("");
 const [token,setToken]=useState("");
 const [memberships,setMemberships]=useState<Membership[]>([]);
 const [applications,setApplications]=useState<Application[]>([]);
 const [inviteEmails,setInviteEmails]=useState<Record<string,string>>({});
 const [inviteRolesBySchool,setInviteRolesBySchool]=useState<Record<string,string>>({});
 const [busySchool,setBusySchool]=useState("");
 const [notice,setNotice]=useState("");
 const [inviteError,setInviteError]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  try{const supabase=createClient();const {data:{session},error:userError}=await supabase.auth.getSession();
   if(userError||!session?.user){router.replace("/schoolverse/login");return;}
   if(!active)return;
   setEmail(session.user.email??"");setToken(session.access_token);
   const [{data,error:queryError},{data:applicationRows,error:applicationError}]=await Promise.all([
    supabase.from("school_memberships").select("school_id,role,status,schools!inner(name,slug,country_code,currency_code,default_locale,timezone)").eq("user_id",session.user.id).eq("status","active"),
    supabase.from("school_applications").select("id,school_name,status,created_at").eq("applicant_user_id",session.user.id).order("created_at",{ascending:false}).limit(10)
   ]);
   if(queryError)throw queryError;if(applicationError)throw applicationError;
   if(active){setMemberships((data??[]) as unknown as Membership[]);setApplications((applicationRows??[]) as Application[]);}
  }catch(e){if(active)setError(e instanceof Error?e.message:"Could not load your school memberships.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false};},[router]);
 async function signOut(){const supabase=createClient();await supabase.auth.signOut();router.replace("/schoolverse/login");router.refresh();}
 async function inviteMember(event:FormEvent<HTMLFormElement>,schoolId:string){
  event.preventDefault();setBusySchool(schoolId);setInviteError("");setNotice("");
  try{
   const response=await fetch("/api/schoolverse/members",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({schoolId,email:inviteEmails[schoolId]??"",role:inviteRolesBySchool[schoolId]??"teacher"})});
   const result=await response.json();if(!response.ok)throw new Error(result.error??"Could not invite this member.");
   setNotice(result.message??`Invitation created for ${result.email}.`);setInviteEmails(old=>({...old,[schoolId]:""}));
  }catch(e){setInviteError(e instanceof Error?e.message:"Could not invite this member.");}
  finally{setBusySchool("");}
 }
 return <main className="sv-app-shell"><header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">RITEX<small> SCHOOL MANAGEMENT</small></Link><div className="sv-app-user"><span>{email}</span><button onClick={signOut}><LogOut size={15}/> Sign out</button></div></header>
 <section className="sv-app-content"><div className="sv-kicker"><span/> YOUR WORKSPACE</div><h1>Welcome to RITEX.</h1><p className="sv-auth-intro">Choose an active school workspace to continue.</p>
 {loading&&<div className="sv-app-panel">Loading your secure school memberships…</div>}
 {error&&<div className="sv-auth-error" role="alert">{error}</div>}
 {notice&&<div className="sv-auth-success" role="status">{notice}</div>}
 {inviteError&&<div className="sv-auth-error" role="alert">{inviteError}</div>}
 {!loading&&!error&&memberships.length===0&&<div className="sv-app-panel"><div className="sv-empty-icon"><Building2 size={25}/></div><h2>No school connected yet</h2><p>Your account is active, but it has not been assigned to a school. For security, users cannot choose their own school or role. Apply to onboard a school, or ask your school administrator to invite you.</p><div className="sv-record-actions"><Link href="/schoolverse/apply" className="sv-record-primary">Apply to onboard your school →</Link><Link href="/schoolverse" className="sv-secondary">Return to RITEX overview</Link></div></div>}
 <div className="sv-workspace-grid">{memberships.map((m)=>{const school=Array.isArray(m.schools)?m.schools[0]:m.schools;const Icon=roleIcons[m.role]??Building2;if(!school)return null;const canInvite=["school_admin","principal"].includes(m.role);return <article className="sv-workspace-card" key={m.school_id+m.role}><div className="sv-icon-tile"><Icon size={22}/></div><small>{roleNames[m.role]??m.role}</small><h2>{school.name}</h2><p>{school.country_code} · {school.currency_code} · {school.timezone}</p><Link href={`/schoolverse/school/${encodeURIComponent(school.slug)}/${m.role}`}>Open workspace →</Link>
 {canInvite&&<form className="sv-auth-form" onSubmit={e=>inviteMember(e,m.school_id)} style={{marginTop:20}}><h3><UserPlus size={17}/> Invite a school member</h3><label>Email address<input type="email" required value={inviteEmails[m.school_id]??""} onChange={e=>setInviteEmails(old=>({...old,[m.school_id]:e.target.value}))} placeholder="teacher@school.com"/></label><label>Role<select value={inviteRolesBySchool[m.school_id]??"teacher"} onChange={e=>setInviteRolesBySchool(old=>({...old,[m.school_id]:e.target.value}))}>{inviteRoles.map(role=><option key={role.value} value={role.value}>{role.label}</option>)}</select></label><button disabled={busySchool===m.school_id}>{busySchool===m.school_id?"Sending…":"Invite member"}</button></form>}
 </article>})}</div>
 {applications.length>0&&<div className="sv-app-panel"><h2>Your school applications</h2>{applications.map(a=><div className="sv-application-status" key={a.id}><span><b>{a.school_name}</b><small>{new Date(a.created_at).toLocaleDateString()}</small></span><span className="sv-record-status">{a.status.replace("_"," ")}</span></div>)}</div>}
 <div className="sv-record-shortcut"><div><b>Register a school</b><small>Submit a school onboarding application for RITEX platform review.</small></div><Link href="/schoolverse/apply">Start application →</Link></div><div className="sv-app-footnote"><ShieldCheck size={16}/> Your available workspaces come from verified database memberships.</div>
 </section><footer className="sv-app-footer">© 2026 RITEX · School management, simplified.</footer></main>;
}
