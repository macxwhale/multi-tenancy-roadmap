-- Function to calculate and update client status based on balance
CREATE OR REPLACE FUNCTION update_client_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger on transactions table to update client status
DROP TRIGGER IF EXISTS trigger_update_client_status_on_transaction ON transactions;
CREATE TRIGGER trigger_update_client_status_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_client_status();

-- Trigger on invoices table to update client status
DROP TRIGGER IF EXISTS trigger_update_client_status_on_invoice ON invoices;
CREATE TRIGGER trigger_update_client_status_on_invoice
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_client_status();

-- Update existing clients to have correct status based on current balance
UPDATE clients c
SET status = CASE 
  WHEN (
    COALESCE((SELECT SUM(amount) FROM invoices WHERE client_id = c.id), 0) -
    COALESCE((SELECT SUM(amount) FROM transactions WHERE client_id = c.id AND type = 'payment'), 0)
  ) = 0 THEN 'closed'
  ELSE 'open'
END;