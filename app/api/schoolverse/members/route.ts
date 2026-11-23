import { createClient } from "@supabase/supabase-js";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function getSchoolManager(request: Request, schoolId: string) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!token || !url || !publishableKey || !secretKey) {
    return { response: json({ error: "Sign in and configure the secure server connection." }, 401) };
  }
  const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await auth.auth.getUser(token);
  if (userError || !userData.user || !userData.user.email_confirmed_at) {
    return { response: json({ error: "A verified account is required." }, 401) };
  }
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: membership, error } = await admin.from("school_memberships")
    .select("id,role").eq("school_id", schoolId).eq("user_id", userData.user.id)
    .eq("status", "active").in("role", ["school_admin", "principal"]).maybeSingle();
  if (error || !membership) {
    return { response: json({ error: "Only an active School Admin or Principal can invite members to this school." }, 403) };
  }
  return { admin, user: userData.user, membership };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { schoolId?: unknown; email?: unknown; role?: unknown } | null;
  if (!body || typeof body.schoolId !== "string" || typeof body.email !== "string" || typeof body.role !== "string") {
    return json({ error: "School, email and role are required." }, 400);
  }
  const email = body.email.trim().toLowerCase();
  const role = body.role;
  const allowedRoles = ["principal", "teacher", "student", "parent", "accountant"];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email address." }, 400);
  if (!allowedRoles.includes(role)) return json({ error: "Choose a supported school role." }, 400);

  const context = await getSchoolManager(request, body.schoolId);
  if ("response" in context) return context.response;

  // Never silently grant a role to an existing account when an invitation cannot be sent.
  // Existing-account linking needs a separate, verified acceptance flow.
  const { data: invited, error: inviteError } = await context.admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: new URL("/schoolverse/login", request.url).toString(),
  });
  if (inviteError || !invited.user) {
    return json({
      error: "An invitation could not be sent. If this email already has a RITEX account, ask the account holder to contact the school administrator for a verified account-linking process.",
    }, 409);
  }
  const invitedUserId = invited.user.id;

  const { data: duplicate, error: duplicateError } = await context.admin.from("school_memberships")
    .select("id").eq("school_id", body.schoolId).eq("user_id", invitedUserId).maybeSingle();
  if (duplicateError) return json({ error: "Could not check the existing school membership." }, 500);
  if (duplicate) return json({ error: "This user already has a membership in this school." }, 409);

  const { error: insertError } = await context.admin.from("school_memberships")
    .insert({ school_id: body.schoolId, user_id: invitedUserId, role, status: "active" });
  if (insertError) return json({ error: insertError.message }, 400);

  await context.admin.from("audit_logs").insert({
    school_id: body.schoolId, actor_user_id: context.user.id,
    action: "school_member_invited", entity_type: "school_membership",
    metadata: { invited_email: email, role },
  });

  return json({ invited: true, email, role, message: "Invitation sent. Access is assigned to the invited account; the recipient must accept the email invitation before signing in." }, 201);
}
