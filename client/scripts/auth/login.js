document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form')

    $('.toggle-password').on('click', function() {
        const passwordField = $(this).siblings('input');
        const passwordFieldType = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', passwordFieldType);
        
        const icon = $(this).find('i');
        if (passwordFieldType === 'text') {
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault() // Evita el envío del formulario

        // Obtener los valores de los campos de entrada
        const usu_codigo = form.querySelector('input[name="usu_codigo"]').value
        const usu_contrasena = form.querySelector('input[name="usu_contrasena"]').value

        // Formatear los datos para enviarlos
        const formatData = {
            usu_codigo,
            usu_contrasena,
        }

        try {
            // Realizar la solicitud de login
            const {data} = await axios.post('http://localhost:8080/api/auth/login', formatData)
            const {access_token} = data
            localStorage.setItem('authToken', access_token)
            window.location.href = '/'
        } catch (error) {
            console.log(error) // Manejar errores de la solicitud
            const {data} = error.response
            alert(data.error)
        }
    })

    // Funcion para verificar si el usuario esta autenticado
    const isAuthenticated = () => {
        return localStorage.getItem('authToken') !== null
    }

    // Funcion para regresar a la pagina de inicio en caso este logeado
    const returnNoAccess = () => {
        if (isAuthenticated()) {
            window.location.href = '/'
        }
    }

    returnNoAccess()
})
