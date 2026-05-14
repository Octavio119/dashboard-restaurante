const logger = require('../lib/logger');
const router = require('express').Router();
const multer = require('multer');
const xlsx   = require('xlsx');
const requireAuth = require('../middleware/auth');
const verifyRole  = require('../middleware/verifyRole');

router.use(requireAuth);
router.use(require('../middleware/requireTenant'));

const RID = (req) => req.user.restaurante_id;

// multer — memory storage, accept only xlsx/csv, max 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('Solo se aceptan archivos .xlsx, .xls o .csv'), ok);
  },
});

// Column aliases accepted in the spreadsheet
const COL_MAP = {
  nombre:       ['nombre', 'name', 'producto', 'item'],
  precio:       ['precio', 'price', 'costo', 'valor'],
  categoria:    ['categoria', 'category', 'cat', 'categoría'],
  stock:        ['stock', 'cantidad', 'qty', 'existencias'],
  stock_minimo: ['stock_minimo', 'minimo', 'min_stock', 'stock minimo', 'stock mínimo'],
  unidad:       ['unidad', 'unit', 'unidades', 'medida'],
};

function resolveHeader(rawHeader) {
  const h = String(rawHeader).trim().toLowerCase();
  for (const [field, aliases] of Object.entries(COL_MAP)) {
    if (aliases.includes(h)) return field;
  }
  return null;
}

function parseRows(buffer, mimetype, originalname) {
  let wb;
  if (/\.csv$/i.test(originalname)) {
    wb = xlsx.read(buffer, { type: 'buffer', raw: false });
  } else {
    wb = xlsx.read(buffer, { type: 'buffer' });
  }
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length < 2) return { headers: [], data: [] };

  const rawHeaders = rows[0].map(h => String(h).trim());
  const colIndex   = {};
  rawHeaders.forEach((h, i) => {
    const field = resolveHeader(h);
    if (field) colIndex[field] = i;
  });

  const data = rows.slice(1).map((row, i) => {
    const obj = { _row: i + 2 };
    for (const [field, idx] of Object.entries(colIndex)) {
      obj[field] = row[idx] !== undefined ? String(row[idx]).trim() : '';
    }
    return obj;
  });

  return { headers: rawHeaders, data };
}

// GET /api/productos?categoria=xxx
router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;
    const rid = RID(req);
    const where = { activo: true, restaurante_id: rid };
    if (categoria) where.categoria = categoria;
    const rows = await req.prisma.producto.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/productos/import — bulk import from xlsx/csv
router.post('/import', verifyRole('admin', 'gerente'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

  const rid = RID(req);
  let parsed;
  try {
    parsed = parseRows(req.file.buffer, req.file.mimetype, req.file.originalname);
  } catch (e) {
    return res.status(400).json({ error: 'No se pudo leer el archivo. Asegúrate de que sea un Excel o CSV válido.' });
  }

  const { data } = parsed;
  if (!data.length) return res.status(400).json({ error: 'El archivo está vacío o no tiene filas de datos.' });

  // ── Validate each row ────────────────────────────────────────────────────────
  const valid  = [];
  const errors = [];

  for (const row of data) {
    const rowErrors = [];

    const nombre = row.nombre?.trim();
    if (!nombre) rowErrors.push({ field: 'nombre', message: 'Campo obligatorio' });

    const categoriaRaw = row.categoria?.trim();
    if (!categoriaRaw) rowErrors.push({ field: 'categoria', message: 'Campo obligatorio' });

    const precioRaw = row.precio;
    const precio = parseFloat(String(precioRaw).replace(',', '.'));
    if (!precioRaw && precioRaw !== 0) {
      rowErrors.push({ field: 'precio', message: 'Campo obligatorio' });
    } else if (isNaN(precio) || precio < 0) {
      rowErrors.push({ field: 'precio', message: 'Debe ser un número positivo' });
    }

    const stockRaw = row.stock !== undefined && row.stock !== '' ? row.stock : '0';
    const stock = parseInt(String(stockRaw), 10);
    if (isNaN(stock) || stock < 0) {
      rowErrors.push({ field: 'stock', message: 'Debe ser un entero >= 0' });
    }

    const stockMinimoRaw = row.stock_minimo !== undefined && row.stock_minimo !== '' ? row.stock_minimo : '10';
    const stock_minimo = parseInt(String(stockMinimoRaw), 10);

    const unidad = row.unidad?.trim() || 'unidades';

    if (rowErrors.length) {
      errors.push({ row: row._row, errors: rowErrors });
    } else {
      valid.push({
        nombre,
        categoria: categoriaRaw,
        precio,
        stock: isNaN(stock) ? 0 : stock,
        stock_minimo: isNaN(stock_minimo) ? 10 : stock_minimo,
        unidad,
        restaurante_id: rid,
      });
    }
  }

  if (!valid.length) {
    return res.status(422).json({
      imported: 0,
      errors,
      message: 'Ninguna fila pasó la validación.',
    });
  }

  // ── Auto-create missing categories ──────────────────────────────────────────
  const uniqueCats = [...new Set(valid.map(r => r.categoria))];
  const existingCats = await req.prisma.categoria.findMany({
    where: { restaurante_id: rid, nombre: { in: uniqueCats } },
    select: { nombre: true },
  });
  const existingSet = new Set(existingCats.map(c => c.nombre));
  const missingCats = uniqueCats.filter(c => !existingSet.has(c));

  if (missingCats.length) {
    await req.prisma.categoria.createMany({
      data: missingCats.map(nombre => ({ nombre, restaurante_id: rid })),
      skipDuplicates: true,
    });
  }

  // ── Batch insert ─────────────────────────────────────────────────────────────
  const result = await req.prisma.producto.createMany({
    data: valid,
    skipDuplicates: false,
  });

  logger.info({ rid, imported: result.count, errors: errors.length }, 'productos import');

  res.status(201).json({
    imported: result.count,
    errors,
    message: `${result.count} producto(s) importado(s)${errors.length ? `, ${errors.length} fila(s) con errores` : ''}.`,
  });
});

