const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Inicializar Base de Datos SQLite directa
const db = new Database(path.join(__dirname, 'invitaciones.db'));

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

app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'PUBLIC')));

app.get('/', (req, res) => {
  res.redirect('/registro.html');
});

// 1. Ver todas las invitaciones (Admin)
app.get('/invitaciones', (req, res) => {
  try {
    const filas = db.prepare('SELECT * FROM invitaciones ORDER BY rowid DESC').all();
    res.json(filas);
  } catch (error) {
    console.error('Error al leer base de datos:', error);
    res.status(500).json({ error: 'Error al consultar datos' });
  }
});

// 2. Obtener una sola invitación por ID (Pase QR)
app.get('/invitaciones/:id', (req, res) => {
  try {
    const { id } = req.params;
    const inv = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);

    if (!inv) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    res.json(inv);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// 3. Registrar nueva invitación
app.post('/invitaciones', (req, res) => {
  try {
    const { nombre, apellido, dni, celular, instagram, amigos } = req.body;
    const id = 'VIX-' + Date.now().toString().slice(-8);
    const autorizadas = Number(amigos || 0) + 1;

    db.prepare(`
      INSERT INTO invitaciones 
        (id, titular_nombre, titular_apellido, titular_dni, titular_celular, instagram, tipo, evento, autorizadas, ingresadas, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'activa')
    `).run(
      id, 
      nombre || '', 
      apellido || '', 
      dni || '', 
      celular || '', 
      instagram || '',
      'Especial', 
      'Viernes 28.08', 
      autorizadas
    );

    res.json({ ok: true, id });
  } catch (error) {
    console.error('Error al insertar:', error);
    res.status(500).json({ ok: false, error: 'Error al registrar' });
  }
});

// 4. Registrar ingreso en la puerta (Scanner)
app.post('/invitaciones/:id/ingreso', (req, res) => {
  try {
    const { id } = req.params;
    const inv = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);

    if (!inv) {
      return res.status(404).json({ ok: false, error: 'Invitación no encontrada' });
    }

    const autorizadas = Number(inv.autorizadas) || 1;
    const ingresadas = Number(inv.ingresadas) || 0;

    if (ingresadas >= autorizadas) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Pase completado: ya ingresaron todas las personas permitidas.', 
        invitacion: inv 
      });
    }

    const nuevasIngresadas = ingresadas + 1;
    const nuevoEstado = nuevasIngresadas >= autorizadas ? 'usada' : 'activa';

    db.prepare(`
      UPDATE invitaciones 
      SET ingresadas = ?, estado = ? 
      WHERE id = ?
    `).run(nuevasIngresadas, nuevoEstado, id);

    const actualizada = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);
    res.json({ ok: true, invitacion: actualizada });
  } catch (error) {
    console.error('Error al procesar ingreso:', error);
    res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

// 5. Vaciar base de datos
app.post('/invitaciones/limpiar-todo', (req, res) => {
  try {
    db.prepare('DELETE FROM invitaciones').run();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Error al vaciar base de datos' });
  }
});

app.listen(PUERTO, () => {
  console.log(`Servidor VIX activo en el puerto ${PUERTO}`);
});