"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SchoolverseSignupPage() {
  const router = useRouter();
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      const supabase=createClient();
      const {data,error:authError}=await supabase.auth.signUp({
        email:email.trim(),password,
        options:{data:{display_name:name.trim()},emailRedirectTo:`${window.location.origin}/schoolverse/login?verified=1`}
      });
      if(authError)throw authError;
      if(data.session){router.replace("/schoolverse/dashboard");router.refresh();}
      else setMessage("Account created. Check your email for the verification link. After verification, sign in. Your school administrator must assign your school role before school data becomes available.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to create your account. Please try again.");}
    finally{setBusy(false);}
  }
  return <main className="sv-auth-page"><section className="sv-auth-card">
    <Link href="/schoolverse" className="sv-auth-brand">RITEX<small>A RITEX product</small></Link>
    <div className="sv-kicker"><span /> CREATE YOUR ACCOUNT</div><h1>Get started.</h1>
    <p className="sv-auth-intro">Create your secure sign-in. Your school administrator will connect your account to the correct school and role.</p>
    {message&&<div className="sv-auth-notice">{message}</div>}{error&&<div className="sv-auth-error" role="alert">{error}</div>}
    <form onSubmit={submit} className="sv-auth-form">
      <label>Full name<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" /></label>
      <label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@school.com" /></label>
      <label>Password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
      <button disabled={busy}>{busy?"Creating account…":"Create account"}</button>
    </form>
    <p className="sv-auth-switch">Already registered? <Link href="/schoolverse/login">Sign in</Link></p>
    <Link href="/schoolverse" className="sv-auth-back">← Back to RITEX</Link>
  </section></main>;
}
