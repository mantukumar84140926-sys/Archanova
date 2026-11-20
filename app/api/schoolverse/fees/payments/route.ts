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
  if (!url || !publishableKey || !secretKey) {
    return json({ error: "Secure payment recording is not configured on the server." }, 503);
  }
  if (!token) return json({ error: "Please sign in again." }, 401);

  const authClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData.user;
  if (authError || !user || !user.email_confirmed_at) {
    return json({ error: "Your verified sign-in could not be confirmed." }, 401);
  }

  const body = await request.json().catch(() => null) as {
    schoolId?: string; invoiceId?: string; amountMinor?: number;
    paymentMethod?: string; idempotencyKey?: string; notes?: string;
  } | null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;\n  const schoolId = body?.schoolId ?? "";\n  const invoiceId = body?.invoiceId ?? "";
  if (!body || !uuid.test(schoolId) || !uuid.test(invoiceId)) {
    return json({ error: "A valid school and invoice are required." }, 400);
  }
  if (!Number.isSafeInteger(body.amountMinor) || (body.amountMinor ?? 0) <= 0) {
    return json({ error: "Enter a valid payment amount." }, 400);
  }
  const methods = ["cash", "upi", "bank_transfer", "card", "cheque", "other"];
  if (!methods.includes(body.paymentMethod ?? "")) {
    return json({ error: "Choose a valid payment method." }, 400);
  }
  if (!/^[A-Za-z0-9_-]{12,120}$/.test(body.idempotencyKey ?? "")) {
    return json({ error: "Invalid payment request reference. Please retry." }, 400);
  }
  if ((body.notes ?? "").length > 500) return json({ error: "Notes must be 500 characters or fewer." }, 400);

  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: membership, error: membershipError } = await admin
    .from("school_memberships").select("role,status")
    .eq("school_id", schoolId).eq("user_id", user.id).eq("status", "active")
    .in("role", ["school_admin", "accountant"]).maybeSingle();
  if (membershipError || !membership) {
    return json({ error: "Only an active school administrator or accountant can record payments." }, 403);
  }

  const { data: result, error: paymentError } = await admin.rpc("record_fee_payment", {
    p_school_id: schoolId,
    p_invoice_id: invoiceId,
    p_amount_minor: body.amountMinor,
    p_payment_method: body.paymentMethod,
    p_idempotency_key: body.idempotencyKey,
    p_received_by: user.id,
    p_notes: body.notes?.trim() || null,
  });
  if (paymentError) {
    const conflict = /outstanding|already used|Only issued/i.test(paymentError.message);
    return json({ error: paymentError.message }, conflict ? 409 : 400);
  }
  return json({ payment: result?.[0] ?? null }, 201);
}
