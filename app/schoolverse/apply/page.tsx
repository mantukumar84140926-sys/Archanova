"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SchoolApplicationPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("IN");
  const [city, setCity] = useState("");
  const [students, setStudents] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/schoolverse/login"); return; }
      if (!live) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      setLoading(false);
    })();
    return () => { live = false; };
  }, [router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("school_applications").insert({
        applicant_user_id: userId,
        school_name: schoolName.trim(),
        contact_name: contactName.trim(),
        contact_email: email,
        contact_phone: phone.trim() || null,
        country_code: country,
        city: city.trim(),
        expected_students: students ? Number(students) : null,
        status: "pending",
      });
      if (insertError) throw insertError;
      setMessage("Your school application has been submitted. The RITEX platform team must review it before a school workspace can be created.");
      setSchoolName(""); setContactName(""); setPhone(""); setCity(""); setStudents("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your application.");
    } finally { setSaving(false); }
  }

  return <main className="sv-app-shell">
    <header className="sv-app-header"><Link href="/schoolverse" className="sv-auth-brand">RITEX</Link><Link href="/schoolverse/dashboard" className="sv-app-back"><ArrowLeft size={15}/> Dashboard</Link></header>
    <section className="sv-app-content sv-form-page">
      <div className="sv-kicker"><span/> SCHOOL ONBOARDING</div>
      <div className="sv-icon-tile"><Building2 size={24}/></div>
      <h1>Bring your school to RITEX.</h1>
      <p className="sv-auth-intro">Submit your school details. The platform team will review the request and securely provision the school workspace.</p>
      {loading ? <div className="sv-app-panel">Checking your account…</div> : <form className="sv-record-form sv-application-form" onSubmit={submit}>
        <label>School name<input required minLength={2} maxLength={180} value={schoolName} onChange={e=>setSchoolName(e.target.value)} placeholder="e.g. Sunrise International School"/></label>
        <label>Applicant / contact name<input required minLength={2} maxLength={120} value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Your full name"/></label>
        <label>Contact email<input value={email} readOnly aria-readonly="true"/></label>
        <label>Phone number<input type="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Optional"/></label>
        <div className="sv-application-row"><label>Country code<input required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" value={country} onChange={e=>setCountry(e.target.value.toUpperCase())}/></label><label>City<input required minLength={2} maxLength={100} value={city} onChange={e=>setCity(e.target.value)} placeholder="City"/></label></div>
        <label>Expected student count<input type="number" min="1" max="100000" value={students} onChange={e=>setStudents(e.target.value)} placeholder="Optional"/></label>
        {error&&<div className="sv-auth-error" role="alert">{error}</div>}
        {message&&<div className="sv-auth-success" role="status">{message}</div>}
        <button disabled={saving}><Send size={16}/>{saving?"Submitting…":"Submit school application"}</button>
        <p className="sv-form-note">Submitting an application does not automatically create a school or grant administrator access.</p>
      </form>}
    </section>
    <footer className="sv-app-footer">© 2026 RITEX · A RITEX product</footer>
  </main>;
}
