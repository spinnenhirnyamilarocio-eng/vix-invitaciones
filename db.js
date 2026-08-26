const Database = require('better-sqlite3');
const db = new Database('vix.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS invitaciones (
    id TEXT PRIMARY KEY,
    titular_nombre TEXT NOT NULL,
    titular_apellido TEXT NOT NULL,
    titular_dni TEXT NOT NULL,
    titular_celular TEXT NOT NULL,
    instagram TEXT,
    tipo TEXT NOT NULL,
    evento TEXT NOT NULL,
    autorizadas INTEGER NOT NULL,
    ingresadas INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activa',
    creada_en TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;