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
                const { pro_id, pro_codigo, pro_descripcion, uni_codigo, cantidad, stock, cotizaciones_count, ordenes_compra_count, detalle, cotizacion_seleccionada, tiene_adjuntos } = material
                content += `
                <tr data-index="${index}">
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
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm ${pro_id ? 'btn-primary' : 'btn-secondary'} btn-historico" data-historico="${pro_id}" ${pro_id ? '' : 'disabled'}>Ver histórico</button>
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
                        <button class="btn btn-primary btn-reservado">0.00</button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-atendido">0.00</button>
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
            <td>
                <span class="badge ${cotizacion.coc_estado === 'SOL' ? 'bg-danger' : cotizacion.coc_estado === 'RPR' ? 'bg-primary' : 'bg-success'}">
                    ${cotizacion.coc_estado}
                </span>
            </td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
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
            rowItem.classList.add(`${orden_compra.occ_estado === 'SOL' ? 'table-danger' : 'table-success'}`)

            rowItem.innerHTML = `
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
                        <td>${prp_nroordencompra}</td>
                        <td>${proveedor.prv_nrodocumento}</td>
                        <td>${proveedor.prv_nombre}</td>
                        <td>${producto.pro_codigo}</td>
                        <td>${producto.pro_descripcion}</td>
                        <td>${parseDateSimple(prp_fechaultimacompra)}</td>
                        <td>${parseFloat(prp_preciounitario).toFixed(2)}</td>
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

    // --------------- MANEJO DE COTIZACIONES --------------
    function renderRowCotizacion(detalle, index) {
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
                    <input type="number" class="form-control cantidad-pedida-detalle" value="${detalle.cantidad.toFixed(2)}" min="${detalle.cantidad}" readonly disabled/>
                </td>
                <td class="text-center d-none label-precio-unitario-detalle">
                    <input type="number" class="form-control precio-unitario-detalle" value="0.00"/>
                </td>
                <td class="text-center">
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-sm btn-primary btn-detalle me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-primary btn-historico-detalle-material me-1" data-historico="${detalle.pro_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-detalle-material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                            </svg>
                        </button>
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
                    <input type="number" class="form-control cantidad-pedida-detalle" value="${detalle.odm_cantidad}" min="${detalle.odm_cantidad}" readonly disabled/>
                </td>
                <td class="text-center d-none label-precio-unitario-detalle">
                    <input type="number" class="form-control precio-unitario-detalle" value="0.00"/>
                </td>
                <td class="text-center">
                    <div class="d-flex justify-content-center">
                        <button class="btn btn-sm btn-secondary me-1" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm ${detalle.producto ? 'btn-primary' : 'btn-secondary'} btn-historico-detalle-material me-1" data-historico="${detalle.pro_id}" ${detalle.producto ? '' : 'disabled'}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-detalle-material">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`
        }
    }

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
                        <input type="number" class="form-control cantidad-pedida-detalle" value="${valueCantidad}" min="${valueCantidad}" />
                    </td>
                    <td class="text-center d-none label-precio-unitario-detalle">
                        <input type="number" class="form-control precio-unitario-detalle" value="0.00"/>
                    </td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-sm btn-secondary btn-detalle me-1 disabled">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-primary btn-historico-detalle-material me-1" data-historico="${findProducto.pro_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                    <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-danger btn-delete-detalle-material">
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

        // debemos agregar a la información de proveedores que compraron los productos
        data.forEach(proveedor => {
            const row = renderRowProveedor(proveedor)
            $('#tbl-cotizaciones-proveedores tbody').append(row)
        })

        // debemos ingresar la informacion de detalle a cotizar
        $('#tbl-cotizaciones-materiales tbody').empty()
        let content = ''
        detalleCotizacion.forEach((detalle, index) => {
            content += renderRowCotizacion(detalle, index)
        })

        $('#tbl-cotizaciones-materiales tbody').html(content)

        // abrir modal de solicitud de cotizacion
        showModalSolicitudCotizacion()
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
    })

    // ver historico de cotizaciones y ordenes de compra de un producto
    $('#tbl-cotizaciones-materiales tbody').on('click', '.btn-historico-detalle-material', async function () {
        const producto = $(this).data('historico')
        initHistoricoByProducto(producto)
    })

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
            $("#formapagoCotizacionInput").val("CONTADO")
            $("#observacionFormapagoCotizacionInput").val("")
            $("#lugarEntregaCotizacionInput").val("")
            // mostramos los contenedores
            $("#div-cotizacion").removeClass('d-none')
            $(".label-precio-unitario").removeClass('d-none')
            $(".label-precio-unitario-detalle").removeClass('d-none')
        } else {
            $("#div-cotizacion").addClass('d-none')
            $(".label-precio-unitario").addClass('d-none')
            $(".label-precio-unitario-detalle").addClass('d-none')
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

    // buscar proveedores por SUNAT
    async function buscarProveedorBySUNAT(documento) {
        if (documento.length < 8) {
            alert('El documento debe tener más de 8 dígitos')
            return
        }

        try {
            const { data } = await client.get(`/padronSunat?nrodocumento=${documento}`)
            const { xps_nrodocumento, xps_nombre } = data
            const formatData = {
                prv_id: null,
                prv_nrodocumento: xps_nrodocumento,
                prv_nombre: xps_nombre,
                prv_direccion: '',
                tdo_codigo: 'RUC',
                prv_telefono: '',
                prv_whatsapp: '',
                prv_contacto: '',
                prv_correo: ''
            }
            seleccionarProveedor(formatData)
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
                alert('Error al buscar proveedores. Inténtalo de nuevo.'); // Muestra un mensaje de error al usuario
            }
        }
    }

    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    // renderizar row de proveedor
    function renderRowProveedor(proveedor) {
        const { prv_id, prv_nrodocumento, prv_nombre, prv_direccion, tdo_codigo, prv_telefono, prv_whatsapp, prv_contacto, prv_correo } = proveedor
        const row = `
        <tr data-id-proveedor="${prv_id}">
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
            <td>
                <div class="d-flex justify-content-around">
                    <!--
                    <button class="btn btn-sm btn-danger btn-cotizacion-exportar-pdf me-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                            <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                            <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                        </svg>
                    </button>
                    -->
                    <button class="btn btn-sm btn-success btn-guardar-cotizacion me-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                            <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                            <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary btn-cotizacion-enlace me-1 disabled" data-cotizacion-id="">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
                            <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
                            <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary btn-cotizacion-exportar-excel me-1 disabled" data-cotizacion-id="">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-excel-fill" viewBox="0 0 16 16">
                            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M5.884 6.68 8 9.219l2.116-2.54a.5.5 0 1 1 .768.641L8.651 10l2.233 2.68a.5.5 0 0 1-.768.64L8 10.781l-2.116 2.54a.5.5 0 0 1-.768-.641L7.349 10 5.116 7.32a.5.5 0 1 1 .768-.64"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-secondary btn-cotizacion-exportar-text me-1 disabled" data-cotizacion-id="">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger btn-proveedor-eliminar me-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm ${prv_id ? 'btn-outline-primary' : 'btn-outline-secondary'} btn-compras-producto-proveedor" ${prv_id ? '' : 'disabled'}>
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
        const $rows = $('#tbl-cotizaciones-proveedores tbody tr')

        const array_prov = $rows.map(function () {
            // return $(this).data('id-proveedor')
            return $(this).find('.nrodocumento-proveedor').text()
        }).get()
        // const findElement = array_prov.find(element => element == prv_id)
        const findElement = array_prov.find(element => element == proveedor.prv_nrodocumento)

        if (findElement) {
            alert('El proveedor ya fue agregado')
            return
        }

        limpiarLista()
        $('#proveedoresInput').val('')

        const row = renderRowProveedor(proveedor)
        $('#tbl-cotizaciones-proveedores tbody').append(row)
    }

    // eliminar detalle de proveedor
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-proveedor-eliminar', (event) => {
        const row = $(event.currentTarget).closest('tr')
        row.remove()
    })

    // crear solicitud de cotizacion
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-guardar-cotizacion', async (event) => {
        const row = $(event.currentTarget).closest('tr')
        const id_proveedor = row.data('id-proveedor')

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
            prv_correo: row.find('.correo-proveedor').val() || ''
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
            const observacion = $(this).find('.observacion-detalle').val().trim()
            let precioUnitario = proveedor_unico
                ? parseFloat($(this).find('.precio-unitario-detalle').val().trim()).toFixed(2)
                : 0.00
            if (isNaN(precioUnitario)) precioUnitario = 0.00

            // valores detalle de cotizacion
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
                            cod_total: parseFloat(detalle.odm_cantidad * precioUnitario).toFixed(2)
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
                        cod_total: parseFloat(detalleIndex.odm_cantidad * precioUnitario).toFixed(2)
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
                    cod_total: parseFloat($(this).find('.cantidad-pedida-detalle').val() * precioUnitario).toFixed(2)
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

        console.log(formatData)
        // return

        const formData = new FormData()
        if (proveedor_unico) {
            $.each(archivosAdjuntos, function (index, file) {
                formData.append('files[]', file)
            })
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
                .attr('data-cotizacion-id', data.coc_id)

            // debemos habilitar la exportacion de formato text
            row.find('.btn-cotizacion-exportar-text')
                .removeClass('disabled')
                .removeClass('btn-secondary')
                .addClass('btn-primary')
                .attr('data-cotizacion-id', data.coc_id)

            // debemos habilitar la copia del enlace
            row.find('.btn-cotizacion-enlace')
                .removeClass('disabled')
                .removeClass('btn-secondary')
                .addClass('btn-info')
                .attr('data-cotizacion-id', data.coc_id)

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

            alert('La cotización fue creada con éxito')
        } catch (error) {
            alert("Hubo un error en la creación de solicitud de cotización")
        }
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
                        <td>${prp_nroordencompra}</td>
                        <td>${proveedor.prv_nrodocumento}</td>
                        <td>${proveedor.prv_nombre}</td>
                        <td>${producto.pro_codigo}</td>
                        <td>${producto.pro_descripcion}</td>
                        <td>${parseDateSimple(prp_fechaultimacompra)}</td>
                        <td>${parseFloat(prp_preciounitario).toFixed(2)}</td>
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

    // mostrar modal de cotizaciones
    function showModalSolicitudCotizacion() {
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
})
