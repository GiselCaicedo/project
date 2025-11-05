-- Descripción: Agrega las tablas invoice_comment (cliente) e invoice_observation (admin)

-- Tabla de comentarios de clientes en facturas
CREATE TABLE IF NOT EXISTS invoice_comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    user_id UUID NULL,
    content TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NULL,
    status BOOLEAN NULL DEFAULT TRUE,
    CONSTRAINT fk_invoice_comment_invoice FOREIGN KEY (invoice_id)
      REFERENCES invoice(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_invoice_comment_invoice_id ON invoice_comment(invoice_id);
COMMENT ON TABLE invoice_comment IS 'Comentarios de clientes en facturas';

-- Tabla de observaciones de administradores en facturas
CREATE TABLE IF NOT EXISTS invoice_observation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    user_id UUID NULL,
    content TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NULL,
    status BOOLEAN NULL DEFAULT TRUE,
    CONSTRAINT fk_invoice_observation_invoice FOREIGN KEY (invoice_id)
      REFERENCES invoice(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_invoice_observation_invoice_id ON invoice_observation(invoice_id);
COMMENT ON TABLE invoice_observation IS 'Observaciones de administradores en facturas';

