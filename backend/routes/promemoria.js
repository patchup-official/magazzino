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
