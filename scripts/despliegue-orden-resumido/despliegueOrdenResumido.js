$(document).ready(async () => {
    // controla el abort de solicitudes asincronas
    let abortController
    let despliegueMaterialesResumido = []
    let detalleCotizacion = []
    let archivosAdjuntos = []

    // variables para el manejo de datatable
    let dataTable;
    let dataTableCotizaciones;
    const dataContainer = $('#data-container')

    // variables para asignación de códigos
    let idOrdenInternaMaterial = 0

    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna-resumido'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')
    const filterMultiselect = $('#filtermultiselect-button')
    const filterResponsable = $('#filtrar-responsable')

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().startOf('month').toDate());
    $("#fechaHasta").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate());

    // Opciones de DataTable
    const dataTableOptions = {
        dom: '<"top d-flex justify-content-between align-items-center"<"info"i><"search"f><"pagination"p>>rt',
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 100,
        lengthMenu: [50, 100, 250, 500],
        searching: true,
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
            },
            { targets: [2, 3], searchable: true },
            { targets: [0, 1, 4, 5, 6, 7, 8], searchable: false },
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
    }

    const dataTableOptionsCotizaciones = {
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

    const dataTableOptionsOrdenesCompra = {
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

    // declaracion de multiselect
    $('#responsableSelect').multiselect({
        selectAll: true,
        search: true,
        texts: {
            selectAll: "Seleccionar todos",
            search: "Buscar",
            unselectAll: "Deseleccionar todos",
            placeholder: "Seleccionar responsables"
        }
    })

    // gestion de multiselect
    $('#filterMultipleSelector').multiselect({
        texts: {
            placeholder: "Estado"
        }
    })

    // traer informacion de almacenes
    async function traerInformacionAlmacenes() {
        const { data } = await client.get('/almacenes')
        const $almacenes = $("#almacenStock")
        data.forEach(almacen => {
            const option = $('<option>').val(almacen["alm_codigo"]).text(almacen["alm_descripcion"])
            $almacenes.append(option)
        })
    }

    // traer informacion de responsables
    async function traerInformacionResponsables() {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        const { data } = await client.get('/producto-responsable/responsables')
        const options = []
        // agregamos opcion de materiales sin responsable
        options.push({
            name: "Materiales sin responsable",
            value: "SRE",
            checked: false
        })
        data.forEach(responsable => {
            options.push({
                name: responsable["tra_nombre"],
                value: responsable["tra_id"],
                checked: usu_codigo == responsable['usu_codigo']
            })
        })
        $('#responsableSelect').multiselect('loadOptions', options);
    }

    const initInformacionMaestros = async () => {
        return Promise.all(
            [
                traerInformacionAlmacenes(),
                traerInformacionResponsables()
            ]
        )
    }

    // inicializacion de datatable
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
            despliegueMaterialesResumido = data
            let content = ''
            data.forEach((material, index) => {
                // if (material.detalle !== undefined) {
                const { proveedores_count, pro_id, pro_codigo, pro_descripcion, uni_codigo, cantidad, stock, cotizaciones_count, ordenes_compra_count, detalle, cotizacion_seleccionada, tiene_adjuntos } = material
                let sePuedeCotizar = true
                detalle.forEach(item => {
                    if (item.orden_interna_parte.orden_interna.mrq_codigo !== 'RPR' && pro_codigo == null) sePuedeCotizar = false
                })
                content += `
                <tr data-index="${index}" data-se-puede-cotizar="${sePuedeCotizar}">
                    <td></td>
                    <td></td>
                    <td>${pro_codigo || 'N/A'}</td>
                    <td>${pro_descripcion || 'N/A'}</td>
                    <td class="text-center">${uni_codigo || 'N/A'}</td>
                    <td class="text-center">${parseFloat(cantidad).toFixed(2) || 'N/A'}</td>
                    <td class="text-center">${parseFloat(stock).toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary position-relative btn-detalle" data-index-detalle="${index}">
                            Ver detalle
                            ${tiene_adjuntos ? `
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-files" viewBox="0 0 16 16">
                                        <path d="M13 0H6a2 2 0 0 0-2 2 2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 2 2 0 0 0 2-2V2a2 2 0 0 0-2-2m0 13V4a2 2 0 0 0-2-2H5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1M3 4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>
                                    </svg>
                                </span>
                            ` : ''}
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                ${detalle.length}
                            </span>
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm ${pro_id ? 'btn-primary' : 'btn-secondary'} btn-historico position-relative" data-historico="${pro_id}" ${pro_id ? '' : 'disabled'}>
                            Ver histórico
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                ${proveedores_count}
                            </span>
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-responsable" data-index-detalle="${index}">
                            ${detalle[0].responsable?.tra_nombre || 'Sin responsable'}
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary position-relative btn-cotizado" data-index-detalle="${index}">
                            ${cotizacion_seleccionada ? `${cotizacion_seleccionada.cotizacion.proveedor.prv_nombre} - ${cotizacion_seleccionada.cotizacion.moneda?.mon_simbolo || ''} ${cotizacion_seleccionada.cod_preciounitario || 0.00}` : 'Selecciona una cotización'}
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                ${cotizaciones_count}
                            </span>
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary position-relative btn-ordenado" data-index-detalle="${index}">
                            Ordenes de compra
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                ${ordenes_compra_count}
                            </span>
                        </button>
                    </td>
                    <td class="text-center">
                        ${detalle[0].odm_solped || 'N/A'}
                    </td>
                </tr>
                `
            })

            $('#data-container-body').html(content)
            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    // ----------- GESTIONAR CAMBIO DE ALMACEN ------------
    const getValueAlmacen = () => {
        const almacenStockValue = $('#almacenStock').val()
        if (almacenStockValue.length !== 0) {
            return `&alm_codigo=${almacenStockValue}`
        }
        return ""
    }

    await initInformacionMaestros()
    initDataTable(obtenerFiltrosActuales())

    $('#almacenStock').on('change', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}${getValueAlmacen()}`
        initDataTable(filteredURL)
    })

    // ------------ ADMINISTRACION DE FILTROS ---------------
    // filter SOLPED
    $('#filter-SOLPED').on('click', () => {
        const filteredURL = obtenerFiltrosActuales()
        initDataTable(filteredURL)
    })

    // filter fechas
    filterFechas.on('click', () => {
        const filteredURL = obtenerFiltrosActuales()
        initDataTable(filteredURL)
    })

    // filter input
    filterButton.on('click', () => {
        const filteredURL = obtenerFiltrosActuales()
        initDataTable(filteredURL)
    })

    // filtro multi select
    filterMultiselect.on('click', async () => {
        const filteredURL = obtenerFiltrosActuales()
        initDataTable(filteredURL)
    })

    // filtro de responsables
    $(filterResponsable).on('click', function () {
        const filterField = obtenerFiltrosActuales()
        initDataTable(filterField)
    })

    // ---------- ADMINISTRACIÓN DE DETALLE DE DATOS ------------

    function initDetalleMaterialAgrupado(data) {
        $("#tbl-despliegue-materiales-body").empty()
        let cantidadTotal = 0;

        // recorremos el detalle material para completar la información
        data.forEach((material) => {
            const { odm_id, producto, orden_interna_parte, odm_cantidad, odm_descripcion, odm_observacion, odm_tipo, odm_estado, odm_feccreacion, odm_usucreacion, odm_fecmodificacion, odm_usumodificacion, detalle_adjuntos } = material
            const { orden_interna } = orden_interna_parte
            const { odt_numero, oic_tipo } = orden_interna

            const rowItem = document.createElement('tr')
            rowItem.innerHTML = `
                <td class="text-center">
                    ${oic_tipo}
                </td>
                <td>${odt_numero || 'N/A'}</td>
                <td>${parseDate(odm_feccreacion)}</td>
                <td class="text-center">${odm_estado || 'N/A'}</td>
                <td class="text-center">
                ${odm_tipo == 1 ? 'R' : 'A'}
                </td>
                <td>${producto?.pro_codigo || 'N/A'}</td>
                <td>${odm_descripcion || 'N/A'}</td>
                <td>${odm_observacion || 'N/A'}</td>
                <td class="text-center">${producto?.unidad?.uni_codigo || 'N/A'}</td>
                <td class="text-center">${odm_cantidad}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary position-relative btn-detalle btn-adjuntos" data-detalle="${odm_id}" ${detalle_adjuntos.length === 0 ? 'disabled' : ''}>
                        Ver adjuntos
                        ${detalle_adjuntos.length !== 0 ? `
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            ${detalle_adjuntos.length}
                        </span>
                        ` : ''}
                    </button>
                </td>
                <td>${odm_usucreacion}</td>
                <td>${odm_fecmodificacion ? parseDate(odm_fecmodificacion) : 'N/A'}</td>
                <td>${odm_usumodificacion ? odm_usumodificacion : 'N/A'}</td>
            `
            $("#tbl-despliegue-materiales-body").append(rowItem)

            cantidadTotal += parseFloat(odm_cantidad)
        })

        // agregamos un tr para mostrar el total
        const rowTotal = document.createElement('tr')
        rowTotal.innerHTML = `
            <td colspan="9" class="text-end fw-bold">Total</td>
            <td class="text-center">${cantidadTotal.toFixed(2)}</td>
            <td colspan="3"></td>
        `
        $("#tbl-despliegue-materiales-body").append(rowTotal)

        // mostrar modal
        showModalDetalleCotizacionAgrupamiento()
    }

    function initDetalleMaterialAdjuntos() {
        showModalAdjuntos()
    }

    $('#tbl-despliegue-materiales-body').on('click', '.btn-adjuntos', async function () {
        $('#tabla-archivos-adjuntos').empty()
        const detalleMaterial = $(this).data('detalle')
        // llamamos a la informacion del detalle
        try {
            const { data } = await client.get(`/ordeninternamaterialesadjuntos/${detalleMaterial}`)
            data.forEach((element, index) => {
                const { oma_descripcion, oma_url } = element
                const row = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <a target="_blank" href="${config.BACK_STORAGE_URL}${oma_url}">Ver recurso</a>
                        </td>
                        <td class="descripcion-file">${oma_descripcion}</td>
                    </tr>
                `
                $('#tabla-archivos-adjuntos').append(row)
            })

            initDetalleMaterialAdjuntos()
        } catch (error) {
            console.log(error)
            alert("Error al cargar los archivos")
        }
    })

    $('#data-container-body').on('click', '.btn-detalle', function () {
        const indexDetalle = $(this).data('index-detalle')
        const detalleMaterial = despliegueMaterialesResumido[indexDetalle]
        initDetalleMaterialAgrupado(detalleMaterial.detalle)
    })

    // ------------- GESTION DE HISTORICO --------------
    function initHistoricoCotizaciones(data) {
        $('#historico-cotizaciones-container tbody').empty()
        data.forEach(detalle => {
            const { cotizacion } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${cotizacion.coc_estado === 'SOL' ? 'table-danger' : 'table-success'}`)

            rowItem.innerHTML = `
            <td>${parseDateSimple(cotizacion.coc_fechacotizacion)}</td>
            <td>${cotizacion.coc_numero}</td>
            <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${detalle.detalle_material.producto.pro_codigo}</td>
            <td>${detalle.cod_descripcion}</td>
            <td class="text-center">${detalle.cod_cantidad || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.cod_preciounitario || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.cod_total || 'N/A'}</td>
            <td class="text-center">${detalle.cod_tiempoentrega ? `${detalle.cod_tiempoentrega} día(s)` : 'N/A'}</td>
            `
            $('#historico-cotizaciones-container tbody').append(rowItem)
        })
    }

    function initHistoricoOrdenCompra(data) {
        $('#historico-ordenescompra-container tbody').empty()
        data.forEach(detalle => {
            const { orden_compra } = detalle
            const { proveedor, moneda } = orden_compra
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${orden_compra.occ_estado === 'EMI' ? 'table-danger' : 'table-success'}`)

            rowItem.innerHTML = `
            <td>${parseDateSimple(orden_compra.occ_fecha)}</td>
            <td>${orden_compra.occ_numero}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${detalle.detalle_material.producto.pro_codigo}</td>
            <td>${detalle.ocd_descripcion}</td>
            <td class="text-center">${detalle.ocd_cantidad || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_preciounitario || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_total || 'N/A'}</td>
            `
            $('#historico-ordenescompra-container tbody').append(rowItem)
        })
    }

    function initHistoricoByProducto(producto) {
        // debemos verificar que sea un material asignado
        if (producto === null) {
            alert("Este material no tiene un código asignado")
            return
        }

        let proveedoresFilter = []
        // tenemos que detectar si el modal de cotizacion esta abierto
        const loadModalPresupuesto = bootstrap.Modal.getInstance(document.getElementById('cotizacionesModal'))
        if (loadModalPresupuesto) {
            // buscamos el numero de documento de todos los proveedores que tiene un check en filter check
            proveedoresFilter = $('.filter-check').filter(':checked').map((index, element) => {
                const row = $(element).closest('tr')
                const documentoProveedor = row.find('.nrodocumento-proveedor').text()
                return documentoProveedor
            }).get()
        }

        try {
            const params = new URLSearchParams({
                pro_id: producto,
                param: proveedoresFilter.join(','),
            })

            const urlCotizacion = `/cotizacion-detalle-findByProducto?${params.toString()}`;
            initPagination(urlCotizacion,
                initHistoricoCotizaciones,
                dataTableOptionsHistorico,
                10,
                "#historico-cotizaciones-container",
                "#historico-cotizaciones-container-body",
                "#pagination-container-historico-cotizacion")

            const urlOrdenCompra = `/ordencompra-detalle-findByProducto?${params.toString()}`
            initPagination(urlOrdenCompra,
                initHistoricoOrdenCompra,
                dataTableOptionsHistorico,
                10,
                "#historico-ordenescompra-container",
                "#historico-ordenescompra-container-body",
                "#pagination-container-historico-ordencompra"
            )
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener la información de históricos")
        }

        // mnostrar modal
        showModalHistoricoCotizacionesOrdenesCompra()
    }

    $("#data-container-body").on('click', '.btn-historico', async function () {
        const producto = $(this).data('historico')
        // initHistoricoByProducto(producto)
        const formatData = {
            producto: producto
        }

        try {
            const { data } = await client.get('comprasByProducto', { params: formatData })
            // vaciamos la tabla
            $("#tbl-proveedor-productos-body").empty()
            // llenamos la data
            let content = ''
            data.forEach(item => {
                const { proveedor, producto, prp_fechaultimacompra, prp_preciounitario, prp_nroordencompra } = item
                content += `
                    <tr>
                    <td>${parseDateSimple(prp_fechaultimacompra)}</td>
                    <td>${prp_nroordencompra}</td>
                    <td>${proveedor.prv_nrodocumento}</td>
                    <td>${proveedor.prv_nombre}</td>
                    <td>${producto.pro_codigo}</td>
                    <td>${producto.pro_descripcion}</td>
                    <td class="text-center"></td>
                    <td class="text-center">${parseFloat(prp_preciounitario).toFixed(4)}</td>
                    <td class="text-center"></td>
                    </tr>
                `
            })

            // renderizamos la información
            $("#tbl-proveedor-productos-body").html(content)
            // abrimos el modal correspondiente
            showModalProveedorProductosCompras()
        } catch (error) {
            console.log(error)
        }
    })

    // ------------- GESTION DE RESERVACION -------------
    $("#data-container-body").on('click', '.btn-reservado', function () {
        const loadModalReservado = new bootstrap.Modal(document.getElementById('reservacionModal'))
        loadModalReservado.show()
    })

    // ------------- GESTION DE ATENDIDO -----------------
    $("#data-container-body").on('click', '.btn-atendido', function () {
        const loadModalAtendido = new bootstrap.Modal(document.getElementById('atendidoModal'))
        loadModalAtendido.show()
    })

    // ------------ DETALLE DE COTIZACIONES DE LOS MATERIALES AGRUPADOS------------
    $("#data-container-body").on('click', '.btn-cotizado', async function () {
        const indexDetalle = $(this).data('index-detalle')

        // obtenemos los ids de los detalles correspondientes
        const params = obtenerIdDetallesMaterialByIndex(indexDetalle)

        // debemos destruir el datatable si existe relacionado al datacontainer
        const dataContainer = $("#data-container-cotizacion")
        detroyDataTable(dataContainer)

        // realizamos la llamada API
        const { data } = await client.get(`/ordeninternamateriales/cotizacion?${params.toString()}`)
        $("#data-container-cotizacion tbody").empty()

        data.forEach(detalle => {
            const { cotizacion, producto } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${detalle.cod_estado !== null ? 'table-success' : 'table-light'}`)

            rowItem.innerHTML = `
            <td>
                <input type="text" class="id-detalle-cotizacion" value="${detalle.cod_id}" hidden>
            </td>
            <td></td>
            <td>${cotizacion.coc_fechacotizacion ? parseDateSimple(cotizacion.coc_fechacotizacion) : 'N/A'}</td>
            <td>${cotizacion.coc_numero || 'N/A'}</td>
            <td>${cotizacion.coc_cotizacionproveedor || 'N/A'}</td>
            <td class="text-center">
                <span class="badge ${cotizacion.coc_estado === 'SOL' ? 'bg-danger' : cotizacion.coc_estado === 'RPR' ? 'bg-primary' : 'bg-success'}">
                    ${cotizacion.coc_estado}
                </span>
            </td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${detalle.cod_descripcion}</td>
            <td>${moneda?.mon_descripcion || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.cod_preciounitario || 'N/A'}</td>
            `
            $('#data-container-cotizacion tbody').append(rowItem)
        })

        // inicializamos el datatable
        dataTableCotizaciones = dataContainer.DataTable(dataTableOptionsCotizaciones)

        // abrimos el modal de cotizaciones
        showModalCotizaciones()
    })

    // funcion para seleccionar cotizacion
    $("#btn-seleccionar-cotizacion").on('click', async function () {
        const filasSeleccionadas = dataTableCotizaciones.rows({ selected: true }).nodes();
        const valoresSeleccionados = [];

        // recolectamos las cotizaciones
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).find('.id-detalle-cotizacion').val();
            valoresSeleccionados.push(valor);
        });

        if (valoresSeleccionados.length === 0) {
            alert('Debe seleccionar una cotización')
            return
        }

        try {
            await client.put(`/cotizacion-detalle/seleccionar/${valoresSeleccionados[0]}`)
            // cerramos el modal de cotizaciones
            const loadModalCotizaciones = bootstrap.Modal.getInstance(document.getElementById('cotizadoModal'))
            loadModalCotizaciones.hide()
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al seleccionar la cotización")
        }
    })

    // ------------- DETALLE DE ORDEN DE COMPRAS --------------
    $("#data-container-body").on('click', '.btn-ordenado', async function () {
        const indexDetalle = $(this).data('index-detalle')

        // obtenemos los ids de los detalles correspondientes
        const params = obtenerIdDetallesMaterialByIndex(indexDetalle)

        // debemos destruir el datatable si existe relacionado al datacontainer
        const dataContainer = $("#data-container-ordencompra")
        detroyDataTable(dataContainer)

        const { data } = await client.get(`/ordeninternamateriales/ordencompra?${params.toString()}`)
        $("#data-container-ordencompra tbody").empty()

        data.forEach(detalle => {
            const { orden_compra } = detalle
            const { proveedor, moneda } = orden_compra
            const rowItem = document.createElement('tr')

            rowItem.innerHTML = `
            <td></td>
            <td></td>
            <td>${parseDateSimple(orden_compra.occ_fecha)}</td>
            <td>${orden_compra.occ_numero}</td>
            <td>
                <span class="badge bg-primary">
                    ${orden_compra.occ_estado}
                </span>
            </td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${detalle.ocd_descripcion}</td>
            <td class="text-center">${detalle.ocd_cantidad || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_preciounitario || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_total || 'N/A'}</td>
            `
            $('#data-container-ordencompra tbody').append(rowItem)
        })

        // inicializamos el datatable
        dataTableOrdenesCompra = dataContainer.DataTable(dataTableOptionsOrdenesCompra)

        // abrimos el modal de ordendes de compra
        const loadModalOrdenado = new bootstrap.Modal(document.getElementById('ordenadoModal'))
        loadModalOrdenado.show()
    })

    // ------------- DETALLE DE RESPONSABLE -------------
    $("#data-container-body").on('click', '.btn-responsable', async function () {
        const indexDetalle = $(this).data('index-detalle')
        const detalleMaterial = despliegueMaterialesResumido[indexDetalle]
        let odm_id
        if (detalleMaterial.odm_id !== undefined) {
            odm_id = detalleMaterial.odm_id
        } else {
            odm_id = detalleMaterial.detalle[0].odm_id
        }

        // consultamos la informacion de detalle de material
        const { data: ordenMaterial } = await client.get(`/detalleMaterialOrdenInterna/${odm_id}`)

        const idResponsable = ordenMaterial.tra_responsable
        const nombreResponsable = ordenMaterial.responsable?.tra_nombre || 'Sin responsable'
        const fechaResponsable = ordenMaterial.odm_fecasignacionresponsable ? parseDate(ordenMaterial.odm_fecasignacionresponsable) : 'Sin fecha de asignación'
        $("#idIndexDetalle").val(indexDetalle)
        $("#responsableDetalleMaterial").text(nombreResponsable)
        $("#fechaAsignacionResponsableDetalleMaterial").text(fechaResponsable)

        // hacemos llamado a la lista de trabajadores
        const { data } = await client.get('/trabajadoresSimple')

        const $selectorResponsable = $('#selectorResponsableDetalleMaterial')
        $selectorResponsable.empty()

        // Ordenar la data alfabéticamente según el nombre (índice [1])
        data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

        $selectorResponsable.append($('<option selected>').val('').text('Sin responsable'))
        data.forEach(trabajador => {
            const option = $(`<option ${trabajador.tra_id == idResponsable ? 'selected' : ''}>`).val(trabajador.tra_id).text(trabajador.tra_nombre)
            $selectorResponsable.append(option.clone())
        })

        // abrimos el modal
        const loadModalResponsable = new bootstrap.Modal(document.getElementById('responsableModal'))
        loadModalResponsable.show()
    })

    $("#btn-cambiar-responsable-detalle").on('click', async function () {
        let formatData
        // obtenemos el valor del id del detalle de material
        const indexDetalle = $("#idIndexDetalle").val()
        const detalleMaterial = despliegueMaterialesResumido[indexDetalle]
        const responsable = $.trim($("#selectorResponsableDetalleMaterial").val())

        if (responsable.length == 0) {
            alert('Debe seleccionar un responsable')
            return
        }

        if (detalleMaterial.odm_id !== undefined) {
            formatData = {
                tra_responsable: responsable,
                param: [detalleMaterial.odm_id].join(','),
            }
        } else {
            formatData = {
                tra_responsable: responsable,
                param: detalleMaterial.detalle.map(detalle => detalle.odm_id).join(','),
            }
        }

        try {
            const { data } = await client.post(`/ordeninternamateriales/responsable-masivo`, formatData)
            const row = dataTable.rows().nodes().to$().filter(function () {
                return $(this).find('button.btn-responsable').data('index-detalle') == indexDetalle;
            })

            if (row.length > 0) {
                const botonResponsable = row.find('button.btn-responsable')
                botonResponsable.text(data.responsable.tra_nombre)
                dataTable.row(row).invalidate().draw(false)
            }

            // cerramos el modal
            const loadModalResponsable = bootstrap.Modal.getInstance(document.getElementById('responsableModal'))
            loadModalResponsable.hide()
        } catch (error) {
            console.log(error)
            alert('Error al cambiar responsable')
        }
    })

    // ------------- ASIGNACION DE RESPONSABLE EN BLOQUE -------------
    $("#btn-asignar-responsable-en-bloque").on('click', async function () {
        const idsDetalles = $("#ids-detalles-seleccionados").val().split(',').map(Number)
        const responsable = $("#responsable-select-bloque").val()
        const indexDetalles = $("#index-detalles-seleccionados").val().split(',').map(Number)

        if (idsDetalles.length === 0) {
            alert('No se han seleccionado detalles de materiales')
            return
        }

        if (responsable.length === 0) {
            alert('No se ha seleccionado un responsable')
            return
        }

        try {
            const { data } = await client.put(`/ordeninternamateriales/asignar-responsable-en-bloque/${responsable}`, { idsDetalles })

            const rows = dataTable.rows().nodes().to$().filter(function () {
                return indexDetalles.includes($(this).find('button.btn-responsable').data('index-detalle'));
            })
            rows.each(function () {
                $(this).find('button.btn-responsable').text(data.nombreResponsable)
            })

            const loadModalResponsable = bootstrap.Modal.getInstance(document.getElementById('responsableModalBloque'))
            loadModalResponsable.hide()
        } catch (error) {
            console.error(error)
            alert('Error al asignar responsable en bloque')
        }
    })

    // --------------- MANEJO DE COTIZACIONES --------------
    function renderRowCotizacion(detalle, index, proveedor) {
        let precioUnitario = 0.00
        let descuento = 0.00
        let fechaUltimaCompra = 'N/A'
        try {
            precioUnitario = proveedor.precio_unitario
            descuento = proveedor.descuento_porcentaje
        } catch (error) {
            console.log(error)
        }

        try {
            fechaUltimaCompra = parseDateSimple(proveedor.prp_fechaultimacompra)
        } catch (error) {
            fechaUltimaCompra = 'N/A'
        }

        if (descuento == null || descuento == undefined) {
            descuento = 0.00
        }

        if (detalle.odm_id === undefined) {
            const observacion = unionObservaciones(detalle.detalle)
            const rowsObs = observacion.split('\n').length

            return `<tr data-index="${index}">
                <input type="hidden" value="${detalle.pro_id}" />
                <td></td>
                <td>${detalle.pro_codigo}</td>
                <td>${detalle.pro_descripcion}</td>
                <td>
                    <textarea class="form-control observacion-detalle" rows="${Math.max(1, rowsObs)}">${observacion}</textarea>
                </td>
                <td class="text-center">${detalle.uni_codigo}</td>
                <td class="text-center cantidad-requerida-detalle">${detalle.cantidad.toFixed(2)}</td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-pedida-detalle" value="${detalle.cantidad.toFixed(2)}" max="${detalle.cantidad}"/>
                </td>
                <td class="text-center d-none label-precio-unitario-detalle">
                    <input type="number" class="form-control precio-unitario-detalle" value="${precioUnitario}"/>
                </td>
                <td class="text-center d-none label-descuento">
                    <input type="number" class="form-control descuento" value="${descuento}" style="min-width: 150px;"/>
                </td>
                <td class="text-center d-none label-precio-unitario-total">
                    <input type="number" readonly class="form-control precio-unitario-total" style="width: 130px;" value="${(precioUnitario * (1 - descuento / 100)).toFixed(4)}"/>
                </td>
                <td class="text-center">
                    <input type="text" class="form-control fecha-entrega-detalle" style="width: 130px;" value="${detalle.odm_fechaentrega || ''}"/>
                </td>
                <td class="text-center d-none label-ultimo-precio">${fechaUltimaCompra}</td>
                <td class="text-center d-none label-ultimo-precio">${precioUnitario}</td>
                <td class="text-center">
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-sm btn-primary btn-detalle me-1" title="Detalle Material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-primary btn-historico-detalle-material me-1" data-historico="${detalle.pro_id}" title="Historico Detalle Material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-detalle-material me-1" title="Eliminar Detalle Material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                            </svg>
                        </button>
                        <button class="btn btn-primary asignar-codigo" data-odm-id="${detalle.odm_id}" style="width: 155px;">Reasignar Código</button>
                    </div>
                </td>
            </tr>`
        } else {
            return `<tr data-index="${index}">
                <input type="hidden" value="${detalle.pro_id}" />
                <td>${detalle.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                <td>${detalle.producto?.pro_codigo || 'N/A'}</td>
                <td>${detalle.odm_descripcion}</td>
                <td>
                    <textarea class="form-control observacion-detalle" rows="1">${detalle.odm_observacion || ""}</textarea>
                </td>
                <td class="text-center">${detalle.producto?.uni_codigo || 'N/A'}</td>
                <td class="text-center cantidad-requerida-detalle">${detalle.odm_cantidad}</td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-pedida-detalle" value="${detalle.odm_cantidad}" max="${detalle.odm_cantidad}" />
                </td>
                <td class="text-center d-none label-precio-unitario-detalle">
                    <input type="number" class="form-control precio-unitario-detalle" value="${precioUnitario}"/>
                </td>
                <td class="text-center d-none label-descuento">
                    <input type="number" class="form-control descuento" value="${descuento}" style="min-width: 150px;"/>
                </td>
                <td class="text-center d-none label-precio-unitario-total">
                    <input type="number" readonly class="form-control precio-unitario-total" style="width: 130px;" value="${(precioUnitario * (1 - descuento / 100)).toFixed(4)}"/>
                </td>
                <td class="text-center">
                    <input type="text" class="form-control fecha-entrega-detalle" style="width: 130px;" value="${detalle.odm_fechaentrega || ''}"/>
                </td>
                <td class="text-center d-none label-ultimo-precio">${fechaUltimaCompra}</td>
                <td class="text-center d-none label-ultimo-precio">${precioUnitario}</td>
                <td class="text-center">
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-sm btn-secondary me-1" disabled title="Detalle Material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm ${detalle.producto ? 'btn-primary' : 'btn-secondary'} btn-historico-detalle-material me-1" data-historico="${detalle.pro_id}" ${detalle.producto ? '' : 'disabled'} title="Historico Detalle Material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-detalle-material me-1" title="Eliminar Detalle Material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                            </svg>
                        </button>
                        <button class="btn btn-primary asignar-codigo" data-odm-id="${detalle.odm_id}" style="width: 155px;">Reasignar Código</button>
                    </div>
                </td>
            </tr>`
        }
    }

    // accion al presionar validar codigo
    $("#tbl-cotizaciones-materiales").on('click', '.asignar-codigo', function () {
        const odmId = $(this).data('odm-id')
        idOrdenInternaMaterial = odmId

        bootbox.dialog({
            title: 'Asignación Código',
            message: $('#validarCodigoModal').html(),
            className: 'bootbox-confirm-modal',
            size: 'extra-large',
            buttons: {},
            callback: function (result) {
                // Inicializar el modal después de que se abra
                setTimeout(function () {
                    // borramos el detalle actual de la asignacion de codigos
                    $(".bootbox #tbl-asignar-codigos tbody").empty()
                    // limpiamos la lista
                    $(".bootbox #resultadosListaValidarCodigo").empty()
                    // limpiar input
                    $(".bootbox #productosInput").val('')
                    // deshabilitamos el boton de asignación
                    $(".bootbox #btn-asignar-codigo").prop('disabled', true)

                    // Aplicar estilos a la lista
                    $(".bootbox #resultadosListaValidarCodigo").css({
                        'z-index': '9999',
                        'position': 'absolute',
                        'background-color': 'white',
                        'border': '1px solid #ccc',
                        'max-height': '200px',
                        'overflow-y': 'auto',
                        'width': '100%'
                    });
                }, 100);
            }
        })
    })

    // evento para el botón cancelar código
    $(document).on('click', '#btn-cancelar-codigo', function () {
        bootbox.hideAll()
    })

    // Evento para recalcular precio unitario total
    $(document).on('input', '.precio-unitario-detalle, .descuento, .cantidad-pedida-detalle', function () {
        const precioUnitario = $(this).closest('tr').find('.precio-unitario-detalle').val()
        const descuento = $(this).closest('tr').find('.descuento').val()
        const precioUnitarioConDescuento = precioUnitario * (1 - descuento / 100)
        $(this).closest('tr').find('.precio-unitario-total').val(precioUnitarioConDescuento.toFixed(4))

        // Recalcular totales cuando cambien los valores
        recalcularTotales()
    })

    // Verificar que jQuery y bootbox están disponibles

    // buscador de productos a validar - usando delegación para bootbox
    $(document).on('input', '#productosInput', debounce(async function () {
        const query = $(this).val().trim()
        console.log('se ejecuto el input', query);
        if (query.length >= 3) {
            await buscarMateriales(query)
        } else {
            limpiarListaValidacionCodigo()
        }
    }))

    async function buscarMateriales(query) {

        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            // TODO: cambiar a productosByQuery2 para testear, en produccion usar productosByQuery
            const { data } = await client.get(`/productosByQuery?query=${queryEncoded}`)
            // Limpiamos la lista

            limpiarListaValidacionCodigo()

            // formamos la lista
            data.forEach((material, index) => {

                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action material-item'
                listItem.style.cursor = 'pointer'
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.dataset.procodigo = material.pro_codigo
                listItem.dataset.prodescripcion = material.pro_descripcion
                listItem.dataset.alpstock = material.alp_stock
                listItem.dataset.ultimafechaingreso = material["UltimaFechaIngreso"]

                // agregar la lista completa - buscar en el contexto correcto
                const $resultadosLista = $('.bootbox #resultadosListaValidarCodigo').length > 0
                    ? $('.bootbox #resultadosListaValidarCodigo')
                    : $('#resultadosListaValidarCodigo');


                // Agregar z-index alto para que aparezca encima del modal
                $resultadosLista.css({
                    'z-index': '9999',
                    'position': 'absolute',
                    'background-color': 'white',
                    'border': '1px solid #ccc',
                    'max-height': '400px',
                    'overflow-y': 'auto',
                });

                $resultadosLista.append(listItem)
            })


            // Agregar evento usando delegación para los elementos li
            $(document).off('click', '.material-item').on('click', '.material-item', function () {
                const material = {
                    pro_id: $(this).data('id'),
                    pro_codigo: $(this).data('procodigo'),
                    pro_descripcion: $(this).data('prodescripcion'),
                    alp_stock: $(this).data('alpstock'),
                    UltimaFechaIngreso: $(this).data('ultimafechaingreso')
                };
                seleccionarMaterial(material);
            });

        } catch (error) {
            if (error.name === 'AbortError') {
            } else {
                console.error('Error al buscar materiales:', error);
            }
        }
    }

    // funcion que limpia la lista
    function limpiarListaValidacionCodigo() {
        const $resultadosLista = $('.bootbox #resultadosListaValidarCodigo').length > 0
            ? $('.bootbox #resultadosListaValidarCodigo')
            : $('#resultadosListaValidarCodigo');
        console.log('se ejecuto la funcion limpiarLista', $resultadosLista);
        $resultadosLista.empty()
    }

    // funcion que se ejecuta al seleccionar un material
    function seleccionarMaterial(material) {
        limpiarListaValidacionCodigo()
        const $productosInput = $('.bootbox #productosInput').length > 0
            ? $('.bootbox #productosInput')
            : $('#productosInput');
        const $btnAsignarCodigo = $('.bootbox #btn-asignar-codigo').length > 0
            ? $('.bootbox #btn-asignar-codigo')
            : $('#btn-asignar-codigo');
        const $tblAsignarCodigos = $('.bootbox #tbl-asignar-codigos tbody').length > 0
            ? $('.bootbox #tbl-asignar-codigos tbody')
            : $('#tbl-asignar-codigos tbody');

        $productosInput.val('')
        $btnAsignarCodigo.prop('disabled', false)
        const { pro_id, pro_codigo, pro_descripcion, alp_stock, UltimaFechaIngreso } = material

        const row = `
        <tr data-id="${pro_id}">
            <td>${pro_codigo}</td>
            <td>${pro_descripcion}</td>
            <td>${alp_stock}</td>
            <td>${UltimaFechaIngreso || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-danger eliminar-detalle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>
            </td>
        </tr>
        `
        $tblAsignarCodigos.html(row)
    }

    // evento para eliminar detalle de la tabla de asignación de códigos
    $(document).on('click', '.eliminar-detalle', function () {
        const row = $(this).closest('tr')
        row.remove()

        // deshabilitamos el boton de asignación - buscar en el contexto correcto
        const $btnAsignarCodigo = $('.bootbox #btn-asignar-codigo').length > 0
            ? $('.bootbox #btn-asignar-codigo')
            : $('#btn-asignar-codigo');
        $btnAsignarCodigo.prop('disabled', true)
    })

    // evento para el botón de asignar código
    $(document).on('click', '#btn-asignar-codigo', async function () {
        // Validar que se haya seleccionado el ID del material
        if (!idOrdenInternaMaterial || idOrdenInternaMaterial === 0) {
            alert('Error: No se ha seleccionado un material de orden interna válido');
            return;
        }

        // Buscar en el contexto del bootbox o en el documento
        const $tblAsignarCodigos = $('.bootbox #tbl-asignar-codigos tbody tr:first').length > 0
            ? $('.bootbox #tbl-asignar-codigos tbody tr:first')
            : $('#tbl-asignar-codigos tbody tr:first');

        // Validar que existe una fila con producto seleccionado
        if ($tblAsignarCodigos.length === 0) {
            alert('Debe seleccionar un producto de la lista');
            return;
        }

        var pro_codigo = $tblAsignarCodigos.data('id');

        // Validar que el código del producto existe
        if (!pro_codigo) {
            alert('Error: No se pudo obtener el código del producto seleccionado');
            return;
        }

        // Obtener información del producto para mostrar en la confirmación
        const productoCodigo = $tblAsignarCodigos.find('td:first').text();
        const productoDescripcion = $tblAsignarCodigos.find('td:nth-child(2)').text();

        // Mostrar confirmación dentro del mismo modal
        const $btnAsignar = $(this);
        const $btnCancelar = $('#btn-cancelar-codigo');

        // Cambiar el contenido del modal actual
        const $modalBody = $btnAsignar.closest('.bootbox').find('.modal-body');
        const originalContent = $modalBody.html();

        $modalBody.html(`
            <div class="confirmation-message">
                <p>¿Está seguro de asignar el código <strong>${productoCodigo}</strong> - <strong>${productoDescripcion}</strong> a este material?</p>
                <div class="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" class="btn btn-secondary" id="btn-cancelar-confirmacion">Cancelar</button>
                    <button type="button" class="btn btn-success" id="btn-confirmar-asignacion">Sí, asignar</button>
                </div>
            </div>
        `);

        // Manejar la confirmación
        $('#btn-confirmar-asignacion').on('click', async function () {
            try {
                $btnAsignar.prop('disabled', true).text('Asignando...');

                const formatData = {
                    odm_id: idOrdenInternaMaterial,
                    pro_codigo: pro_codigo
                };

                await client.post('/ordeninternamateriales/validar-codigo', formatData);

                // Solo cerrar el modal de bootbox, no todos los modales
                bootbox.hideAll();

                // Actualizar el modal de cotización con la nueva información
                await actualizarModalCotizacionDespuesAsignacion();

            } catch (error) {
                console.error('Error al asignar el codigo:', error);
                alert('Error al asignar el codigo: ' + (error.response?.data?.message || error.message));
            } finally {
                $btnAsignar.prop('disabled', false).text('Asignar Código');
            }
        });

        // Manejar la cancelación
        $('#btn-cancelar-confirmacion').on('click', function () {
            $modalBody.html(originalContent);
        });
    });

    // agregar productosde stock a detalle
    $("#add-product-stock").on('click', async function () {
        // estructurar informacion
        $("#selectMaterialesStock").empty()
        $("#inputCantidadMaterialStock").val("1.00")

        const optionDefault = "<option value=''>Seleccione un material</option>"
        $("#selectMaterialesStock").append(optionDefault)

        detalleCotizacion.forEach((detalle) => {
            if (detalle.pro_id) {
                const option = `<option value="${detalle.pro_id}">${detalle.pro_descripcion}</option>`
                $("#selectMaterialesStock").append(option)
            }
        })
        // mostrar el modal
        showModalProductoStock()
    })

    // accion de agregar material de stock
    $("#btn-agregar-material-stock").on('click', function () {
        // validamos informacion
        const valueMaterial = $("#selectMaterialesStock").val()
        const valueCantidad = $("#inputCantidadMaterialStock").val()

        let handleError = ''

        if (valueMaterial.length === 0) {
            handleError += "- Debes seleccionar un material\n"
        }

        if (!esValorNumericoValidoYMayorQueCero(valueCantidad)) {
            handleError += "- La cantidad ingresada debe ser un valor numérico mayor que cero"
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }
        // añadimos información al dom del table de detalle de cotización
        const findProducto = detalleCotizacion.find(element => element.pro_id == valueMaterial)
        if (findProducto) {
            const row = `
                <tr>
                    <input type="hidden" value="${findProducto.pro_id}" class="producto-detalle"/>
                    <td>Stock</td>
                    <td class="codigo-detalle">${findProducto.pro_codigo}</td>
                    <td class="descripcion-detalle">${findProducto.pro_descripcion}</td>
                    <td>
                        <textarea class="form-control observacion-detalle" rows="1"></textarea>
                    </td>
                    <td class="text-center unidad-detalle">${findProducto.uni_codigo}</td>
                    <td class="text-center cantidad-requerida-detalle">${valueCantidad}</td>
                    <td class="text-center">
                        <input type="number" class="form-control cantidad-pedida-detalle" value="${valueCantidad}" max="${valueCantidad}" />
                    </td>
                    <td class="text-center d-none label-precio-unitario-detalle">
                        <input type="number" class="form-control precio-unitario-detalle" value="0.00"/>
                    </td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-sm btn-secondary btn-detalle me-1 disabled" title="Detalle Material">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-primary btn-historico-detalle-material me-1" data-historico="${findProducto.pro_id} title='Historico Detalle Material'">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                    <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-danger btn-delete-detalle-material me-1" title="Eliminar Detalle Material">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `
            $('#tbl-cotizaciones-materiales tbody').append(row)
        }

    })

    // accion de asignar responsable
    $("#btn-asignar-responsable").on('click', function () {
        // debemos obtener los materiales seleccionados
        const filasSeleccionadas = dataTable.rows({ selected: true }).nodes();
        const indicesSeleccionados = [];
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).data('index');
            indicesSeleccionados.push(valor);
        });

        // debe al menos seleccionarse un item
        if (indicesSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un material')
            return
        }

        // extraer la informacion de los materiales seleccionados
        const dataSeleccionada = despliegueMaterialesResumido.filter((detalle, index) => indicesSeleccionados.includes(index))
        const idsDetalles = []
        dataSeleccionada.forEach((data) => {
            data.detalle.forEach((detalle) => {
                idsDetalles.push(detalle.odm_id)
            })
        })

        $("#ids-detalles-seleccionados").val(idsDetalles)
        $("#index-detalles-seleccionados").val(indicesSeleccionados)
        showModalResponsableBloque()
    })

    // mostrar información a cotizar
    $("#btn-cotizar-materiales").on('click', async function () {
        // vaceamos la informacion de detalle de cotizacion cada vez que abrimos el modal
        detalleCotizacion = []
        archivosAdjuntos = []

        // debemos obtener los materiales seleccionados
        const filasSeleccionadas = dataTable.rows({ selected: true }).nodes();
        const indicesSeleccionados = [];
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).data('index');
            indicesSeleccionados.push(valor);
        });

        // debe al menos seleccionarse un item
        if (indicesSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un material')
            return
        }

        // extraemos la informacion correspondiente
        const dataSeleccionada = despliegueMaterialesResumido.filter((detalle, index) => indicesSeleccionados.includes(index))
        const dataSeleccionadaMateriales = []
        dataSeleccionada.forEach(detalle => {
            detalle.detalle.forEach(detalleElement => {
                if (detalleElement.odm_estado != 'ODC') {
                    dataSeleccionadaMateriales.push(detalleElement)
                }
            })
        })

        // debemos hacer una validación
        if (dataSeleccionadaMateriales.length === 0) {
            alert('Los materiales seleccionados ya fueron ordenados de compra')
            return
        }

        const dataSeleccionadaAgrupada = dataSeleccionadaMateriales.reduce((acc, item) => {
            if (item.pro_id != null && item.odm_observacion === null) {
                // Buscar si ya existe un grupo para este pro_id
                const existingGroup = acc.find((group) => group.pro_id === item.pro_id && group.odm_id == undefined)

                if (existingGroup) {
                    // Acumular cantidad y agregar al detalle
                    existingGroup.cantidad += parseFloat(item.odm_cantidad)
                    existingGroup.detalle.push(item)
                } else {
                    // Crear un nuevo grupo con detalle
                    acc.push({
                        pro_id: item.pro_id,
                        pro_descripcion: item.producto.pro_descripcion,
                        uni_codigo: item.producto.uni_codigo,
                        pro_codigo: item.producto.pro_codigo,
                        cantidad: parseFloat(item.odm_cantidad),
                        detalle: [item],
                    });
                }
            } else {
                // Mantener elementos que no cumplen las condiciones
                acc.push(item);
            }

            return acc;
        }, []);

        // detalleCotizacion = dataSeleccionada
        detalleCotizacion = dataSeleccionadaAgrupada

        // de la data seleccionada extraemos los productos para poder buscar sus proveedores de ordenes de compra correspondientes
        const productosCotizacion = dataSeleccionada.filter(detalle => detalle.odm_id === undefined).map(detalle => {
            return detalle.detalle[0].pro_id
        })

        // con los productos ya seleccionados, hacemos una consulta para saber cual fue el ultimo proveedor que se ordeno la compra de estos
        const formatData = {
            productos: productosCotizacion
        }
        const { data } = await client.post('/ultimas-compras/producto', formatData)

        // reset de los valores de ingreso
        limpiarLista()
        $('#proveedoresInput').val('')
        $('#tipo-proveedor').val('')
        $('#tbl-cotizaciones-proveedores tbody').empty()
        $('#tbl-cotizaciones-materiales tbody').empty()

        // Setear valor de forma de pago y moneda de data
        try {
            $("#formapagoCotizacionInputHidden").val(data[0].fpa_descripcion ? data[0].fpa_descripcion : 'CONTADO')
            $("#monedaCotizacionInputHidden").val(data[0].mon_codigo ? data[0].mon_codigo : '')
        } catch (error) {
            console.log(error)
        }

        // debemos agregar a la información de proveedores que compraron los productos
        const proveedoresUnicos = new Set()
        data.forEach(proveedor => {
            // Solo renderizar si el prv_id no existe en el Set y no es null
            if (proveedor.prv_id && !proveedoresUnicos.has(proveedor.prv_id)) {
                proveedoresUnicos.add(proveedor.prv_id)
                const proveedorMapeado = {
                    ...proveedor,
                    prv_id: proveedor.prv_codigo,
                }
                const row = renderRowProveedor(proveedorMapeado)
                $('#tbl-cotizaciones-proveedores tbody').append(row)
            }
        })

        // debemos ingresar la informacion de detalle a cotizar
        $('#tbl-cotizaciones-materiales tbody').empty()
        let content = ''
        detalleCotizacion.forEach((detalle, index) => {
            const proveedor = data.find(proveedor => proveedor.pro_id === detalle.pro_id)
            content += renderRowCotizacion(detalle, index, proveedor)
        })

        $('#tbl-cotizaciones-materiales tbody').html(content)

        // Inicializar datepicker en todos los inputs de fecha de las filas generadas
        $('.fecha-entrega-detalle').datepicker({
            dateFormat: 'dd/mm/yy'
        });

        // abrir modal de solicitud de cotizacion
        showModalSolicitudCotizacion(data.length)

        recalcularTotales()
    })

    // ver detalle de agrupamiento de detalle de cotizacion
    $('#tbl-cotizaciones-materiales tbody').on('click', '.btn-detalle', (event) => {
        const $element = $(event.currentTarget).closest('tr')
        const index = $element.data('index')
        initDetalleMaterialAgrupado(detalleCotizacion[index].detalle)
    })

    // eliminar detalle de cotizacion
    $('#tbl-cotizaciones-materiales tbody').on('click', '.btn-delete-detalle-material', (event) => {
        const $element = $(event.currentTarget).closest('tr')
        const index = $element.data('index')
        detalleCotizacion[index] = null
        $element.remove()
        recalcularTotales()
    })

    // ver historico de cotizaciones y ordenes de compra de un producto
    $('#tbl-cotizaciones-materiales tbody').on('click', '.btn-historico-detalle-material', async function () {
        const producto = $(this).data('historico')
        initHistoricoByProducto(producto)
    })

    function recalcularTotales() {
        let subtotal = 0.00
        let total = 0.00

        $('#tbl-cotizaciones-materiales tbody tr').each(function () {
            const precioUnitario = parseFloat($(this).find('.precio-unitario-detalle').val()) || 0.00
            const descuento = parseFloat($(this).find('.descuento').val()) || 0.00
            const cantidadPedida = parseFloat($(this).find('.cantidad-pedida-detalle').val()) || 0.00

            // Subtotal = precio unitario * cantidad pedida SIN descuento
            subtotal += precioUnitario * cantidadPedida

            // Total = precio unitario con descuento * cantidad pedida  
            const precioUnitarioConDescuento = precioUnitario * (1 - descuento / 100)
            total += precioUnitarioConDescuento * cantidadPedida
        })

        $('#subtotalCotizacionInput').val(subtotal.toFixed(4))
        $('#totalCotizacionInput').val(total.toFixed(4))
    }

    // ----------- TRAER INFORMACION DE MONEDAS ----------
    const cargarTipoMonedas = async () => {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaCotizacionInput')
            $monedaSelect.empty()

            const optionDefault = '<option value="">Seleccione una moneda</option>'
            $monedaSelect.append(optionDefault)

            data.forEach((moneda) => {
                const option = $(`<option>`).val(moneda["mon_codigo"]).text(`${moneda["mon_simbolo"]} ${moneda["mon_descripcion"]}`)
                $monedaSelect.append(option)
            })

            // Setear valor de moneda de data y forma de pago
            $("#monedaCotizacionInput").val($("#monedaCotizacionInputHidden").val())
            if ($("#formapagoCotizacionInputHidden").val().toUpperCase() === "CREDITO") {
                $("#formapagoCotizacionInput").val("CREDITO")
            } else {
                $("#formapagoCotizacionInput").val("CONTADO")
            }
        } catch (error) {
            console.log(error)
        }
    }

    // ----------- GESTIÓN DE PROVEEDORES ----------------
    $("#checkProveedorUnico").on('change', async function () {
        const checked = $(this).is(':checked')
        if (checked) {
            // cargamos información de monedas
            await cargarTipoMonedas()
            // establecemos manejador de fecha de validez
            $("#fechaValidezPicker").datepicker({
                dateFormat: 'dd/mm/yy',
            })
            // resetemos los valores
            $("#cotizacionProveedorCotizacionInput").val("")
            $("#fechaValidezPicker").val("")
            $("#observacionFormapagoCotizacionInput").val("")
            $("#lugarEntregaCotizacionInput").val("")
            // mostramos los contenedores
            $("#div-cotizacion").removeClass('d-none')
            $(".label-precio-unitario").removeClass('d-none')
            $(".label-precio-unitario-detalle").removeClass('d-none')
            $(".label-descuento").removeClass('d-none')
            $(".label-precio-unitario-total").removeClass('d-none')
            $(".label-ultimo-precio").removeClass('d-none')
        } else {
            $("#div-cotizacion").addClass('d-none')
            $(".label-precio-unitario").addClass('d-none')
            $(".label-precio-unitario-detalle").addClass('d-none')
            $(".label-descuento").addClass('d-none')
            $(".label-precio-unitario-total").addClass('d-none')
            $(".label-ultimo-precio").addClass('d-none')
        }
    })

    $('#proveedoresInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarProveedores(query)
        } else {
            limpiarLista()
        }
    }))

    $('#proveedoresSUNAT').keypress(function (e) {
        var key = e.which
        if (key == 13) {
            const query = $('#proveedoresSUNAT').val().trim()
            buscarProveedorBySUNAT(query)
        }
    })

    // al momento de presionar enter
    $('#searchProveedorSUNAT').on('click', async function (event) {
        const query = $('#proveedoresSUNAT').val().trim()
        buscarProveedorBySUNAT(query)
    });

    // buscar proveedores por SAP
    async function buscarProveedorBySUNAT(documento) {
        if (documento.length < 8) {
            alert('El documento debe tener más de 8 dígitos')
            return
        }

        try {
            const { data } = await client.get(`/proveedoresByQuerySAP?nrodocumento=${documento}`)
            seleccionarProveedor(data[0])
        } catch (error) {
            const { data, status } = error.response
            if (status === 404) {
                alert(data.error)
            } else {
                alert('Error al realizar la búsqueda')
            }
        }
    }

    // buscar proveedores de nuestra base de datos
    async function buscarProveedores(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/proveedoresByQuerySAP?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(proveedor => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                listItem.textContent = `${proveedor.RUC} - ${proveedor.RazSocial}`
                listItem.dataset.id = proveedor.CardCode
                listItem.addEventListener('click', () => seleccionarProveedor(proveedor))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Petición abortada'); // Maneja el error de la petición abortada
            } else {
                console.error('Error al buscar proveedores:', error);
                alert('Error al buscar proveedores. Inténtalo de nuevo.'); // Muestra un mensaje de error al usuario
            }
        }
    }

    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    // renderizar row de proveedor
    function renderRowProveedor(proveedor) {
        console.log(proveedor)
        const { prv_id, prv_nrodocumento, prv_nombre, prv_direccion, tdo_codigo, prv_telefono, prv_whatsapp, prv_contacto, prv_correo, prv_account_sol, prv_banco_sol, prv_account_usd, prv_banco_usd, prv_account_nacion, precio_unitario, prp_fechaultimacompra } = proveedor
        const row = `
        <tr data-id-proveedor="${prv_id}">
            <input class="account-sol-proveedor" type="hidden" value="${prv_account_sol || ''}"/>
            <input class="banco-sol-proveedor" type="hidden" value="${prv_banco_sol || ''}"/>
            <input class="account-usd-proveedor" type="hidden" value="${prv_account_usd || ''}"/>
            <input class="banco-usd-proveedor" type="hidden" value="${prv_banco_usd || ''}"/>
            <input class="account-nacion-proveedor" type="hidden" value="${prv_account_nacion || ''}"/>
            <input class="direccion-proveedor" type="hidden" value="${prv_direccion || ''}"/>
            <td class="nombre-proveedor">${prv_nombre}</td>
            <td class="tipodocumento-proveedor text-center">${tdo_codigo}</td>
            <td class="nrodocumento-proveedor">${prv_nrodocumento}</td>
            <td>
                <input type="text" class="form-control correo-proveedor" value="${prv_correo || ''}" />
            </td>
            <td>
                <input type="text" class="form-control contacto-proveedor" value="${prv_contacto || ''}" />
            </td>
            <td>
                <input type="text" class="form-control celular-proveedor" value="${prv_whatsapp || ''}" />
            </td>
            <td>
                <input type="text" class="form-control telefono-proveedor" value="${prv_telefono || ''}" />
            </td>
            <td>${parseDateSimple(prp_fechaultimacompra) || ''}</td>
            <td>
                <div class="d-flex justify-content-around">
                    <!--
                    <button class="btn btn-sm btn-danger btn-cotizacion-exportar-pdf me-1" title="Exportar PDF">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                            <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                            <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                        </svg>
                    </button>
                    -->
                    <button class="btn btn-sm btn-success btn-guardar-cotizacion me-1" title="Guardar cotización">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                            <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                            <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary btn-cotizacion-enlace me-1 disabled" data-cotizacion-id="" title="Enlace de cotización">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
                            <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
                            <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary btn-cotizacion-exportar-excel me-1 disabled" data-cotizacion-id="" title="Exportar Excel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-excel-fill" viewBox="0 0 16 16">
                            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M5.884 6.68 8 9.219l2.116-2.54a.5.5 0 1 1 .768.641L8.651 10l2.233 2.68a.5.5 0 0 1-.768.64L8 10.781l-2.116 2.54a.5.5 0 0 1-.768-.641L7.349 10 5.116 7.32a.5.5 0 1 1 .768-.64"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary btn-cotizacion-exportar-text me-1 disabled" data-cotizacion-id="" title="Exportar Texto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger btn-proveedor-eliminar me-1" title="Eliminar proveedor">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm ${prv_id ? 'btn-outline-primary' : 'btn-outline-secondary'} btn-compras-producto-proveedor" ${prv_id ? '' : 'disabled'} title="Historial de compras productos proveedor">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                            <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                            <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                            <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
        `
        return row
    }

    // seleccionar o busqueda de proveedor
    function seleccionarProveedor(proveedor) {
        const mapProveedor = {
            prv_id: proveedor.CardCode,
            prv_nrodocumento: proveedor.RUC,
            prv_nombre: proveedor.RazSocial,
            tdo_codigo: 'RUC',
            prv_direccion: proveedor.Direccion,
            prv_telefono: proveedor.Telefono,
            prv_whatsapp: proveedor.Celular,
            prv_correo: proveedor.E_Mail,
            prv_contacto: proveedor.Contacto,
            prv_account_sol: proveedor.account_sol,
            prv_banco_sol: proveedor.banco_sol,
            prv_account_usd: proveedor.account_usd,
            prv_banco_usd: proveedor.banco_usd,
            prv_account_nacion: proveedor.account_nacion,
        }
        const $rows = $('#tbl-cotizaciones-proveedores tbody tr')

        const array_prov = $rows.map(function () {
            // return $(this).data('id-proveedor')
            return $(this).find('.nrodocumento-proveedor').text()
        }).get()
        // const findElement = array_prov.find(element => element == prv_id)
        const findElement = array_prov.find(element => element == mapProveedor.prv_nrodocumento)

        if (findElement) {
            alert('El proveedor ya fue agregado')
            return
        }

        limpiarLista()
        $('#proveedoresInput').val('')

        const row = renderRowProveedor(mapProveedor)
        $('#tbl-cotizaciones-proveedores tbody').append(row)
    }

    // eliminar detalle de proveedor
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-proveedor-eliminar', (event) => {
        const row = $(event.currentTarget).closest('tr')
        row.remove()
    })

    // crear solicitud de cotizacion
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-guardar-cotizacion', async (event) => {
        const filas = $('#tbl-cotizaciones-materiales tbody tr')
        const filas_sin_codigo = filas.filter(function () {
            const codigoMaterial = $(this).find('td:nth-child(3)').text().trim()
            return codigoMaterial === 'N/A' || codigoMaterial === ''
        })

        if (filas_sin_codigo.length > 0) {
            bootbox.alert({
                title: '<span style="color:#dc3545;font-weight:bold;">Error</span>',
                message: `<div class="d-flex align-items-center gap-2 flex-column">
                            <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="#dc3545" class="bi bi-x-circle me-2" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z"/>
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.646a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                            </svg>
                            <p>No se puede cotizar materiales que no tengan un código asignado</p>
                        </div>`,
                centerVertical: true,
                backdrop: true,
                size: 'large',
                className: 'bootbox-confirm-modal'
            })
            return
        }

        const row = $(event.currentTarget).closest('tr')
        const id_proveedor = row.data('id-proveedor')
        let flagPedidoMayorRequerido = false

        // debemos saber si la solicitud de cotización sera de proveedor unico
        const proveedor_unico = $('#checkProveedorUnico').is(':checked')

        // formamos la informacion de proveedor
        const proveedor = {
            prv_id: id_proveedor,
            prv_direccion: row.find('.direccion-proveedor').val() || '',
            prv_nombre: row.find('.nombre-proveedor').text() || '',
            tdo_codigo: row.find('.tipodocumento-proveedor').text() || '',
            prv_nrodocumento: row.find('.nrodocumento-proveedor').text() || '',
            prv_contacto: row.find('.contacto-proveedor').val() || '',
            prv_whatsapp: row.find('.celular-proveedor').val() || '',
            prv_telefono: row.find('.telefono-proveedor').val() || '',
            prv_correo: row.find('.correo-proveedor').val() || '',
            prv_account_sol: row.find('.account-sol-proveedor').val() || '',
            prv_banco_sol: row.find('.banco-sol-proveedor').val() || '',
            prv_account_usd: row.find('.account-usd-proveedor').val() || '',
            prv_banco_usd: row.find('.banco-usd-proveedor').val() || '',
            prv_account_nacion: row.find('.account-nacion-proveedor').val() || '',
        }

        // si es proveedor unico, se debe ingresar información de cotizacion
        let handleError = ''
        let cotizacion = {}

        if (proveedor_unico) {
            const numeroCotizacion = $("#cotizacionProveedorCotizacionInput").val()
            const fechaValidezCotizacion = $("#fechaValidezPicker").val()
            const monedaCotizacion = $("#monedaCotizacionInput").val()
            const formapagoCotizacion = $("#formapagoCotizacionInput").val()
            const observacionFormapagoCotizacion = $("#observacionFormapagoCotizacionInput").val()
            const lugarEntregaCotizacion = $("#lugarEntregaCotizacionInput").val()

            if (numeroCotizacion.length === 0) {
                handleError += "- Debe ingresar el número de cotización\n"
            }

            if (monedaCotizacion.length === 0) {
                handleError += "- Debe ingresar una moneda para la cotización\n"
            }

            if (handleError.length !== 0) {
                alert(handleError)
                return
            }

            cotizacion = {
                coc_cotizacionproveedor: numeroCotizacion,
                mon_codigo: monedaCotizacion,
                coc_fechavalidez: fechaValidezCotizacion ? transformarFecha(fechaValidezCotizacion) : null,
                coc_formapago: formapagoCotizacion || '',
                coc_notas: observacionFormapagoCotizacion || '',
                coc_lugarentrega: lugarEntregaCotizacion || '',
            }
        }

        const detalleMateriales = []
        const detalleMaterialesStock = []

        const rows = $('#tbl-cotizaciones-materiales tbody tr')
        let cod_orden = 1;

        rows.each(function () {
            const index = $(this).data('index')
            const descuentoDetalle = $(this).find('.descuento').val() ? $(this).find('.descuento').val() : 0.00

            const observacion = $(this).find('.observacion-detalle').val().trim()
            let precioUnitario = proveedor_unico
                ? parseFloat($(this).find('.precio-unitario-detalle').val().trim()).toFixed(4) * (1 - descuentoDetalle / 100)
                : 0.00
            if (isNaN(precioUnitario)) precioUnitario = 0.00
            const cantidadPedida = $(this).find('.cantidad-pedida-detalle').val()
            // valores detalle de cotizacion

            if (+cantidadPedida > +$(this).find('.cantidad-requerida-detalle').text()) {
                flagPedidoMayorRequerido = true
            }

            const fechaEntrega = $(this).find('.fecha-entrega-detalle').val() ? transformarFecha($(this).find('.fecha-entrega-detalle').val()) : null
            if (index !== undefined) {
                const detalleIndex = detalleCotizacion[index]
                if (detalleIndex.odm_id === undefined) {
                    detalleIndex.detalle.forEach(detalle => {
                        detalleMateriales.push({
                            cod_orden: cod_orden,
                            odm_id: detalle.odm_id,
                            pro_id: detalleIndex.pro_id,
                            uni_codigo: detalle.producto.uni_codigo,
                            cod_descripcion: detalle.producto.pro_descripcion,
                            cod_observacion: observacion,
                            cod_cantidad: detalle.odm_cantidad,
                            cod_preciounitario: precioUnitario,
                            cod_total: parseFloat(detalle.odm_cantidad * precioUnitario).toFixed(4),
                            cod_cantidadcotizada: cantidadPedida,
                            cod_fecentregaoc: fechaEntrega,
                            cod_descuento: descuentoDetalle
                        })
                    })
                } else {
                    detalleMateriales.push({
                        cod_orden: cod_orden,
                        pro_id: detalleIndex.pro_id,
                        odm_id: detalleIndex.odm_id,
                        uni_codigo: detalleIndex.pro_id ? detalleIndex.producto.uni_codigo : '',
                        cod_descripcion: detalleIndex.odm_descripcion,
                        cod_observacion: observacion,
                        cod_cantidad: detalleIndex.odm_cantidad,
                        cod_preciounitario: precioUnitario,
                        cod_total: parseFloat(detalleIndex.odm_cantidad * precioUnitario).toFixed(4),
                        cod_cantidadcotizada: cantidadPedida,
                        cod_fecentregaoc: fechaEntrega,
                        cod_descuento: descuentoDetalle
                    })
                }
            } else {
                detalleMaterialesStock.push({
                    cod_orden: cod_orden,
                    pro_id: $(this).find('.producto-detalle').val(),
                    odm_id: null,
                    uni_codigo: $(this).find('.unidad-detalle').text(),
                    cod_descripcion: $(this).find('.descripcion-detalle').text(),
                    cod_observacion: $(this).find('.observacion-detalle').val(),
                    cod_cantidad: $(this).find('.cantidad-pedida-detalle').val(),
                    cod_preciounitario: precioUnitario,
                    cod_total: parseFloat($(this).find('.cantidad-pedida-detalle').val() * precioUnitario).toFixed(4),
                    cod_fecentregaoc: fechaEntrega,
                    cod_descuento: descuentoDetalle
                })
            }
            cod_orden++
        })


        const formatData = {
            proveedor,
            detalle_materiales: detalleMateriales,
            detalle_materiales_stock: detalleMaterialesStock,
            proveedor_unico: proveedor_unico,
            cotizacion: cotizacion
        }

        // Recolectar información de productos excedentes
        if (flagPedidoMayorRequerido) {
            const productosExcedentes = [];
            rows.each(function () {
                const cantidadPedida = parseFloat($(this).find('.cantidad-pedida-detalle').val());
                const cantidadRequerida = parseFloat($(this).find('.cantidad-requerida-detalle').text());

                if (cantidadPedida > cantidadRequerida) {
                    const index = $(this).data('index');
                    const detalleIndex = detalleCotizacion[index];

                    productosExcedentes.push({
                        pro_id: detalleIndex.pro_id,
                        odm_item: 1, // Se ajustará en el backend
                        odm_asociar: true,
                        odm_descripcion: detalleIndex.pro_descripcion || detalleIndex.odm_descripcion,
                        odm_cantidad: cantidadPedida - cantidadRequerida,
                        odm_observacion: `Cantidad excedente de cotización ${formatData.proveedor.prv_nombre}`,
                        odm_tipo: 1
                    });
                }
            });

            if (productosExcedentes.length > 0) {
                formatData.productos_excedentes = productosExcedentes;
            }
        }

        console.log(formatData)
        // return

        const formData = new FormData()
        if (proveedor_unico) {
            $.each(archivosAdjuntos, function (index, file) {
                formData.append('files[]', file)
            })
        }

        if (flagPedidoMayorRequerido) {
            const resultadoModalExcedente = await new Promise((resolve) => {
                $('#ot-numero-requerimiento').val('')
                $('#modalRequerimientoExcedente').modal({
                    backdrop: 'static',
                    keyboard: false
                }).modal('show')

                $('#modalRequerimientoExcedente').off('hidden.bs.modal').on('hidden.bs.modal', () => {
                    resolve(null)
                })

                $('#modalRequerimientoExcedente .btn-secondary').off('click').on('click', () => {
                    $('#modalRequerimientoExcedente').modal('hide')
                })

                $('#btn-guardar-requerimiento-excedente').off('click').on('click', async () => {
                    const ot_numero = $('#ot-numero-requerimiento').val()

                    if (!ot_numero.trim()) {
                        alert('Debe ingresar el número de orden de trabajo')
                        return
                    }

                    const $boton = $('#btn-guardar-requerimiento-excedente')
                    const textoOriginal = $boton.html()

                    $boton.prop('disabled', true).html(`
                        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Procesando...
                    `)

                    try {
                        await buscarOrdenTrabajo(ot_numero.trim())
                        $boton.prop('disabled', false).html(textoOriginal)
                        $('#modalRequerimientoExcedente').modal('hide')
                        resolve(ot_numero)
                    } catch (error) {
                        console.log(error)
                        $boton.prop('disabled', false).html(textoOriginal)
                    }
                })
            })

            if (!resultadoModalExcedente) {
                return
            }
            formatData.ot_numero = resultadoModalExcedente
        }

        formData.append('cotizacion', JSON.stringify(formatData))

        try {
            const { data } = await client.post('/cotizacionesByDespliegue', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            // debemos habilitar la exportacion de excel
            row.find('.btn-cotizacion-exportar-excel')
                .removeClass('disabled')
                .removeClass('btn-secondary')
                .addClass('btn-success')
                .attr('data-cotizacion-id', data.cotizacion.coc_id)

            // debemos habilitar la exportacion de formato text
            row.find('.btn-cotizacion-exportar-text')
                .removeClass('disabled')
                .removeClass('btn-secondary')
                .addClass('btn-primary')
                .attr('data-cotizacion-id', data.cotizacion.coc_id)

            // debemos habilitar la copia del enlace
            row.find('.btn-cotizacion-enlace')
                .removeClass('disabled')
                .removeClass('btn-secondary')
                .addClass('btn-info')
                .attr('data-cotizacion-id', data.cotizacion.coc_id)

            // debemos deshabilitar la eliminacion del detalle de proveedor
            row.find('.btn-proveedor-eliminar')
                .addClass('disabled')
                .removeClass('btn-danger')
                .addClass('btn-secondary')

            // debemos deshabilitar la posibilidad de guardar la cotizacion de nuevo
            row.find('.btn-guardar-cotizacion')
                .addClass('disabled')
                .removeClass('btn-success')
                .addClass('btn-secondary')

            row.addClass('table-success')

            // limpiamos el form de cotizacion
            clearDataCotizacion()

            bootbox.dialog({
                title: '<i class="fa fa-check-circle text-success"></i> <span class="text-success">' + (proveedor_unico ? 'Cotización' : 'Solicitud de cotización') + ' creada</span>',
                message: `La ${proveedor_unico ? 'cotización' : 'solicitud de cotización'} fue creada con éxito. ${data.requerimiento_excedente ? `Adicional se ha creado un requerimiento para la cantidad excedente con numero: <span class="fw-bold">${data.requerimiento_excedente.odt_numero}</span>` : ''}.<br><br>
                Aqui esta el link de la ${proveedor_unico ? 'cotización' : 'solicitud de cotización'}: <a href="${config.FRONT_EXTRANET_URL}/cotizacion-proveedor.html?coc_id=${data.cotizacion.coc_id}" target="_blank">${config.FRONT_EXTRANET_URL}/cotizacion-proveedor.html?coc_id=${data.cotizacion.coc_id}</a>
                `,
                backdrop: true,
                centerVertical: true,
                className: 'bootbox-confirm-modal',
                buttons: {
                    confirm: {
                        label: 'Aceptar',
                        className: 'btn-success'
                    }
                }
            })

            // SOLO SE CIERRA EL MODAL SI UN UNICO PROVEEDOR
            if ($('#tbl-proveedores-container-body tr').length === 1) {
                $('#cotizacionesModal').modal('hide')
            }
        } catch (error) {
            console.log(error)
            bootbox.dialog({
                title: '<i class="fa fa-times-circle text-danger"></i> <span class="text-danger">Error</span>',
                message: error.response.data.error ? error.response.data.error : 'Hubo un error en la creación de solicitud de cotización',
                backdrop: true,
                centerVertical: true,
                className: 'bootbox-alert-modal',
                buttons: {
                    confirm: {
                        label: 'Aceptar',
                        className: 'btn-danger'
                    }
                }
            })
        }
    })

    // funcion de buscar Orden de Trabajo
    const buscarOrdenTrabajo = async (otValue) => {
        try {
            const { data } = await client.get(`/ordenestrabajosByNumero/${otValue}`)
            if (!data.length > 0) {
                alert('No se encontro la orden de trabajo en la base de datos')
                throw new Error('Orden de trabajo no encontrada')
            }
        } catch (error) {
            console.log(error)
            const { response } = error
            if (response && response.status === 404) {
                alert(response.data.error)
            } else {
                alert('Error al buscar la orden de trabajo')
            }
            throw new Error('Error en la búsqueda de orden de trabajo')
        }
    }

    // crear solicitud de cotizacion modal
    $('#btn-guardar-cotizacion-modal').on('click', async (event) => {
        $('#tbl-cotizaciones-proveedores tbody .btn-guardar-cotizacion').first().trigger('click');
    })

    // Funcion para exportar en txt de cotizacion
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-cotizacion-exportar-text', async function () {
        const row = $(this).closest('tr')
        const cotizacion_id = $(this).data('cotizacion-id')
        try {
            const response = await client.get(`/cotizacion/exportarTXT/${cotizacion_id}`, {
                headers: {
                    'Accept': 'text/plain'
                },
                responseType: 'blob'
            })
            const textBlob = new Blob([response.data], { type: 'text/plain' });
            const textUrl = URL.createObjectURL(textBlob);
            showModalPreviewText(textUrl)
        } catch (error) {
            console.log(error)
        }
    })

    // Funcion para ir al enlace de url de la solicitud de cotizacion
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-cotizacion-enlace', function () {
        const id_cotizacion = $(this).data('cotizacion-id')
        const url = `${config.FRONT_EXTRANET_URL}/cotizacion-proveedor.html?coc_id=${id_cotizacion}`
        window.open(url, '_blank')
    })

    // Funcion para exportar en excel de la solicitud de cotizacion
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-cotizacion-exportar-excel', async function () {
        const id_cotizacion = $(this).data('cotizacion-id')
        try {
            const response = await client.get(`/cotizacion/exportarExcel/${id_cotizacion}`, {
                responseType: 'blob',
            })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar el archivo:", error);
        }
    })

    // Funcion para consultar historico de ultimas compras por proveedor y productos
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-compras-producto-proveedor', async function () {
        const row = $(this).closest('tr')
        const id_proveedor = row.data('id-proveedor')

        const formatData = {
            proveedor: id_proveedor,
            productos: obtenerIdDetallesProductos()
        }

        try {
            const { data } = await client.get('comprasByProductoProveedor', { params: formatData })
            // vaciamos la tabla
            $("#tbl-proveedor-productos-body").empty()
            // llenamos la data
            let content = ''
            data.forEach(item => {
                const { proveedor, producto, prp_fechaultimacompra, prp_preciounitario, prp_nroordencompra } = item
                content += `
                    <tr>
                        <td>${parseDateSimple(prp_fechaultimacompra)}</td>
                        <td>${prp_nroordencompra}</td>
                        <td>${proveedor.prv_nrodocumento}</td>
                        <td>${proveedor.prv_nombre}</td>
                        <td>${producto.pro_codigo}</td>
                        <td>${producto.pro_descripcion}</td>
                        <td></td>
                        <td>${parseFloat(prp_preciounitario).toFixed(4)}</td>
                        <td></td>
                    </tr>
                `
            })

            // renderizamos la información
            $("#tbl-proveedor-productos-body").html(content)
            // abrimos el modal correspondiente
            showModalProveedorProductosCompras()
        } catch (error) {
            console.log(error)
        }
    })

    // Gestionamos el cierre del modal
    $('#cotizacionesModal').on('hide.bs.modal', function (e) {
        clearDataCotizacion()
        const filteredURL = obtenerFiltrosActuales()
        initDataTable(filteredURL)
    })

    // Gestionamos el cierre del modal de seleccion de cotizaciones
    $('#cotizadoModal').on('hide.bs.modal', function (e) {
        const filteredURL = obtenerFiltrosActuales()
        initDataTable(filteredURL)
    })

    // -------- GESTIÓN DE ARCHIVOS --------------
    $('#file-input').on('change', function () {
        const files = this.files;

        $.each(files, function (index, file) {
            archivosAdjuntos.push(file)
            const listItem = $('<div></div>').addClass('alert alert-secondary d-flex justify-content-between align-items-center')
                .text(`${file.name} (${file.size} bytes)`)

            const deleteButton = $('<button></button>')
                .addClass('btn btn-danger btn-sm')
                .text('Eliminar')
                .on('click', function () {
                    const fileIndex = archivosAdjuntos.indexOf(file)
                    if (fileIndex > -1) {
                        archivosAdjuntos.splice(fileIndex, 1)
                    }
                    listItem.remove()
                });

            listItem.append(deleteButton)
            $('#file-list').append(listItem)
        });

        $('#file-input').val('')
    })

    // -------- FUNCIONES UTILITARIAS PARA ESTE SCRIPT -------------
    // limpiar datos para nuevas cotizaciones
    function clearDataCotizacion() {
        // deshabilitamos la opción de proveedor único
        $("#checkProveedorUnico").prop('checked', false)
        $(".label-precio-unitario-total").addClass('d-none')
        $(".label-descuento").addClass('d-none')
        $(".label-ultimo-precio").addClass('d-none')
        // vaceamos la variable de archivos adjuntos
        archivosAdjuntos = []
        // vaceamos la lista de archivos adjuntos
        $("#file-list").empty()
        // ocultamos los campos correspondientes
        $("#div-cotizacion").addClass('d-none')
        $(".label-precio-unitario").addClass('d-none')
        $(".label-precio-unitario-detalle").addClass('d-none')
        // los valores de precios unitarios reseteamos a 0
        $(".precio-unitario-detalle").val(0)
    }

    // obtener filtros para la busqueda
    function obtenerFiltrosActuales(urlAPI = apiURL) {
        const filterField = filterSelector.val().trim()
        const filterValue = filterInput.val().trim()
        const responsables = $("#responsableSelect").val()
        const solped = $('#inputSOLPED').val().trim()
        let filteredURL = urlAPI

        // si existen filtros de combobox, estos no dependen de filtros de fechas ni filtros multiples
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}${getValueAlmacen()}`
        } else {
            const filters = $('#filterMultipleSelector').val()
            const fecha_desde = transformarFecha($('#fechaDesde').val())
            const fecha_hasta = transformarFecha($('#fechaHasta').val())
            filteredURL += `?fecha_desde=${fecha_desde}&fecha_hasta=${fecha_hasta}${getValueAlmacen()}`

            if (filters.length !== 0) {
                filteredURL += `&multifilter=${filters.join('OR')}`
            }

        }

        if (responsables.length !== 0) {
            responsables.forEach((responsable) => {
                filteredURL += `&responsables[]=${responsable}`
            })
        }

        if (solped.length !== 0) {
            filteredURL += `&solped=${solped}`
        }

        return filteredURL
    }

    // exportar excel
    $("#btn-exportar-materiales").on('click', async function () {
        const disgregado = confirm('¿Quieres exportar disgregado?')

        const filteredURL = obtenerFiltrosActuales('/detalleMaterialesOrdenInterna-logistica-excel') + `&disgregado=${disgregado}`
        try {
            const response = await client.get(filteredURL, {
                responseType: 'blob',
            })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar el archivo:", error);
        }
    })

    // obtener ids de productos segun los materiales a cotizar
    function obtenerIdDetallesProductos() {
        let proIds = $('#tbl-cotizaciones-materiales tbody input[type="hidden"]').map(function () {
            return $(this).val();
        }).get();

        // Filtrar valores nulos o undefined y quedarse con valores únicos
        let uniqueProIds = [...new Set(proIds.filter(id => id !== "null"))];
        return uniqueProIds
    }

    // obtener ids de detalle de materiales segun indice de agrupado
    function obtenerIdDetallesMaterialByIndex(indexDetalle) {
        const detalleMaterial = despliegueMaterialesResumido[indexDetalle]
        return params = new URLSearchParams({
            param: detalleMaterial.detalle.map(detalle => detalle.odm_id).join(','),
        })
    }

    // mostrar modal de asignacion de responsable
    async function showModalResponsableBloque() {
        const modalElement = document.getElementById("responsableModalBloque")
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        })

        const { data } = await client.get('/trabajadoresSimple')

        // Ordenar la data alfabéticamente según el nombre (índice [1])
        data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

        $("#responsable-select-bloque").append($('<option selected>').val('').text('Sin responsable'))
        data.forEach(trabajador => {
            const option = $(`<option>`).val(trabajador.tra_id).text(trabajador.tra_nombre)
            $("#responsable-select-bloque").append(option.clone())
        })

        modal.show()
    }

    // mostrar modal de cotizaciones
    function showModalSolicitudCotizacion(cantidadProveedores) {
        console.log("cantidadProveedores", cantidadProveedores)
        if (cantidadProveedores > 1) {
            $("#btn-guardar-cotizacion-modal").hide()
        } else {
            $("#btn-guardar-cotizacion-modal").show()
        }

        const modalElement = document.getElementById("cotizacionesModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        modal.show();
    }

    // mostrar modal previsualizacion de txt
    function showModalPreviewText(pdfUrl) {
        document.getElementById('txt-frame').src = pdfUrl;
        const modalElement = document.getElementById("previewTXTModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static', // Esto previene el cierre al hacer clic fuera del modal
            keyboard: false // Deshabilita el cierre con "Escape"
        });

        modal.show();
    }

    // mostrar modal de productos proveedor compras
    function showModalProveedorProductosCompras() {
        const modalElement = document.getElementById("productosProveedorModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        modal.show();
    }

    // mostrar modal detalle de cotizacion
    function showModalDetalleCotizacionAgrupamiento() {
        const modalElement = document.getElementById('modalDetalleMaterialModal')
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        modal.show();
    }

    // mostrar modal de historico de cotizaciones y ordenes de compra
    function showModalHistoricoCotizacionesOrdenesCompra() {
        const modalElement = document.getElementById('historicoModal')
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        modal.show();
    }

    // mostrar modal de cotizaciones
    function showModalCotizaciones() {
        const modalElement = document.getElementById('cotizadoModal')
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        modal.show();
    }

    // mostrar modal de adjuntos
    function showModalAdjuntos() {
        const modalElement = document.getElementById('adjuntosMaterialModal')
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });

        modal.show();
    }

    // mostrar modal de productos stock
    function showModalProductoStock() {
        const modalElement = document.getElementById('materialesStockModal')
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        })

        modal.show()
    }

    // función para actualizar el modal de cotización después de asignar código
    async function actualizarModalCotizacionDespuesAsignacion() {
        try {
            // Primero necesitamos actualizar detalleCotizacion con la nueva información
            // Volver a obtener los materiales seleccionados actualizados
            const filasSeleccionadas = dataTable.rows({ selected: true }).nodes();
            const indicesSeleccionados = [];
            $(filasSeleccionadas).each(function (index, node) {
                const valor = $(node).data('index');
                indicesSeleccionados.push(valor);
            });

            // Recargar la información de los materiales
            await initDataTable(obtenerFiltrosActuales());

            // Extraer la información actualizada
            const dataSeleccionada = despliegueMaterialesResumido.filter((detalle, index) => indicesSeleccionados.includes(index))
            const dataSeleccionadaMateriales = []
            dataSeleccionada.forEach(detalle => {
                detalle.detalle.forEach(detalleElement => {
                    if (detalleElement.odm_estado != 'ODC') {
                        dataSeleccionadaMateriales.push(detalleElement)
                    }
                })
            })

            const dataSeleccionadaAgrupada = dataSeleccionadaMateriales.reduce((acc, item) => {
                if (item.pro_id != null && item.odm_observacion === null) {
                    const existingGroup = acc.find((group) => group.pro_id === item.pro_id && group.odm_id == undefined)

                    if (existingGroup) {
                        existingGroup.cantidad += parseFloat(item.odm_cantidad)
                        existingGroup.detalle.push(item)
                    } else {
                        acc.push({
                            pro_id: item.pro_id,
                            pro_descripcion: item.producto.pro_descripcion,
                            uni_codigo: item.producto.uni_codigo,
                            pro_codigo: item.producto.pro_codigo,
                            cantidad: parseFloat(item.odm_cantidad),
                            detalle: [item],
                        });
                    }
                } else {
                    acc.push(item);
                }

                return acc;
            }, []);

            // Actualizar la variable global
            detalleCotizacion = dataSeleccionadaAgrupada

            // Obtener los productos actualizados de la cotización
            const productosCotizacion = dataSeleccionada.filter(detalle => detalle.odm_id === undefined).map(detalle => {
                return detalle.detalle[0].pro_id
            })

            // Hacer la consulta actualizada de proveedores
            const formatData = {
                productos: productosCotizacion
            }
            const { data } = await client.post('/ultimas-compras/producto', formatData)

            // Limpiar y actualizar la tabla de proveedores
            $('#tbl-cotizaciones-proveedores tbody').empty()

            // Actualizar valores de forma de pago y moneda
            try {
                $("#formapagoCotizacionInputHidden").val(data[0]?.fpa_descripcion || 'CONTADO')
                $("#monedaCotizacionInputHidden").val(data[0]?.mon_codigo || '')
            } catch (error) {
                console.log(error)
            }

            // Agregar proveedores únicos actualizados
            const proveedoresUnicos = new Set()
            data.forEach(proveedor => {
                if (proveedor.prv_id && !proveedoresUnicos.has(proveedor.prv_id)) {
                    proveedoresUnicos.add(proveedor.prv_id)
                    const proveedorMapeado = {
                        ...proveedor,
                        prv_id: proveedor.prv_codigo,
                    }
                    const row = renderRowProveedor(proveedorMapeado)
                    $('#tbl-cotizaciones-proveedores tbody').append(row)
                }
            })

            // Actualizar la tabla de materiales
            $('#tbl-cotizaciones-materiales tbody').empty()
            let content = ''
            detalleCotizacion.forEach((detalle, index) => {
                const proveedor = data.find(proveedor => proveedor.pro_id === detalle.pro_id)
                content += renderRowCotizacion(detalle, index, proveedor)
            })

            $('#tbl-cotizaciones-materiales tbody').html(content)

            // Reinicializar datepicker en las nuevas filas
            $('.fecha-entrega-detalle').datepicker({
                dateFormat: 'dd/mm/yy'
            });

            console.log('Modal de cotización actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar el modal de cotización:', error);
            alert('Error al actualizar la información de cotización, cierre el modal y vuelva a abrirlo');
        }
    }
})
