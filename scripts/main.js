
        // Funciones para obtener token e IP
        function getToken() {
            return localStorage.getItem('token');
        }
        function getForwardedFor() {
            return '177.91.250.33'; // Cambiar según tu IP
        }

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

            const response = await fetch(url, {
                ...options,
                headers
            });

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

        // Función para actualizar hora actual
        function actualizarHora() {
            const now = new Date();
            const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const fecha = now.toLocaleDateString('es-ES', opciones);
            const hora = now.toLocaleTimeString('es-ES');
            document.getElementById('currentTime').innerHTML = `<i class="far fa-clock"></i> ${fecha} | ${hora}`;
        }

        // Función para cargar datos del usuario y dashboard
        async function cargarDashboard() {
            // Actualiza la hora cada segundo
            actualizarHora();
            setInterval(actualizarHora, 1000);

            // Obtener info del usuario (ejemplo: /api/auth/me o similar)
            const userResp = await apiRequest('http://localhost:3002/api/auth/me');
            if (userResp?.ok) {
                const user = userResp.data;
                document.getElementById('userName').textContent = `${user.name} ${user.lastName}`;
                document.getElementById('welcomeMessage').textContent = `Bienvenido, ${user.name}. Aquí está tu resumen de asistencia`;
            }

            // Obtener resumen de asistencia y horas (ajusta según tu API)
            const resumenResp = await apiRequest('http://localhost:3002/api/attendance/summary');
            if (resumenResp?.ok) {
                const resumen = resumenResp.data;
                document.getElementById('estadoActual').textContent = resumen.estadoActual || 'N/D';
                document.getElementById('modalidadActual').textContent = `Modalidad: ${resumen.modalidad || '--'}`;
                document.getElementById('horasTrabajadas').textContent = resumen.horasTrabajadasHoy || '0h 0m';
                document.getElementById('asistenciaMensual').textContent = resumen.porcentajeAsistencia || '0%';
                document.getElementById('diasAsistidos').textContent = resumen.diasAsistidos || '--';
                document.getElementById('companerosEnLinea').textContent = resumen.companerosEnLinea || '0/0';
                document.getElementById('companerosDetalle').textContent = resumen.companerosDetalle || '--';
            }

            // Cargar tabla de asistencia últimos 5 días
            const asistenciaResp = await apiRequest('http://localhost:3002/api/attendance/last5days');
            if (asistenciaResp?.ok) {
                const tbody = document.querySelector('#tablaAsistencia tbody');
                tbody.innerHTML = '';
                asistenciaResp.data.forEach(dia => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${dia.fecha}</td>
                        <td><span class="attendance-status status-${dia.estado.toLowerCase()}">${dia.estado}</span></td>
                        <td>${dia.entrada || '-'}</td>
                        <td>${dia.salida || '-'}</td>
                        <td>${dia.horas || '-'}</td>
                        <td>${dia.modalidad || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            // Cargar tabla de equipo / compañeros en línea
            const equipoResp = await apiRequest('http://localhost:3002/api/team/status');
            if (equipoResp?.ok) {
                const tbody = document.querySelector('#tablaEquipo tbody');
                tbody.innerHTML = '';
                equipoResp.data.forEach(emp => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <div class="employee-name">
                                <div class="employee-avatar">
                                    <img src="/api/placeholder/30/30" alt="Employee" />
                                </div>
                                <span>${emp.nombre}</span>
                            </div>
                        </td>
                        <td><span class="attendance-status status-${emp.estado.toLowerCase()}">${emp.estado}</span></td>
                        <td>${emp.entrada || '-'}</td>
                        <td>${emp.modalidad || '-'}</td>
                        <td>${emp.departamento || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
        // --- ACCIONES DE LOS BOTONES ---

        // Marcar Entrada
        async function marcarEntrada() {
            const res = await apiRequest('http://localhost:3002/api/attendance/checkin', { method: 'POST' });
            if (res?.ok) {
                alert('Entrada registrada correctamente');
                cargarDashboard(); // Opcional: recarga los datos del dashboard
            } else {
                alert('Error al marcar entrada: ' + (res?.data?.message || 'Error desconocido'));
            }
        }

        // Marcar Salida
        async function marcarSalida() {
            const res = await apiRequest('http://localhost:3002/api/attendance/checkout', { method: 'POST' });
            if (res?.ok) {
                alert('Salida registrada correctamente');
                cargarDashboard();
            } else {
                alert('Error al marcar salida: ' + (res?.data?.message || 'Error desconocido'));
            }
        }

        // Solicitar Permiso
        async function solicitarPermiso() {
            const motivo = prompt("Motivo del permiso:");
            if (!motivo) return;
            const res = await apiRequest('http://localhost:3002/api/permission', {
                method: 'POST',
                body: JSON.stringify({ motivo })
            });
            if (res?.ok) {
                alert('Permiso solicitado correctamente');
            } else {
                alert('Error al solicitar permiso: ' + (res?.data?.message || 'Error desconocido'));
            }
        }

        // Asigna los eventos a los botones al cargar la página
        window.addEventListener('DOMContentLoaded', () => {
            cargarDashboard(); // Ya lo tienes, solo asegúrate de no duplicar la llamada
            document.getElementById('btnEntrada').addEventListener('click', marcarEntrada);
            document.getElementById('btnSalida').addEventListener('click', marcarSalida);
            document.getElementById('btnPermiso').addEventListener('click', solicitarPermiso);
        });


        // Ejecutar al cargar la página
        window.addEventListener('DOMContentLoaded', cargarDashboard);
