document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia de Navigo
    const router = new Navigo('/', false)

    // Función para cargar contenido en el elemento #content
    const loadContent = (path, scriptURL) => {
        fetch(path)
            .then(response => response.text())
            .then(html => {
                document.getElementById('content').innerHTML = html
                // Si se puede cargar scripts
                if(scriptURL){
                    const script = document.createElement('script')
                    script.src = scriptURL
                    document.getElementById('content').appendChild(script)
                }
            })
            .catch(error => console.error('Error:', error))
    }

    // Funcion para verificar si el usuario esta autenticado
    const isAuthenticated = () => {
        return localStorage.getItem('authToken') !== null
    }

    // Middleware para rutas protegidas
    const requireAuth = (callback) => {
        if (isAuthenticated()) {
            callback();
        } else {
            window.location.href = 'login.html';
        }
    }

    // Definir las rutas
    router.on('/', () => {
        requireAuth(() => {
            loadContent('pages/home.html', '')
        })
        // document.getElementById('content').innerHTML = '<h1>Bienvenido a la Página de Inicio</h1>'
    })

    // Ruta para el listado de productos
    router.on('/productos', () => {
        requireAuth(() => {
            loadContent('pages/producto/producto.html', 'scripts/producto/productos.js')
        })
    })

    // Ruta para el listado de trabajadores
    router.on('/trabajadores', () => {
        requireAuth(() => {
            loadContent('pages/trabajador/trabajador.html', 'scripts/trabajador/trabajadores.js')
        })
    })

    router.on('/test', () => {
        loadContent('pages/test.html', 'scripts/test.js')
    })

    // Manejar la navegación hacia atrás y adelante
    window.addEventListener('popstate', () => {
        router.resolve()
    })

    // Resolver la ruta actual
    router.resolve()
})
