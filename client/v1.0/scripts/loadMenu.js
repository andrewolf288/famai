$(document).ready(function () {
    // Carga el navbar y configura los enlaces
    $('#navbar-container').load('./paginas/navBar.html', function () {
        configureLinks();
    });

    // Carga el footer
    $('#footer-container').load('./paginas/footer.html');

    // Configura los enlaces del navbar
    function configureLinks() {
        const links = [
            { selector: '#formularioLink', page: 'formulario' },
            { selector: '#usuariosLink', page: 'usuarios' },
            // PAGINAS DE ORDEN INTERNA
            { selector: '#list-orden-interna', page: 'orden-interna/listOrdenInterna' },
            { selector: '#create-orden-interna', page: 'orden-interna/createOrdenInterna' },
            // PAGINAS DE PRODUCTOS
            { selector: '#productosLink', page: 'productos/listProductos'},
            // PAGINAS DE TRABAJADORES
            {selector: '#trabajadoresLink', page: 'trabajadores/listTrabajadores'},
            { selector: '#reportesLink', action: returnReport },
            { selector: '#sesionLink', page: 'sesion' }
        ];

        links.forEach(link => {
            if (link.page) {
                $(link.selector).click(function (event) {
                    event.preventDefault();
                    loadContent(link.page);
                });
            } else if (link.action) {
                $(link.selector).click(function (event) {
                    event.preventDefault();
                    link.action();
                });
            }
        });
    }

    // Función para cargar las páginas
    function loadContent(page) {
        $('#content').load('./paginas/' + page + '.html')
    }

    // Función para retornar el reporte
    function returnReport() {
        window.location.href = './php/vistas/generarReporteOrdenTrabajo.php';
    }

    // Cargar contenido por defecto
    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            loadContent(hash);
        } else {
            loadContent('usuarios'); // Página por defecto
        }
    }

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Carga inicial
});