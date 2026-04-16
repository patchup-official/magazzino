// routes/cassa_route.js v2
const express = require('express');
const router = express.Router();
function db(req) { return req.app.locals; }

const IVA = 0.22;
function scorporaIva(lordo) { return lordo / (1 + IVA); }
function ivaLordo(lordo) { return lordo - scorporaIva(lordo); }

function ensureTables(req) {
  db(req).run(`CREATE TABLE IF NOT EXISTS cassa_chiusure (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL UNIQUE,
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
    enwon_pay REAL DEFAULT 0,
    uscita_contante REAL DEFAULT 0,
    uscita_tipo TEXT DEFAULT 'contante',
    versamento_contante REAL DEFAULT 0,
    fattura_sifar REAL DEFAULT 0,
    acquisto_privati REAL DEFAULT 0,
    spostamento_contante REAL DEFAULT 0,
    note_credito REAL DEFAULT 0,
    fc_100 REAL DEFAULT 0, fc_50 REAL DEFAULT 0, fc_20 REAL DEFAULT 0,
    fc_10 REAL DEFAULT 0, fc_5 REAL DEFAULT 0, fc_2 REAL DEFAULT 0,
    fc_1 REAL DEFAULT 0, fc_050 REAL DEFAULT 0, fc_020 REAL DEFAULT 0,
    fc_010 REAL DEFAULT 0, fc_005 REAL DEFAULT 0, fc_002 REAL DEFAULT 0,
    fc_001 REAL DEFAULT 0,
    contante_da_versare REAL DEFAULT 0,
    note TEXT DEFAULT '',
    operatore TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  db(req).run(`CREATE TABLE IF NOT EXISTS cassa_config_mese (
    id TEXT PRIMARY KEY,
    mese INTEGER NOT NULL,
    anno INTEGER NOT NULL,
    accantonato REAL DEFAULT 0,
    agenzie_bonifico TEXT DEFAULT '["Compass","Stripe","Enwon Pay"]',
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(mese, anno)
  )`);
  db(req).run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_cassa_data ON cassa_chiusure(data)`);
}

function calcolaRiepilogo(chiusure, config) {
  const acc = config?.accantonato || 0;
  const totFiscale = chiusure.reduce((s,c) => s+(c.chiusura_fiscale||0), 0);
  const totFatture = chiusure.reduce((s,c) => s+(c.fatturato||0), 0);
  const totArt36 = chiusure.reduce((s,c) => s+(c.fatturato_art36||0), 0);
  const totNoteCredito = chiusure.reduce((s,c) => s+(c.note_credito||0), 0);
  const fiscaleNetto = scorporaIva(totFiscale);
  const fiscaleIva = ivaLordo(totFiscale);
  const fattureNetto = scorporaIva(totFatture);
  const fattureIva = ivaLordo(totFatture);
  const totAcquistiPrivati = chiusure.reduce((s,c) => s+(c.acquisto_privati||0), 0);
  const margineArt36 = Math.max(0, totArt36 - totAcquistiPrivati);
  const ivaArt36 = ivaLordo(margineArt36);
  const art36Netto = totArt36 - ivaArt36;
  const totIncasso = totFiscale + totFatture;
  const totIncassoNetto = fiscaleNetto + fattureNetto;
  const totIvaIncassata = fiscaleIva + fattureIva + ivaArt36;
  const totContanti = chiusure.reduce((s,c) => s+(c.contanti||0), 0);
  const totPos = chiusure.reduce((s,c) => s+(c.pos||0), 0);
  const totSatispay = chiusure.reduce((s,c) => s+(c.satispay||0), 0);
  const totAssegni = chiusure.reduce((s,c) => s+(c.assegni||0), 0);
  const totBonifico = chiusure.reduce((s,c) => s+(c.bonifico||0), 0);
  const totCompass = chiusure.reduce((s,c) => s+(c.compass||0), 0);
  const totStripe = chiusure.reduce((s,c) => s+(c.stripe||0), 0);
  const totEnwon = chiusure.reduce((s,c) => s+(c.enwon_pay||0), 0);
  const bonificiAgenzie = totCompass + totStripe + totEnwon;
  const totUsciteContante = chiusure.reduce((s,c) => {
    const uc = (c.uscita_tipo==='contante'||!c.uscita_tipo) ? (c.uscita_contante||0) : 0;
    return s + uc + (c.versamento_contante||0) + (c.fattura_sifar||0) + (c.acquisto_privati||0) + (c.spostamento_contante||0);
  }, 0);
  const contanteDaVersare = Math.max(0, totContanti - totUsciteContante - acc);
  return {
    accantonato: acc,
    tot_fiscale_lordo: totFiscale, tot_fiscale_netto: fiscaleNetto, tot_fiscale_iva: fiscaleIva,
    tot_fatture_lordo: totFatture, tot_fatture_netto: fattureNetto, tot_fatture_iva: fattureIva,
    tot_art36_lordo: totArt36, tot_art36_netto: art36Netto, tot_art36_iva: ivaArt36,
    tot_acquisti_privati: totAcquistiPrivati, margine_art36: margineArt36,
    tot_incasso_lordo: totIncasso, tot_incasso_netto: totIncassoNetto, tot_iva_incassata: totIvaIncassata,
    tot_contanti: totContanti, tot_pos: totPos, tot_satispay: totSatispay, tot_assegni: totAssegni,
    tot_bonifico: totBonifico, tot_compass: totCompass, tot_stripe: totStripe, tot_enwon: totEnwon,
    tot_uscite_contante: totUsciteContante, contante_da_versare: contanteDaVersare,
    bonifici_agenzie: bonificiAgenzie, bonifici_bancari: totBonifico,
    tot_note_credito: totNoteCredito, giorni: chiusure.length
  };
}

