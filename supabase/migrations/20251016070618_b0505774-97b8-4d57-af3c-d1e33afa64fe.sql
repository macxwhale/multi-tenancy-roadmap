-- Add 'partial' status to invoices
-- This allows tracking of partially paid invoices

-- First, update any existing constraint or check that might restrict status values
-- Note: If using an enum type, we'd need to add the value to it
-- For text columns with check constraints, we need to update the constraint

-- Check if there's an existing constraint and drop it if needed
DO $$ 
BEGIN
  -- Try to drop the constraint if it exists
  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Add the new check constraint that includes 'partial'
ALTER TABLE invoices 
  ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('pending', 'paid', 'overdue', 'partial'));

-- Add a comment to document the status values
COMMENT ON COLUMN invoices.status IS 'Invoice payment status: pending (not paid), partial (partially paid), paid (fully paid), overdue (past due date)';

-- Create an index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);