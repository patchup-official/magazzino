// routes/cassa_route.js
// Plugin Cassa — chiusura giornaliera negozio
const express = require('express');
const router = express.Router();

function db(req) { return req.app.locals; }

function ensureTables(req) {
  db(req).run(`CREATE TABLE IF NOT EXISTS cassa_chiusure (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    chiusura_fiscale REAL DEFAULT 0,
    fatturato REAL DEFAULT 0,
    fatturato_art36 REAL DEFAULT 0,
    contanti REAL DEFAULT 0,
    pos REAL DEFAULT 0,
    satispay REAL DEFAULT 0,
    assegni REAL DEFAULT 0,
    bonifico REAL DEFAULT 0,
    compass REAL DEFAULT 0,
    stripe REAL DEFAULT 0,
    uscita_contante REAL DEFAULT 0,
    versamento_contante REAL DEFAULT 0,
    fattura_sifar REAL DEFAULT 0,
    acquisto_privati REAL DEFAULT 0,
    spostamento_contante REAL DEFAULT 0,
    fc_100 REAL DEFAULT 0,
    fc_50 REAL DEFAULT 0,
    fc_20 REAL DEFAULT 0,
    fc_10 REAL DEFAULT 0,
    fc_5 REAL DEFAULT 0,
    fc_2 REAL DEFAULT 0,
    fc_1 REAL DEFAULT 0,
    fc_050 REAL DEFAULT 0,
    fc_020 REAL DEFAULT 0,
    fc_010 REAL DEFAULT 0,
    fc_005 REAL DEFAULT 0,
    fc_002 REAL DEFAULT 0,
    fc_001 REAL DEFAULT 0,
    contante_da_versare REAL DEFAULT 0,
    note TEXT DEFAULT '',
    operatore TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  db(req).run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_cassa_data ON cassa_chiusure(data)`);
}

router.get('/', (req, res) => {
  try {
    ensureTables(req);
    const { mese, anno } = req.query;
    let sql = 'SELECT * FROM cassa_chiusure WHERE 1=1';
    const params = [];
    if (anno) { sql += ' AND anno=?'; params.push(parseInt(anno)); }
    if (mese) { sql += ' AND mese=?'; params.push(parseInt(mese)); }
    sql += ' ORDER BY data DESC';
    res.json(db(req).query(sql, params));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/sommario', (req, res) => {
  try {
    ensureTables(req);
    const anno = parseInt(req.query.anno) || new Date().getFullYear();
    const rows = db(req).query(`
      SELECT
        mese,
        COUNT(*) as giorni,
        SUM(chiusura_fiscale) as tot_fiscale,
        SUM(fatturato) as tot_fatture,
        SUM(fatturato_art36) as tot_art36,
        SUM(contanti+pos+satispay+assegni+bonifico+compass+stripe) as tot_incasso,
        SUM(contanti) as tot_contanti,
        SUM(pos) as tot_pos,
        SUM(satispay) as tot_satispay,
        SUM(assegni) as tot_assegni,
        SUM(bonifico) as tot_bonifico,
        SUM(compass) as tot_compass,
        SUM(stripe) as tot_stripe,
        SUM(versamento_contante) as tot_versamenti,
        SUM(acquisto_privati) as tot_acquisti_privati,
        SUM(contante_da_versare) as tot_da_versare
      FROM cassa_chiusure
      WHERE anno=?
      GROUP BY mese
      ORDER BY mese
    `, [anno]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/oggi', (req, res) => {
  try {
    ensureTables(req);
    const today = new Date().toISOString().slice(0, 10);
    const row = db(req).get('SELECT * FROM cassa_chiusure WHERE data=?', [today]);
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:data', (req, res) => {
  try {
    ensureTables(req);
    const row = db(req).get('SELECT * FROM cassa_chiusure WHERE data=?', [req.params.data]);
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    ensureTables(req);
    const d = req.body;
    if (!d.data) return res.status(400).json({ error: 'Data obbligatoria' });
    const dateObj = new Date(d.data);
    const mese = dateObj.getMonth() + 1;
    const anno = dateObj.getFullYear();
    const existing = db(req).get('SELECT id FROM cassa_chiusure WHERE data=?', [d.data]);
    const fields = [
      'chiusura_fiscale', 'fatturato', 'fatturato_art36',
      'contanti', 'pos', 'satispay', 'assegni', 'bonifico', 'compass', 'stripe',
      'uscita_contante', 'versamento_contante', 'fattura_sifar', 'acquisto_privati', 'spostamento_contante',
      'fc_100', 'fc_50', 'fc_20', 'fc_10', 'fc_5', 'fc_2', 'fc_1',
      'fc_050', 'fc_020', 'fc_010', 'fc_005', 'fc_002', 'fc_001',
      'contante_da_versare', 'note', 'operatore'
    ];
    if (existing) {
      const sets = fields.map(f => f + '=?').join(', ') + ", updated_at=datetime('now')";
      const vals = fields.map(f => d[f] !== undefined ? d[f] : 0);
      vals.push(existing.id);
      db(req).run('UPDATE cassa_chiusure SET ' + sets + ' WHERE id=?', vals);
      res.json(db(req).get('SELECT * FROM cassa_chiusure WHERE id=?', [existing.id]));
    } else {
      const id = db(req).uid();
      const cols = ['id', 'data', 'mese', 'anno', ...fields].join(', ');
      const ph = ['?', '?', '?', '?', ...fields.map(() => '?')].join(', ');
      const vals = [id, d.data, mese, anno, ...fields.map(f => d[f] !== undefined ? d[f] : 0)];
      db(req).run('INSERT INTO cassa_chiusure (' + cols + ') VALUES (' + ph + ')', vals);
      res.status(201).json(db(req).get('SELECT * FROM cassa_chiusure WHERE id=?', [id]));
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:data', (req, res) => {
  try {
    db(req).run('DELETE FROM cassa_chiusure WHERE data=?', [req.params.data]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = { router };
