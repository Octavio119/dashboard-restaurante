import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, X, CheckCircle, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../../api';

// ── Template definition ───────────────────────────────────────────────────────
const TEMPLATE_COLUMNS = ['nombre', 'precio', 'categoria', 'stock', 'stock_minimo', 'unidad'];
const TEMPLATE_EXAMPLES = [
  ['Pizza Margherita', 12990, 'Pizzas', 50, 5, 'unidades'],
  ['Coca-Cola 500ml',  1990,  'Bebidas', 100, 10, 'unidades'],
  ['Ensalada César',   8500,  'Ensaladas', 30, 3, 'unidades'],
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, ...TEMPLATE_EXAMPLES]);
  ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla_productos_mastexopos.xlsx');
}

// ── Parse file client-side for preview ───────────────────────────────────────
function parseFilePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!rows.length) return resolve({ headers: [], preview: [], total: 0 });
        const headers = rows[0].map(h => String(h).trim());
        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));
        const preview  = dataRows.slice(0, 5).map(r => headers.map((_, i) => String(r[i] ?? '').trim()));
        resolve({ headers, preview, total: dataRows.length });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────
const ACCEPTED = '.xlsx,.xls,.csv';

function DropZone({ onFile, isDragging, setIsDragging }) {
  const inputRef = useRef(null);

  const handle = useCallback((file) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      alert('Solo se aceptan archivos .xlsx, .xls o .csv');
      return;
    }
    onFile(file);
  }, [onFile]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setIsDragging(false);
        handle(e.dataTransfer.files[0]);
      }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all select-none"
      style={{
        minHeight: 160,
        border: `2px dashed ${isDragging ? '#8B5CF6' : 'rgba(255,255,255,0.1)'}`,
        background: isDragging ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={e => handle(e.target.files[0])}
      />
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
        <Upload size={22} style={{ color: '#8B5CF6' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-300">Arrastra tu archivo aquí</p>
        <p className="text-xs text-zinc-500 mt-0.5">o haz clic para seleccionar · .xlsx, .xls, .csv</p>
      </div>
    </div>
  );
}

function PreviewTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-zinc-400 whitespace-nowrap uppercase tracking-wider" style={{ fontSize: 10 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-zinc-300 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ErrorList({ errors }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? errors : errors.slice(0, 5);
  return (
    <div className="flex flex-col gap-1.5">
      {visible.map((e, i) => (
        <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#F87171' }} />
          <span className="text-red-300">
            <span className="font-semibold">Fila {e.row}:</span>{' '}
            {e.errors.map(er => `${er.field} — ${er.message}`).join(' · ')}
          </span>
        </div>
      ))}
      {errors.length > 5 && (
        <button onClick={() => setExpanded(x => !x)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-left pl-1">
          {expanded ? 'Ver menos' : `+ ${errors.length - 5} errores más`}
        </button>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function ImportProductosModal({ onClose, onSuccess }) {
  const [isDragging,    setIsDragging]    = useState(false);
  const [file,          setFile]          = useState(null);
  const [preview,       setPreview]       = useState(null);   // { headers, preview, total }
  const [parseError,    setParseError]    = useState(null);
  const [status,        setStatus]        = useState('idle'); // idle | previewing | importing | done | error
  const [result,        setResult]        = useState(null);   // { imported, errors, message }
  const [importError,   setImportError]   = useState(null);

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setParseError(null);
    setPreview(null);
    setStatus('previewing');
    try {
      const p = await parseFilePreview(f);
      setPreview(p);
    } catch {
      setParseError('No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.');
      setStatus('idle');
    }
  }, []);

  const handleImport = async () => {
    if (!file) return;
    setStatus('importing');
    setImportError(null);
    try {
      const res = await api.importProductos(file);
      setResult(res);
      setStatus('done');
      if (res.imported > 0) onSuccess?.();
    } catch (err) {
      setImportError(err.message || 'Error al importar');
      setStatus('error');
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setParseError(null);
    setStatus('idle');
    setResult(null);
    setImportError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-2xl flex flex-col gap-5 rounded-2xl p-6"
        style={{ background: '#0F0F17', border: '1px solid rgba(255,255,255,0.07)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <FileSpreadsheet size={18} style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Importar productos</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Excel (.xlsx) o CSV · hasta 5 MB · 200 productos por lote</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Template download */}
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 self-start text-xs font-semibold transition-colors cursor-pointer px-3 py-2 rounded-lg"
          style={{ color: '#10B981', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.07)'}
        >
          <Download size={13} /> Descargar plantilla de ejemplo
        </button>

        <AnimatePresence mode="wait">
          {/* ── IDLE / DROP ZONE ── */}
          {(status === 'idle' || status === 'previewing') && !preview && (
            <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DropZone onFile={handleFile} isDragging={isDragging} setIsDragging={setIsDragging} />
              {parseError && (
                <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={13} /> {parseError}
                </p>
              )}
            </motion.div>
          )}

          {/* ── PREVIEW ── */}
          {preview && status !== 'done' && (
            <motion.div key="preview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={14} style={{ color: '#8B5CF6' }} />
                  <span className="text-sm font-semibold text-zinc-200 truncate max-w-[260px]">{file?.name}</span>
                  <span className="text-xs text-zinc-500">· {preview.total} filas detectadas</span>
                </div>
                <button onClick={reset} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Cambiar archivo</button>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Primeras {preview.preview.length} filas</p>
                <PreviewTable headers={preview.headers} rows={preview.preview} />
                {preview.total > 5 && (
                  <p className="text-xs text-zinc-600 mt-1.5">
                    … y {preview.total - 5} fila{preview.total - 5 !== 1 ? 's' : ''} más
                  </p>
                )}
              </div>

              {importError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle size={13} /> {importError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  style={{ height: 42, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#A1A1AA' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={status === 'importing'}
                  className="flex-1 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ height: 42, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff' }}
                >
                  {status === 'importing' ? (
                    <><Loader2 size={15} className="animate-spin" /> Importando…</>
                  ) : (
                    <><Upload size={15} /> Confirmar importación</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {status === 'done' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              {/* Success banner */}
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-bold text-emerald-400">
                    {result.imported} producto{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''}
                  </p>
                  {result.errors?.length > 0 && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {result.errors.length} fila{result.errors.length !== 1 ? 's' : ''} con error{result.errors.length !== 1 ? 'es' : ''} — no se importaron
                    </p>
                  )}
                </div>
              </div>

              {/* Error detail */}
              {result.errors?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} style={{ color: '#F59E0B' }} /> Filas con errores
                  </p>
                  <ErrorList errors={result.errors} />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {result.errors?.length > 0 && (
                  <button
                    onClick={reset}
                    className="flex-1 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    style={{ height: 42, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#A1A1AA' }}
                  >
                    Corregir y reimportar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                  style={{ height: 42, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff' }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Columns guide */}
        {status === 'idle' && !preview && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Columnas del archivo</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                { col: 'nombre',       req: true,  desc: 'Nombre del producto' },
                { col: 'precio',       req: true,  desc: 'Precio de venta (número)' },
                { col: 'categoria',    req: true,  desc: 'Categoría (se crea si no existe)' },
                { col: 'stock',        req: false, desc: 'Stock inicial (default: 0)' },
                { col: 'stock_minimo', req: false, desc: 'Stock mínimo (default: 10)' },
                { col: 'unidad',       req: false, desc: 'Unidad (default: unidades)' },
              ].map(({ col, req, desc }) => (
                <div key={col} className="flex items-start gap-2">
                  <span className="font-mono text-[11px] font-semibold shrink-0" style={{ color: req ? '#8B5CF6' : '#52525B' }}>
                    {col}
                    {req && <span className="text-red-400 ml-0.5">*</span>}
                  </span>
                  <span className="text-[11px] text-zinc-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
