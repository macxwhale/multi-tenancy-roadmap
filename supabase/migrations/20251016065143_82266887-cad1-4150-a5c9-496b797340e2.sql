-- Add product_id column to invoices table
ALTER TABLE invoices ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_invoices_product_id ON invoices(product_id);

-- Add comment for documentation
COMMENT ON COLUMN invoices.product_id IS 'Optional reference to product. Nullable to support custom invoices and preserve data when products are deleted.';