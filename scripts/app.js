document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia de Navigo
    const router = new Navigo('/logistica', {hash: false})

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

    // Funcion para verificar que el usuario no este autenticado
    const notAuthenticated = () => {
        return localStorage.getItem('authToken') === null
    }

    // Middleware para rutas protegidas
    const privateRoute = (callback) => {
        if (isAuthenticated()) {
            callback();
        } else {
            window.location.href = 'login.html';
        }
    }

    // Middleware para rutas no protegidas
    const publicRoute = (callback) => {
        if (notAuthenticated()) {
            callback();
        } else {
            window.location.href = '/';
        }
    }

    // Definir las rutas
    router.on('/', () => {
        privateRoute(() => {
            loadContent('pages/home.html', 'scripts/home.js')
        })
    })

    // Ruta para el listado de productos
    router.on('/productos', () => {
        privateRoute(() => {
            loadContent('pages/producto/producto.html', 'scripts/producto/productos.js')
        })
    })

    // Ruta para el listado de trabajadores
    router.on('/trabajadores', () => {
        privateRoute(() => {
            loadContent('pages/trabajador/trabajador.html', 'scripts/trabajador/trabajadores.js')
        })
    })

    // Ruta para el listado de usuarios
    router.on('/usuarios', () => {
        privateRoute(() => {
            loadContent('pages/usuario/usuario.html', 'scripts/usuario/usuarios.js')
        })
    })

    // Ruta para el listado de roles
    router.on('/roles', () => {
        privateRoute(() => {
            loadContent('pages/rol/rol.html', 'scripts/rol/roles.js')
        })
    })

    // Ruta para ordenes internas
    router.on('/orden-interna', () => {
        privateRoute(() => {
            loadContent('pages/orden-interna/ordenInterna.html', 'scripts/orden-interna/ordenesInternas.js')
        })
    })
    // Ruta para la creacion de orden interna
    router.on('/orden-interna/crear', () => {
        privateRoute(() => {
            loadContent('pages/orden-interna/crearOrdenInterna.html', 'scripts/orden-interna/crearOrdenInterna.js')
        })
    })
    // Ruta para la edicion de orden interna
    router.on('/orden-interna/editar/:id', () => {
        privateRoute(() => {
            loadContent('pages/orden-interna/editarOrdenInterna.html', 'scripts/orden-interna/editarOrdenInterna.js')
        })
    })
    // Ruta para despliegue orden interna
    router.on('/despliegue-orden', () => {
        privateRoute(() => {
            loadContent('pages/despliegue-orden/despliegueOrdenInterna.html', 'scripts/despliegue-orden/despliegueOrdenInterna.js')
        })
    })

    // Ruta para proveedores
    router.on('/proveedores', () => {
        privateRoute(() => {
            loadContent('pages/proveedor/proveedor.html', 'scripts/proveedor/proveedores.js')
        })
    })

    // Ruta para clientes
    router.on('/clientes', () => {
        privateRoute(() => {
            loadContent('pages/cliente/cliente.html', 'scripts/cliente/clientes.js')
        })
    })

    // Ruta para entidades bancarias
    router.on('/entidad-bancaria', () => {
        privateRoute(() => {
            loadContent('pages/entidad-bancaria/entidadBancaria.html', 'scripts/entidad-bancaria/entidadBancaria.js')
        })
    })

    // Ruta para cotizacion
    router.on('/cotizacion', () => {
        privateRoute(() => {
            loadContent('pages/cotizacion/cotizacion.html', 'scripts/cotizacion/cotizaciones.js')
        })
    })
    // Ruta creacion de cotizacion
    router.on('/cotizacion/crear', () => {
        privateRoute(() => {
            loadContent('pages/cotizacion/crearCotizacion.html', 'scripts/cotizacion/crearCotizacion.js')
        })
    })
    // Ruta edicion de cotizacion
    router.on('/cotizacion/editar/:id', () => {
        privateRoute(() => {
            loadContent('pages/cotizacion/editarCotizacion.html', 'scripts/cotizacion/editarCotizacion.js')
        })
    })
    // Ruta para orden de compra
    router.on('/orden-compra', () => {
        privateRoute(() => {
            loadContent('pages/orden-compra/ordenCompra.html', 'scripts/orden-compra/ordenCompra.js')
        })
    })
    // Ruta creacion de orden compra
    router.on('/orden-compra/crear', () => {
        privateRoute(() => {
            loadContent('pages/orden-compra/crearOrderCompra.html', 'scripts/orden-compra/crearOrdenCompra.js')
        })
    })

    // Ruta edicion de orden compra
    router.on('/orden-compra/editar/:id', () => {
        privateRoute(() => {
            loadContent('pages/orden-compra/editarOrdenCompra.html', 'scripts/orden-compra/editarOrdenCompra.js')
        })
    })

    // Ruta de aprobacion de orden de compra
    router.on('/aprobacion-orden-compra', () => {
        privateRoute(() => {
            loadContent('pages/aprobacion-orden-compra/aprobacionOrdenCompra.html', 'scripts/aprobacion-orden-compra/aprobacion-orden-compra.js')
        })
    })

    // Ruta de validacion de codigo de orden interna
    router.on('/validacion-codigo-orden', () => {
        privateRoute(() => {
            loadContent('pages/validacion-codigo-orden/validacionCodigoOrdenInterna.html', 'scripts/validacion-codigo-orden/validacionCodigoOrdenInterna.js')
        })
    })

    // Ruta de lista de requerimientos
    router.on('/requerimiento', () => {
        privateRoute(() => {
            loadContent('pages/requerimiento/requerimiento.html', 'scripts/requerimiento/requerimientos.js')
        })
    })

    // Ruta de creacion de requerimientos
    router.on('/requerimiento/crear', () => {
        privateRoute(() => {
            loadContent('pages/requerimiento/crearRequerimiento.html', 'scripts/requerimiento/crearRequerimiento.js')
        })
    })

    // Ruta de edicion de requerimientos
    router.on('/requerimiento/editar/:id', () => {
        privateRoute(() => {
            loadContent('pages/requerimiento/editarRequerimiento.html', 'scripts/requerimiento/editarRequerimiento.js')
        })
    })

    // Ruta para el perfil
    router.on('/perfil', () => {
        privateRoute(() => {
            loadContent('pages/perfil.html', 'scripts/perfil/perfil.js')
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

    // ------------- JAVACRIPT PARA EL NAVABAR DE NAVEGACION -------------
    const modulos = JSON.parse(localStorage.getItem('modulos'));
    const {maestros, procesos} = modulos

    // Seleccionar los dropdowns donde se agregarán los enlaces
    const catalogosDropdown = $('#catalogosDropdownMenu');
    const procesosDropdown = $('#procesosDropdownMenu');

    // Función para crear enlaces de menú
    function crearEnlaceMenu(descripcion, url) {
        return `<li><a class="dropdown-item" href="${url}">${descripcion}</a></li>`;
    }

    // Agregar los enlaces de "Maestros" al menú de "Catálogos"
    if (maestros && maestros.length) {
        maestros.forEach((maestro) => {
            catalogosDropdown.append(crearEnlaceMenu(maestro.mol_descripcion, maestro.mol_url));
        });
    }

    // Agregar los enlaces de "Procesos" al menú de "Procesos"
    if (procesos && procesos.length) {
        procesos.forEach((proceso) => {
            procesosDropdown.append(crearEnlaceMenu(proceso.mol_descripcion, proceso.mol_url));
        });
    }
})
