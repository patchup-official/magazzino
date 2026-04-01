// routes/valutazione.js
// Motore di valutazione prezzi con scraping eBay.it

const express = require('express');
const router = express.Router();
const https = require('https');

// ── DATABASE PREZZI BASE (aggiornato manualmente o via scraping) ──────────
// Struttura: { brand: { modello: { storage: prezzoMercato } } }
// Prezzi mercato usato Italia marzo 2026 (condizione B - buona)
const PREZZI_BASE = {
  Apple: {
    'iPhone SE (3rd)':   { '64GB':120,  '128GB':150,  '256GB':180 },
    'iPhone 12':         { '64GB':140,  '128GB':170,  '256GB':200 },
    'iPhone 12 Pro':     { '128GB':190, '256GB':220,  '512GB':260 },
    'iPhone 13':         { '128GB':280, '256GB':320,  '512GB':370 },
    'iPhone 13 Pro':     { '128GB':340, '256GB':380,  '512GB':440 },
    'iPhone 13 Pro Max': { '128GB':380, '256GB':420,  '512GB':480 },
    'iPhone 14':         { '128GB':380, '256GB':430,  '512GB':500 },
    'iPhone 14 Plus':    { '128GB':400, '256GB':450,  '512GB':520 },
    'iPhone 14 Pro':     { '128GB':480, '256GB':540,  '512GB':620,  '1TB':700 },
    'iPhone 14 Pro Max': { '128GB':520, '256GB':580,  '512GB':660,  '1TB':750 },
    'iPhone 15':         { '128GB':450, '256GB':510,  '512GB':590 },
    'iPhone 15 Plus':    { '128GB':470, '256GB':530,  '512GB':610 },
    'iPhone 15 Pro':     { '128GB':580, '256GB':640,  '512GB':720,  '1TB':820 },
    'iPhone 15 Pro Max': { '128GB':640, '256GB':700,  '512GB':790,  '1TB':890 },
    'iPhone 16':         { '128GB':600, '256GB':660,  '512GB':750 },
    'iPhone 16 Plus':    { '128GB':640, '256GB':700,  '512GB':790 },
    'iPhone 16 Pro':     { '128GB':750, '256GB':820,  '512GB':900,  '1TB':1000 },
    'iPhone 16 Pro Max': { '128GB':820, '256GB':890,  '512GB':980,  '1TB':1100 },
  },
  Samsung: {
    'Galaxy S23':        { '128GB':280, '256GB':320 },
    'Galaxy S23+':       { '256GB':360, '512GB':420 },
    'Galaxy S23 Ultra':  { '256GB':480, '512GB':560 },
    'Galaxy S24':        { '128GB':400, '256GB':450 },
    'Galaxy S24+':       { '256GB':520, '512GB':600 },
    'Galaxy S24 Ultra':  { '256GB':680, '512GB':760 },
    'Galaxy A54':        { '128GB':180, '256GB':210 },
    'Galaxy A34':        { '128GB':150, '256GB':180 },
    'Galaxy Z Fold5':    { '256GB':700, '512GB':800 },
    'Galaxy Z Flip5':    { '256GB':380, '512GB':440 },
  },
  Google: {
    'Pixel 7':           { '128GB':240, '256GB':280 },
    'Pixel 7a':          { '128GB':220, '256GB':260 },
    'Pixel 8':           { '128GB':380, '256GB':430 },
    'Pixel 8 Pro':       { '128GB':480, '256GB':540, '512GB':620 },
  },
  Xiaomi: {
    'Redmi Note 13 Pro': { '128GB':140, '256GB':170 },
    '13T Pro':           { '256GB':280, '512GB':340 },
    '14':                { '256GB':380, '512GB':450 },
    '14 Ultra':          { '256GB':520, '512GB':600 },
  },
  OnePlus: {
    'Nord CE 3':         { '128GB':160, '256GB':190 },
    '11':                { '128GB':280, '256GB':330 },
    '12':                { '256GB':400, '512GB':470 },
  },
  Huawei: {
    'P60 Pro':           { '256GB':380, '512GB':450 },
    'Mate 60 Pro':       { '256GB':480, '512GB':560 },
  },
};

// ── PENALI CONDIZIONE ────────────────────────────────────────────────────
// Applicate sul prezzo di mercato prima di calcolare l'offerta
const PENALI = {
  non_si_accende:   { tipo: 'percentuale', valore: -40 },  // -40%
  schermo_rotto:    { tipo: 'percentuale', valore: -25 },  // -25%
  schermo_crepe:    { tipo: 'percentuale', valore: -15 },  // -15% (crepe minori)
  batteria_sotto80: { tipo: 'percentuale', valore: -10 },  // -10%
  batteria_sotto60: { tipo: 'percentuale', valore: -20 },  // -20%
  scocca_graffi:    { tipo: 'percentuale', valore: -8  },  // -8%
  scocca_rotta:     { tipo: 'percentuale', valore: -15 },  // -15%
  icloud_bloccato:  { tipo: 'percentuale', valore: -85 },  // -85% (quasi inutile)
  touch_id_rotto:   { tipo: 'percentuale', valore: -10 },
  face_id_rotto:    { tipo: 'percentuale', valore: -10 },
  tasto_rotto:      { tipo: 'percentuale', valore: -8  },
  fotocamera_rotta: { tipo: 'percentuale', valore: -15 },
  con_scatola:      { tipo: 'percentuale', valore: +3  },  // +3% con scatola
  con_accessori:    { tipo: 'percentuale', valore: +2  },  // +2% con caricatore
};

