const f = document.getElementById('f');
const card = document.getElementById('card');
let amigos = 0;
const cantEl = document.getElementById('cant');

document.getElementById('mas').onclick = () => cantEl.textContent = ++amigos;
document.getElementById('menos').onclick = () => { if (amigos > 0) cantEl.textContent = --amigos; };

function marcar(campo, invalido) {
  document.querySelector(`[data-f="${campo}"]`)?.classList.toggle('invalid', invalido);
}

f.onsubmit = (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  let ok = true;

  marcar('nombre', !d.nombre); if (!d.nombre) ok = false;
  marcar('apellido', !d.apellido); if (!d.apellido) ok = false;

  const dniOk = d.dni.replace(/\D/g, '').length >= 7;
  marcar('dni', !dniOk); if (!dniOk) ok = false;

  const celOk = d.celular.replace(/\D/g, '').length >= 8;
  marcar('celular', !celOk); if (!celOk) ok = false;

  if (!ok) return;

  fetch('/invitaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...d, amigos })
  })
    .then(respuesta => {
      if (!respuesta.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      return respuesta.json();
    })
    .then(resultado => {
      localStorage.setItem('idInvitacionActual', resultado.id);

      // Asignar el enlace del pase generado al botón
      const btnPase = document.getElementById('btn-ver-pase');
      if (btnPase) {
        btnPase.href = `/pase.html?id=${resultado.id}`;
      }

      card.classList.add('done');
      document.getElementById('ok').classList.add('show');
    })
    .catch(error => {
      console.error('Error al crear la invitación:', error);
      alert('Hubo un problema al generar tu invitación. Intentá de nuevo.');
    });
};