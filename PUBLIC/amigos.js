const LIMITE_AMIGOS = 8; // ajustable según el tipo de invitación

const lista = document.getElementById('lista');
const vacio = document.getElementById('vacio');
const totalEl = document.getElementById('total');
const btnAgregar = document.getElementById('btn-agregar');
const btnContinuar = document.getElementById('btn-continuar');

let amigos = [];

function actualizarVista() {
  lista.innerHTML = '';

  amigos.forEach((amigo, i) => {
    const fila = document.createElement('div');
    fila.className = 'amigo';
    fila.innerHTML = `
      <div class="info">
        <span class="nombre">${amigo.nombre} ${amigo.apellido}</span>
        <span class="dni">DNI ${amigo.dni}</span>
      </div>
      <button data-i="${i}">✕</button>
    `;
    lista.appendChild(fila);
  });

  vacio.classList.toggle('oculto', amigos.length > 0);

  const total = amigos.length + 1; // +1 por el titular
  totalEl.textContent = `${total} persona${total !== 1 ? 's' : ''}`;

  btnAgregar.disabled = amigos.length >= LIMITE_AMIGOS;
  btnAgregar.style.opacity = amigos.length >= LIMITE_AMIGOS ? '0.4' : '1';
}

lista.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const i = Number(e.target.dataset.i);
    amigos.splice(i, 1);
    actualizarVista();
  }
});

btnAgregar.addEventListener('click', () => {
  const nombre = document.getElementById('f-nombre').value.trim();
  const apellido = document.getElementById('f-apellido').value.trim();
  const dni = document.getElementById('f-dni').value.trim();

  if (!nombre || !apellido || dni.replace(/\D/g, '').length < 7) {
    alert('Completá nombre, apellido y un DNI válido.');
    return;
  }

  if (amigos.length >= LIMITE_AMIGOS) return;

  amigos.push({ nombre, apellido, dni });
  actualizarVista();

  document.getElementById('f-nombre').value = '';
  document.getElementById('f-apellido').value = '';
  document.getElementById('f-dni').value = '';
});

btnContinuar.addEventListener('click', () => {
  const grupo = {
    titular: document.getElementById('titular').textContent,
    amigos: amigos
  };
  localStorage.setItem('grupoVix', JSON.stringify(grupo));
  window.location.href = 'confirmacion.html';
});

actualizarVista();