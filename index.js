const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sirve las páginas web directamente desde la carpeta public
app.use(express.static(path.join(__dirname, 'PUBLIC')));
// Redirigir el inicio directamente al registro
app.get('/', (req, res) => {
  res.redirect('/registro.html');
});

// 1. Ver todas las invitaciones
app.get('/invitaciones', (req, res) => {
  const invitaciones = db.prepare('SELECT * FROM invitaciones').all();
  res.json(invitaciones);
});

// 2. Obtener una sola invitación por ID
app.get('/invitaciones/:id', (req, res) => {
  const { id } = req.params;
  const invitacion = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);

  if (!invitacion) {
    return res.status(404).json({ error: 'Invitación no encontrada' });
  }

  res.json(invitacion);
});

// 3. Crear una invitación nueva
app.post('/invitaciones', (req, res) => {
  const { nombre, apellido, dni, celular, instagram, amigos } = req.body;
  const id = 'VIX-' + Date.now().toString().slice(-8);

  db.prepare(`
    INSERT INTO invitaciones
      (id, titular_nombre, titular_apellido, titular_dni, titular_celular, instagram, tipo, evento, autorizadas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, nombre, apellido, dni, celular, instagram || '',
    'Especial', 'Viernes 28.08', Number(amigos) + 1
  );

  res.json({ ok: true, id });
});

// 4. Registrar el ingreso en la puerta
app.post('/invitaciones/:id/ingreso', (req, res) => {
  const { id } = req.params;
  const invitacion = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);

  if (!invitacion) {
    return res.status(404).json({ ok: false, error: 'Invitación no encontrada' });
  }

  if (invitacion.ingresadas >= invitacion.autorizadas) {
    return res.status(400).json({ 
      ok: false, 
      error: 'Ya ingresó la cantidad máxima de personas permitida para esta invitación.', 
      invitacion 
    });
  }

  const nuevasIngresadas = invitacion.ingresadas + 1;
  const nuevoEstado = nuevasIngresadas >= invitacion.autorizadas ? 'usada' : 'activa';

  db.prepare(`
    UPDATE invitaciones 
    SET ingresadas = ?, estado = ? 
    WHERE id = ?
  `).run(nuevasIngresadas, nuevoEstado, id);

  const actualizada = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);
  res.json({ ok: true, invitacion: actualizada });
});

app.listen(PUERTO, () => {
  console.log(`Servidor de VIX corriendo en el puerto ${PUERTO}`);
});