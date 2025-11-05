-- Migración manual: Agregar tabla consecutive, campos a quote e invoice, y tabla invoice_attachment
-- Fecha: 2025-10-31

-- Crear tabla consecutive para control de consecutivos
CREATE TABLE IF NOT EXISTS "consecutive" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(10) NOT NULL,
  "number" INTEGER NOT NULL,
  "created" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updated" TIMESTAMPTZ(6),
  CONSTRAINT "consecutive_code_number_key" UNIQUE ("code", "number")
);

CREATE INDEX IF NOT EXISTS "consecutive_code_idx" ON "consecutive"("code");

-- Agregar campo consecutive a la tabla invoice
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "consecutive" VARCHAR(50);

-- Agregar campos de cálculo a la tabla quote
ALTER TABLE "quote" ADD COLUMN IF NOT EXISTS "consecutive" VARCHAR(50);
ALTER TABLE "quote" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12, 2);
ALTER TABLE "quote" ADD COLUMN IF NOT EXISTS "tax_one" DECIMAL(12, 2);
ALTER TABLE "quote" ADD COLUMN IF NOT EXISTS "tax_two" DECIMAL(12, 2);
ALTER TABLE "quote" ADD COLUMN IF NOT EXISTS "include_iva" BOOLEAN DEFAULT false;
ALTER TABLE "quote" ADD COLUMN IF NOT EXISTS "total" DECIMAL(12, 2);

-- Crear tabla invoice_attachment para anexos de facturas
CREATE TABLE IF NOT EXISTS "invoice_attachment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
  "name" VARCHAR(255),
  "url" VARCHAR,
  "type" VARCHAR(50),
  "created" TIMESTAMPTZ(6) DEFAULT NOW(),
  CONSTRAINT "invoice_attachment_invoice_id_fkey" FOREIGN KEY ("invoice_id")
    REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "invoice_attachment_invoice_id_idx" ON "invoice_attachment"("invoice_id");

-- Comentario: Los consecutivos se generarán dinámicamente desde el backend
-- Ejemplo de uso: FAC-201, COT-500, etc.
