$(document).ready(() => {
    let abortController
    // inicializamos la data
    let dataTableMateriales

    let indiceSeleccionado

    const dataMaterialesContainer = $("#orden-materiales-container")

    let detalleMateriales = []

    $("#fechaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $("#fechaEntregaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // ---------- CARGA DE AREAS INICIALES -----------
    const cargarTipoMonedas = async () => {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaOrdenCompraInput')

            data.forEach((moneda) => {
                const option = $(`<option ${moneda["mon_codigo"] == 'SOL' ? 'selected' : ''}>`).val(moneda["mon_codigo"]).text(moneda["mon_descripcion"])
                $monedaSelect.append(option)
            })

        } catch (error) {
            alert('Error al obtener las areas')
        }
    }

    // ---------- CARGA DE TRABAJADORES INCIALES ------------
    const cargarTrabajadores = async () => {
        try {
            const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
            const { data } = await client.get('/trabajadoresSimple')
            const $elaboradoOrdenCompraInput = $('#elaboradoOrdenCompraInput')
            const $solicitadoOrdenCompraInput = $('#solicitadoOrdenCompraInput')
            const $autorizadoOrdenCompraInput = $('#autorizadoOrdenCompraInput')

            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(trabajador => {
                const option = $('<option>').val(trabajador.tra_id).text(trabajador.tra_nombre)
                $elaboradoOrdenCompraInput.append(option.clone())
                $solicitadoOrdenCompraInput.append(option.clone())
                $autorizadoOrdenCompraInput.append(option.clone())
            })

            const { data: trabajador } = await client.get(`/trabajadorByUsuario/${usu_codigo}`)
            $elaboradoOrdenCompraInput.val(trabajador.tra_id)
        } catch (error) {
            alert('Error al obtener los encargados')
        }
    }

    // ---------- FUNCION DE INICIALIZACION DE INFORMACION ----------
    const initInformacion = async () => {
        try {
            await Promise.all([
                cargarTipoMonedas(),
                cargarTrabajadores(),
            ])
        } catch (error) {
            alert("Error al cargar los datos")
        }
    }

    // ----------- GESTION DE CREACION DE ORDEN DE COMPRA JALANDO UNA COTIZACION ------------
    const dataTableOptionsMateriales = {
        dom: '<"top d-flex justify-content-between align-items-center"<"info"i><"pagination"p>>rt',
        destroy: true,
        responsive: false,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        info: true,
        language: {
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
            },
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    const dataTableOptionsHistorico = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: true,
        language: {
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
            },
        ],
        select: {
            style: 'single',
            selector: 'td.form-check-input'
        },
    }

    // ------- GESTION DE COTZACIONES DESPLEGABLE PARA CREACION DE ORDEN DE COMPRA -------

    async function initDetalleMateriales() {
        const modalDetalleMateriales = new bootstrap.Modal(document.getElementById('ordenMaterialesModal'))
        modalDetalleMateriales.show()

        if ($.fn.DataTable.isDataTable(dataMaterialesContainer)) {
            dataMaterialesContainer.DataTable().destroy();
        }

        $('#orden-materiales-container tbody').empty()
        $('#orden-materiales-container tbody').append(`
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
            const { data } = await client.get('/detalleMaterialesOrdenInterna-resumido-ordencompra')
            detalleMateriales = data
            let content = ''
            data.forEach((detalle, index) => {
                const { pro_id } = detalle
                content += `
                    <tr data-index="${index}">
                        <td>
                            <input class="indice-detalle" value="${index}" type="hidden"/>
                        </td>
                        <td></td>
                        <td>
                            ${pro_id ? detalle.pro_descripcion : detalle.odm_descripcion}
                        </td>
                        <td>
                            ${pro_id ? detalle.uni_codigo : 'N/A'}
                        </td>
                        <td>
                            ${pro_id ? detalle.cantidad : detalle.odm_cantidad}
                        </td>
                        <td>
                            <select class="form-select form-select-md seleccion-origen" data-indice="${index}">
                                <option selected value="">Elige una opción</option>
                                <option value="cotizacion">Cotización</option>
                                <option value="orden_compra">Orden de Compra</option>
                                <option value="nuevo_proveedor">Nuevo proveedor</option>
                            </select>
                        </td>
                        <td class="origen_cotizacion">
                            ${pro_id
                        ?
                        `<button class="btn btn-outline-dark w-100 btn-cotizacion" data-indice="${index}">
                                    ${detalle.cotizacion ?
                            `${detalle.cotizacion?.cotizacion?.proveedor?.prv_nombre || 'N/A'} - ${detalle.cotizacion?.cotizacion?.moneda?.mon_simbolo || ''} ${detalle.cotizacion?.cod_preciounitario || 'N/A'}`
                            : `Sin información`}  
                            </button>`
                        :
                        `<button class="btn btn-outline-dark w-100 btn-cotizacion" data-indice="${index}">
                                Sin información
                            </button>`
                    }
                        </td>
                        <td class="origen_orden_compra">
                            ${pro_id
                        ?
                        `<button class="btn btn-outline-dark w-100 btn-ordencompra" data-indice="${index}">
                                ${detalle.orden_compra ?
                            `${detalle.orden_compra?.orden_compra?.proveedor?.prv_nombre || 'N/A'} - ${detalle.orden_compra?.orden_compra?.moneda?.mon_simbolo || ''} ${detalle.orden_compra?.ocd_preciounitario || 'N/A'}`
                            : `Sin información`}
                            </button>`
                        :
                        `<button class="btn btn-outline-dark w-100 btn-ordencompra" data-indice="${index}">
                                Sin información
                            </button>`
                    }
                        </td>
                        <td class="origen_nuevo_proveedor" data-indice="${index}">
                            <button class="btn btn-outline-dark w-100 btn-nuevoproveedor" data-indice="${index}">
                                Sin información
                            </button>
                        </td>
                    </tr>
                `
            })

            $('#orden-materiales-container tbody').html(content)
            dataTableMateriales = dataMaterialesContainer.DataTable(dataTableOptionsMateriales)
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener las ordenes de materiales")
        }
    }

    // inicializamos la información de detalle de materiales
    initDetalleMateriales()

    // --------------- GESTION DE COTIZACIONES ----------------
    // funcion que nos sirve para poder inicializar el datatable de historico de cotizaciones
    function initHistoricoCotizaciones(data) {
        $('#historico-cotizaciones-container-body').empty()
        data.forEach(detalle => {
            const { cotizacion, cod_preciounitario, cod_id } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')
            rowItem.dataset.detalle = cod_id

            rowItem.innerHTML = `
            <td>
            </td>
            <td></td>
            <td>${proveedor.prv_nombre}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${moneda.mon_simbolo} ${cod_preciounitario}</td>
            <td>${parseDateSimple(cotizacion.coc_fechacotizacion)}</td>
            <td>
                <button class="btn btn-sm btn-primary">Ver detalle</button>
            </td>
            `
            $('#historico-cotizaciones-container-body').append(rowItem)
        })
    }

    // Abrir modal de cotizaciones y traer cotizaciones relacionadas a producto
    $('#orden-materiales-container tbody').on('click', '.btn-cotizacion', function () {
        const row = $(this)
        const index = row.data('indice')
        indiceSeleccionado = index
        const detalle = detalleMateriales[index]
        if (detalle.pro_id === null) {
            alert('Este detalle no tiene asignado un producto.')
            return
        }

        try {
            const params = new URLSearchParams({
                pro_id: detalle.pro_id
            })
            const urlCotizacion = `/cotizacion-detalle-findByProducto?${params.toString()}`

            initPagination(
                urlCotizacion,
                initHistoricoCotizaciones,
                dataTableOptionsHistorico,
                10,
                "#historico-cotizaciones-container",
                "#historico-cotizaciones-container-body",
                "#pagination-container-historico-cotizaciones"
            )

        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener la información de históricos")
        }

        const modalCotizaciones = new bootstrap.Modal(document.getElementById('historicoCotizacionesModal'))
        modalCotizaciones.show()
    })

    // gestion de seleccion de cotizacion para orden de compra
    $("#btn-seleccionar-cotizacion").on('click', async function () {
        const dataTableCotizaciones = $("#historico-cotizaciones-container").DataTable()
        const filaSeleccionada = dataTableCotizaciones.rows({ selected: true }).nodes()

        let idDetalleCotizacion = null

        if (filaSeleccionada) {
            idDetalleCotizacion = $(filaSeleccionada).data('detalle')
            console.log(idDetalleCotizacion)
        }

        if (idDetalleCotizacion === null) {
            alert('Debe seleccionar una cotización')
            return
        }

        try {
            const { data } = await client.get(`/cotizacion-detalle-view/${idDetalleCotizacion}`)
            console.log(data)
            const detalle = detalleMateriales[indiceSeleccionado]
            detalle["cotizacion"] = data

            // actualizamos el dom del detalle
            const textButton = `${data.cotizacion?.proveedor?.prv_nombre || 'N/A'} - ${data.cotizacion?.moneda?.mon_simbolo || ''} ${data.cod_preciounitario || 'N/A'}`
            $(`.btn-cotizacion[data-indice="${indiceSeleccionado}"]`).text(textButton);

            const modalCotizaciones = bootstrap.Modal.getInstance(document.getElementById('historicoCotizacionesModal'))
            modalCotizaciones.hide()
        } catch (error) {
            console.log(error)
        }
    })

    // --------------- GESTION DE ORDENES DE COMPRA ---------------
    // funcion que nos sirve para poder inicializar el datatable de historico de cotizaciones
    function initHistoricoOrdenesCompra(data) {
        $('#historico-ordenes-compra-container-body').empty()
        data.forEach(detalle => {
            const { orden_compra, ocd_preciounitario, ocd_id } = detalle
            const { proveedor, moneda } = orden_compra
            const rowItem = document.createElement('tr')
            rowItem.dataset.detalle = ocd_id

            rowItem.innerHTML = `
            <td>
            </td>
            <td></td>
            <td>${proveedor.prv_nombre}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${moneda.mon_simbolo} ${ocd_preciounitario}</td>
            <td>${parseDateSimple(orden_compra.occ_fecha)}</td>
            <td>
                <button class="btn btn-sm btn-primary">Ver detalle</button>
            </td>
            `
            $('#historico-ordenes-compra-container-body').append(rowItem)
        })
    }

    // Abrir modal de cotizaciones y traer cotizaciones relacionadas a producto
    $('#orden-materiales-container tbody').on('click', '.btn-ordencompra', function () {
        const row = $(this)
        const index = row.data('indice')
        indiceSeleccionado = index
        const detalle = detalleMateriales[index]
        if (detalle.pro_id === null) {
            alert('Este detalle no tiene asignado un producto.')
            return
        }

        try {
            const params = new URLSearchParams({
                pro_id: detalle.pro_id
            })
            const urlOrdenCompra = `/ordencompra-detalle-findByProducto?${params.toString()}`

            initPagination(
                urlOrdenCompra,
                initHistoricoOrdenesCompra,
                dataTableOptionsHistorico,
                10,
                "#historico-ordenes-compra-container",
                "#historico-ordenes-compra-container-body",
                "#pagination-container-historico-ordenes-compra"
            )

        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener la información de históricos")
        }

        const modalOrdenesCompra = new bootstrap.Modal(document.getElementById('historicoOrdenesCompraModal'))
        modalOrdenesCompra.show()
    })

    // gestion de seleccion de cotizacion para orden de compra
    $("#btn-seleccionar-orden-compra").on('click', async function () {
        const dataTableOrdenesCompra = $("#historico-ordenes-compra-container").DataTable()
        const filaSeleccionada = dataTableOrdenesCompra.rows({ selected: true }).nodes()

        let idDetalleOrdenCompra = null

        if (filaSeleccionada) {
            idDetalleOrdenCompra = $(filaSeleccionada).data('detalle')
        }

        if (idDetalleOrdenCompra === null) {
            alert('Debe seleccionar una orden de compra')
            return
        }

        try {
            const { data } = await client.get(`/ordencompra-detalle-view/${idDetalleOrdenCompra}`)
            const detalle = detalleMateriales[indiceSeleccionado]
            detalle["orden_compra"] = data

            // actualizamos el dom del detalle
            const textButton = `${data.orden_compra?.proveedor?.prv_nombre || 'N/A'} - ${data.orden_compra?.moneda?.mon_simbolo || ''} ${data.ocd_preciounitario || 'N/A'}`
            $(`.btn-ordencompra[data-indice="${indiceSeleccionado}"]`).text(textButton);

            const modalOrdenesCompra = bootstrap.Modal.getInstance(document.getElementById('historicoOrdenesCompraModal'))
            modalOrdenesCompra.hide()
        } catch (error) {
            console.log(error)
        }
    })

    // ----------- GESTION DE CAMBIO DE OPCION ------------
    $("#orden-materiales-container-body").on('change', '.seleccion-origen', function () {
        const rowTable = $(this).closest('tr')
        // limpiamos las clases anteriores
        rowTable.find('.origen_cotizacion').removeClass('table-success')
        rowTable.find('.origen_orden_compra').removeClass('table-success')
        rowTable.find('.origen_nuevo_proveedor').removeClass('table-success')

        // obtenemos el origen para asignar
        const origenSeleccionado = $(this).val()

        // debemos verificar que se ingreso un valor valido
        const index = $(this).data('indice')
        const detalle = detalleMateriales[index]
        if (detalle[origenSeleccionado] === undefined || detalle[origenSeleccionado] === null) {
            $(this).val('')
            alert("Seleccione un origen con un valor ingresado")
            return
        }

        const origenRow = `.origen_${origenSeleccionado}`
        rowTable.find(origenRow).addClass('table-success')
    })

    // ------------ GESTION DE NUEVO PROVEEDOR -------------
    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    $('#agregarProveedoresInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarProveedores(query)
        } else {
            limpiarLista()
        }
    }))

    async function buscarProveedores(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/proveedoresByQuery?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(proveedor => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                listItem.textContent = `${proveedor.prv_nrodocumento} - ${proveedor.prv_nombre}`
                listItem.dataset.id = proveedor.prv_id
                listItem.addEventListener('click', () => seleccionarProveedor(proveedor))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Petición abortada'); // Maneja el error de la petición abortada
            } else {
                console.error('Error al buscar proveedores:', error);
            }
        }
    }

    function seleccionarProveedor(proveedor) {
        const { prv_id, prv_nombre } = proveedor
        console.log(prv_id, prv_nombre)
        limpiarLista()
        $('#agregarProveedoresInput').val(prv_nombre)
        $('#proveedorIdInput').val(prv_id)
    }

    $('#orden-materiales-container-body').on('click', '.btn-nuevoproveedor', function () {
        const index = $(this).data('indice')
        indiceSeleccionado = index
        const modalNuevosProveedores = new bootstrap.Modal(document.getElementById('nuevoProveedorModal'))
        modalNuevosProveedores.show()
    })

    $("#btn-seleccionar-nuevo-proveedor").on('click', function () {
        let handleError = ''
        if ($('#proveedorIdInput').val() === '') {
            handleError = '- Debe seleccionar un proveedor\n'
        }

        if (!esValorNumericoValidoYMayorQueCero($('#agregarPrecioProveedorInput').val().trim())) {
            handleError += '- El precio debe ser un valor numérico mayor a 0\n'
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        const detalle = detalleMateriales[indiceSeleccionado]
        detalle["nuevo_proveedor"] = {
            prv_id: $('#proveedorIdInput').val(),
            prv_nombre: $('#agregarProveedoresInput').val(),
            ocd_preciounitario: $('#agregarPrecioProveedorInput').val()
        }

        const textButton = `${detalle.nuevo_proveedor?.prv_nombre || 'N/A'} - S/. ${detalle.nuevo_proveedor.ocd_preciounitario || 'N/A'}`
        $(`.btn-nuevoproveedor[data-indice="${indiceSeleccionado}"]`).text(textButton);

        // limpiamos los campos de input
        $('#agregarPrecioProveedorInput').val("")

        const modalNuevosProveedores = bootstrap.Modal.getInstance(document.getElementById('nuevoProveedorModal'))
        modalNuevosProveedores.hide()
    })
})