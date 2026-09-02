const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PUERTO = process.env.PORT || 3000;

// Conexión a MongoDB Atlas
const MONGO_URI = 'mongodb+srv://spinnenhirnyamilarocio_db_user:cxV7oUOJQkjrRdfM@cluster0.bbqua0y.mongodb.net/vix_db?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conexión exitosa a MongoDB Atlas'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema de Invitación
const invitacionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titular_nombre: { type: String, default: '' },
  titular_apellido: { type: String, default: '' },
  titular_dni: { type: String, default: '' },
  titular_celular: { type: String, default: '' },
  instagram: { type: String, default: '' },
  tipo: { type: String, default: 'Especial' },
  evento: { type: String, default: 'VIERNES' }, // Guarda VIERNES o SÁBADO
  autorizadas: { type: Number, default: 1 },
  ingresadas: { type: Number, default: 0 },
  estado: { type: String, default: 'activa' },
  fecha: { type: Date, default: Date.now }
});

const Invitacion = mongoose.model('Invitacion', invitacionSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'PUBLIC')));

app.get('/', (req, res) => {
  res.redirect('/registro.html');
});

// 1. Listar todas las invitaciones (Panel Admin)
app.get('/invitaciones', async (req, res) => {
  try {
    const lista = await Invitacion.find().sort({ fecha: -1 });
    res.json(lista);
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({ error: 'Error al consultar datos' });
  }
});

// 2. Obtener una sola invitación por ID (Pase QR y Escáner)
app.get('/invitaciones/:id', async (req, res) => {
  try {
    const inv = await Invitacion.findOne({ id: req.params.id });
    if (!inv) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }
    res.json(inv);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// 3. Registrar nueva invitación con control de DNI por día
app.post('/invitaciones', async (req, res) => {
  try {
    const { nombre, apellido, dni, celular, instagram, amigos, dia } = req.body;
    const dniLimpio = (dni || '').toString().trim();
    const diaElegido = (dia || 'VIERNES').toString().trim().toUpperCase();

    // Verificación: Bloquea si ya tiene pase para ESE mismo día
    if (dniLimpio) {
      const yaExiste = await Invitacion.findOne({ 
        titular_dni: dniLimpio,
        evento: diaElegido
      });

      if (yaExiste) {
        return res.json({ 
          ok: false, 
          error: `⚠️ Este número de DNI ya cuenta con pase registrado para el día ${diaElegido}.` 
        });
      }
    }

    const nuevoId = 'VIX-' + Date.now().toString().slice(-6);
    const autorizadas = Number(amigos || 0) + 1;

    const nueva = new Invitacion({
      id: nuevoId,
      titular_nombre: nombre || '',
      titular_apellido: apellido || '',
      titular_dni: dniLimpio,
      titular_celular: celular || '',
      instagram: instagram || '',
      tipo: 'Especial',
      evento: diaElegido,
      autorizadas: autorizadas,
      ingresadas: 0,
      estado: 'activa'
    });

    await nueva.save();
    res.json({ ok: true, id: nuevoId });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ ok: false, error: 'Error al registrar' });
  }
});

// 4. Registrar ingreso en la puerta (Scanner)
app.post('/invitaciones/:id/ingreso', async (req, res) => {
  try {
    const inv = await Invitacion.findOne({ id: req.params.id });

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

    inv.ingresadas = ingresadas + 1;
    inv.estado = inv.ingresadas >= autorizadas ? 'usada' : 'activa';
    await inv.save();

    res.json({ ok: true, invitacion: inv });
  } catch (error) {
    console.error('Error al procesar ingreso:', error);
    res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

// 5. Vaciar lista completa
app.post('/invitaciones/limpiar-todo', async (req, res) => {
  try {
    await Invitacion.deleteMany({});
    res.json({ ok: true });
  } catch (error) {
    console.error('Error al vaciar base de datos:', error);
    res.status(500).json({ ok: false, error: 'Error al vaciar' });
  }
});

app.listen(PUERTO, () => {
  console.log(`Servidor VIX activo en puerto ${PUERTO}`);
});