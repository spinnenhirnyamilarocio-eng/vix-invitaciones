// 1. Buscamos el ID en la URL o en el almacenamiento local
const params = new URLSearchParams(window.location.search);
const idInvitacion = params.get('id') || localStorage.getItem('idInvitacionActual');

if (!idInvitacion) {
  alert('No se encontró ninguna invitación.');
  window.location.href = 'registro.html';
} else {
  // 2. Consultamos al backend los datos reales
 fetch(`/invitaciones/${idInvitacion}`)
    .then(res => {
      if (!res.ok) throw new Error('Invitación no encontrada');
      return res.json();
    })
    .then(invitacion => {
      // 3. Cargamos los datos en pantalla
      document.getElementById('nombre').textContent = `${invitacion.titular_nombre} ${invitacion.titular_apellido}`;
      document.getElementById('fecha').textContent = invitacion.evento || 'Viernes 28.08';
      
      const adicionales = Number(invitacion.autorizadas) - 1;
      document.getElementById('cantidad').textContent = adicionales > 0 ? `+${adicionales}` : '0';

      const estadoEl = document.getElementById('estado');
      estadoEl.textContent = invitacion.estado === 'activa' || invitacion.estado === 'valida' ? 'Válida' : 'No válida';

      // 4. Dibujamos el QR
      new QRCode(document.getElementById('qrcode'), {
        text: invitacion.id,
        width: 160,
        height: 160,
        colorDark: "#0a0806",
        colorLight: "#f2e9d8"
      });

      // 5. Mensaje de WhatsApp estructurado y sin errores de símbolos
      const btnWhatsapp = document.getElementById('btn-whatsapp');
      if (btnWhatsapp) {
        const linkInvitacion = `${window.location.origin}${window.location.pathname}?id=${invitacion.id}`;
        
        const mensaje = 
`*VIX - INVITACIÓN DIGITAL*

¡Hola ${invitacion.titular_nombre}! Acá está tu pase con código QR para ingresar al evento:

${linkInvitacion}

_Presentá esta pantalla en la puerta._`;

        btnWhatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
      }
    })
    .catch(error => {
      console.error('Error al cargar la invitación:', error);
      alert('Hubo un error al obtener tu invitación del servidor.');
    });
}