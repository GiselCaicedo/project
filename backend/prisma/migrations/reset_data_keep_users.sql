-- Script para limpiar datos de la base de datos
-- MANTIENE: usuarios, roles, permisos, configuraciones del sistema
-- ELIMINA: cotizaciones, facturas, servicios, clientes, pagos, logs, etc.

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
-- PASO 2: Eliminar relaciones de servicios PRIMERO
-- ============================================

-- Eliminar uso de servicios
DELETE FROM "service_usage";

-- Eliminar solicitudes de servicios
DELETE FROM "service_request";

-- Eliminar relaciones cliente-servicio (IMPORTANTE: antes de eliminar servicios)
DELETE FROM "client_service";

-- ============================================
-- PASO 3: Eliminar servicios y categorías
-- ============================================

-- Ahora sí podemos eliminar servicios
DELETE FROM "service";

-- Eliminar categorías de servicios
DELETE FROM "service_category";

-- Eliminar impuestos
DELETE FROM "tax";

-- ============================================
-- PASO 4: Desasociar usuarios de clientes
-- ============================================

-- Quitar la relación client_id de los usuarios (mantener usuarios, solo quitar referencia al cliente)
UPDATE "user" SET client_id = NULL WHERE client_id IS NOT NULL;

-- ============================================
-- PASO 5: Eliminar clientes y relaciones
-- ============================================

-- Eliminar detalles de clientes
DELETE FROM "client_details";

-- Eliminar parámetros de clientes
DELETE FROM "client_parameter";

-- Eliminar métodos de pago
DELETE FROM "payment_method";

-- Eliminar clientes
DELETE FROM "client";

-- ============================================
-- PASO 6: Limpiar consecutivos
-- ============================================

-- Eliminar todos los consecutivos generados
DELETE FROM "consecutive";

-- ============================================
-- PASO 7: Limpiar historial de contraseñas (opcional)
-- ============================================

-- Eliminar historial de contraseñas (opcional, descomentar si deseas limpiar)
-- DELETE FROM "password_history";

-- ============================================
-- RESUMEN
-- ============================================

-- Lo siguiente NO se elimina y permanece intacto:
-- - user (usuarios)
-- - role (roles)
-- - permission (permisos)
-- - role_permission (relaciones rol-permiso)
-- - user_setting (configuraciones de usuario)
-- - user_twofa (configuración 2FA)
-- - user_notification_setting (configuraciones de notificaciones)
-- - general_setting (configuración general del sistema)
-- - smtp_config (configuración de correo)
-- - alert_rule (reglas de alertas)
-- - security_policy (políticas de seguridad)
-- - session_policy (políticas de sesión)
-- - password_policy (políticas de contraseña)
-- - user_module_policy (políticas de módulos de usuario)

-- Verificar resultados
SELECT 'Clientes restantes:' as tabla, COUNT(*) as cantidad FROM "client"
UNION ALL
SELECT 'Servicios restantes:', COUNT(*) FROM "service"
UNION ALL
SELECT 'Cotizaciones restantes:', COUNT(*) FROM "quote"
UNION ALL
SELECT 'Facturas restantes:', COUNT(*) FROM "invoice"
UNION ALL
SELECT 'Usuarios restantes:', COUNT(*) FROM "user"
UNION ALL
SELECT 'Roles restantes:', COUNT(*) FROM "role"
UNION ALL
SELECT 'Consecutivos restantes:', COUNT(*) FROM "consecutive";
