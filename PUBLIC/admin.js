let listaCompleta = [];

// Formatear el número de celular para enlace directo a WhatsApp (código de Argentina +54 9)
function formatearNumeroWhatsApp(celular) {
  if (!celular) return '';
  let limpio = celular.replace(/[^0-9]/g, '');
  if (limpio.startsWith('0')) limpio = limpio.substring(1);
  if (!limpio.startsWith('54')) {
    limpio = '549' + limpio;
  }
  return limpio;
}

function cargarDatos() {
  fetch('/invitaciones')
    .then(res => res.json())
    .then(invitaciones => {
      listaCompleta = invitaciones;
      actualizarMetricas(invitaciones);
      renderizarTabla(invitaciones);
    })
    .catch(err => {
      console.error('Error al cargar datos:', err);
      document.getElementById('tabla-cuerpo').innerHTML = `
        <tr><td colspan="7" style="text-align:center; color:#ff5252;">Error de conexión con el backend</td></tr>
      `;
    });
}

function actualizarMetricas(invitaciones) {
  const totalTitulares = invitaciones.length;
  let esperados = 0;
  let ingresados = 0;

  invitaciones.forEach(inv => {
    esperados += Number(inv.autorizadas || 0);
    ingresados += Number(inv.ingresadas || 0);
  });

  const pendientes = esperados - ingresados;

  document.getElementById('total-invitaciones').textContent = totalTitulares;
  document.getElementById('total-esperados').textContent = esperados;
  document.getElementById('total-ingresados').textContent = ingresados;
  document.getElementById('total-pendientes').textContent = Math.max(pendientes, 0);
}

function renderizarTabla(invitaciones) {
  const tbody = document.getElementById('tabla-cuerpo');
  
  if (invitaciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #887e70;">No se encontraron registros</td></tr>';
    return;
  }

  tbody.innerHTML = invitaciones.map(inv => {
    const estadoClass = inv.estado === 'usada' ? 'usada' : 'activa';
    const estadoTexto = inv.estado === 'usada' ? 'Completado' : 'Pendiente';

    // Generación del enlace y botón de WhatsApp
   const telWsp = formatearNumeroWhatsApp(inv.celular || inv.titular_celular || inv.telefono || inv.titular_telefono);
    const linkInvitacion = `${window.location.origin}/invitacion.html?id=${inv.id}`;
    const mensaje = encodeURIComponent(`¡Hola ${inv.titular_nombre}! Acá tenés tu pase para el evento: ${linkInvitacion}`);
    
    const botonWsp = telWsp ? `
      <a href="https://wa.me/${telWsp}?text=${mensaje}" target="_blank" style="
        background: #25d366;
        color: #ffffff;
        padding: 6px 12px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 12px;
        font-weight: bold;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
      ">
        WhatsApp 💬
      </a>
    ` : '—';

    return `
      <tr>
        <td style="font-family: monospace; color: #d4af37;">${inv.id}</td>
        <td>
          <strong>${inv.titular_nombre} ${inv.titular_apellido}</strong>
          <div class="dni-sub">DNI: ${inv.titular_dni}</div>
        </td>
        <td>${inv.instagram ? '@' + inv.instagram.replace('@', '') : '—'}</td>
        <td>${inv.autorizadas} pers.</td>
        <td><strong>${inv.ingresadas}</strong> / ${inv.autorizadas}</td>
        <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
        <td>${botonWsp}</td>
      </tr>
    `;
  }).join('');
}

// Filtros y Búsqueda en vivo
function aplicarFiltros() {
  const texto = document.getElementById('buscador').value.toLowerCase().trim();
  const filtroEstado = document.getElementById('filtro-estado').value;

  const filtrados = listaCompleta.filter(inv => {
    const coincideTexto = 
      inv.id.toLowerCase().includes(texto) ||
      inv.titular_nombre.toLowerCase().includes(texto) ||
      inv.titular_apellido.toLowerCase().includes(texto) ||
      inv.titular_dni.toLowerCase().includes(texto) ||
      (inv.celular && inv.celular.includes(texto)) ||
      (inv.instagram && inv.instagram.toLowerCase().includes(texto));

    const coincideEstado = 
      filtroEstado === 'todos' ||
      (filtroEstado === 'activa' && inv.estado !== 'usada') ||
      (filtroEstado === 'usada' && inv.estado === 'usada');

    return coincideTexto && coincideEstado;
  });

  renderizarTabla(filtrados);
}

document.getElementById('buscador').addEventListener('input', aplicarFiltros);
document.getElementById('filtro-estado').addEventListener('change', aplicarFiltros);

// Auto-actualizar cada 5 segundos para monitoreo en vivo en la puerta
setInterval(cargarDatos, 5000);

// Carga inicial
cargarDatos();