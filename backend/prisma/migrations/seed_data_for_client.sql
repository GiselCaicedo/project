-- Script para crear datos de ejemplo para el cliente
-- Client ID: 05821cfe-4c68-42f0-93b5-c99d56d548e1

-- ============================================
-- PASO 1: Crear Impuestos (Taxes)
-- ============================================

INSERT INTO "tax" (id, name, description, percentage, active, created, updated)
VALUES
  (gen_random_uuid(), 'IVA', 'Impuesto al Valor Agregado', 19.00, true, NOW(), NOW()),
  (gen_random_uuid(), 'IMP2', 'Impuesto Adicional 2', 5.00, true, NOW(), NOW()),
  (gen_random_uuid(), 'IMP3', 'Impuesto Adicional 3', 2.00, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- PASO 2: Crear Categorías de Servicios
-- ============================================

DO $$
BEGIN
  INSERT INTO "service_category" (id, name)
  VALUES
    (gen_random_uuid(), 'Desarrollo Web'),
    (gen_random_uuid(), 'Consultoría'),
    (gen_random_uuid(), 'Diseño Gráfico'),
    (gen_random_uuid(), 'Marketing Digital');
EXCEPTION WHEN unique_violation THEN
  -- Si ya existen, no hacer nada
  NULL;
END $$;

-- ============================================
-- PASO 3: Crear Servicios
-- ============================================

DO $$
DECLARE
  tax_iva_id uuid;
  tax_imp2_id uuid;
  cat_web_id uuid;
  cat_consulting_id uuid;
  cat_design_id uuid;
  cat_marketing_id uuid;
BEGIN
  -- Obtener IDs de impuestos
  SELECT id INTO tax_iva_id FROM "tax" WHERE name = 'IVA' LIMIT 1;
  SELECT id INTO tax_imp2_id FROM "tax" WHERE name = 'IMP2' LIMIT 1;

  -- Obtener IDs de categorías
  SELECT id INTO cat_web_id FROM "service_category" WHERE name = 'Desarrollo Web' LIMIT 1;
  SELECT id INTO cat_consulting_id FROM "service_category" WHERE name = 'Consultoría' LIMIT 1;
  SELECT id INTO cat_design_id FROM "service_category" WHERE name = 'Diseño Gráfico' LIMIT 1;
  SELECT id INTO cat_marketing_id FROM "service_category" WHERE name = 'Marketing Digital' LIMIT 1;

  INSERT INTO "service" (id, service_category_id, name, unit, description, price, frequency, tax_one_id, tax_two_id, subtotal, created, updated, status)
  VALUES
    (gen_random_uuid(), cat_web_id, 'Desarrollo de Sitio Web Corporativo', 'proyecto', 'Desarrollo completo de sitio web responsive con diseño moderno', 20000000.00, 'única', tax_iva_id, NULL, 20000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), cat_web_id, 'Desarrollo de E-commerce', 'proyecto', 'Tienda en línea con carrito de compras y pasarela de pagos', 35000000.00, 'única', tax_iva_id, NULL, 35000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), cat_web_id, 'Mantenimiento Web Mensual', 'mes', 'Mantenimiento y actualización de contenido web', 2000000.00, 'mensual', tax_iva_id, NULL, 2000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), cat_consulting_id, 'Consultoría en Transformación Digital', 'hora', 'Asesoría en procesos de digitalización empresarial', 350000.00, 'por hora', tax_iva_id, tax_imp2_id, 350000.00, NOW(), NOW(), true),
    (gen_random_uuid(), cat_design_id, 'Diseño de Identidad Corporativa', 'proyecto', 'Creación de logo, manual de marca y papelería', 12000000.00, 'única', tax_iva_id, NULL, 12000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), cat_marketing_id, 'Campaña de Marketing Digital', 'mes', 'Gestión de redes sociales y pauta publicitaria', 6000000.00, 'mensual', tax_iva_id, NULL, 6000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), cat_web_id, 'API REST Development', 'proyecto', 'Desarrollo de API RESTful personalizada', 18000000.00, 'única', tax_iva_id, NULL, 18000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), cat_consulting_id, 'Auditoría de Seguridad', 'proyecto', 'Análisis de vulnerabilidades y recomendaciones', 10000000.00, 'única', tax_iva_id, NULL, 10000000.00, NOW(), NOW(), true);
END $$;

-- ============================================
-- PASO 4: Crear Cotizaciones para el cliente
-- ============================================

