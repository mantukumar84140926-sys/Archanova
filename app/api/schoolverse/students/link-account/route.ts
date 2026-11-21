import { createClient } from "@supabase/supabase-js";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey) return json({ error: "Secure student invitations are not configured on the server." }, 503);
  if (!token) return json({ error: "Please sign in again." }, 401);

  const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  const actor = authData.user;
  if (authError || !actor || !actor.email_confirmed_at) return json({ error: "Your verified sign-in could not be confirmed." }, 401);

  const body = await request.json().catch(() => null) as { schoolId?: unknown; studentId?: unknown; email?: unknown } | null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  if (!body || !uuid.test(schoolId) || !uuid.test(studentId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: "Provide a valid student and email address." }, 400);
  }

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: membership, error: membershipError } = await admin.from("school_memberships")
    .select("role,status").eq("school_id", schoolId).eq("user_id", actor.id)
    .in("role", ["school_admin", "principal"]).eq("status", "active").limit(1).maybeSingle();
  if (membershipError || !membership) return json({ error: "Only an active school administrator or principal can invite student accounts." }, 403);

  const { data: student, error: studentError } = await admin.from("students")
    .select("id,school_id,auth_user_id,email").eq("id", studentId).eq("school_id", schoolId).maybeSingle();
  if (studentError || !student) return json({ error: "Student record not found." }, 404);
  if (student.email && student.email.toLowerCase() !== email) return json({ error: "The invitation email must match the student record email. Update the student record first." }, 400);

  let user: { id: string } | null = null;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: "Could not verify the student account." }, 502);
    user = data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
    if (user || data.users.length < 1000) break;
  }

  if (student.auth_user_id && (!user || student.auth_user_id !== user.id)) {
    return json({ error: "This student record is already linked to another login account." }, 409);
  }

  let invited = false;
  if (!user) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
    if (error || !data.user) return json({ error: error?.message ?? "Could not send student invitation." }, 400);
    user = data.user;
    invited = true;
  }

  const { error: linkError } = await admin.rpc("link_student_account", {
    p_school_id: schoolId,
    p_student_id: studentId,
    p_user_id: user.id,
    p_email: email,
    p_actor_user_id: actor.id,
  });
  if (linkError) {
    const conflict = /already linked|non-active|must match/i.test(linkError.message);
    return json({ error: linkError.message }, conflict ? 409 : 400);
  }
  return json({ linked: true, invited, role: "student", email }, 200);
}
