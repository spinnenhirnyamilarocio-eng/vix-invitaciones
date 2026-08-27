const pantallaCamara = document.getElementById('pantalla-camara');
const pantallaResultado = document.getElementById('pantalla-resultado');
const badgeEstado = document.getElementById('badge-estado');
const motivoEl = document.getElementById('r-motivo');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnVolver = document.getElementById('btn-volver');

let idActual = null;
let escaneoActivo = true;
const html5QrCode = new Html5Qrcode("reader");

function iniciarCamara() {
  const config = {
    fps: 20, // Mayor velocidad de lectura
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.floor(minEdge * 0.75);
      return { width: size, height: size };
    },
    aspectRatio: 1.0
  };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    onScanExitoso,
    () => {} // Ignorar errores cuadro por cuadro
  ).catch(err => {
    console.error("Error al iniciar cámara:", err);
    alert("No se pudo acceder a la cámara. Asegurate de dar permisos.");
  });
}

function onScanExitoso(textoDecodificado) {
  if (!escaneoActivo) return;
  escaneoActivo = false;

  // Extraer el ID limpio ya sea que el QR tenga la URL entera o solo el código
  let id = textoDecodificado.trim();
  if (id.includes('id=')) {
    id = id.split('id=')[1].split('&')[0];
  } else if (id.includes('/')) {
    id = id.substring(id.lastIndexOf('/') + 1);
  }

  idActual = id;
  consultarAlServidor(id);
}

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
  document.getElementById('r-tipo').textContent = invitacion.tipo || 'Pase Exclusivo';
  document.getElementById('r-autorizadas').textContent = invitacion.autorizadas;
  document.getElementById('r-ingresadas').textContent = invitacion.ingresadas;
  document.getElementById('r-restantes').textContent = Math.max(restantes, 0);

  if (restantes <= 0) {
    badgeEstado.textContent = 'No válido';
    badgeEstado.className = 'estado-badge invalido';
    motivoEl.textContent = 'Ya ingresó la cantidad total de personas autorizadas.';
    motivoEl.classList.remove('oculto');
    btnConfirmar.disabled = true;
  } else {
    badgeEstado.textContent = 'VÁLIDO';
    badgeEstado.className = 'estado-badge';
    motivoEl.classList.add('oculto');
    btnConfirmar.disabled = false;
  }
}

// Confirmar ingreso
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
      alert('Error al confirmar ingreso con el servidor');
      btnConfirmar.disabled = false;
    });
});

// Botón para volver a escanear
btnVolver.addEventListener('click', () => {
  pantallaResultado.classList.add('oculto');
  pantallaCamara.classList.remove('oculto');
  escaneoActivo = true;
});

iniciarCamara();