DO $$
DECLARE
  client_id uuid := '05821cfe-4c68-42f0-93b5-c99d56d548e1';
  quote_id_1 uuid := gen_random_uuid();
  quote_id_2 uuid := gen_random_uuid();
  quote_id_3 uuid := gen_random_uuid();
  srv_web uuid;
  srv_ecommerce uuid;
  srv_consulting uuid;
  srv_design uuid;
  srv_marketing uuid;
  subtotal_q1 numeric := 0;
  subtotal_q2 numeric := 0;
  subtotal_q3 numeric := 0;
BEGIN
  -- Obtener IDs de servicios
  SELECT id INTO srv_web FROM "service" WHERE name = 'Desarrollo de Sitio Web Corporativo' LIMIT 1;
  SELECT id INTO srv_ecommerce FROM "service" WHERE name = 'Desarrollo de E-commerce' LIMIT 1;
  SELECT id INTO srv_consulting FROM "service" WHERE name = 'Consultoría en Transformación Digital' LIMIT 1;
  SELECT id INTO srv_design FROM "service" WHERE name = 'Diseño de Identidad Corporativa' LIMIT 1;
  SELECT id INTO srv_marketing FROM "service" WHERE name = 'Campaña de Marketing Digital' LIMIT 1;

  -- Calcular subtotales
  subtotal_q1 := 20000000.00 + 12000000.00; -- Web + Diseño
  subtotal_q2 := 35000000.00; -- E-commerce
  subtotal_q3 := 350000.00 * 20 + 6000000.00; -- Consulting (20 horas) + Marketing

  -- Cotización 1: Sitio Web + Diseño
  INSERT INTO "quote" (id, client_id, consecutive, description, value, subtotal, tax_one, tax_two, include_iva, total, created, updated, status)
  VALUES (
    quote_id_1,
    client_id,
    'COT-001',
    'Desarrollo de sitio web corporativo con identidad visual',
    subtotal_q1 + (subtotal_q1 * 0.19), -- total con IVA
    subtotal_q1,
    subtotal_q1 * 0.19, -- IVA 19%
    0,
    true,
    subtotal_q1 + (subtotal_q1 * 0.19),
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    true -- aprobada
  );

  -- Detalles de cotización 1
  INSERT INTO "quote_detail" (id, quote_id, service_id, item, quantity, total_value, created, updated, status)
  VALUES
    (gen_random_uuid(), quote_id_1, srv_web, 1, 1, 20000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), quote_id_1, srv_design, 2, 1, 12000000.00, NOW(), NOW(), true);

  -- Cotización 2: E-commerce
  INSERT INTO "quote" (id, client_id, consecutive, description, value, subtotal, tax_one, tax_two, include_iva, total, created, updated, status)
  VALUES (
    quote_id_2,
    client_id,
    'COT-002',
    'Desarrollo de tienda en línea con carrito de compras',
    subtotal_q2 + (subtotal_q2 * 0.19),
    subtotal_q2,
    subtotal_q2 * 0.19,
    0,
    true,
    subtotal_q2 + (subtotal_q2 * 0.19),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    false -- pendiente
  );

  -- Detalles de cotización 2
  INSERT INTO "quote_detail" (id, quote_id, service_id, item, quantity, total_value, created, updated, status)
  VALUES
    (gen_random_uuid(), quote_id_2, srv_ecommerce, 1, 1, 35000000.00, NOW(), NOW(), true);

  -- Cotización 3: Consultoría + Marketing
  INSERT INTO "quote" (id, client_id, consecutive, description, value, subtotal, tax_one, tax_two, include_iva, total, created, updated, status)
  VALUES (
    quote_id_3,
    client_id,
    'COT-003',
    'Consultoría en transformación digital y campaña de marketing',
    subtotal_q3 + (subtotal_q3 * 0.19),
    subtotal_q3,
    subtotal_q3 * 0.19,
    0,
    true,
    subtotal_q3 + (subtotal_q3 * 0.19),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    true -- aprobada
  );

  -- Detalles de cotización 3
  INSERT INTO "quote_detail" (id, quote_id, service_id, item, quantity, total_value, created, updated, status)
  VALUES
    (gen_random_uuid(), quote_id_3, srv_consulting, 1, 20, 7000000.00, NOW(), NOW(), true), -- 20 horas
    (gen_random_uuid(), quote_id_3, srv_marketing, 2, 1, 6000000.00, NOW(), NOW(), true);

END $$;

-- ============================================
-- PASO 5: Crear Facturas para cotizaciones aprobadas
-- ============================================

