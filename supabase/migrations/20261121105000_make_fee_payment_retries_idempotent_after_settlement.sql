-- Forward migration: make_fee_payment_retries_idempotent_after_settlement (20261121105000).
-- Check the idempotency key before invoice status so a successful retry still returns
-- the original receipt even after the invoice transitions to paid.
CREATE OR REPLACE FUNCTION public.record_fee_payment(
  p_school_id uuid,
  p_invoice_id uuid,
  p_amount_minor bigint,
  p_payment_method text,
  p_idempotency_key text,
  p_received_by uuid,
  p_notes text DEFAULT NULL::text
)
RETURNS TABLE(payment_id uuid, receipt_number text, invoice_status public.invoice_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  invoice_row public.fee_invoices%rowtype;
  existing public.fee_payments%rowtype;
  new_payment_id uuid;
  new_receipt text;
  paid_total bigint;
  next_status public.invoice_status;
  normalized_notes text;
BEGIN
  IF p_amount_minor IS NULL OR p_amount_minor <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash','upi','bank_transfer','card','cheque','other') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;
  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) < 12 OR char_length(p_idempotency_key) > 120 THEN
    RAISE EXCEPTION 'Invalid idempotency key';
  END IF;

  normalized_notes := nullif(btrim(p_notes), '');

  SELECT * INTO invoice_row
  FROM public.fee_invoices
  WHERE id = p_invoice_id AND school_id = p_school_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- A retry with the same key must replay the original successful result,
  -- even if that payment has already moved the invoice to "paid".
  SELECT * INTO existing
  FROM public.fee_payments
  WHERE school_id = p_school_id AND idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF existing.invoice_id <> p_invoice_id
       OR existing.amount_minor <> p_amount_minor
       OR existing.payment_method <> p_payment_method
       OR coalesce(existing.notes, '') <> coalesce(normalized_notes, '') THEN
      RAISE EXCEPTION 'Idempotency key was already used for a different payment';
    END IF;
    RETURN QUERY
      SELECT existing.id, existing.receipt_number, invoice_row.status;
    RETURN;
  END IF;

  IF invoice_row.status NOT IN ('issued','part_paid') THEN
    RAISE EXCEPTION 'Only issued or partially paid invoices can receive payments';
  END IF;

  SELECT coalesce(sum(amount_minor), 0) INTO paid_total
  FROM public.fee_payments
  WHERE invoice_id = p_invoice_id
    AND school_id = p_school_id
    AND status = 'succeeded';

  IF p_amount_minor > invoice_row.total_minor - paid_total THEN
    RAISE EXCEPTION 'Payment exceeds the outstanding invoice balance';
  END IF;

  new_payment_id := pg_catalog.gen_random_uuid();
  new_receipt := 'RCPT-' || upper(substr(replace(new_payment_id::text, '-', ''), 1, 12));

  INSERT INTO public.fee_payments(
    id, school_id, invoice_id, amount_minor, currency_code, status, provider,
    provider_reference, idempotency_key, paid_at, receipt_number, payment_method,
    received_by, notes
  ) VALUES (
    new_payment_id, p_school_id, p_invoice_id, p_amount_minor, invoice_row.currency_code,
    'succeeded', 'manual', new_receipt, p_idempotency_key, pg_catalog.now(),
    new_receipt, p_payment_method, p_received_by, normalized_notes
  );

  paid_total := paid_total + p_amount_minor;
  next_status := CASE
    WHEN paid_total >= invoice_row.total_minor THEN 'paid'::public.invoice_status
    ELSE 'part_paid'::public.invoice_status
  END;

  UPDATE public.fee_invoices
  SET status = next_status
  WHERE id = p_invoice_id AND school_id = p_school_id;

  INSERT INTO public.audit_logs(school_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    p_school_id, p_received_by, 'fee_payment_recorded', 'fee_payment', new_payment_id,
    pg_catalog.jsonb_build_object(
      'invoice_id', p_invoice_id,
      'amount_minor', p_amount_minor,
      'currency_code', invoice_row.currency_code,
      'payment_method', p_payment_method,
      'receipt_number', new_receipt
    )
  );

  RETURN QUERY SELECT new_payment_id, new_receipt, next_status;
END;
$function$;
