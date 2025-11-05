-- Script para limpiar TODA la base de datos
-- SOLO MANTIENE: El usuario administrador, roles y permisos
-- ELIMINA: Todo lo demás (usuarios no-admin, clientes, servicios, facturas, etc.)

-- ============================================
-- PASO 1: Eliminar datos transaccionales
-- ============================================

-- Eliminar anexos de facturas
DELETE FROM "invoice_attachment";

-- Eliminar comentarios y observaciones de facturas
DELETE FROM "invoice_comment";
DELETE FROM "invoice_observation";

-- Eliminar comentarios y observaciones de cotizaciones
DELETE FROM "quote_comment";
DELETE FROM "quote_observation";

-- Eliminar adjuntos de pagos
DELETE FROM "payment_attachment";

-- Eliminar detalles de facturas
DELETE FROM "invoice_detail";

-- Eliminar detalles de cotizaciones
DELETE FROM "quote_detail";

-- Eliminar relaciones entre cotizaciones y facturas
DELETE FROM "quote_attachment";

-- Eliminar facturas
DELETE FROM "invoice";

-- Eliminar cotizaciones
DELETE FROM "quote";

-- Eliminar pagos
DELETE FROM "payment";

-- Eliminar logs
DELETE FROM "log";

-- ============================================
-- PASO 2: Eliminar relaciones de servicios
-- ============================================

-- Eliminar uso de servicios
DELETE FROM "service_usage";

-- Eliminar solicitudes de servicios
DELETE FROM "service_request";

-- Eliminar relaciones cliente-servicio
DELETE FROM "client_service";

-- ============================================
-- PASO 3: Eliminar servicios y categorías
-- ============================================

-- Eliminar servicios
DELETE FROM "service";

-- Eliminar categorías de servicios
DELETE FROM "service_category";

-- Eliminar impuestos
DELETE FROM "tax";

-- ============================================
-- PASO 4: Eliminar clientes NO relacionados con admin
-- ============================================

-- Eliminar detalles de clientes que NO están asociados al admin
DELETE FROM "client_details"
WHERE client_id NOT IN (
  SELECT client_id FROM "user" WHERE "user" = 'admin' AND client_id IS NOT NULL
);

-- Eliminar parámetros de clientes que NO están asociados al admin
DELETE FROM "client_parameter"
WHERE id NOT IN (
  SELECT c_parameter_id FROM "client_details"
  WHERE client_id IN (
    SELECT client_id FROM "user" WHERE "user" = 'admin' AND client_id IS NOT NULL
  )
);

-- Eliminar métodos de pago
DELETE FROM "payment_method";

-- Eliminar clientes que NO están asociados al admin
DELETE FROM "client"
WHERE id NOT IN (
  SELECT client_id FROM "user" WHERE "user" = 'admin' AND client_id IS NOT NULL
);

-- ============================================
-- PASO 5: Limpiar consecutivos
-- ============================================

-- Eliminar todos los consecutivos generados
DELETE FROM "consecutive";

-- ============================================
-- PASO 6: Eliminar configuraciones de usuarios
-- ============================================

-- Eliminar historial de contraseñas de usuarios no-admin
DELETE FROM "password_history"
WHERE user_id NOT IN (
  SELECT id FROM "user" WHERE "user" = 'admin'
);

-- Eliminar configuraciones de notificación de usuarios no-admin
DELETE FROM "user_notification_setting"
WHERE user_id NOT IN (
  SELECT id FROM "user" WHERE "user" = 'admin'
);

-- Eliminar configuración 2FA de usuarios no-admin
DELETE FROM "user_twofa"
WHERE user_id NOT IN (
  SELECT id FROM "user" WHERE "user" = 'admin'
);

-- Eliminar configuraciones de usuarios no-admin
DELETE FROM "user_setting"
WHERE user_id NOT IN (
  SELECT id FROM "user" WHERE "user" = 'admin'
);

-- ============================================
-- PASO 7: Eliminar usuarios no-admin
-- ============================================

-- Eliminar todos los usuarios EXCEPTO el admin
DELETE FROM "user" WHERE "user" != 'admin';

-- ============================================
-- PASO 8: Limpiar políticas de módulos de usuario
-- ============================================

-- Eliminar políticas de módulos de usuario
DELETE FROM "user_module_policy";

-- ============================================
-- PASO 9: Limpiar configuraciones del sistema (opcional)
-- ============================================

-- Si quieres también limpiar las configuraciones del sistema, descomenta lo siguiente:
-- DELETE FROM "alert_rule";
-- DELETE FROM "security_policy";
-- DELETE FROM "session_policy";
-- DELETE FROM "password_policy";
-- DELETE FROM "smtp_config";
-- DELETE FROM "general_setting";

-- ============================================
-- RESUMEN
-- ============================================

-- Lo que PERMANECE intacto:
-- - El usuario con username = 'admin'
-- - El CLIENTE asociado al admin (si existe)
-- - Detalles y parámetros del cliente del admin
-- - Sus configuraciones (user_setting, user_twofa, user_notification_setting, password_history)
-- - Todos los ROLES (role)
-- - Todos los PERMISOS (permission)
-- - Todas las relaciones ROL-PERMISO (role_permission)
-- - Configuraciones del sistema (general_setting, smtp_config, etc.) - SI NO LAS DESCOMENTASTE ARRIBA

-- Verificar resultados
SELECT 'Usuarios restantes:' as tabla, COUNT(*) as cantidad FROM "user"
UNION ALL
SELECT 'Roles restantes:', COUNT(*) FROM "role"
UNION ALL
SELECT 'Permisos restantes:', COUNT(*) FROM "permission"
UNION ALL
SELECT 'Relaciones rol-permiso:', COUNT(*) FROM "role_permission"
UNION ALL
SELECT 'Clientes restantes:', COUNT(*) FROM "client"
UNION ALL
SELECT 'Servicios restantes:', COUNT(*) FROM "service"
UNION ALL
SELECT 'Cotizaciones restantes:', COUNT(*) FROM "quote"
UNION ALL
SELECT 'Facturas restantes:', COUNT(*) FROM "invoice"
UNION ALL
SELECT 'Consecutivos restantes:', COUNT(*) FROM "consecutive";

-- Mostrar el usuario admin que quedó
SELECT 'Usuario admin:' as info, id, "user", name, role_id, client_id, status
FROM "user"
WHERE "user" = 'admin';
