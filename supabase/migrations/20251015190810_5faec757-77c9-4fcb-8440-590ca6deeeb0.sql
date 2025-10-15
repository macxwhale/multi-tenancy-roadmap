-- Fix function search path security issue by dropping triggers first
DROP TRIGGER IF EXISTS trigger_update_client_status_on_transaction ON transactions;
DROP TRIGGER IF EXISTS trigger_update_client_status_on_invoice ON invoices;
DROP FUNCTION IF EXISTS update_client_status();

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION update_client_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate triggers
CREATE TRIGGER trigger_update_client_status_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_client_status();

CREATE TRIGGER trigger_update_client_status_on_invoice
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_client_status();