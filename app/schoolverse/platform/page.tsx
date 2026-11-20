"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Application = {
  id: string;
  school_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  country_code: string;
  city: string;
  expected_students: number | null;
  status: string;
  created_at: string;
};
type Config = { slug: string; currencyCode: string; defaultLocale: string; timezone: string };
const currencyByCountry: Record<string,string> = { IN:"INR", US:"USD", GB:"GBP", AE:"AED", CA:"CAD", AU:"AUD", SG:"SGD", JP:"JPY", DE:"EUR", FR:"EUR" };
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);

export default function PlatformProvisioningPage() {
  const router = useRouter();
  const [token,setToken] = useState("");
  const [applications,setApplications] = useState<Application[]>([]);
  const [configs,setConfigs] = useState<Record<string,Config>>({});
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState("");
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");

  const load = useCallback(async (accessToken: string) => {
    setError("");
    const response = await fetch("/api/schoolverse/provision", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Could not load platform applications.");
    const rows = (result.applications ?? []) as Application[];
    setApplications(rows);
    setConfigs((current) => {
      const next = { ...current };
      for (const app of rows) {
        if (!next[app.id]) next[app.id] = {
          slug: slugify(app.school_name),
          currencyCode: currencyByCountry[app.country_code] ?? "USD",
          defaultLocale: app.country_code === "IN" ? "en-IN" : "en",
          timezone: app.country_code === "IN" ? "Asia/Kolkata" : "UTC",
        };
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace("/schoolverse/login"); return; }
        if (!live) return;
        setToken(session.access_token);
        await load(session.access_token);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "Platform administration is unavailable.");
      } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [load,router]);

  function updateConfig(id:string,field:keyof Config,value:string) {
    setConfigs((old) => ({ ...old, [id]: { ...old[id], [field]: value } }));
  }

  async function provision(app:Application) {
    const config=configs[app.id];
    if (!config || !token) return;
    setBusy(app.id);setError("");setMessage("");
    try {
      const response=await fetch("/api/schoolverse/provision",{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({applicationId:app.id,...config}),
      });
      const result=await response.json();
      if(!response.ok) throw new Error(result.error??"School provisioning failed.");
      setMessage(`${app.school_name} has been provisioned. The applicant has been assigned School Admin access.`);
      await load(token);
    } catch(e) { setError(e instanceof Error?e.message:"Could not provision school."); }
    finally { setBusy(""); }
  }

  return <main className="sv-app-shell">
    <header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">SCHOOL<span>VERSE</span></Link><Link href="/schoolverse/dashboard" className="sv-app-back"><ArrowLeft size={15}/> Dashboard</Link></header>
    <section className="sv-app-content">
      <div className="sv-kicker"><span/> RITEX PLATFORM CONTROL</div>
      <div className="sv-icon-tile"><ShieldCheck size={24}/></div>
      <h1>School onboarding review</h1>
      <p className="sv-auth-intro">Review submitted school applications and provision a separate school workspace. This page and its API require a verified email on the private RITEX platform-admin allowlist.</p>
      {error&&<div className="sv-auth-error" role="alert">{error}</div>}
      {message&&<div className="sv-auth-success" role="status"><CheckCircle2 size={16}/> {message}</div>}
      {loading?<div className="sv-app-panel">Verifying platform access…</div>:applications.length===0?<div className="sv-app-panel"><Building2 size={22}/><h2>No pending applications</h2><p>New school applications will appear here after submission.</p></div>:<div className="sv-platform-applications">
        {applications.map(app=>{const config=configs[app.id]??{slug:"",currencyCode:"USD",defaultLocale:"en",timezone:"UTC"};return <article className="sv-app-panel sv-platform-application" key={app.id}>
          <div className="sv-notice-meta">{app.status} · {new Date(app.created_at).toLocaleDateString()}</div>
          <h2>{app.school_name}</h2>
          <p>{app.contact_name} · {app.contact_email}{app.contact_phone? ` · ${app.contact_phone}`:""}</p>
          <p>{app.city}, {app.country_code} · {app.expected_students??"Student count not provided"} expected students</p>
          <div className="sv-platform-config">
            <label>School URL slug<input value={config.slug} onChange={e=>updateConfig(app.id,"slug",e.target.value.toLowerCase())}/></label>
            <label>Currency code<input maxLength={3} value={config.currencyCode} onChange={e=>updateConfig(app.id,"currencyCode",e.target.value.toUpperCase())}/></label>
            <label>Default locale<input value={config.defaultLocale} onChange={e=>updateConfig(app.id,"defaultLocale",e.target.value)}/></label>
            <label>Timezone<input value={config.timezone} onChange={e=>updateConfig(app.id,"timezone",e.target.value)}/></label>
          </div>
          <button className="sv-record-primary" disabled={busy===app.id||!config.slug||config.currencyCode.length!==3} onClick={()=>provision(app)}>{busy===app.id?"Provisioning…":"Approve & create school"}</button>
          <small className="sv-form-note">This creates the school and its first School Admin membership in one database transaction.</small>
        </article>})}
      </div>}
    </section>
    <footer className="sv-app-footer">© 2026 SCHOOLVERSE · A RITEX product</footer>
  </main>;
}
