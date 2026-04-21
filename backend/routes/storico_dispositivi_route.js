// routes/storico_dispositivi_route.js v1.0
const express = require('express');
const router = express.Router();
function db(req) { return req.app.locals; }

function ensureTables(req) {
  db(req).run(`CREATE TABLE IF NOT EXISTS storico_dispositivi (
    id TEXT PRIMARY KEY,
    data_acquisto TEXT NOT NULL,
    mese_acquisto INTEGER NOT NULL,
    anno_acquisto INTEGER NOT NULL,
    venditore_nome TEXT NOT NULL,
    venditore_cognome TEXT DEFAULT '',
    venditore_doc_tipo TEXT DEFAULT 'CI',
    venditore_doc_numero TEXT DEFAULT '',
    venditore_telefono TEXT DEFAULT '',
    venditore_indirizzo TEXT DEFAULT '',
    dispositivo_tipo TEXT DEFAULT 'Smartphone',
    dispositivo_marca TEXT NOT NULL,
    dispositivo_modello TEXT NOT NULL,
    dispositivo_imei TEXT DEFAULT '',
    dispositivo_seriale TEXT DEFAULT '',
    dispositivo_colore TEXT DEFAULT '',
    dispositivo_storage TEXT DEFAULT '',
    dispositivo_condizione TEXT DEFAULT 'buono',
    dispositivo_note TEXT DEFAULT '',
    prezzo_acquisto REAL NOT NULL DEFAULT 0,
    stato TEXT DEFAULT 'in_magazzino',
    data_vendita TEXT DEFAULT '',
    mese_vendita INTEGER DEFAULT 0,
    anno_vendita INTEGER DEFAULT 0,
    acquirente_tipo TEXT DEFAULT 'privato',
    acquirente_nome TEXT DEFAULT '',
    acquirente_cognome TEXT DEFAULT '',
    acquirente_email TEXT DEFAULT '',
    acquirente_telefono TEXT DEFAULT '',
    acquirente_cf TEXT DEFAULT '',
    acquirente_piva TEXT DEFAULT '',
    acquirente_ragione_sociale TEXT DEFAULT '',
    acquirente_indirizzo TEXT DEFAULT '',
    acquirente_cap TEXT DEFAULT '',
    acquirente_citta TEXT DEFAULT '',
    acquirente_provincia TEXT DEFAULT '',
    prezzo_vendita REAL DEFAULT 0,
    margine_art36 REAL DEFAULT 0,
    iva_sul_margine REAL DEFAULT 0,
    fattura_numero TEXT DEFAULT '',
    fattura_inviata INTEGER DEFAULT 0,
    fattura_data TEXT DEFAULT '',
    operatore TEXT DEFAULT '',
    note_vendita TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  db(req).run('CREATE INDEX IF NOT EXISTS idx_sd_stato ON storico_dispositivi(stato)');
  db(req).run('CREATE INDEX IF NOT EXISTS idx_sd_acq ON storico_dispositivi(anno_acquisto,mese_acquisto)');
  db(req).run('CREATE INDEX IF NOT EXISTS idx_sd_vend ON storico_dispositivi(anno_vendita,mese_vendita)');
}

const IVA = 0.22;
function calcolaIva(m) { return Math.max(0,m)/(1+IVA)*IVA; }

router.get('/', (req,res) => {
  try {
    ensureTables(req);
    const {stato,anno,mese,anno_vendita,mese_vendita,q} = req.query;
    let sql = 'SELECT * FROM storico_dispositivi WHERE 1=1';
    const p = [];
    if(stato){sql+=' AND stato=?';p.push(stato);}
    if(anno){sql+=' AND anno_acquisto=?';p.push(parseInt(anno));}
    if(mese){sql+=' AND mese_acquisto=?';p.push(parseInt(mese));}
    if(anno_vendita){sql+=' AND anno_vendita=?';p.push(parseInt(anno_vendita));}
    if(mese_vendita){sql+=' AND mese_vendita=?';p.push(parseInt(mese_vendita));}
    if(q){sql+=' AND (dispositivo_modello LIKE ? OR dispositivo_marca LIKE ? OR dispositivo_imei LIKE ? OR venditore_nome LIKE ? OR acquirente_nome LIKE ?)';const l='%'+q+'%';p.push(l,l,l,l,l);}
    sql+=' ORDER BY data_acquisto DESC, created_at DESC';
    res.json(db(req).query(sql,p));
  } catch(e){res.status(500).json({error:e.message});}
});

router.get('/magazzino', (req,res) => {
  try {
    ensureTables(req);
    res.json(db(req).query("SELECT * FROM storico_dispositivi WHERE stato='in_magazzino' ORDER BY data_acquisto DESC"));
  } catch(e){res.status(500).json({error:e.message});}
});

router.get('/riepilogo-mese/:anno/:mese', (req,res) => {
  try {
    ensureTables(req);
    const {anno,mese} = req.params;
    const acquisti = db(req).query('SELECT * FROM storico_dispositivi WHERE anno_acquisto=? AND mese_acquisto=?',[anno,mese]);
    const vendite = db(req).query("SELECT * FROM storico_dispositivi WHERE anno_vendita=? AND mese_vendita=? AND stato='venduto'",[anno,mese]);
    res.json({
      anno, mese,
      acquisti:{count:acquisti.length,totale:acquisti.reduce((s,r)=>s+(r.prezzo_acquisto||0),0),righe:acquisti},
      vendite:{count:vendite.length,totale:vendite.reduce((s,r)=>s+(r.prezzo_vendita||0),0),
        totale_margine:vendite.reduce((s,r)=>s+(r.margine_art36||0),0),
        totale_iva:vendite.reduce((s,r)=>s+(r.iva_sul_margine||0),0),righe:vendite}
    });
  } catch(e){res.status(500).json({error:e.message});}
});

router.get('/:id', (req,res) => {
  try {
    ensureTables(req);
    const row = db(req).get('SELECT * FROM storico_dispositivi WHERE id=?',[req.params.id]);
    if(!row) return res.status(404).json({error:'Non trovato'});
    res.json(row);
  } catch(e){res.status(500).json({error:e.message});}
});

router.post('/', (req,res) => {
  try {
    ensureTables(req);
    const d = req.body;
    if(!d.venditore_nome) return res.status(400).json({error:'venditore_nome obbligatorio'});
    if(!d.dispositivo_modello) return res.status(400).json({error:'dispositivo_modello obbligatorio'});
    if(d.prezzo_acquisto===undefined) return res.status(400).json({error:'prezzo_acquisto obbligatorio'});
    const dt = d.data_acquisto||new Date().toISOString().slice(0,10);
    const dateObj = new Date(dt);
    const id = db(req).uid();
    db(req).run(`INSERT INTO storico_dispositivi
      (id,data_acquisto,mese_acquisto,anno_acquisto,
       venditore_nome,venditore_cognome,venditore_doc_tipo,venditore_doc_numero,venditore_telefono,venditore_indirizzo,
       dispositivo_tipo,dispositivo_marca,dispositivo_modello,dispositivo_imei,dispositivo_seriale,
       dispositivo_colore,dispositivo_storage,dispositivo_condizione,dispositivo_note,
       prezzo_acquisto,stato,operatore)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id,dt,dateObj.getMonth()+1,dateObj.getFullYear(),
       d.venditore_nome,d.venditore_cognome||'',d.venditore_doc_tipo||'CI',d.venditore_doc_numero||'',
       d.venditore_telefono||'',d.venditore_indirizzo||'',
       d.dispositivo_tipo||'Smartphone',d.dispositivo_marca||'',d.dispositivo_modello,
       d.dispositivo_imei||'',d.dispositivo_seriale||'',d.dispositivo_colore||'',
       d.dispositivo_storage||'',d.dispositivo_condizione||'buono',d.dispositivo_note||'',
       +d.prezzo_acquisto,'in_magazzino',d.operatore||'']);
    res.status(201).json(db(req).get('SELECT * FROM storico_dispositivi WHERE id=?',[id]));
  } catch(e){res.status(500).json({error:e.message});}
});

