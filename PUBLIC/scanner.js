const pantallaCamara = document.getElementById('pantalla-camara');
const pantallaResultado = document.getElementById('pantalla-resultado');
const badgeEstado = document.getElementById('badge-estado');
const motivoEl = document.getElementById('r-motivo');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnVolver = document.getElementById('btn-volver');

let idActual = null;
const html5QrCode = new Html5Qrcode("reader");

function iniciarCamara() {
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    onScanExitoso
  ).catch(err => console.error("Error al iniciar cámara:", err));
}

function onScanExitoso(idLeido) {
  html5QrCode.pause();
  
  // Limpia el texto por si viene con espacios
  let id = idLeido.trim();
  if (id.includes('id=')) {
    id = id.split('id=')[1].split('&')[0];
  }
  
  idActual = id;
  consultarAlServidor(id);
}

// Va a buscar la invitación a la base de datos real
function consultarAlServidor(id) {
  pantallaCamara.classList.add('oculto');
  pantallaResultado.classList.remove('oculto');

  fetch(`/invitaciones/${id}`)
    .then(res => {
      if (!res.ok) throw new Error('No encontrada');
      return res.json();
    })
    .then(invitacion => {
      actualizarVista(invitacion);
    })
    .catch(err => {
      badgeEstado.textContent = 'No válido';
      badgeEstado.className = 'estado-badge invalido';
      document.getElementById('r-nombre').textContent = 'Invitación no encontrada';
      document.getElementById('r-evento').textContent = '—';
      document.getElementById('r-tipo').textContent = '—';
      document.getElementById('r-autorizadas').textContent = '0';
      document.getElementById('r-ingresadas').textContent = '0';
      document.getElementById('r-restantes').textContent = '0';

      motivoEl.textContent = 'Este código no corresponde a ninguna invitación registrada.';
      motivoEl.classList.remove('oculto');
      btnConfirmar.disabled = true;
    });
}

function actualizarVista(invitacion) {
  const restantes = invitacion.autorizadas - invitacion.ingresadas;

  document.getElementById('r-nombre').textContent = `${invitacion.titular_nombre} ${invitacion.titular_apellido}`;
  document.getElementById('r-evento').textContent = invitacion.evento || 'Viernes 28.08';
  document.getElementById('r-tipo').textContent = invitacion.tipo || 'Especial';
  document.getElementById('r-autorizadas').textContent = invitacion.autorizadas;
  document.getElementById('r-ingresadas').textContent = invitacion.ingresadas;
  document.getElementById('r-restantes').textContent = Math.max(restantes, 0);

  if (restantes <= 0) {
    badgeEstado.textContent = 'No válido';
    badgeEstado.className = 'estado-badge invalido';
    motivoEl.textContent = 'Ya ingresó la cantidad máxima de personas permitida para esta invitación.';
    motivoEl.classList.remove('oculto');
    btnConfirmar.disabled = true;
  } else {
    badgeEstado.textContent = 'Válido';
    badgeEstado.className = 'estado-badge';
    motivoEl.classList.add('oculto');
    btnConfirmar.disabled = false;
  }
}

// Al presionar el botón "Confirmar ingreso"
btnConfirmar.addEventListener('click', () => {
  btnConfirmar.disabled = true;

  fetch(`/invitaciones/${idActual}/ingreso`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        actualizarVista(data.invitacion);
      } else {
        alert(data.error || 'No se pudo confirmar el ingreso');
      }
    })
    .catch(err => {
      alert('Error de conexión con el backend');
      btnConfirmar.disabled = false;
    });
});

// Botón para volver a escanear otra
btnVolver.addEventListener('click', () => {
  pantallaResultado.classList.add('oculto');
  pantallaCamara.classList.remove('oculto');
  html5QrCode.resume();
});

iniciarCamara();