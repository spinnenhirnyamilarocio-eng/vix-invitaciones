const data = JSON.parse(localStorage.getItem('grupoVix'));

if (!data) {
  // Si alguien entra directo a esta pantalla sin pasar por "amigos.html"
  document.querySelector('.card').innerHTML =
    '<p style="color:var(--muted); text-align:center;">No hay ningún grupo cargado todavía.</p>';
} else {
  document.getElementById('titular').textContent = data.titular;

  const lista = document.getElementById('lista');
  data.amigos.forEach((amigo, i) => {
    const fila = document.createElement('div');
    fila.className = 'amigo';
    fila.innerHTML = `
      <div class="info">
        <span class="nombre">${i + 1}. ${amigo.nombre} ${amigo.apellido}</span>
        <span class="dni">DNI ${amigo.dni}</span>
      </div>
    `;
    lista.appendChild(fila);
  });

  const total = data.amigos.length + 1;
  document.getElementById('total').textContent = `${total} persona${total !== 1 ? 's' : ''}`;

  document.getElementById('btn-final').addEventListener('click', () => {
    // Acá, en la próxima etapa, esto dispara la creación real
    // de la invitación en el backend y redirige a invitacion.html
    // con los datos definitivos.
    window.location.href = 'invitacion.html';
  });
}