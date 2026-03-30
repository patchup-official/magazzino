// routes/devices.js

const express = require('express');
const router = express.Router();

function evaluateDevice({ si_accende, schermo_rotto, batteria_ok }) {
  let prezzo = 300;
  const breakdown = [{ voce: 'Base', importo: 300 }];
  if (!si_accende)  { prezzo -= 100; breakdown.push({ voce: 'Non si accende', importo: -100 }); }
  if (schermo_rotto){ prezzo -= 50;  breakdown.push({ voce: 'Schermo rotto',  importo: -50  }); }
  if (!batteria_ok) { prezzo -= 30;  breakdown.push({ voce: 'Batteria KO',    importo: -30  }); }
  let condizione = 'A';
  if (!si_accende || schermo_rotto) condizione = 'C';
  else if (!batteria_ok) condizione = 'B';
  return { prezzo_cash: Math.max(prezzo,0), prezzo_voucher: Math.round(Math.max(prezzo,0)*1.2), condizione, breakdown };
}

router.get('/', (req, res) => {
  const { query } = req.app.locals;
  const { brand, stato, provenienza } = req.query;
  let sql = 'SELECT * FROM devices';
  const params = [], conds = [];
  if (brand)       { conds.push('brand = ?');       params.push(brand); }
  if (stato)       { conds.push('stato = ?');        params.push(stato); }
  if (provenienza) { conds.push('provenienza = ?');  params.push(provenienza); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const devices = query(sql, params);
  res.json({ data: devices, total: devices.length });
});

router.get('/:id', (req, res) => {
  const d = req.app.locals.get('SELECT * FROM devices WHERE id = ?', [req.params.id]);
  if (!d) return res.status(404).json({ error: 'Non trovato' });
  res.json(d);
});

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals;
  const { brand, modello, storage, colore, imei, condizione='B', stato='in_stock', provenienza='fornitore', prezzo_acq=0, prezzo_vend=0, cliente_nome, cliente_tel, note } = req.body;
  if (!brand || !modello) return res.status(400).json({ error: 'brand e modello obbligatori' });
  const id = uid();
  try {
    run(`INSERT INTO devices (id,brand,modello,storage,colore,imei,condizione,stato,provenienza,prezzo_acq,prezzo_vend,cliente_nome,cliente_tel,note)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id,brand,modello,storage,colore,imei||null,condizione,stato,provenienza,prezzo_acq,prezzo_vend,cliente_nome,cliente_tel,note]);
  } catch(e) {
    return res.status(409).json({ error: 'IMEI già presente' });
  }
  res.status(201).json(get('SELECT * FROM devices WHERE id = ?', [id]));
});

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  if (!get('SELECT id FROM devices WHERE id = ?', [req.params.id]))
    return res.status(404).json({ error: 'Non trovato' });
  const { brand,modello,storage,colore,imei,condizione,stato,provenienza,prezzo_acq,prezzo_vend,cliente_nome,cliente_tel,note } = req.body;
  run(`UPDATE devices SET brand=?,modello=?,storage=?,colore=?,imei=?,condizione=?,stato=?,provenienza=?,prezzo_acq=?,prezzo_vend=?,cliente_nome=?,cliente_tel=?,note=? WHERE id=?`,
      [brand,modello,storage,colore,imei||null,condizione,stato,provenienza,prezzo_acq,prezzo_vend,cliente_nome,cliente_tel,note,req.params.id]);
  res.json(get('SELECT * FROM devices WHERE id = ?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  if (!get('SELECT id FROM devices WHERE id = ?', [req.params.id]))
    return res.status(404).json({ error: 'Non trovato' });
  run('DELETE FROM devices WHERE id = ?', [req.params.id]);
  res.json({ message: 'Eliminato' });
});

router.post('/evaluate', (req, res) => {
  const { si_accende, schermo_rotto, batteria_ok } = req.body;
  if (si_accende===undefined||schermo_rotto===undefined||batteria_ok===undefined)
    return res.status(400).json({ error: 'Tutti i campi obbligatori' });
  res.json(evaluateDevice({ si_accende, schermo_rotto, batteria_ok }));
});

router.post('/create-from-evaluation', (req, res) => {
  const { run, get, uid } = req.app.locals;
  const { brand, modello, storage, colore, imei, si_accende, schermo_rotto, batteria_ok, tipo_pagamento='cash', cliente_nome, cliente_tel } = req.body;
  if (!brand||!modello||!cliente_nome||!cliente_tel)
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  const ev = evaluateDevice({ si_accende, schermo_rotto, batteria_ok });
  const prezzo_acq = tipo_pagamento==='voucher' ? ev.prezzo_voucher : ev.prezzo_cash;
  const id = uid();
  try {
    run(`INSERT INTO devices (id,brand,modello,storage,colore,imei,condizione,stato,provenienza,prezzo_acq,prezzo_vend,cliente_nome,cliente_tel)
         VALUES (?,?,?,?,?,?,?,'da_testare','privato',?,0,?,?)`,
        [id,brand,modello,storage,colore,imei||null,ev.condizione,prezzo_acq,cliente_nome,cliente_tel]);
  } catch(e) {
    return res.status(409).json({ error: 'IMEI già presente' });
  }
  res.status(201).json({ device: get('SELECT * FROM devices WHERE id=?',[id]), evaluation: ev, prezzo_pagato: prezzo_acq, tipo_pagamento });
});

module.exports = router;
