import { createClient } from "@supabase/supabase-js";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function getPlatformAdmin(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const allowedEmails = (process.env.RITEX_PLATFORM_ADMIN_EMAILS ?? "")
    .split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);

  if (!url || !publishableKey || !secretKey || allowedEmails.length === 0) {
    return { response: json({ error: "Platform provisioning is not configured on the server yet." }, 503) };
  }
  if (!token) return { response: json({ error: "Sign in with an authorised RITEX platform account." }, 401) };

  const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !data.user || !email || !data.user.email_confirmed_at) {
    return { response: json({ error: "Your verified sign-in could not be confirmed." }, 401) };
  }
  if (!allowedEmails.includes(email)) {
    return { response: json({ error: "This account is not authorised for RITEX platform administration." }, 403) };
  }
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return { admin, userId: data.user.id };
}

export async function GET(request: Request) {
  const context = await getPlatformAdmin(request);
  if ("response" in context) return context.response;
  const { data, error } = await context.admin.from("school_applications")
    .select("id,school_name,contact_name,contact_email,contact_phone,country_code,city,expected_students,status,created_at")
    .in("status", ["pending", "under_review"]).order("created_at", { ascending: true }).limit(100);
  if (error) return json({ error: "Could not load pending school applications." }, 500);
  return json({ applications: data ?? [] });
}

export async function POST(request: Request) {
  const context = await getPlatformAdmin(request);
  if ("response" in context) return context.response;
  const body = await request.json().catch(() => null) as {
    applicationId?: unknown; slug?: unknown; currencyCode?: unknown; defaultLocale?: unknown; timezone?: unknown;
  } | null;
  if (!body || typeof body.applicationId !== "string" || typeof body.slug !== "string" ||
      typeof body.currencyCode !== "string" ||
      (body.defaultLocale !== undefined && typeof body.defaultLocale !== "string") ||
      (body.timezone !== undefined && typeof body.timezone !== "string")) {
    return json({ error: "Provide valid school provisioning details." }, 400);
  }
  const applicationId = body.applicationId;
  const slug = body.slug.trim().toLowerCase();
  const currencyCode = body.currencyCode.trim().toUpperCase();
  const defaultLocale = (body.defaultLocale ?? "en").trim();
  const timezone = (body.timezone ?? "UTC").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)) return json({ error: "A valid application ID is required." }, 400);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return json({ error: "Use a lowercase school slug with letters, numbers and hyphens." }, 400);
  if (!/^[A-Z]{3}$/.test(currencyCode)) return json({ error: "Enter a valid three-letter ISO currency code." }, 400);
  if (defaultLocale.length < 2 || defaultLocale.length > 35 || timezone.length < 1 || timezone.length > 80) return json({ error: "Locale or timezone is invalid." }, 400);

  const { data, error } = await context.admin.rpc("provision_school_from_application", {
    p_application_id: applicationId,
    p_slug: slug,
    p_currency_code: currencyCode,
    p_default_locale: defaultLocale,
    p_timezone: timezone,
    p_actor_user_id: context.userId,
  });
  if (error) {
    const conflict = error.code === "23505";
    return json({ error: conflict ? "That school slug is already in use. Choose another slug." : error.message }, conflict ? 409 : 400);
  }
  return json({ schoolId: data }, 201);
}

export async function PATCH(request: Request) {
  const context = await getPlatformAdmin(request);
  if ("response" in context) return context.response;
  const body = await request.json().catch(() => null) as { applicationId?: string; status?: string } | null;
  const applicationId = body?.applicationId ?? "";
  const status = body?.status ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)) return json({ error: "A valid application ID is required." }, 400);
  if (!["under_review", "rejected"].includes(status)) return json({ error: "Choose a supported application review status." }, 400);

  const { error } = await context.admin.rpc("review_school_application", {
    p_application_id: applicationId,
    p_status: status,
    p_actor_user_id: context.userId,
  });
  if (error) {
    const notFound = /not found/i.test(error.message);
    return json({ error: error.message }, notFound ? 404 : 400);
  }
  return json({ applicationId, status });
}