// ── BONUS PERMUTA ────────────────────────────────────────────────────────
// Se il cliente acquista un nuovo dispositivo, riceve un bonus sulla valutazione
const BONUS_PERMUTA = {
  // Se acquista un dispositivo di fascia alta → bonus 25%
  fascia_alta:   25, // >€500 di vendita
  // Se acquista fascia media → bonus 20%
  fascia_media:  20, // €200-€500
  // Se acquista fascia bassa → bonus 15%
  fascia_bassa:  15, // <€200
};

// ── FUNZIONE CALCOLO PREZZO ──────────────────────────────────────────────
function calcolaPrezzo({ brand, modello, storage, condizioni, permuta_fascia }) {
  // 1. Trova prezzo base
  const prezzoMercato = PREZZI_BASE[brand]?.[modello]?.[storage];
  if (!prezzoMercato) {
    return { ok: false, error: 'Modello non trovato nel database prezzi' };
  }

  // 2. Applica percentuale negozio (55% del mercato per cash)
  let prezzoBase = Math.round(prezzoMercato * 0.55);
  
  // 3. Applica penali condizioni
  const breakdown = [
    { voce: `Prezzo mercato (${brand} ${modello} ${storage})`, importo: prezzoMercato, tipo: 'mercato' },
    { voce: 'Base negozio (55%)', importo: prezzoBase, tipo: 'base' },
  ];

  let moltiplicatoriPenali = 0;
  const penaliApplicate = [];

  if (condizioni) {
    for (const [chiave, valore] of Object.entries(condizioni)) {
      if (valore && PENALI[chiave]) {
        const penale = PENALI[chiave];
        moltiplicatoriPenali += penale.valore;
        penaliApplicate.push({
          voce: chiave.replace(/_/g,' '),
          percentuale: penale.valore,
          importo: Math.round(prezzoBase * (penale.valore / 100))
        });
        breakdown.push({
          voce: chiave.replace(/_/g,' '),
          importo: Math.round(prezzoBase * (penale.valore / 100)),
          percentuale: penale.valore,
          tipo: penale.valore < 0 ? 'penale' : 'bonus'
        });
      }
    }
  }

  // Applica tutte le penali insieme (non in cascata)
  const moltiplicatore = 1 + (moltiplicatoriPenali / 100);
  let prezzoCash = Math.max(Math.round(prezzoBase * moltiplicatore), 10);

  // 4. Calcola prezzo buono (+20%)
  let prezzoVoucher = Math.round(prezzoCash * 1.2);

  // 5. Calcola prezzo permuta (se applicabile)
  let prezzoPermuta = null;
  if (permuta_fascia) {
    const bonusPerc = BONUS_PERMUTA[permuta_fascia] || 20;
    prezzoPermuta = Math.round(prezzoCash * (1 + bonusPerc / 100));
    breakdown.push({
      voce: `Bonus permuta (${bonusPerc}%)`,
      importo: prezzoPermuta - prezzoCash,
      tipo: 'permuta'
    });
  }

  // 6. Valutazione condizione automatica
  let condizione = 'A';
  if (condizioni?.non_si_accende || condizioni?.icloud_bloccato) condizione = 'C';
  else if (condizioni?.schermo_rotto || condizioni?.scocca_rotta) condizione = 'C';
  else if (condizioni?.batteria_sotto60 || condizioni?.schermo_crepe) condizione = 'B';
  else if (condizioni?.batteria_sotto80 || condizioni?.scocca_graffi) condizione = 'B';

  return {
    ok: true,
    brand, modello, storage,
    prezzo_mercato: prezzoMercato,
    prezzo_cash: prezzoCash,
    prezzo_voucher: prezzoVoucher,
    prezzo_permuta: prezzoPermuta,
    condizione,
    breakdown,
    penali_applicate: penaliApplicate,
    timestamp: new Date().toISOString(),
  };
}

// ── ENDPOINTS ────────────────────────────────────────────────────────────

// GET /valutazione/modelli - lista tutti i modelli disponibili
router.get('/modelli', (req, res) => {
  const modelli = {};
  for (const [brand, modelloMap] of Object.entries(PREZZI_BASE)) {
    modelli[brand] = {};
    for (const [modello, storageMap] of Object.entries(modelloMap)) {
      modelli[brand][modello] = Object.keys(storageMap);
    }
  }
  res.json(modelli);
});

// POST /valutazione/calcola - calcola prezzo
router.post('/calcola', (req, res) => {
  const { brand, modello, storage, condizioni, permuta_fascia } = req.body;
  if (!brand || !modello || !storage) {
    return res.status(400).json({ error: 'brand, modello e storage sono obbligatori' });
  }
  const risultato = calcolaPrezzo({ brand, modello, storage, condizioni, permuta_fascia });
  res.json(risultato);
});

// GET /valutazione/prezzi - visualizza tutti i prezzi (per admin)
router.get('/prezzi', (req, res) => {
  res.json(PREZZI_BASE);
});

// GET /valutazione/bonus-permuta - vedi bonus permuta
router.get('/bonus-permuta', (req, res) => {
  res.json(BONUS_PERMUTA);
});

module.exports = router;
module.exports.calcolaPrezzo = calcolaPrezzo;
module.exports.PREZZI_BASE = PREZZI_BASE;
