document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/signIn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': '127.0.0.1'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            localStorage.setItem('token', data.access_token);
            alert('Login exitoso');
            window.location.href = 'main.html';
        } else {
            alert('Error en login: ' + (data.message || 'Credenciales incorrectas'));
        }
    } catch (error) {
        alert('Error de conexión con el servidor');
    }
});
