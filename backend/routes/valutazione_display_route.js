// routes/valutazione_display_route.js
// Gestione listino display: upload, ricerca prezzi, impostazioni margine, dati azienda
const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const upload = multer({ storage: multer.memoryStorage() });

function db(req) { return req.app.locals; }

// IMPOSTAZIONI MARGINE
router.get('/settings', (req, res) => {
  try {
    const row = db(req).get("SELECT valore FROM display_settings WHERE chiave='margine_percentuale'");
    const tipo = db(req).get("SELECT valore FROM display_settings WHERE chiave='margine_tipo'");
    res.json({
      global_margin_type: (tipo && tipo.valore) || 'percentage',
      global_margin_value: row ? parseFloat(row.valore) : 20
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/settings', (req, res) => {
  try {
    const { global_margin_type, global_margin_value } = req.body;
    const value = parseFloat(global_margin_value);
    if (isNaN(value) || value < 0) return res.status(400).json({ error: 'Valore margine non valido' });
    const tipo = global_margin_type === 'fixed' ? 'fixed' : 'percentage';
    const existe = db(req).get("SELECT chiave FROM display_settings WHERE chiave='margine_percentuale'");
    if (existe) { db(req).run("UPDATE display_settings SET valore=? WHERE chiave='margine_percentuale'", [String(value)]); }
    else { db(req).run("INSERT INTO display_settings (chiave, valore) VALUES ('margine_percentuale', ?)", [String(value)]); }
    const existeTipo = db(req).get("SELECT chiave FROM display_settings WHERE chiave='margine_tipo'");
    if (existeTipo) { db(req).run("UPDATE display_settings SET valore=? WHERE chiave='margine_tipo'", [tipo]); }
    else { db(req).run("INSERT INTO display_settings (chiave, valore) VALUES ('margine_tipo', ?)", [tipo]); }
    res.json({ global_margin_type: tipo, global_margin_value: value });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DATI AZIENDA
router.get('/company', (req, res) => {
  try {
    db(req).run('CREATE TABLE IF NOT EXISTS display_company (chiave TEXT PRIMARY KEY, valore TEXT DEFAULT "")');
    const fields = ['company_name','company_address','company_city','company_phone','company_email','company_vat'];
    const result = {};
    for (const f of fields) {
      const row = db(req).get('SELECT valore FROM display_company WHERE chiave=?', [f]);
      result[f] = row ? row.valore : '';
    }
    res.json([result]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/company', (req, res) => {
  try {
    db(req).run('CREATE TABLE IF NOT EXISTS display_company (chiave TEXT PRIMARY KEY, valore TEXT DEFAULT "")');
    const { company_name, company_address, company_city, company_phone, company_email, company_vat } = req.body;
    const fields = { company_name, company_address, company_city, company_phone, company_email, company_vat };
    for (const [k, v] of Object.entries(fields)) {
      const exists = db(req).get('SELECT chiave FROM display_company WHERE chiave=?', [k]);
      if (exists) { db(req).run('UPDATE display_company SET valore=? WHERE chiave=?', [v || '', k]); }
      else { db(req).run('INSERT INTO display_company (chiave, valore) VALUES (?,?)', [k, v || '']); }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RICERCA PREZZI
router.get('/search', (req, res) => {
  try {
    const { brand, model, q } = req.query;
    const settRow = db(req).get("SELECT valore FROM display_settings WHERE chiave='margine_percentuale'");
    const tipoRow = db(req).get("SELECT valore FROM display_settings WHERE chiave='margine_tipo'");
    const marginVal = settRow ? parseFloat(settRow.valore) : 20;
    const marginType = (tipoRow && tipoRow.valore) || 'percentage';
    const uploadRow = db(req).get('SELECT id, filename, created_at FROM display_uploads WHERE attivo=1');
    let sql = 'SELECT * FROM display_listino WHERE attivo=1';
    const params = [];
    if (q) { sql += ' AND (LOWER(brand) LIKE ? OR LOWER(modello) LIKE ?)'; params.push('%'+q.toLowerCase()+'%','%'+q.toLowerCase()+'%'); }
    if (brand) { sql += ' AND brand=?'; params.push(brand); }
    if (model) { sql += ' AND LOWER(modello) LIKE ?'; params.push('%'+model.toLowerCase()+'%'); }
    sql += ' ORDER BY brand, modello LIMIT 300';
    const rows = db(req).query(sql, params);
    const items = rows.map(row => {
      const supplierPrice = parseFloat(row.prezzo_acquisto);
      let myPrice = marginType === 'percentage' ? supplierPrice*(1-marginVal/100) : supplierPrice-marginVal;
      myPrice = Math.max(0, Math.round(myPrice*100)/100);
      const gain = Math.round((supplierPrice-myPrice)*100)/100;
      return { id:row.id, brand:row.brand, model:row.modello, purchase_price:supplierPrice, my_price:myPrice, final_price:myPrice, margin_value:marginVal, margin_type:marginType, gain };
    });
    res.json({ items, rows:items, settings:{global_margin_type:marginType,global_margin_value:marginVal}, activeUpload:uploadRow||null });
  } catch (e) { console.error('Search error:',e); res.status(500).json({ error: e.message }); }
});

router.get('/brands', (req, res) => {
  try {
    const rows = db(req).query('SELECT DISTINCT brand FROM display_listino WHERE attivo=1 ORDER BY brand');
    res.json(rows.map(r => r.brand));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', (req, res) => {
  try {
    const total = db(req).get('SELECT COUNT(*) as n FROM display_listino WHERE attivo=1');
    const brands = db(req).get('SELECT COUNT(DISTINCT brand) as n FROM display_listino WHERE attivo=1');
    const upload = db(req).get('SELECT id, filename, created_at FROM display_uploads WHERE attivo=1');
    const marg = db(req).get("SELECT valore FROM display_settings WHERE chiave='margine_percentuale'");
    const tipo = db(req).get("SELECT valore FROM display_settings WHERE chiave='margine_tipo'");
    res.json({ totalModels:total?total.n:0, totalBrands:brands?brands.n:0, activeUpload:upload||null, settings:{global_margin_type:(tipo&&tipo.valore)||'percentage',global_margin_value:marg?parseFloat(marg.valore):20} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPLOAD LISTINO
router.get('/uploads', (req, res) => {
  try { res.json(db(req).query('SELECT * FROM display_uploads ORDER BY created_at DESC')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/uploads', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
    const { version_name } = req.body;
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    db(req).run('UPDATE display_uploads SET attivo=0');
    db(req).run('UPDATE display_listino SET attivo=0');
    const uploadId = db(req).uid();
    const versionName = version_name || req.file.originalname;
    db(req).run('INSERT INTO display_uploads (id, filename, attivo) VALUES (?,?,1)', [uploadId, versionName]);
    const header = rawRows[0] || [];
    const norm = s => String(s||'').toLowerCase().replace(/[\s_\-.]/g,'');
    const findCol = (pats) => { for(let i=0;i<header.length;i++){ const h=norm(header[i]); if(pats.some(p=>h.includes(p))) return i; } return -1; };
    const brandIdx = findCol(['brand','marca']);
    const modelIdx = findCol(['model','modello','descrizione','desc']);
    const priceIdx = findCol(['price','prezzo','costo','acquisto','buyback','ivato']);
    const codeIdx  = findCol(['code','codice','sku','cod']);
    if (brandIdx===-1||modelIdx===-1||priceIdx===-1) return res.status(400).json({ error:'Colonne non riconosciute. Trovate: '+header.join(', ')+'. Servono brand/marca, modello, prezzo/acquisto' });
    let count = 0;
    for (let i=1;i<rawRows.length;i++) {
      const row=rawRows[i];
      const brand=String(row[brandIdx]||'').trim();
      const modello=String(row[modelIdx]||'').trim();
      const prezzo=parseFloat(String(row[priceIdx]||'').replace(',','.'));
      if(!brand||!modello||isNaN(prezzo)||prezzo<=0) continue;
      const codice=codeIdx>=0?String(row[codeIdx]||'').trim():'';
      try { db(req).run('INSERT OR REPLACE INTO display_listino (id,upload_id,brand,modello,codice,prezzo_acquisto,attivo) VALUES (?,?,?,?,?,?,1)',[db(req).uid(),uploadId,brand,modello,codice,prezzo]); count++; } catch(e2){}
    }
    db(req).run('UPDATE display_uploads SET righe=? WHERE id=?',[count,uploadId]);
    res.json({ ok:true, uploadId, count, versionName });
  } catch (e) { console.error('Upload error:',e); res.status(500).json({ error: e.message }); }
});

router.post('/uploads/:id/activate', (req, res) => {
  try {
    const { id } = req.params;
    db(req).run('UPDATE display_uploads SET attivo=0');
    db(req).run('UPDATE display_listino SET attivo=0');
    db(req).run('UPDATE display_uploads SET attivo=1 WHERE id=?',[id]);
    db(req).run('UPDATE display_listino SET attivo=1 WHERE upload_id=?',[id]);
    res.json({ ok:true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/uploads/:id', (req, res) => {
  try {
    const { id } = req.params;
    db(req).run('DELETE FROM display_listino WHERE upload_id=?',[id]);
    db(req).run('DELETE FROM display_uploads WHERE id=?',[id]);
    res.json({ ok:true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = { router };
