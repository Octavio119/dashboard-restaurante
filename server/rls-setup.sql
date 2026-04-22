-- Script de Configuración de RLS para Aislamiento Multi-tenant
-- Este script habilita RLS en todas las tablas críticas y crea políticas que
-- filtran los datos basándose en la variable 'app.current_restaurant_id'.

-- 1. Habilitar RLS en las tablas principales
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Categoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Producto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pedido" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PedidoItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reserva" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReservaConsumo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Venta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Caja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConfigNegocio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proveedor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventarioMovimiento" ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas de aislamiento por cada tabla
-- La política asegura que el restaurante_id de la fila coincida con el contexto de la sesión.
DO $$ 
DECLARE 
    t text;
    tables_to_protect text[] := ARRAY[
        'Usuario', 'Cliente', 'Categoria', 'Producto', 'Pedido', 
        'PedidoItem', 'Reserva', 'ReservaConsumo', 'Venta', 
        'Caja', 'ConfigNegocio', 'Proveedor', 'InventarioMovimiento'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_protect
    LOOP
        -- Eliminar política anterior si existe
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON %I', t);
        
        -- Crear la nueva política para SELECCIÓN y MODIFICACIÓN
        -- Comparamos restaurante_id (int) con la variable de sesión (text)
        EXECUTE format(
            'CREATE POLICY "tenant_isolation_policy" ON %I 
             AS PERMISSIVE FOR ALL
             TO public
             USING (restaurante_id::text = current_setting(''app.current_restaurant_id'', true))
             WITH CHECK (restaurante_id::text = current_setting(''app.current_restaurant_id'', true))', 
            t
        );
        
        RAISE NOTICE 'RLS habilitado y política aplicada a la tabla: %', t;
    END LOOP;
END $$;

-- 3. Excepción para la tabla de Restaurantes (opcional)
-- Un administrador autenticado debería poder ver su propio restaurante.
ALTER TABLE "Restaurante" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "restaurant_self_view" ON "Restaurante";
CREATE POLICY "restaurant_self_view" ON "Restaurante" 
USING (id::text = current_setting('app.current_restaurant_id', true));

-- 4. Asegurarse de que el usuario de Postgres pueda seguir operando sin restricciones si no hay contexto
-- (Útil para scripts de administración o migraciones de sistema)
-- Pero para la App, siempre forzaremos el contexto.
