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

// Función para calcular la etiqueta del fin de semana (Ej: "04/09 - 05/09/2026")
function obtenerFinDeSemana(fecha = new Date()) {
  const d = new Date(fecha);
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const fechaArg = new Date(utc - (3 * 3600000));

  const fechaAjustada = new Date(fechaArg.getTime() - (6 * 3600000));
  const diaSemana = fechaAjustada.getDay();

  let diasHastaViernes = 5 - diaSemana;
  if (diaSemana === 0) diasHastaViernes = 5;

  const viernes = new Date(fechaAjustada);
  viernes.setDate(fechaAjustada.getDate() + diasHastaViernes);

  const sabado = new Date(viernes);
  sabado.setDate(viernes.getDate() + 1);

  const pad = n => n.toString().padStart(2, '0');
  return `${pad(viernes.getDate())}/${pad(viernes.getMonth() + 1)} - ${pad(sabado.getDate())}/${pad(sabado.getMonth() + 1)}/${sabado.getFullYear()}`;
}

// Esquema de Invitación
const invitacionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titular_nombre: { type: String, default: '' },
  titular_apellido: { type: String, default: '' },
  titular_dni: { type: String, default: '' },
  titular_celular: { type: String, default: '' },
  instagram: { type: String, default: '' },
  tipo: { type: String, default: 'Especial' },
  evento: { type: String, default: 'VIERNES' },
  fin_semana: { type: String, default: '' },
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

// 1. Listar todas las invitaciones
app.get('/invitaciones', async (req, res) => {
  try {
    const lista = await Invitacion.find().sort({ fecha: -1 });
    const listaNormalizada = lista.map(inv => {
      const item = inv.toObject();
      if (!item.fin_semana) {
        item.fin_semana = obtenerFinDeSemana(item.fecha);
      }
      return item;
    });
    res.json(listaNormalizada);
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({ error: 'Error al consultar datos' });
  }
});

// 2. Obtener una sola invitación por ID
app.get('/invitaciones/:id', async (req, res) => {
  try {
    const inv = await Invitacion.findOne({ id: req.params.id });
    if (!inv) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }
    const item = inv.toObject();
    if (!item.fin_semana) {
      item.fin_semana = obtenerFinDeSemana(item.fecha);
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// 3. Registrar invitación regular (DNI único por Día y Fin de Semana)
app.post('/invitaciones', async (req, res) => {
  try {
    const { nombre, apellido, dni, celular, instagram, amigos, dia } = req.body;
    const dniLimpio = (dni || '').toString().trim();
    const diaElegido = (dia || 'VIERNES').toString().trim().toUpperCase();
    const finSemanaActual = obtenerFinDeSemana(new Date());

    if (dniLimpio) {
      const yaExiste = await Invitacion.findOne({ 
        titular_dni: dniLimpio,
        evento: diaElegido,
        fin_semana: finSemanaActual
      });

      if (yaExiste) {
        return res.json({ 
          ok: false, 
          error: `⚠️ Este DNI ya tiene pase registrado para el ${diaElegido} de este fin de semana.` 
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
      fin_semana: finSemanaActual,
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

// 4. Crear Pase Cumpleaños (Ahora guarda el DNI real)
app.post('/invitaciones/cumple', async (req, res) => {
  try {
    const { nombre, apellido, dni, celular, dia } = req.body;
    const dniLimpio = (dni || '').toString().trim();
    const diaElegido = (dia || 'SÁBADO').toString().trim().toUpperCase();
    const finSemanaActual = obtenerFinDeSemana(new Date());
    const nuevoId = 'CUMPLE-' + Date.now().toString().slice(-5);

    const nueva = new Invitacion({
      id: nuevoId,
      titular_nombre: nombre || '',
      titular_apellido: apellido || '',
      titular_dni: dniLimpio,
      titular_celular: celular || '',
      instagram: '',
      tipo: 'Cumpleaños',
      evento: diaElegido,
      fin_semana: finSemanaActual,
      autorizadas: 999,
      ingresadas: 0,
      estado: 'activa'
    });

    await nueva.save();
    res.json({ ok: true, id: nuevoId });
  } catch (error) {
    console.error('Error al registrar cumpleaños:', error);
    res.status(500).json({ ok: false, error: 'Error al crear pase de cumpleaños' });
  }
});

// 5. Borrar una invitación individual por ID
app.delete('/invitaciones/:id', async (req, res) => {
  try {
    const eliminada = await Invitacion.findOneAndDelete({ id: req.params.id });
    if (!eliminada) {
      return res.status(404).json({ ok: false, error: 'Registro no encontrado' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({ ok: false, error: 'Error al eliminar' });
  }
});

// 6. Registrar ingreso en la puerta (Scanner)
app.post('/invitaciones/:id/ingreso', async (req, res) => {
  try {
    const inv = await Invitacion.findOne({ id: req.params.id });

    if (!inv) {
      return res.status(404).json({ ok: false, error: 'Invitación no encontrada' });
    }

    const autorizadas = Number(inv.autorizadas) || 1;
    const ingresadas = Number(inv.ingresadas) || 0;

    if (inv.tipo !== 'Cumpleaños' && ingresadas >= autorizadas) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Pase completado: ya ingresaron todas las personas permitidas.', 
        invitacion: inv 
      });
    }

    inv.ingresadas = ingresadas + 1;
    if (inv.tipo !== 'Cumpleaños') {
      inv.estado = inv.ingresadas >= autorizadas ? 'usada' : 'activa';
    } else {
      inv.estado = 'activa';
    }
    
    await inv.save();

    res.json({ ok: true, invitacion: inv });
  } catch (error) {
    console.error('Error al procesar ingreso:', error);
    res.status(500).json({ ok: false, error: 'Error del servidor' });
  }
});

app.listen(PUERTO, () => {
  console.log(`Servidor VIX activo en puerto ${PUERTO}`);
});