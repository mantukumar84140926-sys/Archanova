"use client";
import {FormEvent,useState} from "react";
import Link from "next/link";
import {ArrowLeft,Mail} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
export default function ForgotPasswordPage(){
 const [email,setEmail]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [sent,setSent]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");setSent(false);try{const s=createClient();const {error}=await s.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/schoolverse/reset-password"});if(error)throw error;setSent(true)}catch(e){setError(e instanceof Error?e.message:"Could not send password reset email.")}finally{setBusy(false)}}
 return <main className="sv-auth-page"><section className="sv-auth-card"><Link href="/schoolverse" className="sv-auth-brand">RITEX<small>A RITEX product</small></Link><div className="sv-kicker"><span/> ACCOUNT RECOVERY</div><h1>Reset your password.</h1><p className="sv-auth-intro">Enter the email address linked to your RITEX account. We’ll send a secure reset link.</p>{error&&<div className="sv-auth-error" role="alert">{error}</div>}{sent&&<div className="sv-auth-success" role="status">If an account exists for that address, a password reset email has been sent. Check your inbox.</div>}<form onSubmit={submit} className="sv-auth-form"><label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@school.com"/></label><button disabled={busy}><Mail size={15}/>{busy?"Sending…":"Send reset link"}</button></form><Link href="/schoolverse/login" className="sv-auth-back"><ArrowLeft size={14}/> Back to sign in</Link></section></main>;
}
