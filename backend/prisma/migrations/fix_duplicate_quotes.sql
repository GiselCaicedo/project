-- Script para identificar y eliminar cotizaciones duplicadas
-- Este script debe ejecutarse con precaución

-- Primero, identificar duplicados
SELECT
  consecutive,
  client_id,
  COUNT(*) as count
FROM quote
GROUP BY consecutive, client_id
HAVING COUNT(*) > 1;

-- Ver detalles de los duplicados
SELECT
  id,
  client_id,
  consecutive,
  description,
  created,
  updated,
  status
FROM quote
WHERE consecutive IN (
  SELECT consecutive
  FROM quote
  GROUP BY consecutive, client_id
  HAVING COUNT(*) > 1
)
ORDER BY consecutive, created;

-- PARA EJECUTAR LIMPIEZA (comentado por seguridad):
-- DELETE FROM quote
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY consecutive, client_id ORDER BY created) as row_num
--     FROM quote
--   ) t
--   WHERE row_num > 1
-- );
