"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SchoolverseLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { if (new URLSearchParams(window.location.search).get("verified")) setNotice("Email verified. You can now sign in."); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      router.replace("/schoolverse/dashboard"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="sv-auth-page"><section className="sv-auth-card">
    <Link href="/schoolverse" className="sv-auth-brand">SCHOOL<span>VERSE</span><small>A RITEX product</small></Link>
    <div className="sv-kicker"><span /> SECURE SCHOOL WORKSPACE</div>
    <h1>Welcome back.</h1><p className="sv-auth-intro">Sign in with the email address linked to your school account.</p>
    {notice && <div className="sv-auth-notice">{notice}</div>}
    {error && <div className="sv-auth-error" role="alert">{error}</div>}
    <form onSubmit={submit} className="sv-auth-form">
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@school.com" /></label>
      <label>Password<input type="password" autoComplete="current-password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" /></label><div className="sv-auth-switch"><Link href="/schoolverse/forgot-password">Forgot password?</Link></div>
      <button disabled={busy}>{busy ? "Signing in…" : "Sign in to SCHOOLVERSE"}</button>
    </form>
    <p className="sv-auth-switch">New to SCHOOLVERSE? <Link href="/schoolverse/signup">Create an account</Link></p>
    <Link href="/schoolverse" className="sv-auth-back">← Back to SCHOOLVERSE</Link>
  </section></main>;
}
