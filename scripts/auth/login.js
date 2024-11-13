document.addEventListener('DOMContentLoaded', () => {

    function parseJwt (token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    
        return JSON.parse(jsonPayload);
    }

    const form = document.getElementById('login-form')

    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            const passwordFieldType = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', passwordFieldType);
    
            const icon = this.querySelector('i');
            if (passwordFieldType === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
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
            const {data} = await axios.post(`${config.BACK_URL}/auth/login`, formatData)
            const {access_token} = data
            const payload = parseJwt(access_token)
            localStorage.setItem('authToken', access_token)
            // realizamos una peticion para traer la informacion de modulos admitidos
            const {data: modulos} = await axios.get(`${config.BACK_URL}/findModulosByRol/${payload.rol}`)

            const result = {
                maestros: [],
                procesos: []
            }

            modulos[0].rol_modulo.forEach((mod) => {
                if (mod.modulo.mol_tipo === "MAESTRO") {
                    result.maestros.push(mod.modulo);
                } else if (mod.modulo.mol_tipo === "PROCESO") {
                    result.procesos.push(mod.modulo);
                }
            })
            localStorage.setItem('modulos', JSON.stringify(result))

            window.location.href = `/${config.XAMPP_CARPET}`
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
            window.location.href = `/${config.XAMPP_CARPET}`
        }
    }

    returnNoAccess()
})
