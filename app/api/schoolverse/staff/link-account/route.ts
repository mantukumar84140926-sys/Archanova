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
  if (!url || !publishableKey || !secretKey) return json({ error: "Secure staff invitations are not configured on the server." }, 503);
  if (!token) return json({ error: "Please sign in again." }, 401);

  const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  const actor = authData.user;
  if (authError || !actor || !actor.email_confirmed_at) return json({ error: "Your verified sign-in could not be confirmed." }, 401);

  const body = await request.json().catch(() => null) as { schoolId?: unknown; staffId?: unknown; email?: unknown; role?: unknown } | null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role === undefined ? "teacher" : body.role;
  const schoolId = typeof body?.schoolId === "string" ? body.schoolId : "";
  const staffId = typeof body?.staffId === "string" ? body.staffId : "";
  if (!body || !uuid.test(schoolId) || !uuid.test(staffId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof role !== "string" || !["teacher", "accountant", "principal"].includes(role)) {
    return json({ error: "Provide a valid staff record, email and role." }, 400);
  }

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: membership, error: membershipError } = await admin.from("school_memberships")
    .select("role,status").eq("school_id", schoolId).eq("user_id", actor.id)
    .in("role", ["school_admin", "principal"]).eq("status", "active").limit(1).maybeSingle();
  if (membershipError || !membership) return json({ error: "Only an active school administrator or principal can invite staff." }, 403);
  if (role === "principal" && membership.role !== "school_admin") {
    return json({ error: "Only a school administrator can assign the principal login role." }, 403);
  }

  const { data: staff, error: staffError } = await admin.from("staff")
    .select("id,school_id,auth_user_id,email,first_name,last_name,portal_role")
    .eq("id", staffId).eq("school_id", schoolId).maybeSingle();
  if (staffError || !staff) return json({ error: "Staff record not found in this school." }, 404);
  if (staff.portal_role !== role) return json({ error: "The selected login role must match the staff record portal role." }, 400);
  if (staff.email && staff.email.toLowerCase() !== email) return json({ error: "The invitation email must match the staff record email. Update the staff record first." }, 400);

  let user: { id: string } | null = null;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: "Could not verify the staff account. Try again later." }, 502);
    user = data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
    if (user || data.users.length < 1000) break;
  }

  if (staff.auth_user_id && (!user || staff.auth_user_id !== user.id)) {
    return json({ error: "This staff record is already linked to another login account." }, 409);
  }

  let invited = false;
  if (!user) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { display_name: [staff.first_name, staff.last_name].filter(Boolean).join(" ") },
    });
    if (error || !data.user) return json({ error: error?.message ?? "Could not send the staff invitation." }, 400);
    user = data.user;
    invited = true;
  }

  const { error: linkError } = await admin.rpc("link_staff_account", {
    p_school_id: schoolId,
    p_staff_id: staffId,
    p_user_id: user.id,
    p_email: email,
    p_role: role,
    p_actor_user_id: actor.id,
  });
  if (linkError) {
    const conflict = /already linked|non-active|must match|portal role/i.test(linkError.message);
    return json({ error: linkError.message }, conflict ? 409 : 400);
  }
  return json({ linked: true, invited, role, email }, 200);
}
