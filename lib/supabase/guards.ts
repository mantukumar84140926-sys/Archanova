import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AppRole = "student" | "teacher" | "admin";

export async function requireRoles(allowedRoles: AppRole[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .single();

  if (profileError || !profile || !allowedRoles.includes(profile.role as AppRole)) {
    redirect("/student");
  }
}
