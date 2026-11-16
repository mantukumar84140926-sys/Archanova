"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = { mode: "login" | "register" };

const pageStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "28px 18px",
  background: "linear-gradient(135deg, #f7f5ff 0%, #fff 55%, #fff6ef 100%)",
  fontFamily: "Arial, sans-serif",
  color: "#17172b",
} as const;

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #e5e2ef",
  borderRadius: "10px",
  fontSize: "15px",
  outlineColor: "#7256e8",
  boxSizing: "border-box" as const,
};

export default function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const safeNext = requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : null;

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/student`,
          },
        });
        if (error) throw error;

        if (data.session) {
          router.push(safeNext || "/student");
          router.refresh();
        } else {
          setMessage("Account request received. Please check your email to confirm your account, then sign in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const rolePath = profile?.role === "admin"
          ? "/admin"
          : profile?.role === "teacher"
            ? "/teacher"
            : "/student";

        router.push(safeNext || rolePath);
        router.refresh();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <section style={{ width: "100%", maxWidth: 440, background: "#fff", border: "1px solid #eeebf6", borderRadius: 22, padding: 30, boxShadow: "0 22px 70px rgba(40,30,90,.09)" }}>
        <Link href="/" style={{ color: "#7256e8", fontWeight: 800, letterSpacing: ".3px", textDecoration: "none" }}>AJEDUVERSE</Link>
        <p style={{ color: "#8b879e", fontSize: 11, fontWeight: 700, letterSpacing: 1.3, margin: "22px 0 8px" }}>LEARN · GROW · SUCCEED</p>
        <h1 style={{ fontSize: 30, margin: "0 0 8px", letterSpacing: -1 }}>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p style={{ color: "#77758a", lineHeight: 1.6, margin: "0 0 24px" }}>
          {isRegister ? "Join a free learning space for school, college and competitive exams." : "Sign in to continue your learning journey."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          {isRegister && (
            <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>
              Your name
              <input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Enter your name" autoComplete="name" style={inputStyle} />
            </label>
          )}
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>
            Email address
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>
            Password
            <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={isRegister ? "new-password" : "current-password"} style={inputStyle} />
          </label>
          {errorMessage && <p role="alert" style={{ color: "#b42318", background: "#fff1f0", padding: 11, borderRadius: 9, fontSize: 13 }}>{errorMessage}</p>}
          {message && <p role="status" style={{ color: "#176b42", background: "#edfff5", padding: 11, borderRadius: 9, fontSize: 13 }}>{message}</p>}
          <button disabled={loading} type="submit" style={{ marginTop: 5, padding: 14, border: 0, borderRadius: 10, background: loading ? "#a99be8" : "#7256e8", color: "#fff", fontWeight: 800, fontSize: 14, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Please wait..." : isRegister ? "Create free account" : "Sign in"}
          </button>
        </form>

        <p style={{ color: "#77758a", fontSize: 13, textAlign: "center", margin: "22px 0 0" }}>
          {isRegister ? "Already have an account? " : "New to AJEDUVERSE? "}
          <Link href={isRegister ? "/login" : "/register"} style={{ color: "#7256e8", fontWeight: 800 }}>
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>
        <p style={{ color: "#a09caf", fontSize: 11, lineHeight: 1.5, textAlign: "center", margin: "18px 0 0" }}>
          Every new account starts with Student access. Teacher access requires Admin approval.
        </p>
      </section>
    </main>
  );
}
