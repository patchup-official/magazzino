// routes/display_ordini_route.js
// Gestione ordini display buyback: fornitori, ordini, articoli, stati
const express = require('express');
const router = express.Router();

function db(req) { return req.app.locals; }

function ensureFornitori(req) {
  db(req).run(`CREATE TABLE IF NOT EXISTS display_fornitori (
    id TEXT PRIMARY KEY, nome TEXT NOT NULL,
    email TEXT DEFAULT '', telefono TEXT DEFAULT '',
    note TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
  )`);
}

// FORNITORI
router.get('/suppliers', (req, res) => {
  try { ensureFornitori(req); res.json(db(req).query('SELECT * FROM display_fornitori ORDER BY nome')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/suppliers', (req, res) => {
  try {
    ensureFornitori(req);
    const { name, email, phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome fornitore obbligatorio' });
    const id = db(req).uid();
    db(req).run('INSERT INTO display_fornitori (id,nome,email,telefono,note) VALUES (?,?,?,?,?)', [id, name, email||'', phone||'', notes||'']);
    res.status(201).json(db(req).get('SELECT * FROM display_fornitori WHERE id=?', [id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/suppliers/:id', (req, res) => {
  try {
    ensureFornitori(req);
    const { name, email, phone, notes } = req.body;
    db(req).run('UPDATE display_fornitori SET nome=?,email=?,telefono=?,note=? WHERE id=?', [name, email||'', phone||'', notes||'', req.params.id]);
    res.json(db(req).get('SELECT * FROM display_fornitori WHERE id=?', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/suppliers/:id', (req, res) => {
  try { ensureFornitori(req); db(req).run('DELETE FROM display_fornitori WHERE id=?', [req.params.id]); res.json({ message: 'Fornitore eliminato' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// HELPERS
function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  return `ORD-${y}${m}${d}-${Math.floor(Math.random()*9000)+1000}`;
}

function getOrderWithItems(req, id) {
  const ordine = db(req).get(`
    SELECT o.*, f.nome as supplier_name, f.email as supplier_email, f.telefono as supplier_phone
    FROM display_ordini o LEFT JOIN display_fornitori f ON o.fornitore_id=f.id WHERE o.id=?`, [id]);
  if (!ordine) return null;
  ordine.items = db(req).query('SELECT * FROM display_ordini_items WHERE ordine_id=? ORDER BY brand,modello', [id]);
  const totale = ordine.items.reduce((s,i) => s+(i.prezzo_unitario*i.quantita), 0);
  db(req).run('UPDATE display_ordini SET totale=? WHERE id=?', [totale, id]);
  ordine.totale = totale;
  return ordine;
}

// ORDINI
router.get('/', (req, res) => {
  try {
    ensureFornitori(req);
    res.json(db(req).query(`
      SELECT o.*, f.nome as supplier_name, f.email as supplier_email,
        (SELECT COUNT(*) FROM display_ordini_items WHERE ordine_id=o.id) as items_count
      FROM display_ordini o LEFT JOIN display_fornitori f ON o.fornitore_id=f.id
      ORDER BY o.created_at DESC`));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/open', (req, res) => {
  try {
    ensureFornitori(req);
    const ordine = db(req).get(`
      SELECT o.*, f.nome as supplier_name, f.email as supplier_email, f.telefono as supplier_phone
      FROM display_ordini o LEFT JOIN display_fornitori f ON o.fornitore_id=f.id
      WHERE o.stato='aperto' ORDER BY o.created_at DESC LIMIT 1`);
    if (!ordine) return res.json(null);
    ordine.items = db(req).query('SELECT * FROM display_ordini_items WHERE ordine_id=? ORDER BY brand,modello', [ordine.id]);
    res.json(ordine);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    ensureFornitori(req);
    const o = getOrderWithItems(req, req.params.id);
    if (!o) return res.status(404).json({ error: 'Ordine non trovato' });
    res.json(o);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    ensureFornitori(req);
    const existing = db(req).get("SELECT id FROM display_ordini WHERE stato='aperto' LIMIT 1");
    if (existing) return res.status(409).json({ error: 'Esiste gia un ordine aperto. Chiudilo prima di crearne uno nuovo.' });
    const { supplier_id, notes } = req.body;
    const id = db(req).uid();
    db(req).run('INSERT INTO display_ordini (id,numero,fornitore_id,note,stato) VALUES (?,?,?,?,?)',
      [id, generateOrderNumber(), supplier_id||null, notes||'', 'aperto']);
    res.status(201).json(getOrderWithItems(req, id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { supplier_id, notes } = req.body;
    const forn = supplier_id ? db(req).get('SELECT * FROM display_fornitori WHERE id=?', [supplier_id]) : null;
    db(req).run('UPDATE display_ordini SET fornitore_id=?,fornitore_nome=?,fornitore_email=?,fornitore_tel=?,note=? WHERE id=?',
      [supplier_id||null, forn?forn.nome:'', forn?forn.email:'', forn?forn.telefono:'', notes||'', req.params.id]);
    res.json(getOrderWithItems(req, req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const map = { open:'aperto', pdf_generated:'pdf_generato', waiting_payment:'inviato', paid:'pagato' };
    const s = map[status] || status;
    const valid = ['aperto','pdf_generato','inviato','pagato'];
    if (!valid.includes(s)) return res.status(400).json({ error: 'Stato non valido' });
    db(req).run('UPDATE display_ordini SET stato=? WHERE id=?', [s, req.params.id]);
    if (s==='pdf_generato') db(req).run('UPDATE display_ordini SET pdf_generato_at=? WHERE id=?', [new Date().toISOString(), req.params.id]);
    if (s==='inviato') db(req).run('UPDATE display_ordini SET inviato_at=? WHERE id=?', [new Date().toISOString(), req.params.id]);
    if (s==='pagato') db(req).run('UPDATE display_ordini SET pagato_at=? WHERE id=?', [new Date().toISOString(), req.params.id]);
    res.json(getOrderWithItems(req, req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db(req).run('DELETE FROM display_ordini_items WHERE ordine_id=?', [req.params.id]);
    db(req).run('DELETE FROM display_ordini WHERE id=?', [req.params.id]);
    res.json({ message: 'Ordine eliminato' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ITEMS
router.post('/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const { brand, model, quantity, unit_price, notes } = req.body;
    if (!brand||!model||!quantity||!unit_price) return res.status(400).json({ error: 'Dati incompleti' });
    const ordine = db(req).get('SELECT stato FROM display_ordini WHERE id=?', [id]);
    if (!ordine||ordine.stato!=='aperto') return res.status(400).json({ error: 'Puoi aggiungere display solo a ordini aperti' });
    const existing = db(req).get('SELECT id,quantita FROM display_ordini_items WHERE ordine_id=? AND brand=? AND modello=?', [id, brand, model]);
    if (existing) {
      db(req).run('UPDATE display_ordini_items SET quantita=? WHERE id=?', [existing.quantita+parseInt(quantity), existing.id]);
    } else {
      db(req).run('INSERT INTO display_ordini_items (id,ordine_id,brand,modello,quantita,prezzo_unitario,prezzo_offerta,note) VALUES (?,?,?,?,?,?,?,?)',
        [db(req).uid(), id, brand, model, parseInt(quantity), parseFloat(unit_price), parseFloat(unit_price), notes||'']);
    }
    const items = db(req).query('SELECT * FROM display_ordini_items WHERE ordine_id=?', [id]);
    db(req).run('UPDATE display_ordini SET totale=? WHERE id=?', [items.reduce((s,i)=>s+(i.prezzo_unitario*i.quantita),0), id]);
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/items/:itemId', (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { quantity } = req.body;
    if (!quantity||quantity<1) return res.status(400).json({ error: 'Quantita non valida' });
    db(req).run('UPDATE display_ordini_items SET quantita=? WHERE id=? AND ordine_id=?', [parseInt(quantity), itemId, id]);
    const items = db(req).query('SELECT * FROM display_ordini_items WHERE ordine_id=?', [id]);
    db(req).run('UPDATE display_ordini SET totale=? WHERE id=?', [items.reduce((s,i)=>s+(i.prezzo_unitario*i.quantita),0), id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/items/:itemId', (req, res) => {
  try {
    const { id, itemId } = req.params;
    db(req).run('DELETE FROM display_ordini_items WHERE id=? AND ordine_id=?', [itemId, id]);
    const items = db(req).query('SELECT * FROM display_ordini_items WHERE ordine_id=?', [id]);
    db(req).run('UPDATE display_ordini SET totale=? WHERE id=?', [items.reduce((s,i)=>s+(i.prezzo_unitario*i.quantita),0), id]);
    res.json({ message: 'Articolo rimosso' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = { router };
