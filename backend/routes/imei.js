const express = require('express');
const router = express.Router();
const https = require('https');

router.get('/:imei', (req, res) => {
  const imei = req.params.imei.replace(/\D/g, '');
  if (imei.length < 8) return res.status(400).json({ error: 'IMEI troppo corto' });

  const url = `https://alpha.imeicheck.com/api/modelBrandName?imei=${imei}&format=json`;
  https.get(url, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json && json.brand) {
          res.json({ ok: true, brand: json.brand, model: json.model || json.name || '', name: json.name || `${json.brand} ${json.model}`, imei });
        } else {
          res.json({ ok: false, error: 'Dispositivo non trovato' });
        }
      } catch (e) {
        res.json({ ok: false, error: 'Risposta non valida' });
      }
    });
  }).on('error', (err) => {
    res.status(500).json({ ok: false, error: err.message });
  });
});

module.exports = router;
