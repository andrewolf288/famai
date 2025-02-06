$(document).ready(() => {
    let abortController
    let dataTable
    const dataContainer = $('#data-container')
    const apiURL = '/detalleMaterialesOrdenInterna-pendientes-entregar'

    // configuracion de opciones de datatable
    const dataTableOptionsMaterialesPendientes = {
        detroy: true,
        reponsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        searching: false,
        info: true,
        language: {
            lengthMenu: "Mostrar _MENU_ registros por página",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            search: "Buscar:",
            zeroRecords: "No se encontraron resultados",
            select: {
                rows: {
                    _: " - %d filas seleccionadas",
                    0: " - Ninguna fila seleccionada",
                    1: " - 1 fila seleccionada"
                }
            },
        },
        columnDefs: [
            { type: 'string', targets: 2 },
            {
                targets: 0,
                orderable: false,
            },
            {
                orderable: false,
                render: DataTable.render.select(),
                targets: 1,
                className: 'form-check-input'
            }
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    async function initDataTable(URL = apiURL) {
        // verificamos que no se haya inicializado el datatable
        if ($.fn.DataTable.isDataTable(dataContainer)) {
            dataContainer.DataTable().destroy();
        }
        // vaciamos la lista
        $('#data-container-body').empty()
        // agregamos un loader
        $('#data-container-body').append(`
            <tr>
                <td colspan="100%">
                    <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div class="mt-2">Cargando...</div>
                        </div>
                    </div>
                </td>
            </tr>
        `)
        try {
            const { data } = await client.get(URL)
            let content = ''
            data.forEach((detalleMateriales, index) => {
                const { orden_interna_parte, total_reservado_atendido, odm_id, producto } = detalleMateriales

                content += `
                <tr>
                    <td></td>
                    <td></td>
                    <td>${orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td>${producto?.pro_descripcion || 'N/A'}</td>
                    <td class="text-center">${producto?.uni_codigo || 'N/A'}</td>
                    <td class="text-center">${total_reservado_atendido}</td>
                    <td class="d-none detalle-material">${odm_id}</td>
                </tr>
                `
            })

            $('#data-container-body').html(content)
            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptionsMaterialesPendientes)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    // initializamos el datatable
    initDataTable(apiURL)

    // ----------- GESTION DE EMISION DE NOTA DE SALIDA -------------
    $("#btn-crear-nota-salida").on('click', async function(){
        const filasSeleccionadas = dataTable.rows({ selected: true }).nodes()
        const detallesMaterialesIds = []
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).find('.detalle-material').text()
            detallesMaterialesIds.push(parseInt(valor))
        })

        // inicializamos la información
        initInformacionMaestros()

        // debemos completar las 2 casuisticas
        if (detallesMaterialesIds.length === 0) {
            $("#agregarItemButton").removeClass('d-none')
        } else {
            // si es de una orden de compra entonces habilitamos el boton de agregar productos de modal
            $("#agregarItemButton").addClass('d-none')
            const { data } = await client.post('detalleMaterialesOrdenInterna-pendientes-entregar', {
                detalles: detallesMaterialesIds
            })
            establecerInformacionDetalles(data)
        }

        showModalCreacionNotaSalida()
    })

    // --------- GESTION DE INFORMACION DE MAESTROS NECESARIOS -----------
    // cargar motivos de movimiento
    async function cargarMotivoMovimiento() {
        try {
            const { data } = await client.get('/motivosmovimiento?mtm_tipomovimiento=S')
            const $motivomovimiento = $("#motivoMovimientoInput")
            $motivomovimiento.empty()
            // añadimos una opcion por defecto
            const defaultOptionMotivoMovimiento = $('<option>').val('').text('Seleccione un motivo de movimiento')
            $motivomovimiento.append(defaultOptionMotivoMovimiento)

            data.forEach(motivo => {
                const option = $(`<option>`).val(motivo["mtm_codigo"]).text(`${motivo["mtm_descripcion"]}`)
                $motivomovimiento.append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }

    // cargar informacion de almacenes
    async function cargarAlmacenes() {
        // primero obtenemos informacion de la sede del trabajador que esta usando el sistema
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        let sed_codigo = "10" // por defecto almacen de Arequipa
        try {
            const { data } = await client.get(`/trabajadorByUsuario?usu_codigo=${usu_codigo}`)
            sed_codigo = data.sed_codigo
        } catch (error) {
            alert("No se encontró un trabajador asignado a este usuario")
        }

        // luego establecemos los almacenes
        const { data } = await client.get('/almacenes?alm_esprincipal=1')
        const $almacenes = $("#almacenNotaSalidaInput")
        $almacenes.empty()
        data.forEach(almacen => {
            const option = $(`<option ${almacen["sed_codigo"] === sed_codigo ? 'selected' : ''}>`).val(almacen["alm_id"]).text(almacen["alm_descripcion"])
            $almacenes.append(option)
        })
    }

    const initInformacionMaestros = () => {
        return Promise.all([
            cargarAlmacenes(),
            cargarMotivoMovimiento(),
        ])
    }

    // inicializar información de detalles
    function establecerInformacionDetalles(detalles) {
        $("#detalleNotaSalidaTableBody").empty()

        let content = ''
        detalles.forEach((detalle) => {
            const { odm_id, orden_interna_parte, producto, total_reservado_atendido} = detalle
            content += `
            <tr>
                <input type="hidden" class="producto-id" value="${producto.pro_id}"/>
                <input type="hidden" class="detalle-material-id" value="${odm_id}"/>
                <td>${orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                <td>${producto?.pro_codigo || 'N/A'}</td>
                <td>${producto?.pro_descripcion || 'N/A'}</td>
                <td class="text-center">${producto?.uni_codigo || 'N/A'}</td>
                <td class="text-center cantidad-pendiente-input">${total_reservado_atendido}</td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-salida-input" value='${total_reservado_atendido}' max="${total_reservado_atendido}"/>
                </td>
            </tr>
            `
        })

        $("#detalleNotaSalidaTableBody").html(content)
    }

    // ------------ GESTION DE MODAL DE PRODUCTO ---------------
    function limpiarListaProductos() {
        $('#resultadosListaProductos').empty()
    }

    $('#productosInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarMateriales(query)
        } else {
            limpiarListaProductos()
        }
    }))

    $("#agregarItemButton").on('click', function () {
        showModalProducto()
    })

    async function buscarMateriales(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/productosByQuery2?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarListaProductos()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                // listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - ${material.stock?.alp_stock || 0}`
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosListaProductos').append(listItem)
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Petición abortada'); // Maneja el error de la petición abortada
            } else {
                console.error('Error al buscar materiales:', error);
                alert('Error al buscar materiales. Inténtalo de nuevo.'); // Muestra un mensaje de error al usuario
            }
        }
    }

    function seleccionarMaterial(material) {
        const { pro_codigo, pro_descripcion, uni_codigo } = material
        // limpiamos el input
        limpiarListaProductos()
        $('#productosInput').val('')

        const rowItem = document.createElement('tr')
        rowItem.innerHTML = `
        <input class="producto-id" value="${pro_codigo}" type="hidden"/>
        <input class="detalle-material-id" value="" type="hidden"/>
        <td class="text-center odt-numero">N/A</td>
        <td class="codigo-producto">${pro_codigo}</td>
        <td class="descripcion-producto">${pro_descripcion}</td>
        <td class="text-center unidad-producto">${uni_codigo}</td>
        <td class="text-center">
            <input type="number" class="form-control cantidad-producto-input" value='0'/>
        </td>
        <td class="text-center">
            <button class="btn btn-sm btn-danger delete-detalle-producto">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                </svg>
            </button>
        </td>
        `
        $('#tbl-detalle-productos-nota-salida-body').append(rowItem)
    }

    $('#btn-agregar-producto').on('click', function () {
        const detalle = []
        const identificadores = []

        $("#tbl-detalle-productos-nota-salida-body tr").each(function () {
            const odm_id = $(this).find('.detalle-material-id').val();
            const pro_id = $(this).find('.producto-id').val();

            identificadores.push(odm_id)

            const content = `
            <tr>
                <input type="hidden" class="producto-id" value="${pro_id}"/>
                <input type="hidden" class="detalle-material-id" value="${odm_id}"/>
                <td>${$(this).find('.odt-numero').text()}</td>
                <td>${$(this).find('.codigo-producto').text()}</td>
                <td>${$(this).find('.descripcion-producto').text()}</td>
                <td class="text-center">${$(this).find('.unidad-producto').text()}</td>
                <td class="text-center cantidad-pendiente-input">N/A</td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-salida-input" value='${$(this).find('.cantidad-producto-input').val()}' max="${$(this).find('.cantidad-producto-input').val()}"/>
                </td>
            </tr>
            `
            detalle.push(content)
        });

        detalle.forEach(detalle => {
            $("#detalleNotaSalidaTableBody").append(detalle)
        })

        // cerramos el modal de producto
        const modalProductoDetalle = bootstrap.Modal.getInstance(document.getElementById('addProductModal'))
        modalProductoDetalle.hide()
    })

    // --------- CREACION DE NOTA DE SALIDA --------------
    $("#btn-guardar-nota-salida").on('click', function () {
        crearNotaSalida()
    })

    async function crearNotaSalida() {
        // motivo movimiento
        const motivoMovimiento = $("#motivoMovimientoInput").val().trim()
        // almacen de salida
        const almacenSalida = $("#almacenNotaSalidaInput").val().trim()

        // realizamos las validaciones correspondientes
        let handleError = ''
        if (motivoMovimiento.length === 0) {
            handleError += '- Se debe ingresar un motivo de movimiento\n'
        }
        if (almacenSalida.length === 0) {
            handleError += '- Se debe ingresar un almacen de salida\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        // detalle de nota de salida
        const detalleFormatNotaSalida = obtenerDetalleNotaSalida()
        // validamos la informacion de detalle
        if (detalleFormatNotaSalida.length === 0) {
            alert("Debe ingresar al menos un producto para la nota de salida")
            return
        }

        const validacionDetalle = validarDetalleNotaSalida(detalleFormatNotaSalida)
        if (validacionDetalle.length !== 0) {
            alert(validacionDetalle)
            return
        }

        const formatData = {
            alm_id: almacenSalida,
            mtm_codigo: motivoMovimiento, // motivo de movimiento
            detalle: detalleFormatNotaSalida
        }

        console.log(formatData)
        // return
        try {
            const { data } = await client.post('almacen-movimiento/salida', formatData)
            alert('Nota de salida creada exitosamente')
            // cerramos el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('crearNotaSalidaModal'))
            modal.hide()
        } catch (error) {
            console.log(error)
            const { response } = error
            alert(response.data.error)
        }
    }

    // ------- FUNCIONES UTILITARIAS PARA EL MODULO -------
    // cerrar modal de nota de salida modal
    $('#crearNotaSalidaModal').on('hide.bs.modal', function (e) {
        limpiarFormularioNotaSalida()
        initDataTable(apiURL)
    })

    // cerrar modal de producto modal
    $('#addProductModal').on('hide.bs.modal', function (e) {
        limpiarFormularioProducto()
    })

    // funcion para mostrar modal de creacion de nota de salida
    function showModalCreacionNotaSalida() {
        const modalElement = document.getElementById("crearNotaSalidaModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    // funcion para modal de agregar producto
    function showModalProducto() {
        const modalElement = document.getElementById("addProductModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    // funcion para limpiar el formulario de creacion de nota de salida
    function limpiarFormularioNotaSalida() {
        $("#detalleNotaSalidaTableBody").empty()
    }

    // funcion para limpiar tabla de modal de agregar productos
    function limpiarFormularioProducto() {
        $("#productosInput").val('')
        $("#resultadosListaProductos").empty()
        $("#tbl-detalle-productos-nota-salida-body").empty()
    }

    // obtener detalle de nota de salida para creacion
    function obtenerDetalleNotaSalida() {
        // referencia del cuerpo de la tabla
        const productos = $('#detalleNotaSalidaTableBody tr')
        const detalle = []
        if (productos.length > 0) {
            productos.each(function (index, row) {
                const formatData = {
                    odm_id: $(row).find('.detalle-material-id').val() || null,
                    pro_id: $(row).find('.producto-id').val(),
                    amd_cantidad: $(row).find('.cantidad-salida-input').val(),
                    ocd_cantidadpendiente: $(row).find('.cantidad-pendiente-input').text(),
                }
                detalle.push(formatData)
            })
        }

        return detalle
    }

    // funcion para validar detalle de nota de salida
    function validarDetalleNotaSalida(detalles) {
        let handleError = ''
        detalles.forEach((detalle, index) => {
            const { odm_id, ocd_cantidadpendiente, amd_cantidad } = detalle
            // la cantidad debe ser un valor numerico
            if (odm_id) {
                if (!esValorNumericoValidoMayorIgualQueCero(amd_cantidad)) {
                    handleError += `El detalle ${index + 1} debe tener una cantidad mayor o igual que cero\n`
                } else {
                    // buscamos en el arreglo de detalles
                    if (obtenerValorNumerico(amd_cantidad) > obtenerValorNumerico(ocd_cantidadpendiente)) {
                        handleError += `El detalle ${index + 1} debe tener una cantidad menor o igual a la cantidad\n`
                    }
                }
            } else {
                if (!esValorNumericoValidoYMayorQueCero(amd_cantidad)) {
                    handleError += `El detalle ${index + 1} debe tener una cantidad mayor que cero\n`
                }
            }
        })

        return handleError
    }
})
