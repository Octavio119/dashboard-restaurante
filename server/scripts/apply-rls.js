const { PrismaClient } = require('../generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuración de RLS en Supabase...');
  
  try {
    const sqlPath = path.join(__dirname, '../rls-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Separamos las sentencias de ALTER TABLE (simples) y el bloque DO (complejo)
    // Buscamos patrones específicos en lugar de un split ciego por ";"
    const alterTableStatements = sql.match(/ALTER TABLE ".*?" ENABLE ROW LEVEL SECURITY;/g) || [];
    const doBlock = sql.match(/DO \$\$[\s\S]*?END \$\$;/g) || [];
    const finalPolicies = [
      'ALTER TABLE "Restaurante" ENABLE ROW LEVEL SECURITY;',
      'DROP POLICY IF EXISTS "restaurant_self_view" ON "Restaurante";',
      'CREATE POLICY "restaurant_self_view" ON "Restaurante" USING (id::text = current_setting(\'app.current_restaurant_id\', true));'
    ];

    const allStatements = [...alterTableStatements, ...doBlock, ...finalPolicies];

    for (const statement of allStatements) {
      if (!statement.trim()) continue;
      console.log(`Executing: ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
      await prisma.$executeRawUnsafe(statement);
    }

    console.log('✅ RLS configurado exitosamente en todas las tablas.');
  } catch (error) {
    console.error('❌ Error configurando RLS:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
