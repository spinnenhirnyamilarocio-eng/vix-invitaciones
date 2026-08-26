// Usuario de prueba. Esto se reemplaza por una validación
// real contra el backend cuando esté conectado.
const USUARIO_PRUEBA = { usuario: "puerta", clave: "1234" };

const f = document.getElementById('f-login');
const errorEl = document.getElementById('error-login');

f.addEventListener('submit', (e) => {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const clave = document.getElementById('clave').value.trim();

  if (usuario === USUARIO_PRUEBA.usuario && clave === USUARIO_PRUEBA.clave) {
    sessionStorage.setItem('sesionPuerta', 'activa');
    window.location.href = 'scanner.html';
  } else {
    errorEl.classList.add('show');
  }
});