DO $$
DECLARE
  client_id uuid := '05821cfe-4c68-42f0-93b5-c99d56d548e1';
  invoice_id_1 uuid := gen_random_uuid();
  invoice_id_2 uuid := gen_random_uuid();
  quote_id_1 uuid;
  quote_id_3 uuid;
  srv_web uuid;
  srv_design uuid;
  srv_consulting uuid;
  srv_marketing uuid;
  subtotal_i1 numeric := 0;
  subtotal_i2 numeric := 0;
BEGIN
  -- Obtener IDs de cotizaciones aprobadas
  SELECT id INTO quote_id_1 FROM "quote" WHERE consecutive = 'COT-001' LIMIT 1;
  SELECT id INTO quote_id_3 FROM "quote" WHERE consecutive = 'COT-003' LIMIT 1;

  -- Obtener IDs de servicios
  SELECT id INTO srv_web FROM "service" WHERE name = 'Desarrollo de Sitio Web Corporativo' LIMIT 1;
  SELECT id INTO srv_design FROM "service" WHERE name = 'Diseño de Identidad Corporativa' LIMIT 1;
  SELECT id INTO srv_consulting FROM "service" WHERE name = 'Consultoría en Transformación Digital' LIMIT 1;
  SELECT id INTO srv_marketing FROM "service" WHERE name = 'Campaña de Marketing Digital' LIMIT 1;

  -- Calcular subtotales
  subtotal_i1 := 20000000.00 + 12000000.00;
  subtotal_i2 := 350000.00 * 20 + 6000000.00;

  -- Factura 1: Para cotización COT-001
  INSERT INTO "invoice" (id, client_id, service_id, consecutive, description, value, subtotal, tax_one, tax_two, include_iva, total, created, updated, status, expiry)
  VALUES (
    invoice_id_1,
    client_id,
    srv_web,
    'FAC-001',
    'Factura por desarrollo web y diseño',
    subtotal_i1,
    subtotal_i1,
    subtotal_i1 * 0.19,
    0,
    true,
    subtotal_i1 + (subtotal_i1 * 0.19),
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days',
    true, -- paid (pagada)
    NOW() + INTERVAL '30 days'
  );

  -- Detalles de factura 1
  INSERT INTO "invoice_detail" (id, invoice_id, service_id, item, quantity, total_value, created, updated, status)
  VALUES
    (gen_random_uuid(), invoice_id_1, srv_web, 1, 1, 20000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), invoice_id_1, srv_design, 2, 1, 12000000.00, NOW(), NOW(), true);

  -- Relación cotización-factura
  INSERT INTO "quote_attachment" (id, quote_id, invoice_id)
  VALUES (gen_random_uuid(), quote_id_1, invoice_id_1);

  -- Factura 2: Para cotización COT-003
  INSERT INTO "invoice" (id, client_id, service_id, consecutive, description, value, subtotal, tax_one, tax_two, include_iva, total, created, updated, status, expiry)
  VALUES (
    invoice_id_2,
    client_id,
    srv_consulting,
    'FAC-002',
    'Factura por consultoría y marketing digital',
    subtotal_i2,
    subtotal_i2,
    subtotal_i2 * 0.19,
    0,
    true,
    subtotal_i2 + (subtotal_i2 * 0.19),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    false, -- pending (pendiente)
    NOW() + INTERVAL '15 days'
  );

  -- Detalles de factura 2
  INSERT INTO "invoice_detail" (id, invoice_id, service_id, item, quantity, total_value, created, updated, status)
  VALUES
    (gen_random_uuid(), invoice_id_2, srv_consulting, 1, 20, 7000000.00, NOW(), NOW(), true),
    (gen_random_uuid(), invoice_id_2, srv_marketing, 2, 1, 6000000.00, NOW(), NOW(), true);

  -- Relación cotización-factura
  INSERT INTO "quote_attachment" (id, quote_id, invoice_id)
  VALUES (gen_random_uuid(), quote_id_3, invoice_id_2);

END $$;

-- ============================================
-- PASO 6: Crear Consecutivos
-- ============================================

-- Primero eliminar consecutivos existentes para crear nuevos
DELETE FROM "consecutive" WHERE code IN ('COT', 'FAC');

INSERT INTO "consecutive" (id, code, number, created, updated)
VALUES
  (gen_random_uuid(), 'COT', 1, NOW(), NOW()),
  (gen_random_uuid(), 'COT', 2, NOW(), NOW()),
  (gen_random_uuid(), 'COT', 3, NOW(), NOW()),
  (gen_random_uuid(), 'FAC', 1, NOW(), NOW()),
  (gen_random_uuid(), 'FAC', 2, NOW(), NOW());

