// Obtener token y IP
function getToken() {
    return localStorage.getItem('token');
}
function getForwardedFor() {
    return '177.91.250.33'; // Cambia según tu IP
}

// Función genérica para llamadas API protegidas
async function apiRequest(url, options = {}) {
    const token = getToken();
    if (!token) {
        alert('No hay sesión activa. Por favor inicia sesión.');
        window.location.href = 'login.html';
        return;
    }
    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-forwarded-for': getForwardedFor(),
        ...options.headers
    };
    if (options.method && options.method !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, { ...options, headers });
    let data;
    try {
        data = await response.json();
    } catch {
        data = null;
    }
    if (response.status === 401) {
        alert('Sesión expirada o token inválido. Por favor inicia sesión de nuevo.');
        window.location.href = 'login.html';
        return;
    }
    return { ok: response.ok, status: response.status, data };
}

// Actualizar hora y fecha en pantalla
function actualizarHoraFecha() {
    const now = new Date();
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaStr = now.toLocaleDateString('es-ES', opcionesFecha);
    const horaStr = now.toLocaleTimeString('es-ES');
    document.querySelector('.current-time-display').textContent = horaStr;
    document.querySelector('.current-date').textContent = fechaStr;
}

// Obtener hora actual en formato HH:mm:ss
function obtenerHoraActual() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

// Cargar estado de asistencia actual y actualizar UI
async function cargarEstadoAsistencia() {
    const res = await apiRequest('http://localhost:3002/api/attendance/today');
    if (!res?.ok) {
        console.error('Error al obtener estado de asistencia');
        return;
    }
    const estado = res.data;

    // Mostrar u ocultar botones según si ya hay check-in
    const actionDiv = document.querySelector('.attendance-action');
    actionDiv.innerHTML = ''; // limpiar

    if (!estado.checkIn) {
        // No hay entrada registrada, mostrar botón "Marcar Entrada"
        const btnEntrada = document.createElement('button');
        btnEntrada.className = 'attendance-button check-in';
        btnEntrada.innerHTML = '<i class="fas fa-sign-in-alt"></i> Marcar Entrada';
        btnEntrada.addEventListener('click', marcarEntrada);
        actionDiv.appendChild(btnEntrada);

        // Ocultar mensaje de estado
        document.querySelector('.status-message').style.display = 'none';
    } else if (estado.checkIn && !estado.checkOut) {
        // Entrada registrada, pero no salida, mostrar botón "Marcar Salida"
        const btnSalida = document.createElement('button');
        btnSalida.className = 'attendance-button check-out';
        btnSalida.innerHTML = '<i class="fas fa-sign-out-alt"></i> Marcar Salida';
        btnSalida.addEventListener('click', marcarSalida);
        actionDiv.appendChild(btnSalida);

        // Mostrar mensaje con hora de entrada
        const msg = document.querySelector('.status-message');
        msg.style.display = 'block';
        msg.innerHTML = `<i class="fas fa-check-circle"></i> Entrada registrada correctamente a las ${estado.checkIn}`;
    } else {
        // Entrada y salida registradas, no mostrar botones
        document.querySelector('.status-message').style.display = 'block';
        document.querySelector('.status-message').textContent = 'Asistencia del día completada.';
        actionDiv.innerHTML = '';
    }

    // Actualizar info de asistencia
    document.querySelector('.status-info-value:nth-child(1)').textContent = estado.estadoActual || 'N/D';
    document.querySelector('.status-info-value:nth-child(2)').textContent = estado.checkIn || 'Pendiente';
    document.querySelector('.status-info-value:nth-child(3)').textContent = estado.checkOut || 'Pendiente';
    document.querySelector('.status-info-value:nth-child(4)').textContent = estado.tiempoTrabajado || '0h 0m';
}

// Funciones para marcar entrada y salida
async function marcarEntrada() {
  const hora = obtenerHoraActual(); // función que devuelve "HH:mm:ss"
  const res = await apiRequest('http://localhost:3002/api/attendance/checkin', {
    method: 'POST',
    body: JSON.stringify({ checkIn: hora }),
  });
  if (res?.ok) {
    alert(`Entrada registrada a las ${hora}`);
    cargarEstadoAsistencia(); // refresca datos en pantalla
  } else {
    alert('Error al marcar entrada: ' + (res?.data?.message || 'Error desconocido'));
  }
}

async function marcarSalida() {
  const hora = obtenerHoraActual();
  const res = await apiRequest('http://localhost:3002/api/attendance/checkout', {
    method: 'POST',
    body: JSON.stringify({ checkOut: hora }),
  });
  if (res?.ok) {
    alert(`Salida registrada a las ${hora}`);
    cargarEstadoAsistencia();
  } else {
    alert('Error al marcar salida: ' + (res?.data?.message || 'Error desconocido'));
  }
}

// Cargar historial semanal y actualizar tabla
async function cargarHistorialSemanal() {
    const res = await apiRequest('http://localhost:3002/api/attendance/lastweek');
    if (!res?.ok) {
        console.error('Error al cargar historial semanal');
        return;
    }
    const tbody = document.querySelector('.history-table tbody');
    tbody.innerHTML = '';
    res.data.forEach(dia => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dia.fecha}</td>
            <td>${dia.checkIn || '-'}</td>
            <td>${dia.checkOut || '-'}</td>
            <td>${dia.horas || '-'}</td>
            <td>${dia.modalidad || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Inicializar todo al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    actualizarHoraFecha();
    setInterval(actualizarHoraFecha, 1000);
    cargarEstadoAsistencia();
    cargarHistorialSemanal();
});
