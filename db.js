const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'invitaciones.db'));

// Crea la tabla con la estructura exacta si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS invitaciones (
    id TEXT PRIMARY KEY,
    titular_nombre TEXT,
    titular_apellido TEXT,
    titular_dni TEXT,
    titular_celular TEXT,
    instagram TEXT,
    tipo TEXT DEFAULT 'Especial',
    evento TEXT DEFAULT 'Viernes 28.08',
    autorizadas INTEGER DEFAULT 1,
    ingresadas INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'activa',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;