router.get('/config/:anno/:mese', (req, res) => {
  try {
    ensureTables(req);
    const row = db(req).get('SELECT * FROM cassa_config_mese WHERE anno=? AND mese=?', [req.params.anno, req.params.mese]);
    if (row) { try { row.agenzie_bonifico = JSON.parse(row.agenzie_bonifico); } catch {} }
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/config', (req, res) => {
  try {
    ensureTables(req);
    const { mese, anno, accantonato, agenzie_bonifico, note } = req.body;
    const existing = db(req).get('SELECT id FROM cassa_config_mese WHERE mese=? AND anno=?', [mese, anno]);
    const agStr = JSON.stringify(agenzie_bonifico || ['Compass','Stripe','Enwon Pay']);
    if (existing) {
      db(req).run("UPDATE cassa_config_mese SET accantonato=?,agenzie_bonifico=?,note=?,updated_at=datetime('now') WHERE id=?", [accantonato||0, agStr, note||'', existing.id]);
      res.json(db(req).get('SELECT * FROM cassa_config_mese WHERE id=?', [existing.id]));
    } else {
      const id = db(req).uid();
      db(req).run('INSERT INTO cassa_config_mese (id,mese,anno,accantonato,agenzie_bonifico,note) VALUES (?,?,?,?,?,?)', [id,mese,anno,accantonato||0,agStr,note||'']);
      res.status(201).json(db(req).get('SELECT * FROM cassa_config_mese WHERE id=?', [id]));
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/riepilogo/:anno/:mese', (req, res) => {
  try {
    ensureTables(req);
    const chiusure = db(req).query('SELECT * FROM cassa_chiusure WHERE anno=? AND mese=?', [req.params.anno, req.params.mese]);
    const config = db(req).get('SELECT * FROM cassa_config_mese WHERE anno=? AND mese=?', [req.params.anno, req.params.mese]);
    res.json(calcolaRiepilogo(chiusure, config));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/sommario', (req, res) => {
  try {
    ensureTables(req);
    const anno = parseInt(req.query.anno) || new Date().getFullYear();
    const rows = db(req).query(`SELECT mese, COUNT(*) as giorni, SUM(chiusura_fiscale) as tot_fiscale, SUM(fatturato) as tot_fatture, SUM(fatturato_art36) as tot_art36, SUM(note_credito) as tot_note_credito, SUM(contanti+pos+satispay+assegni+bonifico+compass+stripe+enwon_pay) as tot_incasso, SUM(contanti) as tot_contanti, SUM(pos) as tot_pos, SUM(satispay) as tot_satispay, SUM(assegni) as tot_assegni, SUM(bonifico) as tot_bonifico, SUM(compass) as tot_compass, SUM(stripe) as tot_stripe, SUM(enwon_pay) as tot_enwon, SUM(versamento_contante) as tot_versamenti, SUM(acquisto_privati) as tot_acquisti_privati, SUM(contante_da_versare) as tot_da_versare FROM cassa_chiusure WHERE anno=? GROUP BY mese ORDER BY mese`, [anno]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/oggi', (req, res) => {
  try {
    ensureTables(req);
    const today = new Date().toISOString().slice(0,10);
    res.json(db(req).get('SELECT * FROM cassa_chiusure WHERE data=?', [today]) || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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

router.get('/:data', (req, res) => {
  try {
    ensureTables(req);
    res.json(db(req).get('SELECT * FROM cassa_chiusure WHERE data=?', [req.params.data]) || null);
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
    const fields = ['chiusura_fiscale','fatturato','fatturato_art36','contanti','pos','satispay','assegni','bonifico','compass','stripe','enwon_pay','uscita_contante','uscita_tipo','versamento_contante','fattura_sifar','acquisto_privati','spostamento_contante','note_credito','fc_100','fc_50','fc_20','fc_10','fc_5','fc_2','fc_1','fc_050','fc_020','fc_010','fc_005','fc_002','fc_001','contante_da_versare','note','operatore'];
    if (existing) {
      const sets = fields.map(f => f+'=?').join(', ') + ", updated_at=datetime('now')";
      const vals = fields.map(f => d[f]!==undefined ? d[f] : (f==='uscita_tipo'?'contante':0));
      vals.push(existing.id);
      db(req).run('UPDATE cassa_chiusure SET '+sets+' WHERE id=?', vals);
      res.json(db(req).get('SELECT * FROM cassa_chiusure WHERE id=?', [existing.id]));
    } else {
      const id = db(req).uid();
      const cols = ['id','data','mese','anno',...fields].join(', ');
      const ph = ['?','?','?','?',...fields.map(()=>'?')].join(', ');
      const vals = [id, d.data, mese, anno, ...fields.map(f => d[f]!==undefined ? d[f] : (f==='uscita_tipo'?'contante':0))];
      db(req).run('INSERT INTO cassa_chiusure ('+cols+') VALUES ('+ph+')', vals);
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
