/**
 * db.js — SQLite con node-sqlite3-wasm (sin compilación nativa)
 * El runtime WASM ya está inicializado al importar el módulo.
 */
const { Database } = require('node-sqlite3-wasm');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'restaurante.db');

// Limpiar archivos de lock que quedan tras crash
const lockPath = DB_PATH + '.lock';
if (fs.existsSync(lockPath)) {
  try { fs.rmSync(lockPath, { recursive: true, force: true }); } catch {}
}

const db = new Database(DB_PATH);

db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys=ON");

// ─── Tablas ───────────────────────────────────────────────────────────────────
db.exec(`
  -- Multi-tenant: cada restaurante es un tenant
  CREATE TABLE IF NOT EXISTS restaurantes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre     TEXT NOT NULL,
    slug       TEXT UNIQUE NOT NULL,
    plan       TEXT NOT NULL DEFAULT 'free',  -- free | pro | enterprise
    activo     INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT    NOT NULL,
    email            TEXT    UNIQUE NOT NULL,
    password_hash    TEXT    NOT NULL,
    rol              TEXT    NOT NULL DEFAULT 'staff',
    restaurante_id   INTEGER NOT NULL DEFAULT 1,
    activo           INTEGER NOT NULL DEFAULT 1,
    created_at       TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id)
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    email          TEXT DEFAULT '',
    telefono       TEXT DEFAULT '',
    rut            TEXT DEFAULT '',
    tipo_cliente   TEXT NOT NULL DEFAULT 'persona',
    razon_social   TEXT DEFAULT '',
    visitas        INTEGER NOT NULL DEFAULT 0,
    total_gastado  REAL    NOT NULL DEFAULT 0,
    estado         TEXT    NOT NULL DEFAULT 'Nuevo',
    restaurante_id INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS productos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    categoria      TEXT NOT NULL,
    precio         REAL NOT NULL,
    stock          INTEGER NOT NULL DEFAULT 0,
    stock_minimo   INTEGER NOT NULL DEFAULT 10,
    unidad         TEXT DEFAULT 'unidades',
    activo         INTEGER NOT NULL DEFAULT 1,
    restaurante_id INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    numero         TEXT UNIQUE NOT NULL,
    cliente_nombre TEXT NOT NULL,
    item           TEXT NOT NULL,
    total          REAL NOT NULL,
    estado         TEXT NOT NULL DEFAULT 'pendiente',
    fecha          TEXT NOT NULL,
    restaurante_id INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    email          TEXT DEFAULT '',
    telefono       TEXT DEFAULT '',
    hora           TEXT NOT NULL,
    personas       INTEGER NOT NULL,
    mesa           TEXT DEFAULT '',
    estado         TEXT NOT NULL DEFAULT 'pendiente',
    fecha          TEXT NOT NULL,
    consumo_base   REAL NOT NULL DEFAULT 0,
    cliente_id     INTEGER DEFAULT NULL,
    restaurante_id INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cajas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha            TEXT NOT NULL,
    restaurante_id   INTEGER NOT NULL DEFAULT 1,
    monto_inicial    REAL NOT NULL DEFAULT 0,
    total_ventas     REAL,
    total_efectivo   REAL,
    monto_final      REAL,
    diferencia       REAL,
    cajero_apertura  TEXT NOT NULL DEFAULT '',
    cajero_cierre    TEXT DEFAULT '',
    estado           TEXT NOT NULL DEFAULT 'abierta',
    created_at       TEXT DEFAULT (datetime('now')),
    closed_at        TEXT DEFAULT NULL,
    UNIQUE(fecha, restaurante_id)
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    restaurante_id INTEGER NOT NULL DEFAULT 1,
    UNIQUE(nombre, restaurante_id)
  );

  CREATE TABLE IF NOT EXISTS config_negocio (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurante_id  INTEGER UNIQUE NOT NULL DEFAULT 1,
    nombre          TEXT NOT NULL DEFAULT 'Mi Restaurante',
    rut             TEXT NOT NULL DEFAULT '',
    direccion       TEXT NOT NULL DEFAULT '',
    currency        TEXT NOT NULL DEFAULT '$',
    currency_code   TEXT NOT NULL DEFAULT 'CLP',
    open_time       TEXT NOT NULL DEFAULT '11:00',
    close_time      TEXT NOT NULL DEFAULT '23:30',
    tax_rate        REAL NOT NULL DEFAULT 19,
    payment_methods TEXT NOT NULL DEFAULT '{"cash":true,"card":true,"transfer":true,"qr":false}',
    timezone        TEXT NOT NULL DEFAULT 'America/Santiago',
    idioma          TEXT NOT NULL DEFAULT 'es',
    formato_fecha   TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    prefijo_ticket  TEXT NOT NULL DEFAULT 'TKT',
    numero_inicial  INTEGER NOT NULL DEFAULT 1,
    impuesto_activo INTEGER NOT NULL DEFAULT 1,
    logo_url        TEXT NOT NULL DEFAULT '',
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS proveedores (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre         TEXT NOT NULL,
    contacto       TEXT,
    telefono       TEXT,
    email          TEXT,
    restaurante_id INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventario_movimientos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id    INTEGER NOT NULL,
    usuario_id     INTEGER NOT NULL,
    tipo           TEXT NOT NULL, -- entrada, salida, ajuste
    cantidad       INTEGER NOT NULL,
    motivo         TEXT,
    proveedor_id   INTEGER,
    restaurante_id INTEGER NOT NULL DEFAULT 1,
    fecha          TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
  );

  CREATE TABLE IF NOT EXISTS reserva_consumos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    reserva_id     INTEGER NOT NULL,
    producto_id    INTEGER,
    nombre         TEXT NOT NULL,
    cantidad       INTEGER NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL DEFAULT 0,
    restaurante_id INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );

  CREATE TABLE IF NOT EXISTS pedido_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id       INTEGER NOT NULL,
    producto_id     INTEGER,
    nombre          TEXT NOT NULL,
    cantidad        INTEGER NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL DEFAULT 0,
    restaurante_id  INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (pedido_id)   REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  );

  CREATE TABLE IF NOT EXISTS metadata (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ─── Migraciones seguras (ALTER TABLE idempotente) ────────────────────────────
// SQLite no soporta IF NOT EXISTS en ALTER TABLE — usamos try/catch por columna
const migrations = [
  "ALTER TABLE usuarios   ADD COLUMN restaurante_id INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE clientes   ADD COLUMN restaurante_id INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE productos  ADD COLUMN stock_minimo   INTEGER NOT NULL DEFAULT 10",
  "ALTER TABLE productos  ADD COLUMN unidad         TEXT    DEFAULT 'unidades'",
  "ALTER TABLE productos  ADD COLUMN restaurante_id INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE pedidos    ADD COLUMN restaurante_id INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE reservas   ADD COLUMN restaurante_id INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE config_negocio ADD COLUMN prefijo_ticket  TEXT    NOT NULL DEFAULT 'TKT'",
  "ALTER TABLE config_negocio ADD COLUMN numero_inicial  INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE config_negocio ADD COLUMN impuesto_activo INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE config_negocio ADD COLUMN logo_url        TEXT    NOT NULL DEFAULT ''",
  "ALTER TABLE pedidos        ADD COLUMN metodo_pago     TEXT    NOT NULL DEFAULT 'efectivo'",
  "ALTER TABLE reservas       ADD COLUMN cliente_id      INTEGER DEFAULT NULL",
  "ALTER TABLE reservas       ADD COLUMN email           TEXT    DEFAULT ''",
  "ALTER TABLE pedidos        ADD COLUMN reserva_id      INTEGER DEFAULT NULL",
  "ALTER TABLE pedidos        ADD COLUMN mesa            TEXT    DEFAULT ''",
  "ALTER TABLE pedidos        ADD COLUMN personas        INTEGER DEFAULT 0",
  "ALTER TABLE inventario_movimientos ADD COLUMN stock_anterior INTEGER DEFAULT NULL",
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* columna ya existe — ok */ }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
// Usamos tabla metadata para que el seed solo corra UNA vez.
// Así los datos del negocio no se recrean si el admin los elimina.
const today = new Date().toISOString().split('T')[0];

const alreadySeeded = db.prepare("SELECT value FROM metadata WHERE key='seeded'").get();

if (!alreadySeeded) {
  // Si hay usuarios, es una instalación existente — no tocar datos, solo marcar
  const hasUsers = db.prepare('SELECT COUNT(*) as n FROM usuarios').get().n > 0;

  if (!hasUsers) {
    // Instalación limpia: crear datos de ejemplo
    db.prepare('INSERT INTO restaurantes (nombre, slug, plan) VALUES (?,?,?)')
      .run(['masterGrowth Gourmet', 'mastergrowth', 'pro']);

    db.prepare('INSERT INTO usuarios (nombre,email,password_hash,rol,restaurante_id) VALUES (?,?,?,?,?)')
      .run(['Administrador', 'admin@restaurante.com', bcrypt.hashSync('admin123', 10), 'admin', 1]);
    db.prepare('INSERT INTO usuarios (nombre,email,password_hash,rol,restaurante_id) VALUES (?,?,?,?,?)')
      .run(['Mario Vargas', 'mario@restaurante.com', bcrypt.hashSync('staff123', 10), 'chef', 1]);
    console.log('✅ Seed: admin@restaurante.com / admin123');

    const insC = db.prepare('INSERT INTO clientes (nombre,email,telefono,rut,tipo_cliente,razon_social,visitas,total_gastado,estado) VALUES (?,?,?,?,?,?,?,?,?)');
    insC.run(['Carlos Ruiz',  'carlos@email.com',  '+56912345678', '12.345.678-9', 'persona', '',           12, 450.00, 'VIP']);
    insC.run(['Ana Belén',    'ana@email.com',      '+56699888777', '9.876.543-2',  'persona', '',            8, 320.50, 'Regular']);
    insC.run(['David Soto',   'david@email.com',    '+56655444333', '15.123.456-7', 'persona', '',            5, 125.00, 'Nuevo']);
    insC.run(['Gastro SpA',   'contacto@gastro.cl', '+56222334455', '76.543.210-K', 'empresa', 'Gastro SpA',  3, 890.00, 'VIP']);

    const insP = db.prepare('INSERT INTO productos (nombre,categoria,precio,stock) VALUES (?,?,?,?)');
    [
      ['Tostadas con Palta',   'desayuno',  8.00, 40],
      ['Café Americano',       'desayuno',  4.50, 100],
      ['Ribeye Steak 400g',    'almuerzo', 35.00, 20],
      ['Hamburguesa Premium',  'almuerzo', 18.50, 30],
      ['Pasta Carbonara',      'almuerzo', 18.00, 25],
      ['Ensalada César',       'almuerzo', 14.00, 40],
      ['Salmón Grillé',        'cena',     28.00, 15],
      ['Risotto Funghi',       'cena',     22.00, 20],
      ['Tiramisú',             'cena',     10.00, 20],
      ['Sándwich Club',        'colacion',  9.50, 35],
      ['Cocktail Signature',   'coctel',   14.00, 30],
      ['Cerveza Artesanal',    'coctel',    7.00, 50],
      ['Vino Tinto Copa',      'coctel',    9.00, 40],
    ].forEach(r => insP.run(r));

    const insK = db.prepare('INSERT OR IGNORE INTO categorias (nombre, restaurante_id) VALUES (?, 1)');
    ['desayuno', 'almuerzo', 'cena', 'coctel', 'colacion'].forEach(c => insK.run(c));

    const insO = db.prepare('INSERT INTO pedidos (numero,cliente_nombre,item,total,estado,fecha) VALUES (?,?,?,?,?,?)');
    insO.run(['#ORD-7281', 'Carlos Ruiz', 'Hamburguesa Premium', 18.50, 'en preparación', today]);
    insO.run(['#ORD-7280', 'Ana Belén',   'Pasta Carbonara x2',  32.00, 'pendiente',       today]);
    insO.run(['#ORD-7279', 'David Soto',  'Pizza Margarita',     14.00, 'entregado',       today]);
    insO.run(['#ORD-7278', 'Elena Marín', 'Ensalada César',      12.00, 'entregado',       today]);

    const insR = db.prepare('INSERT INTO reservas (nombre,telefono,hora,personas,mesa,estado,fecha,consumo_base) VALUES (?,?,?,?,?,?,?,?)');
    insR.run(['Roberto Gómez',    '+34612345678', '14:30', 4, 'Mesa 12',     'confirmada', today, 85.00]);
    insR.run(['Lucía Fernández',  '+34699888777', '15:45', 2, 'Terraza 05',  'pendiente',  today, 42.00]);
    insR.run(['Familia Martínez', '+34655444333', '20:00', 8, 'Privado VIP', 'pendiente',  today, 210.00]);

    const insProv = db.prepare('INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES (?,?,?,?)');
    insProv.run(['Distribuidora Central', 'Mario López', '+56987654321', 'ventas@distribuidora.cl']);
    insProv.run(['Frutas y Verduras VIP', 'Elena Soto', '+56911223344', 'contacto@frescos.cl']);

    console.log('✅ Seed completo: datos de ejemplo creados');
  } else {
    console.log('✅ Seed: instalación existente detectada, datos preservados');
  }

  // Marcar como seeded para no volver a ejecutar
  db.prepare("INSERT INTO metadata (key, value) VALUES ('seeded', '1')").run();
}

module.exports = db;
