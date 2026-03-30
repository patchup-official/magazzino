// routes/devices.js - CRUD Dispositivi + Plugin Valutazione

const express = require('express');
const router = express.Router();

// ── Logica valutazione (business logic Magazzino) ─────────────
function evaluateDevice({ si_accende, schermo_rotto, batteria_ok }) {
  let prezzo = 300;
  const breakdown = [{ voce: 'Base', importo: 300 }];

  if (!si_accende) {
    prezzo -= 100;
    breakdown.push({ voce: 'Non si accende', importo: -100 });
  }
  if (schermo_rotto) {
    prezzo -= 50;
    breakdown.push({ voce: 'Schermo rotto', importo: -50 });
  }
  if (!batteria_ok) {
    prezzo -= 30;
    breakdown.push({ voce: 'Batteria KO', importo: -30 });
  }

  // Condizione automatica
  let condizione = 'A';
  if (!si_accende || schermo_rotto) condizione = 'C';
  else if (!batteria_ok) condizione = 'B';

  return {
    prezzo_cash: Math.max(prezzo, 0),
    prezzo_voucher: Math.round(Math.max(prezzo, 0) * 1.2),
    condizione,
    breakdown
  };
}

// GET /devices
router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { brand, stato, provenienza } = req.query;

  let query = 'SELECT * FROM devices';
  const params = [];
  const conditions = [];

  if (brand) { conditions.push('brand = ?'); params.push(brand); }
  if (stato) { conditions.push('stato = ?'); params.push(stato); }
  if (provenienza) { conditions.push('provenienza = ?'); params.push(provenienza); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  const devices = db.prepare(query).all(...params);
  res.json({ data: devices, total: devices.length });
});

// GET /devices/:id
router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  if (!device) return res.status(404).json({ error: 'Dispositivo non trovato' });
  res.json(device);
});

// POST /devices
router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const uid = req.app.locals.uid;
  const {
    brand, modello, storage, colore, imei,
    condizione = 'B', stato = 'in_stock',
    provenienza = 'fornitore',
    prezzo_acq = 0, prezzo_vend = 0,
    cliente_nome, cliente_tel, note
  } = req.body;

  if (!brand || !modello) {
    return res.status(400).json({ error: 'brand e modello sono obbligatori' });
  }

  const id = uid();

  try {
    db.prepare(`
      INSERT INTO devices
        (id, brand, modello, storage, colore, imei, condizione, stato, provenienza,
         prezzo_acq, prezzo_vend, cliente_nome, cliente_tel, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, brand, modello, storage, colore, imei || null, condizione, stato,
           provenienza, prezzo_acq, prezzo_vend, cliente_nome, cliente_tel, note);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'IMEI già presente in magazzino' });
    }
    throw err;
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  res.status(201).json(device);
});

// PUT /devices/:id
router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const existing = db.prepare('SELECT id FROM devices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Dispositivo non trovato' });

  const {
    brand, modello, storage, colore, imei,
    condizione, stato, provenienza,
    prezzo_acq, prezzo_vend, cliente_nome, cliente_tel, note
  } = req.body;

  db.prepare(`
    UPDATE devices SET brand=?, modello=?, storage=?, colore=?, imei=?,
      condizione=?, stato=?, provenienza=?, prezzo_acq=?, prezzo_vend=?,
      cliente_nome=?, cliente_tel=?, note=?
    WHERE id=?
  `).run(brand, modello, storage, colore, imei || null, condizione, stato,
         provenienza, prezzo_acq, prezzo_vend, cliente_nome, cliente_tel, note,
         req.params.id);

  res.json(db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id));
});

// DELETE /devices/:id
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const result = db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Dispositivo non trovato' });
  res.json({ message: 'Dispositivo eliminato' });
});

// ── PLUGIN ENDPOINTS ──────────────────────────────────────

// POST /devices/evaluate
// Calcola prezzo di acquisto da privato
router.post('/evaluate', (req, res) => {
  const { si_accende, schermo_rotto, batteria_ok } = req.body;

  if (si_accende === undefined || schermo_rotto === undefined || batteria_ok === undefined) {
    return res.status(400).json({ error: 'Tutti i campi condizione sono obbligatori' });
  }

  const result = evaluateDevice({ si_accende, schermo_rotto, batteria_ok });
  res.json(result);
});

// POST /devices/create-from-evaluation
// Crea dispositivo da valutazione plugin
router.post('/create-from-evaluation', (req, res) => {
  const db = req.app.locals.db;
  const uid = req.app.locals.uid;

  const {
    brand, modello, storage, colore, imei,
    si_accende, schermo_rotto, batteria_ok,
    tipo_pagamento = 'cash',
    cliente_nome, cliente_tel
  } = req.body;

  if (!brand || !modello || !cliente_nome || !cliente_tel) {
    return res.status(400).json({ error: 'brand, modello, cliente_nome e cliente_tel sono obbligatori' });
  }

  const evaluation = evaluateDevice({ si_accende, schermo_rotto, batteria_ok });
  const prezzo_acq = tipo_pagamento === 'voucher'
    ? evaluation.prezzo_voucher
    : evaluation.prezzo_cash;

  const id = uid();

  try {
    db.prepare(`
      INSERT INTO devices
        (id, brand, modello, storage, colore, imei, condizione, stato, provenienza,
         prezzo_acq, prezzo_vend, cliente_nome, cliente_tel)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'da_testare', 'privato', ?, 0, ?, ?)
    `).run(id, brand, modello, storage, colore, imei || null,
           evaluation.condizione, prezzo_acq, cliente_nome, cliente_tel);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'IMEI già presente in magazzino' });
    }
    throw err;
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  res.status(201).json({
    device,
    evaluation,
    prezzo_pagato: prezzo_acq,
    tipo_pagamento
  });
});

module.exports = router;
