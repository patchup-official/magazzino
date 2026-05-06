// backend/routes/promemoria.js
const express = require('express')
const router = express.Router()

function generaOccorrenze(p, daData, aData) {
  if (!p.ricorrenza || p.ricorrenza === '') return [p]
  const occorrenze = []
  const start = new Date(p.data)
  const fine = new Date(aData || new Date(start.getFullYear()+1, start.getMonth(), start.getDate()))
  let cur = new Date(start)
  while (cur <= fine) {
    const ds = cur.toISOString().split('T')[0]
    if (!daData || ds >= daData) {
      occorrenze.push({ ...p, data: ds, id: p.id + '_' + ds })
    }
    if (p.ricorrenza === 'settimanale') cur.setDate(cur.getDate() + 7)
    else if (p.ricorrenza === 'mensile') cur.setMonth(cur.getMonth() + 1)
    else if (p.ricorrenza === 'annuale') cur.setFullYear(cur.getFullYear() + 1)
    else break
  }
  return occorrenze.length ? occorrenze : [p]
}

router.get('/', (req, res) => {
  const { query } = req.app.locals
  try {
    const rows = query('SELECT * FROM promemoria ORDER BY data ASC, ora ASC')
    const oggi = new Date().toISOString().split('T')[0]
    const unAnnoFa = new Date(new Date().setFullYear(new Date().getFullYear()-1)).toISOString().split('T')[0]
    const unAnnoFuture = new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().split('T')[0]

    const data = []
    rows.forEach(p => {
      const occ = generaOccorrenze(p, unAnnoFa, unAnnoFuture)
      occ.forEach(o => data.push(o))
    })
    data.sort((a,b) => a.data.localeCompare(b.data))
    res.json({ success: true, data })
  } catch(e) { res.status(500).json({ success: false, error: e.message }) }
})

router.post('/', (req, res) => {
  const { run, get, uid } = req.app.locals
  const { titolo, nota, data, ora, ricorrenza } = req.body
  if(!titolo || !data) return res.status(400).json({ success: false, error: 'titolo e data obbligatori' })
  const id = uid()
  run('INSERT INTO promemoria (id,titolo,nota,data,ora,ricorrenza) VALUES (?,?,?,?,?,?)',
      [id, titolo, nota||'', data, ora||null, ricorrenza||null])
  res.json({ success: true, data: get('SELECT * FROM promemoria WHERE id=?', [id]) })
})

router.put('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const { titolo, nota, data, ora, ricorrenza } = req.body
  if(!get('SELECT id FROM promemoria WHERE id=?', [req.params.id]))
    return res.status(404).json({ success: false, error: 'Non trovato' })
  run('UPDATE promemoria SET titolo=?,nota=?,data=?,ora=?,ricorrenza=? WHERE id=?',
      [titolo, nota||'', data, ora||null, ricorrenza||null, req.params.id])
  res.json({ success: true, data: get('SELECT * FROM promemoria WHERE id=?', [req.params.id]) })
})

router.delete('/:id', (req, res) => {
  const { run, get } = req.app.locals
  const baseId = req.params.id.includes('_') ? req.params.id.split('_')[0] : req.params.id
  if(!get('SELECT id FROM promemoria WHERE id=?', [baseId]))
    return res.status(404).json({ success: false, error: 'Non trovato' })
  run('DELETE FROM promemoria WHERE id=?', [baseId])
  res.json({ success: true })
})

module.exports = router
