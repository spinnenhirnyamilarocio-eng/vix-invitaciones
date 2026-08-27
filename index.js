const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sirve las páginas web
app.use(express.static(path.join(__dirname, 'PUBLIC')));

app.get('/', (req, res) => {
  res.redirect('/registro.html');
});

// 1. Ver todas las invitaciones
app.get('/invitaciones', (req, res) => {
  try {
    const invitaciones = db.prepare('SELECT * FROM invitaciones ORDER BY rowid DESC').all();
    res.json(invitaciones);
  } catch (error) {
    console.error('Error al obtener invitaciones:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// 2. Obtener una sola invitación por ID
app.get('/invitaciones/:id', (req, res) => {
  try {
    const { id } = req.params;
    const invitacion = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);

    if (!invitacion) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    res.json(invitacion);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// 3. Crear una invitación nueva
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
      id, nombre, apellido, dni, celular, instagram || '',
      'Especial', 'Viernes 28.08', autorizadas
    );

    res.json({ ok: true, id });
  } catch (error) {
    console.error('Error al guardar invitación:', error);
    res.status(500).json({ ok: false, error: 'Error al registrar en la base de datos' });
  }
});

// 4. Registrar ingreso en la puerta
app.post('/invitaciones/:id/ingreso', (req, res) => {
  try {
    const { id } = req.params;
    const invitacion = db.prepare('SELECT * FROM invitaciones WHERE id = ?').get(id);

    if (!invitacion) {
      return res.status(404).json({ ok: false, error: 'Invitación no encontrada' });
    }

    const autorizadas = Number(invitacion.autorizadas) || 1;
    const ingresadas = Number(invitacion.ingresadas) || 0;

    if (ingresadas >= autorizadas) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Ya ingresó la cantidad máxima de personas permitida.', 
        invitacion 
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
    console.error('Error al registrar ingreso:', error);
    res.status(500).json({ ok: false, error: 'Error en el servidor' });
  }
});

// 5. Vaciar lista completa
app.post('/invitaciones/limpiar-todo', (req, res) => {
  try {
    db.prepare('DELETE FROM invitaciones').run();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Error al vaciar base de datos' });
  }
});

app.listen(PUERTO, () => {
  console.log(`Servidor VIX corriendo en el puerto ${PUERTO}`);
});