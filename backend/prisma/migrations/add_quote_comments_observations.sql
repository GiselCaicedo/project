-- ================================================
-- MIGRACIÓN: Agregar comentarios y observaciones a cotizaciones
-- Fecha: 2025-10-29
-- Descripción: Agrega las tablas quote_comment (cliente) y quote_observation (admin)
-- ================================================

-- Crear tabla de comentarios (cliente)
CREATE TABLE IF NOT EXISTS quote_comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL,
    user_id UUID,
    content TEXT NOT NULL,
    created TIMESTAMPTZ(6) DEFAULT NOW(),
    updated TIMESTAMPTZ(6),
    status BOOLEAN DEFAULT true,
    CONSTRAINT fk_quote_comment_quote FOREIGN KEY (quote_id)
        REFERENCES quote(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Crear índice para optimizar búsquedas por quote_id
CREATE INDEX IF NOT EXISTS idx_quote_comment_quote_id ON quote_comment(quote_id);

-- Crear tabla de observaciones (admin)
CREATE TABLE IF NOT EXISTS quote_observation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL,
    user_id UUID,
    content TEXT NOT NULL,
    created TIMESTAMPTZ(6) DEFAULT NOW(),
    updated TIMESTAMPTZ(6),
    status BOOLEAN DEFAULT true,
    CONSTRAINT fk_quote_observation_quote FOREIGN KEY (quote_id)
        REFERENCES quote(id) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Crear índice para optimizar búsquedas por quote_id
CREATE INDEX IF NOT EXISTS idx_quote_observation_quote_id ON quote_observation(quote_id);

-- Agregar comentarios a las tablas
COMMENT ON TABLE quote_comment IS 'Comentarios de clientes en cotizaciones';
COMMENT ON TABLE quote_observation IS 'Observaciones de administradores en cotizaciones';

COMMENT ON COLUMN quote_comment.id IS 'Identificador único del comentario';
COMMENT ON COLUMN quote_comment.quote_id IS 'Referencia a la cotización';
COMMENT ON COLUMN quote_comment.user_id IS 'Usuario que creó el comentario (opcional)';
COMMENT ON COLUMN quote_comment.content IS 'Contenido del comentario';
COMMENT ON COLUMN quote_comment.created IS 'Fecha de creación';
COMMENT ON COLUMN quote_comment.updated IS 'Fecha de última actualización';
COMMENT ON COLUMN quote_comment.status IS 'Estado activo/inactivo';

COMMENT ON COLUMN quote_observation.id IS 'Identificador único de la observación';
COMMENT ON COLUMN quote_observation.quote_id IS 'Referencia a la cotización';
COMMENT ON COLUMN quote_observation.user_id IS 'Usuario administrador que creó la observación (opcional)';
COMMENT ON COLUMN quote_observation.content IS 'Contenido de la observación';
COMMENT ON COLUMN quote_observation.created IS 'Fecha de creación';
COMMENT ON COLUMN quote_observation.updated IS 'Fecha de última actualización';
COMMENT ON COLUMN quote_observation.status IS 'Estado activo/inactivo';