-- ============================================
-- PASO 7: Crear Servicios activos para el cliente (client_service)
-- ============================================

DO $$
DECLARE
  client_id uuid := '05821cfe-4c68-42f0-93b5-c99d56d548e1';
  srv_maintenance uuid;
  srv_marketing uuid;
BEGIN
  -- Obtener servicios recurrentes
  SELECT id INTO srv_maintenance FROM "service" WHERE name = 'Mantenimiento Web Mensual' LIMIT 1;
  SELECT id INTO srv_marketing FROM "service" WHERE name = 'Campaña de Marketing Digital' LIMIT 1;

  -- Servicio 1: Mantenimiento Web (activo desde hace 3 meses)
  INSERT INTO "client_service" (id, client_id, service_id, created, updated, started, delivery, expiry, frequency, unit)
  VALUES (
    gen_random_uuid(),
    client_id,
    srv_maintenance,
    NOW() - INTERVAL '3 months',
    NOW(),
    NOW() - INTERVAL '3 months',
    NULL,
    NOW() + INTERVAL '9 months', -- 1 año de contrato
    'mensual',
    'mes'
  );

  -- Servicio 2: Campaña de Marketing (activo desde hace 1 mes)
  INSERT INTO "client_service" (id, client_id, service_id, created, updated, started, delivery, expiry, frequency, unit)
  VALUES (
    gen_random_uuid(),
    client_id,
    srv_marketing,
    NOW() - INTERVAL '1 month',
    NOW(),
    NOW() - INTERVAL '1 month',
    NULL,
    NOW() + INTERVAL '5 months', -- 6 meses de contrato
    'mensual',
    'mes'
  );

END $$;

-- ============================================
-- PASO 8: Crear Pagos para la factura pagada
-- ============================================

DO $$
DECLARE
  invoice_id_1 uuid;
  payment_method_id uuid;
BEGIN
  -- Obtener la factura pagada
  SELECT id INTO invoice_id_1 FROM "invoice" WHERE consecutive = 'FAC-001' LIMIT 1;

  -- Crear método de pago si no existe
  INSERT INTO "payment_method" (id, name)
  VALUES (gen_random_uuid(), 'Transferencia Bancaria')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO payment_method_id FROM "payment_method" WHERE name = 'Transferencia Bancaria' LIMIT 1;

  -- Crear pago registrado para FAC-001
  INSERT INTO "payment_attachment" (id, invoice_id, url, created)
  VALUES (
    gen_random_uuid(),
    invoice_id_1,
    'https://example.com/comprobantes/pago-fac-001.pdf',
    NOW() - INTERVAL '7 days'
  );

  -- Agregar otro pago parcial si lo deseas
  INSERT INTO "payment_attachment" (id, invoice_id, url, created)
  VALUES (
    gen_random_uuid(),
    invoice_id_1,
    'https://example.com/comprobantes/pago-fac-001-parte2.pdf',
    NOW() - INTERVAL '6 days'
  );

END $$;

-- ============================================
-- PASO 9: Crear Comentarios y Observaciones
-- ============================================

DO $$
DECLARE
  target_client_id uuid := '05821cfe-4c68-42f0-93b5-c99d56d548e1';
  admin_user_id uuid;
  client_user_id uuid;
  quote_id_1 uuid;
  quote_id_2 uuid;
  invoice_id_1 uuid;
  invoice_id_2 uuid;
