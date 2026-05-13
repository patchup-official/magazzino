const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const { query } = req.app.locals;
  const { stato, search } = req.query;
  let sql = 'SELECT p.*, c.nome as cliente_nome_db, c.cognome as cliente_cognome_db FROM prenotazioni_ordini p LEFT JOIN clienti c ON p.cliente_id = c.id WHERE 1=1';
  const params = [];
  if (stato) { sql += ' AND p.stato = ?'; params.push(stato); }
  if (search) { sql += ' AND (p.cliente_nome LIKE ? OR p.brand LIKE ? OR p.modello LIKE ? OR p.ricambio LIKE ?)'; const s = '%'+search+'%'; params.push(s,s,s,s); }
  sql += ' ORDER BY p.created_at DESC';
  res.json(query(sql, params));
});

router.get('/:id', (req, res) => {
  const { get } = req.app.locals;
  const row = get('SELECT * FROM prenotazioni_ordini WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Non trovata' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { run, uid, get } = req.app.locals;
  const { cliente_id, cliente_nome, cliente_telefono, cliente_email, brand, modello, colore_variante, tipo_riparazione, ricambio, in_store, note_dispositivo, fornitore_id, fornitore_nome, data_inserimento, caparra_attiva, caparra_importo, caparra_totale, caparra_metodo, caparra_note } = req.body;
  if (!cliente_nome || !brand || !modello) return res.status(400).json({ error: 'Cliente, brand e modello sono obbligatori' });
  const id = uid();
  run('INSERT INTO prenotazioni_ordini (id,cliente_id,cliente_nome,cliente_telefono,cliente_email,brand,modello,colore_variante,tipo_riparazione,ricambio,in_store,note_dispositivo,fornitore_id,fornitore_nome,stato,data_inserimento,caparra_attiva,caparra_importo,caparra_totale,caparra_metodo,caparra_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id,cliente_id||null,cliente_nome,cliente_telefono||null,cliente_email||null,brand,modello,colore_variante||null,tipo_riparazione||null,ricambio||null,in_store?1:0,note_dispositivo||null,fornitore_id||null,fornitore_nome||null,'da_ordinare',data_inserimento||new Date().toISOString().split('T')[0],caparra_attiva?1:0,caparra_importo||null,caparra_totale||null,caparra_metodo||null,caparra_note||null]);
  res.status(201).json(get('SELECT * FROM prenotazioni_ordini WHERE id = ?', [id]));
});

router.patch('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  const ex = get('SELECT * FROM prenotazioni_ordini WHERE id = ?', [req.params.id]);
  if (!ex) return res.status(404).json({ error: 'Non trovata' });
  const { cliente_id, cliente_nome, cliente_telefono, cliente_email, brand, modello, colore_variante, tipo_riparazione, ricambio, in_store, note_dispositivo, fornitore_id, fornitore_nome, stato, data_inserimento, data_ordine, data_arrivo, caparra_attiva, caparra_importo, caparra_totale, caparra_metodo, caparra_note, note_generali } = req.body;
  let d_ord = data_ordine !== undefined ? data_ordine : ex.data_ordine;
  let d_arr = data_arrivo !== undefined ? data_arrivo : ex.data_arrivo;
  const oggi = new Date().toISOString().split('T')[0];
  if (stato === 'ordinato' && !d_ord) d_ord = oggi;
  if (stato === 'arrivato' && !d_arr) d_arr = oggi;
  run('UPDATE prenotazioni_ordini SET cliente_id=?,cliente_nome=?,cliente_telefono=?,cliente_email=?,brand=?,modello=?,colore_variante=?,tipo_riparazione=?,ricambio=?,in_store=?,note_dispositivo=?,fornitore_id=?,fornitore_nome=?,stato=?,data_inserimento=?,data_ordine=?,data_arrivo=?,caparra_attiva=?,caparra_importo=?,caparra_totale=?,caparra_metodo=?,caparra_note=?,note_generali=?,updated_at=datetime('now') WHERE id=?',
    [cliente_id!==undefined?cliente_id:ex.cliente_id,cliente_nome||ex.cliente_nome,cliente_telefono!==undefined?cliente_telefono:ex.cliente_telefono,cliente_email!==undefined?cliente_email:ex.cliente_email,brand||ex.brand,modello||ex.modello,colore_variante!==undefined?colore_variante:ex.colore_variante,tipo_riparazione!==undefined?tipo_riparazione:ex.tipo_riparazione,ricambio!==undefined?ricambio:ex.ricambio,in_store!==undefined?(in_store?1:0):ex.in_store,note_dispositivo!==undefined?note_dispositivo:ex.note_dispositivo,fornitore_id!==undefined?fornitore_id:ex.fornitore_id,fornitore_nome!==undefined?fornitore_nome:ex.fornitore_nome,stato||ex.stato,data_inserimento||ex.data_inserimento,d_ord,d_arr,caparra_attiva!==undefined?(caparra_attiva?1:0):ex.caparra_attiva,caparra_importo!==undefined?caparra_importo:ex.caparra_importo,caparra_totale!==undefined?caparra_totale:ex.caparra_totale,caparra_metodo!==undefined?caparra_metodo:ex.caparra_metodo,caparra_note!==undefined?caparra_note:ex.caparra_note,note_generali!==undefined?note_generali:ex.note_generali,req.params.id]);
  res.json(get('SELECT * FROM prenotazioni_ordini WHERE id = ?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals;
  if (!get('SELECT id FROM prenotazioni_ordini WHERE id = ?', [req.params.id])) return res.status(404).json({ error: 'Non trovata' });
  run('DELETE FROM prenotazioni_ordini WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = { router };
