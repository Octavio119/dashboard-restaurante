/**
 * auto-migrate.js
 * Espera a que Supabase esté online y aplica la migración automáticamente.
 * Uso: node server/scripts/auto-migrate.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { execSync } = require('child_process');
const net = require('net');
const path = require('path');

const SCHEMA = path.join(__dirname, '../prisma/schema.prisma');
const MIGRATION_NAME = '20260513000000_init_postgresql';
const POLL_INTERVAL_MS = 8000;

// Extrae host y puerto de la DIRECT_URL
function parseDirectUrl() {
  const url = process.env.DIRECT_URL || '';
  const match = url.match(/@([^:/?]+):(\d+)/);
  if (!match) throw new Error('DIRECT_URL no válida en .env');
  return { host: match[1], port: parseInt(match[2]) };
}

function checkTcp(host, port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(6000);
    s.connect(port, host, () => { s.destroy(); resolve(true); });
    s.on('error', () => { s.destroy(); resolve(false); });
    s.on('timeout', () => { s.destroy(); resolve(false); });
  });
}

function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe',
    ...opts,
  });
}

function tablesExist() {
  try {
    const out = run(
      `npx prisma db execute --stdin --schema="${SCHEMA}"`,
      { input: `SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema='public' AND table_name='Restaurante';` }
    );
    return out.includes('"n":"1"') || out.includes('"n": 1') || out.includes('1');
  } catch {
    return false;
  }
}

function migrationAlreadyApplied() {
  try {
    const out = run(
      `npx prisma db execute --stdin --schema="${SCHEMA}"`,
      { input: `SELECT id FROM _prisma_migrations WHERE migration_name='${MIGRATION_NAME}' LIMIT 1;` }
    );
    return out.includes(MIGRATION_NAME) || (out.trim().length > 20 && !out.includes('error'));
  } catch {
    return false;
  }
}

async function main() {
  const { host, port } = parseDirectUrl();

  console.log(`\n🔄 auto-migrate — esperando que Supabase esté online...`);
  console.log(`   Conectando a ${host}:${port} cada ${POLL_INTERVAL_MS / 1000}s\n`);

  // Polling hasta que la conexión directa esté disponible
  let attempts = 0;
  while (true) {
    attempts++;
    const online = await checkTcp(host, port);
    if (online) {
      console.log(`✅ Supabase online después de ${attempts} intento(s)`);
      break;
    }
    process.stdout.write(`   [${attempts}] Proyecto pausado, reintentando en ${POLL_INTERVAL_MS / 1000}s...\r`);
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }

  console.log('\n🔍 Detectando estado de la base de datos...');

  await new Promise(r => setTimeout(r, 2000)); // Espera breve para que el DB arranque

  const hasTables = tablesExist();
  const hasAppliedMigration = hasTables ? migrationAlreadyApplied() : false;

  console.log(`   Tablas existentes: ${hasTables ? 'SÍ' : 'NO'}`);
  console.log(`   Migración ya registrada: ${hasAppliedMigration ? 'SÍ' : 'NO'}`);

  if (hasAppliedMigration) {
    console.log('\n✅ La migración ya estaba aplicada. Nada que hacer.');
    process.exit(0);
  }

  if (hasTables) {
    // Las tablas existen pero no hay registro en _prisma_migrations
    // (creadas con db push antes) — marcamos como aplicada sin re-ejecutar el SQL
    console.log('\n⚠️  Tablas encontradas sin registro de migración (db push previo)');
    console.log('   Marcando migración como aplicada sin ejecutar DDL...');
    try {
      const out = run(
        `npx prisma migrate resolve --applied ${MIGRATION_NAME} --schema="${SCHEMA}"`
      );
      console.log(out);
      console.log('✅ Migración marcada como aplicada. Estado sincronizado.');
    } catch (e) {
      console.error('❌ Error al marcar migración:', e.message);
      process.exit(1);
    }
  } else {
    // BD vacía — aplicar la migración normalmente
    console.log('\n🚀 BD vacía — aplicando migración init_postgresql...');
    try {
      const out = run(
        `npx prisma migrate deploy --schema="${SCHEMA}"`
      );
      console.log(out);
      console.log('✅ Migración aplicada correctamente.');
    } catch (e) {
      console.error('❌ Error al aplicar migración:', e.stderr || e.message);
      process.exit(1);
    }
  }

  // Regenera el Prisma Client por si acaso
  console.log('\n🔧 Regenerando Prisma Client...');
  try {
    run(`npx prisma generate --schema="${SCHEMA}"`);
    console.log('✅ Prisma Client actualizado.');
  } catch (e) {
    console.warn('⚠️  generate falló (no crítico):', e.message);
  }

  console.log('\n✅ auto-migrate completado. El servidor puede arrancar.\n');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