BEGIN
  -- Obtener usuarios
  SELECT id INTO admin_user_id FROM "user" WHERE "user" = 'admin' LIMIT 1;
  SELECT id INTO client_user_id FROM "user" WHERE client_id = target_client_id LIMIT 1;

  -- Obtener cotizaciones y facturas
  SELECT id INTO quote_id_1 FROM "quote" WHERE consecutive = 'COT-001' LIMIT 1;
  SELECT id INTO quote_id_2 FROM "quote" WHERE consecutive = 'COT-002' LIMIT 1;
  SELECT id INTO invoice_id_1 FROM "invoice" WHERE consecutive = 'FAC-001' LIMIT 1;
  SELECT id INTO invoice_id_2 FROM "invoice" WHERE consecutive = 'FAC-002' LIMIT 1;

  -- Observaciones del admin en cotizaciones
  IF admin_user_id IS NOT NULL AND quote_id_1 IS NOT NULL THEN
    INSERT INTO "quote_observation" (id, quote_id, user_id, content, created, updated, status)
    VALUES (
      gen_random_uuid(),
      quote_id_1,
      admin_user_id,
      'Cotización aprobada. Se procederá con el desarrollo según cronograma acordado.',
      NOW() - INTERVAL '9 days',
      NOW() - INTERVAL '9 days',
      true
    );
  END IF;

  IF admin_user_id IS NOT NULL AND quote_id_2 IS NOT NULL THEN
    INSERT INTO "quote_observation" (id, quote_id, user_id, content, created, updated, status)
    VALUES (
      gen_random_uuid(),
      quote_id_2,
      admin_user_id,
      'Pendiente de revisión del cliente. Se puede ajustar el alcance según necesidades.',
      NOW() - INTERVAL '4 days',
      NOW() - INTERVAL '4 days',
      true
    );
  END IF;

  -- Comentarios del cliente en cotizaciones
  IF client_user_id IS NOT NULL AND quote_id_1 IS NOT NULL THEN
    INSERT INTO "quote_comment" (id, quote_id, user_id, content, created, updated, status)
    VALUES (
      gen_random_uuid(),
      quote_id_1,
      client_user_id,
      '¿Cuánto tiempo tomará el desarrollo completo?',
      NOW() - INTERVAL '10 days',
      NOW() - INTERVAL '10 days',
      true
    );
  END IF;

  -- Observaciones del admin en facturas
  IF admin_user_id IS NOT NULL AND invoice_id_1 IS NOT NULL THEN
    INSERT INTO "invoice_observation" (id, invoice_id, user_id, content, created, updated, status)
    VALUES (
      gen_random_uuid(),
      invoice_id_1,
      admin_user_id,
      'Pago recibido y confirmado. Proyecto en desarrollo.',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '7 days',
      true
    );
  END IF;

  IF admin_user_id IS NOT NULL AND invoice_id_2 IS NOT NULL THEN
    INSERT INTO "invoice_observation" (id, invoice_id, user_id, content, created, updated, status)
    VALUES (
      gen_random_uuid(),
      invoice_id_2,
      admin_user_id,
      'Recordatorio: Factura pendiente de pago. Vence en 15 días.',
      NOW(),
      NOW(),
      true
    );
  END IF;

  -- Comentarios del cliente en facturas
  IF client_user_id IS NOT NULL AND invoice_id_2 IS NOT NULL THEN
    INSERT INTO "invoice_comment" (id, invoice_id, user_id, content, created, updated, status)
    VALUES (
      gen_random_uuid(),
      invoice_id_2,
      client_user_id,
      'Procesaré el pago esta semana.',
      NOW(),
      NOW(),
      true
    );
  END IF;

END $$;

-- ============================================
-- RESUMEN DE DATOS CREADOS
-- ============================================

SELECT '=== RESUMEN DE DATOS CREADOS ===' as info;

SELECT 'Impuestos creados:' as tipo, COUNT(*) as cantidad FROM "tax";
SELECT 'Categorías creadas:' as tipo, COUNT(*) FROM "service_category";
SELECT 'Servicios creados:' as tipo, COUNT(*) FROM "service";
SELECT 'Cotizaciones creadas:' as tipo, COUNT(*) FROM "quote" WHERE client_id = '05821cfe-4c68-42f0-93b5-c99d56d548e1';
SELECT 'Facturas creadas:' as tipo, COUNT(*) FROM "invoice" WHERE client_id = '05821cfe-4c68-42f0-93b5-c99d56d548e1';

-- Mostrar cotizaciones creadas
SELECT
  consecutive as "Consecutivo",
  description as "Descripción",
  subtotal as "Subtotal",
  tax_one as "IVA",
  total as "Total",
  CASE WHEN status THEN 'Aprobada' ELSE 'Pendiente' END as "Estado"
FROM "quote"
WHERE client_id = '05821cfe-4c68-42f0-93b5-c99d56d548e1'
ORDER BY created DESC;

-- Mostrar facturas creadas
SELECT
  consecutive as "Consecutivo",
  description as "Descripción",
  subtotal as "Subtotal",
  tax_one as "IVA",
  total as "Total",
  CASE WHEN status THEN 'Pagada' ELSE 'Pendiente' END as "Estado"
FROM "invoice"
WHERE client_id = '05821cfe-4c68-42f0-93b5-c99d56d548e1'
ORDER BY created DESC;