router.put('/:id/vendi', (req,res) => {
  try {
    ensureTables(req);
    const d = req.body;
    const existing = db(req).get('SELECT * FROM storico_dispositivi WHERE id=?',[req.params.id]);
    if(!existing) return res.status(404).json({error:'Non trovato'});
    if(existing.stato==='venduto') return res.status(400).json({error:'Già venduto'});
    if(!d.acquirente_nome) return res.status(400).json({error:'acquirente_nome obbligatorio'});
    if(!d.acquirente_email) return res.status(400).json({error:'acquirente_email obbligatoria'});
    if(!d.prezzo_vendita||+d.prezzo_vendita<=0) return res.status(400).json({error:'prezzo_vendita obbligatorio'});
    const dt = d.data_vendita||new Date().toISOString().slice(0,10);
    const dateObj = new Date(dt);
    const margine = Math.max(0,+d.prezzo_vendita-existing.prezzo_acquisto);
    const iva = calcolaIva(margine);
    db(req).run(`UPDATE storico_dispositivi SET
      stato='venduto',data_vendita=?,mese_vendita=?,anno_vendita=?,
      acquirente_tipo=?,acquirente_nome=?,acquirente_cognome=?,acquirente_email=?,
      acquirente_telefono=?,acquirente_cf=?,acquirente_piva=?,acquirente_ragione_sociale=?,
      acquirente_indirizzo=?,acquirente_cap=?,acquirente_citta=?,acquirente_provincia=?,
      prezzo_vendita=?,margine_art36=?,iva_sul_margine=?,
      fattura_numero=?,operatore=?,note_vendita=?,updated_at=datetime('now')
      WHERE id=?`,
      [dt,dateObj.getMonth()+1,dateObj.getFullYear(),
       d.acquirente_tipo||'privato',d.acquirente_nome,d.acquirente_cognome||'',
       d.acquirente_email,d.acquirente_telefono||'',d.acquirente_cf||'',
       d.acquirente_piva||'',d.acquirente_ragione_sociale||'',
       d.acquirente_indirizzo||'',d.acquirente_cap||'',d.acquirente_citta||'',d.acquirente_provincia||'',
       +d.prezzo_vendita,margine,iva,
       d.fattura_numero||'',d.operatore||'',d.note_vendita||'',req.params.id]);
    res.json(db(req).get('SELECT * FROM storico_dispositivi WHERE id=?',[req.params.id]));
  } catch(e){res.status(500).json({error:e.message});}
});

