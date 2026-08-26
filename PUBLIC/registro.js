let cantidadAmigos = 0;

// Botones de amigos (+ y -)
const btnMas = document.getElementById('btn-mas');
const btnMenos = document.getElementById('btn-menos');
const visor = document.getElementById('cant-amigos');

if (btnMas) {
  btnMas.addEventListener('click', (e) => {
    e.preventDefault();
    if (cantidadAmigos < 10) {
      cantidadAmigos++;
      if (visor) visor.textContent = cantidadAmigos;
    }
  });
}

if (btnMenos) {
  btnMenos.addEventListener('click', (e) => {
    e.preventDefault();
    if (cantidadAmigos > 0) {
      cantidadAmigos--;
      if (visor) visor.textContent = cantidadAmigos;
    }
  });
}

// Función para enviar los datos
function procesarEnvio(e) {
  if (e) e.preventDefault();

  // Busca los campos por ID o por orden de aparición
  const inputs = document.querySelectorAll('input');
  const inputNombre = document.getElementById('nombre') || inputs[0];
  const inputApellido = document.getElementById('apellido') || inputs[1];
  const inputDni = document.getElementById('dni') || inputs[2];
  const inputCelular = document.getElementById('celular') || inputs[3];
  const inputInstagram = document.getElementById('instagram') || inputs[4];

  if (!inputNombre || !inputApellido || !inputDni || !inputCelular) {
    alert('Faltan detectar los campos de texto en la pantalla.');
    return;
  }

  const datos = {
    nombre: inputNombre.value.trim(),
    apellido: inputApellido.value.trim(),
    dni: inputDni.value.trim(),
    celular: inputCelular.value.trim(),
    instagram: inputInstagram ? inputInstagram.value.trim() : '',
    amigos: cantidadAmigos
  };

  if (!datos.nombre || !datos.apellido || !datos.dni || !datos.celular) {
    alert('Por favor completá Nombre, Apellido, DNI y Celular.');
    return;
  }

  // Enviamos al servidor
  fetch('/invitaciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error en el servidor');
      }
      return data;
    })
    .then(data => {
      if (data.id) {
        localStorage.setItem('idInvitacionActual', data.id);
        window.location.href = `invitacion.html?id=${data.id}`;
      } else {
        alert('No se recibió el código de invitación.');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error: ' + err.message);
    });
}

// Vinculamos el formulario y el botón dorado directamente
const form = document.querySelector('form');
if (form) {
  form.onsubmit = procesarEnvio;
}

const botones = document.querySelectorAll('button');
botones.forEach(btn => {
  if (btn.textContent.toUpperCase().includes('GENERAR') || btn.type === 'submit') {
    btn.onclick = procesarEnvio;
  }
});