// POST /api/productos
router.post('/', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre, categoria, precio, stock = 0 } = req.body;
    if (!nombre || !categoria || precio == null)
      return res.status(400).json({ error: 'nombre, categoria y precio requeridos' });

    const rid = RID(req);
    const cat = await req.prisma.categoria.findFirst({ where: { nombre: categoria, restaurante_id: rid } });
    if (!cat) return res.status(400).json({ error: `Categoría "${categoria}" no existe. Créala primero.` });

    const producto = await req.prisma.producto.create({
      data: { nombre: nombre.trim(), categoria, precio: parseFloat(precio), stock: parseInt(stock), restaurante_id: rid },
    });
    res.status(201).json(producto);
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/productos/:id
router.put('/:id', verifyRole('admin', 'gerente'), async (req, res) => {
  try {
    const { nombre, categoria, precio, stock } = req.body;
    if (!nombre || !categoria || precio == null)
      return res.status(400).json({ error: 'nombre, categoria y precio requeridos' });

    const id = parseInt(req.params.id);
    const exists = await req.prisma.producto.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Producto no encontrado' });

    const producto = await req.prisma.producto.update({
      where: { id },
      data: { nombre: nombre.trim(), categoria, precio: parseFloat(precio), stock: parseInt(stock ?? 0) },
    });
    res.json(producto);
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

// PATCH /api/productos/:id/stock
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta } = req.body;
    if (delta == null || isNaN(delta)) return res.status(400).json({ error: 'delta requerido' });

    const id = parseInt(req.params.id);
    const rid = RID(req);
    const prod = await req.prisma.producto.findFirst({ where: { id, restaurante_id: rid } });
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    const newStock = Math.max(0, prod.stock + parseInt(delta));
    const [producto] = await req.prisma.$transaction([
      req.prisma.producto.update({ where: { id }, data: { stock: newStock } }),
      req.prisma.inventarioMovimiento.create({
        data: {
          producto_id: id, usuario_id: req.user.id,
          tipo: delta > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(parseInt(delta)),
          motivo: 'Ajuste manual desde menú',
          restaurante_id: rid,
          stock_anterior: prod.stock,
        },
      }),
    ]);
    res.json({ id: producto.id, nombre: producto.nombre, stock: producto.stock });
  } catch (e) { logger.error({ err: e }, 'route error'); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/productos/:id — soft delete
router.delete('/:id', verifyRole('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exists = await req.prisma.producto.findFirst({ where: { id, restaurante_id: RID(req) } });
    if (!exists) return res.status(404).json({ error: 'Producto no encontrado' });
    await req.prisma.producto.update({ where: { id }, data: { activo: false } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
