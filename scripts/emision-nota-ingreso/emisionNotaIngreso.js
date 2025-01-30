$(document).ready(() => {
    let abortController
    let dataTable
    const dataContainer = $('#data-container')
    const apiURL = '/ordencompra-pendientes-ingresar'
    let flagEsTipoOrdenCompra = false
    let detalleNotaIngreso = []

    // configuracion de opciones de datatable
    const dataTableOptionsOrdenesCompraPendientes = {
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
            style: 'single',
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
            data.forEach((ordenCompra, index) => {
                const { occ_id, moneda, proveedor, occ_numero, occ_fecha, occ_total, occ_subtotal, occ_impuesto, items_pendientes } = ordenCompra

                content += `
                <tr data-detalle=${occ_id}>
                    <td></td>
                    <td></td>
                    <td>${parseDateSimple(occ_fecha)}</td>
                    <td>${occ_numero}</td>
                    <td>${proveedor.prv_nrodocumento || 'N/A'}</td>
                    <td>${proveedor.prv_nombre || 'N/A'}</td>
                    <td>${moneda.mon_descripcion}</td>
                    <td>${moneda.mon_simbolo} ${occ_subtotal}</td>
                    <td>${moneda.mon_simbolo} ${occ_impuesto}</td>
                    <td>${moneda.mon_simbolo} ${occ_total}</td>
                    <td>
                        <button class="btn btn-sm btn-primary detalle-items-pendientes">${items_pendientes} item(s) por ingresar</button>
                    </td>
                </tr>
                `
            })

            $('#data-container-body').html(content)
            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptionsOrdenesCompraPendientes)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    // initializamos el datatable
    initDataTable(apiURL)

    // accion para cuando se quiera ver el detalle de orde de compra pendientes
    $('#data-container').on('click', '.detalle-items-pendientes', async function () {
        const row = $(this).closest('tr')
        const id_detalle = row.data('detalle')

        $("#data-container-pendiente-detalle-ordencompra tbody").empty()

        try {
            const { data } = await client.get(`/ordencompra-pendientes-entregar/${id_detalle}`)
            const { orden_compra, detalles } = data
            const { moneda } = orden_compra
            let content = ''
            detalles.forEach((detalle, index) => {
                const { detalle_material, ocd_porcentajedescuento, ocd_fechaentrega, ocd_descripcion, producto, ocd_cantidad, ocd_cantidadingresada, ocd_preciounitario, ocd_total, ocd_observaciondetalle, ocd_observacion } = detalle
                content += `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${detalle_material?.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                        <td>${ocd_porcentajedescuento}</td>
                        <td>${parseDateSimple(ocd_fechaentrega)}</td>
                        <td>${ocd_descripcion}</td>
                        <td class="text-center">${producto?.uni_codigo}</td>
                        <td class="text-center">${ocd_cantidad}</td>
                        <td class="text-center">${ocd_cantidadingresada}</td>
                        <td class="text-center">${moneda.mon_simbolo} ${ocd_preciounitario}</td>
                        <td class="text-center">${moneda.mon_simbolo} ${ocd_total}</td>
                        <td>${ocd_observaciondetalle || 'N/A'}</td>
                        <td>${ocd_observacion || 'N/A'}</td>
                    </tr>
                `
            })

            $("#data-container-pendiente-detalle-ordencompra tbody").html(content)

            showModalDetallesPendientesOrdenCompra()
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    })

    // ------ GESTION DE EMISIÓN DE NOTA DE INGRESO -------
    $("#btn-crear-nota-ingreso").on('click', async function () {
        flagTipoOrdenCompra = null
        // primero debemos verificar si se esta jalando de una orden de compra
        const filasSeleccionadas = dataTable.rows({ selected: true }).nodes()
        let valorSeleccionado = null
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).closest('tr').data('detalle')
            valorSeleccionado = valor;
        });

        // inicializamos la información
        initInformacionMaestros()

        // debemos completar las 2 casuisticas
        if (!valorSeleccionado) {
            $("#agregarItemButton").removeClass('d-none')
            cargarInformacionTrabajadorLogeado()
        } else {
            // si es de una orden de compra entonces habilitamos el boton de agregar productos de modal
            $("#agregarItemButton").addClass('d-none')
            flagEsTipoOrdenCompra = true
            const { data } = await client.get(`ordencompra-pendientes-entregar/${valorSeleccionado}`)
            const { orden_compra, detalles } = data

            establecerInformacionProveedor(orden_compra.proveedor)
            establecerInformacionOrdenCompra(orden_compra)
            establecerInformacionDetalles(detalles)
            // inicializamos la informacion de nota de ingreso
            detalleNotaIngreso = detalles
        }

        showModalCreacionNotaIngreso()
    })

    // ------- GESTION DE INFORMACION DE MAESTROS NECESARIOS
    // cargar motivos de movimiento
    async function cargarMotivoMovimiento() {
        try {
            const { data } = await client.get('/motivosmovimientoSimple')
            const $motivomovimiento = $("#motivoMovimientoInput")
            // añadimos una opcion por defecto
            const defaultOptionMotivoMovimiento = $('<option>').val('').text('Seleccione un motivo de movimiento')
            $motivomovimiento.append(defaultOptionMotivoMovimiento)

            data.forEach(motivo => {
                const option = $(`<option ${motivo["mtm_codigo"] === 'COM' ? 'selected' : ''}>`).val(motivo["mtm_codigo"]).text(`${motivo["mtm_descripcion"]}`)
                $motivomovimiento.append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }

    // cargar tipos de documentos de referencia
    async function cargarTipoDocumentoReferencia() {
        try {
            const { data } = await client.get('/tiposdocumentosreferenciaSimple')
            const $tipodocumentoreferencia = $("#documentoReferenciaInput")
            // añadimos una opcion por defecto
            const defaultOptionTipoDocumentoReferencia = $('<option>').val('').text('Seleccione un tipo de documento de referencia')
            $tipodocumentoreferencia.append(defaultOptionTipoDocumentoReferencia)

            data.forEach(tipoDocumentoReferencia => {
                const option = $(`<option ${tipoDocumentoReferencia["tdr_codigo"] === 'FAC' ? 'selected' : ''}>`).val(tipoDocumentoReferencia["tdr_codigo"]).text(`${tipoDocumentoReferencia["tdr_descripcion"]}`)
                $tipodocumentoreferencia.append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }

    // cargar informacion de almacenes
    async function cargarAlmacenes() {
        const { data } = await client.get('/almacenes?alm_esprincipal=1')
        const $almacenes = $("#almacenNotaIngresoInput")
        data.forEach(almacen => {
            const option = $('<option data-sede="' + almacen["sed_codigo"] + '">').val(almacen["alm_id"]).text(almacen["alm_descripcion"])
            $almacenes.append(option)
        })
    }

    // cargar información del trabajador logeado
    async function cargarInformacionTrabajadorLogeado() {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        let sed_codigo = "10" // por defecto almacen de Arequipa
        try {
            const { data } = await client.get(`/trabajadorByUsuario?usu_codigo=${usu_codigo}`)
            sed_codigo = data.sed_codigo
        } catch (error) {
            alert("No se encontró un trabajador asignado a este usuario")
        }
    }

    const initInformacionMaestros = () => {
        return Promise.all([
            cargarAlmacenes(),
            cargarMotivoMovimiento(),
            cargarTipoDocumentoReferencia(),
        ])
    }

    // inicializar información de proveedor
    function establecerInformacionProveedor(proveedor) {
        const { prv_id, prv_nombre, tdo_codigo, prv_nrodocumento, prv_correo, prv_contacto, prv_whatsapp, prv_direccion } = proveedor
        $("#idProveedorNotaIngresoInput").val(prv_id)
        $("#documentoProveedorInput").val(`${tdo_codigo} - ${prv_nrodocumento}`)
        $("#razonSocialProveedorInput").val(prv_nombre)
        $("#correoProveedorInput").val(prv_correo)
        $("#contactoProveedorInput").val(prv_contacto)
        $("#whatsappProveedorInput").val(prv_whatsapp)
        $("#direccionProveedorInput").val(prv_direccion)
    }

    // incializar información de orden de compra
    function establecerInformacionOrdenCompra(ordenCompra) {
        const { moneda, forma_pago, occ_fecha, elaborador } = ordenCompra
        $("#monedaOrdenCompraInput").val(moneda.mon_descripcion)
        $("#formaDePagoOrdenCompraInput").val(forma_pago.fpa_descripcion)
        $("#fechaDocumentoInput").val(parseDateSimple(occ_fecha))
        $("#elaboradoOrdenCompraInput").val(elaborador?.tra_nombre || 'N/A')

        // obtenemos informacion de sede de trabajador Elaborador
        const { sed_codigo } = elaborador
        const opcionSeleccionada = $("#almacenNotaIngresoInput option[data-sede='" + sed_codigo + "']");
        const valueOpcionSeleccionada = opcionSeleccionada.val();
        $("#almacenNotaIngresoInput").val(valueOpcionSeleccionada);
    }

    // inicializar información de detalles
    function establecerInformacionDetalles(detalles) {
        $("#detalleNotaIngresoTableBody").empty()

        let content = ''
        detalles.forEach((detalle, index) => {
            const { ocd_id, detalle_material, ocd_fechaentrega, producto, ocd_descripcion, ocd_cantidad, ocd_cantidadpendiente, ocd_cantidadingresada } = detalle
            content += `
            <tr data-detalle="${ocd_id}">
                <input type="hidden" class="producto-id" value="${producto.pro_id}"/>
                <input type="hidden" class="producto-codigo" value="${producto.pro_codigo}"/>
                <td class="text-center">${index + 1}</td>
                <td>${detalle_material?.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                <td>${parseDateSimple(ocd_fechaentrega)}</td>
                <td>${producto?.pro_codigo || 'N/A'}</td>
                <td>${ocd_descripcion}</td>
                <td class="text-center">${producto?.uni_codigo || 'N/A'}</td>
                <td class="text-center">${ocd_cantidad}</td>
                <td class="text-center">${ocd_cantidadingresada}</td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-ingreso-input" value='${ocd_cantidadpendiente}' max="${ocd_cantidadpendiente}"/>
                </td>
            </tr>
            `
        })

        $("#detalleNotaIngresoTableBody").html(content)
    }

    // ------ GESTION DE MODAL DE PRODUCTO ------
    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    // al momento de ir ingresando valores en el input
    $('#productosInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarMateriales(query)
        } else {
            limpiarLista()
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
            const { data } = await client.get(`/productosByQuery?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                // listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - ${material.stock?.alp_stock || 0}`
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
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
        const { pro_id, pro_codigo, pro_descripcion, uni_codigo } = material

        // limpiamos el input
        limpiarLista()
        $('#productosInput').val('')

        const rowItem = document.createElement('tr')
        rowItem.innerHTML = `
        <input class="producto-id" value="${pro_id}" type="hidden"/>
        <td>${pro_codigo}</td>
        <td>${pro_descripcion}</td>
        <td>${uni_codigo}</td>
        <td>
            <input type="number" class="form-control cantidad-input" value='1.00'/>
        </td>
        `

        $('#tbl-orden-compra-productos tbody').html(rowItem)
    }

    $('#btn-agregar-producto').on('click', function () {
        const productos = $('#tbl-orden-compra-productos tbody tr')

    })

    // creacion de nota de ingreso
    $("#btn-guardar-nota-ingreso").on('click', function () {
        crearNotaIngreso()
    })

    async function crearNotaIngreso() {
        // documento de referencia
        const documentoReferencia = $("#documentoReferenciaInput").val().trim()
        // serie de documento
        const serieNotaIngreso = $("#serieNotaIngresoInput").val().trim()
        // numero de documento
        const numeroNotaIngreso = $("#numeroNotaIngresoInput").val().trim()
        // consumo directo
        const consumoDirecto = $("#consumoDirectoNotaIngresoInput").val()
        // motivo de movimiento
        const motivoMovimiento = $("#motivoMovimientoInput").val().trim()
        // almacen de ingreso
        const almacenIngreso = $("#almacenNotaIngresoInput").val()
        // fecha documento referencia
        const fechaDocumentoInput = $("#fechaDocumentoInput").val().trim()

        // realizamos las validaciones correspondientes
        let handleError = ''
        if (documentoReferencia.length === 0) {
            handleError += '- Se debe ingresar un documento de referencia\n'
        }
        if (serieNotaIngreso.length === 0) {
            handleError += '- Se debe ingresar una serie de nota de ingreso\n'
        }
        if (numeroNotaIngreso.length === 0) {
            handleError += '- Se debe ingresar un numero de nota de ingreso\n'
        }
        if (motivoMovimiento.length === 0) {
            handleError += '- Se debe ingresar un motivo de movimiento\n'
        }
        if (almacenIngreso.length === 0) {
            handleError += '- Se debe ingresar un almacen de ingreso\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        // detalle de nota de ingreso
        const detalleFormatNotaIngreso = obtenerDetalleNotaIngreso()
        // validamos la información de detalle
        if (detalleFormatNotaIngreso.length === 0) {
            alert('Debe ingresar al menos un producto para la nota de ingreso')
            return
        }

        const validacionDetalle = validarDetalleNotaIngreso(detalleFormatNotaIngreso)
        if (validacionDetalle.length !== 0) {
            alert(validacionDetalle)
            return
        }

        const formatData = {
            mtm_codigo: motivoMovimiento, // motivo de movimiento
            tdr_codigo: documentoReferencia, // documento de referencia
            amc_documentoreferenciaserie: serieNotaIngreso, // serie de documento
            amc_documentoreferencianumero: numeroNotaIngreso, // numero de documento
            amc_documentoreferenciafecha: flagEsTipoOrdenCompra ? transformarFecha(fechaDocumentoInput) : null,
            consumo_directo: consumoDirecto === "1" ? true : false,
            alm_id: almacenIngreso,
            detalle: detalleFormatNotaIngreso
        }

        console.log(formatData)
        // return
        try {
            const { data } = await client.post('almacen-movimiento/ingreso', formatData)
            alert('Nota de ingreso creada exitosamente')
            // cerramos el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('crearNotaIngresoModal'))
            modal.hide()
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al crear la nota de ingreso")
        }
    }

    $('#crearNotaIngresoModal').on('hide.bs.modal', function (e) {
        initDataTable(apiURL)
    })

    // ------- Funciones utilitarias para el modulo -------

    // funcion para mostrar el detall de pednientes de orden de compra
    function showModalDetallesPendientesOrdenCompra() {
        const modal = new bootstrap.Modal(document.getElementById('detallePendienteModal'))
        modal.show()
    }

    // funcion para mostrar modal de creacion de nota de ingreso
    function showModalCreacionNotaIngreso() {
        const modalElement = document.getElementById("crearNotaIngresoModal");
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

    // obtener detalle de nota de ingreso para creacion
    function obtenerDetalleNotaIngreso() {
        // referencia del cuerpo de la tabla
        const productos = $('#detalleNotaIngresoTableBody tr')
        const detalle = []
        if (productos.length > 0) {
            productos.each(function (index, row) {
                const formatData = {
                    ocd_id: flagEsTipoOrdenCompra ? $(row).data('detalle') : null,
                    pro_id: $(row).find('.producto-id').val(),
                    pro_codigo: $(row).find('.producto-codigo').val(),
                    amd_cantidad: $(row).find('.cantidad-ingreso-input').val(),
                }
                detalle.push(formatData)
            })
        }

        return detalle
    }

    // funcion para validar detalle de nota de ingreso
    function validarDetalleNotaIngreso(detalle) {
        let handleError = ''
        detalle.forEach((detalle, index) => {
            const {amd_cantidad} = detalle
            // la cantidad debe ser un valor numerico
            if(detalle.ocd_id){
                if(!esValorNumericoValidoMayorIgualQueCero(amd_cantidad)){
                    handleError += `El detalle ${index + 1} debe tener una cantidad mayor o igual que cero\n`
                } else {
                    // buscamos en el arreglo de detalles
                    const findDetalle = detalleNotaIngreso.find(d => d.ocd_id == detalle.ocd_id)
                    const { ocd_cantidadpendiente } = findDetalle
                    if(amd_cantidad > ocd_cantidadpendiente){
                        handleError += `El detalle ${index + 1} debe tener una cantidad menor o igual a la cantidad pendiente\n`
                    }
                }
            } else {
                if(!esValorNumericoValidoYMayorQueCero(amd_cantidad)){
                    handleError += `El detalle ${index + 1} debe tener una cantidad mayor que cero\n`
                }
            }
        })

        return handleError
    }
})