import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function context(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !secret) return { error: json({ error: "Secure guardian invitations are not configured on the server." }, 503) };
  if (!token) return { error: json({ error: "Please sign in again." }, 401) };

  const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(token);
  const actor = data.user;
  if (error || !actor || !actor.email_confirmed_at) return { error: json({ error: "Your verified sign-in could not be confirmed." }, 401) };
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return { actor, admin };
}

async function isSchoolLeader(admin: SupabaseClient, schoolId: string, userId: string) {
  const { data, error } = await admin.from("school_memberships").select("role,status")
    .eq("school_id", schoolId).eq("user_id", userId)
    .in("role", ["school_admin", "principal"]).eq("status", "active").limit(1).maybeSingle();
  return !error && data?.status === "active" && ["school_admin", "principal"].includes(data.role);
}

async function findUser(admin: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
}

export async function POST(request: Request) {
  const ctx = await context(request);
  if ("error" in ctx) return ctx.error;
  const body = await request.json().catch(() => null) as {
    schoolId?: string; studentId?: string; email?: string; relationship?: string; isPrimary?: boolean;
  } | null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const email = (body?.email ?? "").trim().toLowerCase();
  const relationship = (body?.relationship ?? "").trim();
  const schoolId = body?.schoolId ?? "";
  const studentId = body?.studentId ?? "";
  if (!body || !uuid.test(schoolId) || !uuid.test(studentId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || relationship.length < 2 || relationship.length > 60) {
    return json({ error: "Provide a valid student, guardian email and relationship." }, 400);
  }
  if (!await isSchoolLeader(ctx.admin, schoolId, ctx.actor.id)) {
    return json({ error: "Only a school administrator or principal can link guardians." }, 403);
  }
  const { data: student, error: studentError } = await ctx.admin.from("students")
    .select("id,school_id").eq("id", studentId).eq("school_id", schoolId).maybeSingle();
  if (studentError || !student) return json({ error: "Student record not found." }, 404);

  try {
    let user = await findUser(ctx.admin, email);
    let invited = false;
    if (!user) {
      const { data, error } = await ctx.admin.auth.admin.inviteUserByEmail(email);
      if (error || !data.user) return json({ error: error?.message ?? "Could not send guardian invitation." }, 400);
      user = data.user;
      invited = true;
    }

    const { data: guardianLinkId, error: linkError } = await ctx.admin.rpc("link_student_guardian", {
      p_school_id: schoolId,
      p_student_id: studentId,
      p_guardian_user_id: user.id,
      p_guardian_email: email,
      p_relationship: relationship,
      p_is_primary: body.isPrimary === true,
      p_actor_user_id: ctx.actor.id,
    });
    if (linkError) {
      const conflict = linkError.code === "23505" || /non-active/i.test(linkError.message);
      return json({ error: linkError.message }, conflict ? 409 : 400);
    }
    return json({ guardianLinkId, invited, verified: false }, 201);
  } catch {
    return json({ error: "Guardian account lookup failed. Please retry." }, 502);
  }
}

export async function PATCH(request: Request) {
  const ctx = await context(request);
  if ("error" in ctx) return ctx.error;
  const body = await request.json().catch(() => null) as { schoolId?: string; guardianLinkId?: string } | null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const schoolId = body?.schoolId ?? "";
  const guardianLinkId = body?.guardianLinkId ?? "";
  if (!body || !uuid.test(schoolId) || !uuid.test(guardianLinkId)) return json({ error: "A valid school and guardian link are required." }, 400);
  if (!await isSchoolLeader(ctx.admin, schoolId, ctx.actor.id)) return json({ error: "Only a school administrator or principal can verify guardians." }, 403);

  const { data, error } = await ctx.admin.from("student_guardians")
    .update({ verified_at: new Date().toISOString(), verified_by: ctx.actor.id })
    .eq("id", guardianLinkId).eq("school_id", schoolId).is("verified_at", null).select("id").maybeSingle();
  if (error) return json({ error: "Could not verify guardian relationship." }, 400);
  if (!data) return json({ error: "Guardian link was not found or is already verified." }, 404);
  const { error: auditError } = await ctx.admin.from("audit_logs").insert({
    school_id: schoolId, actor_user_id: ctx.actor.id, action: "guardian_relationship_verified",
    entity_type: "student_guardian", entity_id: guardianLinkId,
  });
  if (auditError) return json({ error: "Guardian was verified, but the audit event could not be recorded. Contact support." }, 500);
  return json({ verified: true });
}
