document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita el envío del formulario

        // Obtener los valores de los campos de entrada
        const username = form.querySelector('input[name="username"]').value;
        const password = form.querySelector('input[name="password"]').value;

        // Formatear los datos para enviarlos
        const formatData = {
            usu_codigo: username,
            usu_contrasena: password
        };

        console.log(formatData)

        try {
            // Realizar la solicitud de login
            const {data} = await axios.post('http://localhost:8080/api/auth/login', formatData);
            const {access_token} = data
            console.log(access_token)
            localStorage.setItem('authToken', access_token)
            window.location.href = '/'
        } catch (error) {
            console.log(error); // Manejar errores de la solicitud
        }
    });
});
