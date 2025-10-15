-- Add SECURITY DEFINER and search_path to update_client_status trigger function
CREATE OR REPLACE FUNCTION public.update_client_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_total_invoiced NUMERIC;
  v_total_paid NUMERIC;
  v_balance NUMERIC;
  v_new_status TEXT;
BEGIN
  -- Calculate total invoiced
  SELECT COALESCE(SUM(amount), 0) INTO v_total_invoiced
  FROM invoices
  WHERE client_id = NEW.client_id;

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM transactions
  WHERE client_id = NEW.client_id AND type = 'payment';

  -- Calculate balance
  v_balance := v_total_invoiced - v_total_paid;

  -- Determine status
  IF v_balance = 0 THEN
    v_new_status := 'closed';
  ELSE
    v_new_status := 'open';
  END IF;

  -- Update client status
  UPDATE clients
  SET status = v_new_status
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$function$;