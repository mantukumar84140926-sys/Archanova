"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, GraduationCap, Users, Wallet, BookOpen, CalendarCheck, ShieldCheck, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Membership={school_id:string;role:string;status:string;schools:{name:string;slug:string;country_code:string;currency_code:string;default_locale:string;timezone:string}|null};
type Application={id:string;school_name:string;status:string;created_at:string};
const roleNames:Record<string,string>={school_admin:"School Admin",principal:"Principal",teacher:"Teacher",student:"Student",parent:"Parent",accountant:"Accountant"};
const roleIcons:Record<string,typeof Building2>={school_admin:Building2,principal:ShieldCheck,teacher:GraduationCap,student:BookOpen,parent:Users,accountant:Wallet};

export default function SchoolverseDashboardPage(){
 const router=useRouter();const [email,setEmail]=useState("");const [memberships,setMemberships]=useState<Membership[]>([]);const [applications,setApplications]=useState<Application[]>([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  try{const supabase=createClient();const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError||!user){router.replace("/schoolverse/login");return;}
   if(!active)return;setEmail(user.email??"");
   const {data,error:queryError}=await supabase.from("school_memberships").select("school_id,role,status,schools!inner(name,slug,country_code,currency_code,default_locale,timezone)").eq("user_id",user.id).eq("status","active");
   if(queryError)throw queryError;
   const {data:applicationRows,error:applicationError}=await supabase.from("school_applications").select("id,school_name,status,created_at").eq("applicant_user_id",user.id).order("created_at",{ascending:false}).limit(10);\n   if(applicationError)throw applicationError;\n   if(active){setMemberships((data??[]) as unknown as Membership[]);setApplications((applicationRows??[]) as Application[]);}
  }catch(e){if(active)setError(e instanceof Error?e.message:"Could not load your school memberships.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false};},[router]);
 async function signOut(){const supabase=createClient();await supabase.auth.signOut();router.replace("/schoolverse/login");router.refresh();}
 return <main className="sv-app-shell"><header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">SCHOOL<span>VERSE</span></Link><div className="sv-app-user"><span>{email}</span><button onClick={signOut}><LogOut size={15}/> Sign out</button></div></header>
 <section className="sv-app-content"><div className="sv-kicker"><span/> YOUR WORKSPACE</div><h1>Welcome to SCHOOLVERSE.</h1><p className="sv-auth-intro">Choose an active school workspace to continue.</p>
 {loading&&<div className="sv-app-panel">Loading your secure school memberships…</div>}
 {error&&<div className="sv-auth-error" role="alert">{error}</div>}
 {!loading&&!error&&memberships.length===0&&<div className="sv-app-panel"><div className="sv-empty-icon"><Building2 size={25}/></div><h2>No school connected yet</h2><p>Your account is active, but it has not been assigned to a school. For security, users cannot choose their own school or role. Ask your SCHOOLVERSE platform administrator to create or invite your school membership.</p><div className="sv-record-actions"><Link href="/schoolverse/apply" className="sv-record-primary">Apply to onboard your school →</Link><Link href="/schoolverse" className="sv-secondary">Return to platform overview</Link></div></div>}
 <div className="sv-workspace-grid">{memberships.map((m)=>{const school=Array.isArray(m.schools)?m.schools[0]:m.schools;const Icon=roleIcons[m.role]??Building2;if(!school)return null;return <article className="sv-workspace-card" key={m.school_id+ m.role}><div className="sv-icon-tile"><Icon size={22}/></div><small>{roleNames[m.role]??m.role}</small><h2>{school.name}</h2><p>{school.country_code} · {school.currency_code} · {school.timezone}</p><Link href={`/schoolverse/school/${encodeURIComponent(school.slug)}/${m.role}`}>Open workspace →</Link></article>})}</div>
 {applications.length>0&&<div className="sv-app-panel"><h2>Your school applications</h2>{applications.map(a=><div className="sv-application-status" key={a.id}><span><b>{a.school_name}</b><small>{new Date(a.created_at).toLocaleDateString()}</small></span><span className="sv-record-status">{a.status.replace("_"," ")}</span></div>)}</div>}<div className="sv-record-shortcut"><div><b>Register a school</b><small>Submit a school onboarding application for RITEX platform review.</small></div><Link href="/schoolverse/apply">Start application →</Link></div><div className="sv-app-footnote"><ShieldCheck size={16}/> Your available workspaces come from verified database memberships.</div>
 </section><footer className="sv-app-footer">© 2026 SCHOOLVERSE · A RITEX product</footer></main>;
}
