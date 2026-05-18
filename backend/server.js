const express=require('express'),cors=require('cors'),path=require('path'),fs=require('fs'),crypto=require('crypto');
const app=express(),PORT=process.env.PORT||3001;
const allowedOrigins=['http://localhost:5173','http://localhost:3000',process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({origin:(o,cb)=>{if(!o||allowedOrigins.includes(o))return cb(null,true);cb(new Error('CORS: '+o));},credentials:true}));
app.use(express.json());
const DB_DIR=process.env.DB_DIR||path.join(__dirname,'db'),DB_PATH=path.join(DB_DIR,'magazzino.sqlite'),SCHEMA_PATH=path.join(__dirname,'db','schema.sql');
if(!fs.existsSync(DB_DIR))fs.mkdirSync(DB_DIR,{recursive:true});

async function initDB(){
const SQL=await require('sql.js')();
let db=fs.existsSync(DB_PATH)?new SQL.Database(fs.readFileSync(DB_PATH)):new SQL.Database();
db.run(fs.readFileSync(SCHEMA_PATH,'utf-8'));
try{db.run('ALTER TABLE products ADD COLUMN barcode TEXT')}catch(e){}
try{db.run('ALTER TABLE products ADD COLUMN fornitore_id TEXT')}catch(e){}
try{db.run('ALTER TABLE products ADD COLUMN note TEXT')}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS servizi(id TEXT PRIMARY KEY,cliente TEXT NOT NULL,telefono TEXT,dispositivo TEXT NOT NULL,tipo_servizio TEXT NOT NULL,nome_servizio TEXT NOT NULL,descrizione TEXT,priorita TEXT DEFAULT 'normale',prezzo REAL NOT NULL,note TEXT,data_richiesta TEXT DEFAULT(date('now')),data_consegna_prevista TEXT,stato TEXT DEFAULT 'in_corso',created_at TEXT DEFAULT(datetime('now')))`)}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS clienti(id TEXT PRIMARY KEY,tipo TEXT NOT NULL DEFAULT 'persona_fisica',nome TEXT NOT NULL,cognome TEXT,ragione_soc TEXT,codice_fisc TEXT,piva TEXT,telefono TEXT,email TEXT,indirizzo TEXT,cap TEXT,citta TEXT,note TEXT,created_at TEXT DEFAULT(datetime('now')))`);db.run(`CREATE INDEX IF NOT EXISTS idx_clienti_nome ON clienti(nome)`);db.run(`CREATE INDEX IF NOT EXISTS idx_clienti_tel ON clienti(telefono)`)}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS piani_protezione(id TEXT PRIMARY KEY,nome TEXT NOT NULL,prezzo REAL NOT NULL,durata_mesi INTEGER NOT NULL,coperture TEXT NOT NULL,consigliato INTEGER DEFAULT 0,attivo INTEGER DEFAULT 1,created_at TEXT DEFAULT(datetime('now')))`);const piani=db.prepare('SELECT COUNT(*) as n FROM piani_protezione').getAsObject();if(!piani.n)db.run(`INSERT INTO piani_protezione(id,nome,prezzo,durata_mesi,coperture,consigliato)VALUES('piano_base','Base',7.90,6,'["Garanzia estesa","Rottura schermo"]',0),('piano_premium','Premium',12.90,12,'["Garanzia estesa","Danni accidentali","Rottura schermo","Sostituzione pezzi"]',1),('piano_elite','Elite',19.90,24,'["Garanzia estesa","Danni accidentali","Rottura schermo","Sostituzione pezzi","Furto e smarrimento","Assistenza prioritaria"]',0)`)}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS protezioni(id TEXT PRIMARY KEY,certificato TEXT UNIQUE NOT NULL,cliente_id TEXT,cliente_nome TEXT NOT NULL,cliente_email TEXT,cliente_tel TEXT,tipo_dispositivo TEXT NOT NULL,brand TEXT NOT NULL,modello TEXT NOT NULL,colore_storage TEXT,seriale TEXT,imei TEXT,piano_id TEXT NOT NULL,piano_nome TEXT NOT NULL,durata_mesi INTEGER NOT NULL,coperture TEXT NOT NULL,prezzo REAL NOT NULL,data_inizio TEXT DEFAULT(date('now')),data_scadenza TEXT NOT NULL,stato TEXT DEFAULT 'attiva',note TEXT,riparazione_id TEXT,created_at TEXT DEFAULT(datetime('now')))`);db.run(`CREATE INDEX IF NOT EXISTS idx_protezioni_cliente ON protezioni(cliente_nome)`);db.run(`CREATE INDEX IF NOT EXISTS idx_protezioni_stato ON protezioni(stato)`)}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS display_ordini(id TEXT PRIMARY KEY,numero TEXT UNIQUE NOT NULL,fornitore_id TEXT,fornitore_nome TEXT,fornitore_email TEXT,fornitore_tel TEXT,stato TEXT DEFAULT 'aperto',totale REAL DEFAULT 0,note TEXT,pdf_generato_at TEXT,inviato_at TEXT,pagato_at TEXT,created_at TEXT DEFAULT(datetime('now')))`);db.run(`CREATE TABLE IF NOT EXISTS display_ordini_items(id TEXT PRIMARY KEY,ordine_id TEXT NOT NULL,brand TEXT NOT NULL,modello TEXT NOT NULL,quantita INTEGER DEFAULT 1,prezzo_unitario REAL NOT NULL,prezzo_offerta REAL NOT NULL,note TEXT,created_at TEXT DEFAULT(datetime('now')),UNIQUE(ordine_id,brand,modello))`)}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS display_listino(id TEXT PRIMARY KEY,upload_id TEXT NOT NULL,brand TEXT NOT NULL,modello TEXT NOT NULL,codice TEXT,prezzo_acquisto REAL NOT NULL,note TEXT,attivo INTEGER DEFAULT 0,created_at TEXT DEFAULT(datetime('now')))`);db.run(`CREATE INDEX IF NOT EXISTS idx_display_brand ON display_listino(brand)`);db.run(`CREATE INDEX IF NOT EXISTS idx_display_modello ON display_listino(modello)`);db.run(`CREATE INDEX IF NOT EXISTS idx_display_attivo ON display_listino(attivo)`);db.run(`CREATE TABLE IF NOT EXISTS display_uploads(id TEXT PRIMARY KEY,filename TEXT NOT NULL,righe INTEGER DEFAULT 0,attivo INTEGER DEFAULT 0,created_at TEXT DEFAULT(datetime('now')))`);db.run(`CREATE TABLE IF NOT EXISTS display_settings(chiave TEXT PRIMARY KEY,valore TEXT NOT NULL)`);const ms=db.prepare("SELECT chiave FROM display_settings WHERE chiave='margine_percentuale'").getAsObject();if(!ms.chiave)db.run(`INSERT INTO display_settings(chiave,valore)VALUES('margine_percentuale','30')`)}catch(e){}
try{db.run("ALTER TABLE repairs ADD COLUMN ora_inizio TEXT")}catch(e){}
try{db.run("ALTER TABLE repairs ADD COLUMN durata_minuti INTEGER")}catch(e){}
try{db.run("ALTER TABLE servizi ADD COLUMN ora_inizio TEXT")}catch(e){}
try{db.run("ALTER TABLE servizi ADD COLUMN durata_minuti INTEGER")}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS promemoria(id TEXT PRIMARY KEY,titolo TEXT NOT NULL,nota TEXT DEFAULT '',data TEXT NOT NULL,ora TEXT,ricorrenza TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`)}catch(e){}
try{db.run(`CREATE TABLE IF NOT EXISTS prenotazioni_ordini(id TEXT PRIMARY KEY,cliente_id TEXT,cliente_nome TEXT NOT NULL,cliente_telefono TEXT,cliente_email TEXT,brand TEXT NOT NULL,modello TEXT NOT NULL,colore_variante TEXT,tipo_riparazione TEXT,ricambio TEXT,in_store INTEGER DEFAULT 1,note_dispositivo TEXT,fornitore_id TEXT,fornitore_nome TEXT,stato TEXT DEFAULT 'da_ordinare',data_inserimento TEXT,data_ordine TEXT,data_arrivo TEXT,caparra_attiva INTEGER DEFAULT 0,caparra_importo REAL,caparra_totale REAL,caparra_metodo TEXT,caparra_note TEXT,note_generali TEXT,created_at TEXT DEFAULT(datetime('now')),updated_at TEXT DEFAULT(datetime('now')))`);db.run(`CREATE INDEX IF NOT EXISTS idx_prenord_stato ON prenotazioni_ordini(stato)`);db.run(`CREATE INDEX IF NOT EXISTS idx_prenord_cliente ON prenotazioni_ordini(cliente_nome)`)}catch(e){}
app.locals.saveDB=()=>fs.writeFileSync(DB_PATH,Buffer.from(db.export()));
app.locals.query=(sql,params=[])=>{const s=db.prepare(sql);s.bind(params);const r=[];while(s.step())r.push(s.getAsObject());s.free();return r;};
app.locals.run=(sql,params=[])=>{db.run(sql,params);app.locals.saveDB();};
app.locals.get=(sql,params=[])=>{const r=app.locals.query(sql,params);return r[0]||null;};
app.locals.uid=()=>crypto.randomBytes(8).toString('hex');
app.locals.saveDB();
console.log('DB ok:',DB_PATH);
}

initDB().then(()=>{
app.use('/products',require('./routes/products'));
app.use('/devices',require('./routes/devices'));
app.use('/repairs',require('./routes/repairs'));
app.use('/purchases',require('./routes/purchases'));
app.use('/imei',require('./routes/imei'));
app.use('/valutazione',require('./routes/valutazione'));
app.use('/fornitori',require('./routes/fornitori'));
app.use('/interventi',require('./routes/interventi'));
app.use('/ricambi',require('./routes/ricambi'));
app.use('/servizi',require('./routes/servizi'));
app.use('/clienti',require('./routes/clienti'));
app.use('/importexport',require('./routes/importexport'));
app.use('/protezioni',require('./routes/protezioni'));
app.use('/piani',require('./routes/piani'));
const valDisplay=require('./routes/valutazione_display_route');
app.use('/valutazione-display',valDisplay.router);
const displayOrdini=require('./routes/display_ordini_route');
const cassaRoute=require('./routes/cassa_route');
const storicoDispRoute=require('./routes/storico_dispositivi_route');
app.use('/display-ordini',displayOrdini.router);
app.use('/storico-dispositivi',storicoDispRoute.router);
app.use('/cassa',cassaRoute.router);
app.use('/promemoria',require('./routes/promemoria'));
const prenotazioniOrdini=require('./routes/prenotazioni_ordini_route');
app.use('/prenotazioni-ordini',prenotazioniOrdini.router);
const fonedayRoute=require('./routes/foneday_route');
app.use('/foneday',fonedayRoute.router);
app.get('/health',(req,res)=>res.json({status:'ok',version:'2.8.0',products:app.locals.get('SELECT COUNT(*) as n FROM products')?.n||0,devices:app.locals.get('SELECT COUNT(*) as n FROM devices')?.n||0,repairs:app.locals.get('SELECT COUNT(*) as n FROM repairs')?.n||0,clienti:app.locals.get('SELECT COUNT(*) as n FROM clienti')?.n||0,protezioni:app.locals.get('SELECT COUNT(*) as n FROM protezioni')?.n||0,display:app.locals.get('SELECT COUNT(*) as n FROM display_listino WHERE attivo=1')?.n||0,prenotazioni_ordini:app.locals.get('SELECT COUNT(*) as n FROM prenotazioni_ordini')?.n||0}));
app.use((err,req,res,next)=>{console.error(err.message);res.status(err.status||500).json({error:err.message});});
app.listen(PORT,'0.0.0.0',()=>console.log('Magazzino API v2.8 port '+PORT));
}).catch(err=>{console.error(err);process.exit(1);});
