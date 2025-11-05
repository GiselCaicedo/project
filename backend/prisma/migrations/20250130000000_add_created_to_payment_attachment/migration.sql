-- Add created column to payment_attachment if it doesn't exist
ALTER TABLE "payment_attachment"
  ADD COLUMN IF NOT EXISTS "created" TIMESTAMP(6) DEFAULT NOW();