router.put('/:id', (req,res) => {
  try {
    ensureTables(req);
    const d = req.body;
    const existing = db(req).get('SELECT id,prezzo_acquisto FROM storico_dispositivi WHERE id=?',[req.params.id]);
    if(!existing) return res.status(404).json({error:'Non trovato'});
    const pa = d.prezzo_acquisto!==undefined?+d.prezzo_acquisto:existing.prezzo_acquisto;
    const pv = d.prezzo_vendita?+d.prezzo_vendita:0;
    const margine = pv?Math.max(0,pv-pa):0;
    db(req).run(`UPDATE storico_dispositivi SET
      dispositivo_tipo=COALESCE(?,dispositivo_tipo),dispositivo_marca=COALESCE(?,dispositivo_marca),
      dispositivo_modello=COALESCE(?,dispositivo_modello),dispositivo_imei=COALESCE(?,dispositivo_imei),
      dispositivo_condizione=COALESCE(?,dispositivo_condizione),dispositivo_note=COALESCE(?,dispositivo_note),
      prezzo_acquisto=COALESCE(?,prezzo_acquisto),prezzo_vendita=COALESCE(?,prezzo_vendita),
      margine_art36=?,iva_sul_margine=?,operatore=COALESCE(?,operatore),
      updated_at=datetime('now') WHERE id=?`,
      [d.dispositivo_tipo,d.dispositivo_marca,d.dispositivo_modello,d.dispositivo_imei,
       d.dispositivo_condizione,d.dispositivo_note,
       d.prezzo_acquisto!==undefined?pa:null,pv||null,
       margine,calcolaIva(margine),d.operatore,req.params.id]);
    res.json(db(req).get('SELECT * FROM storico_dispositivi WHERE id=?',[req.params.id]));
  } catch(e){res.status(500).json({error:e.message});}
});

router.delete('/:id', (req,res) => {
  try { db(req).run('DELETE FROM storico_dispositivi WHERE id=?',[req.params.id]); res.json({ok:true}); }
  catch(e){res.status(500).json({error:e.message});}
});

module.exports = { router };
