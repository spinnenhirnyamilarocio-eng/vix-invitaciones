let listaCompleta = [];

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
    
    // Obtener número de teléfono y armar enlace a WhatsApp
    const telefono = (inv.telefono || inv.whatsapp || inv.titular_telefono || '').toString().replace(/\D/g, '');
    const urlPase = `${window.location.origin}/pase.html?id=${inv.id}`;
    const mensaje = encodeURIComponent(`Hola ${inv.titular_nombre}, acá está tu pase de acceso para VIX:\n${urlPase}`);
    const linkWhatsapp = telefono ? `https://wa.me/${telefono}?text=${mensaje}` : `https://wa.me/?text=${mensaje}`;

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
        <td>
          <a href="${linkWhatsapp}" target="_blank" style="background-color: #25d366; color: #ffffff; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
            WhatsApp 📲
          </a>
        </td>
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