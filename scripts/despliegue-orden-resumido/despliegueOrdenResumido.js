$(document).ready(() => {
    // controla el abort de solicitudes asincronas
    let abortController
    let despliegueMaterialesResumido = []
    let detalleCotizacion = []

    // variables para el manejo de datatable
    let dataTable;
    const dataContainer = $('#data-container')

    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna-resumido'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')
    const filterMultiselect = $('#filtermultiselect-button')

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().startOf('month').toDate());
    $("#fechaHasta").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate());

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 50,
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
        order: [[3, 'asc']],
    }

    const dataTableOptionsHistorico = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: true,
    }

    // gestion de multiselect
    $('select[multiple]').multiselect()

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
                if (material.detalle !== undefined) {
                    content += `
                    <tr data-index="${index}">
                        <td></td>
                        <td></td>
                        <td>${material.pro_codigo || 'N/A'}</td>
                        <td>${material.pro_descripcion || 'N/A'}</td>
                        <td class="text-center">${material.uni_codigo || 'N/A'}</td>
                        <td class="text-center">${material.cantidad.toFixed(2) || 'N/A'}</td>
                        <td class="text-center">${"0.00"}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-primary btn-detalle" data-index-detalle="${index}">Ver detalle</button>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-primary btn-historico" data-historico="${material.pro_id}">Ver histórico</button>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-responsable" data-index-detalle="${index}">
                                ${material.detalle[0].responsable?.tra_nombre || 'Sin responsable'}
                            </button>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-primary position-relative btn-cotizado" data-index-detalle="${index}">
                                Cotizaciones
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    ${material.cotizaciones_count}
                                </span>
                            </button>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-primary position-relative btn-ordenado" data-index-detalle="${index}">
                                Ordenes de compra
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    ${material.ordenes_compra_count}
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
                } else {
                    content += `
                    <tr data-index="${index}">
                        <td></td>
                        <td></td>
                        <td>N/A</td>
                        <td>${material.odm_descripcion || 'N/A'}</td>
                        <td class="text-center">N/A</td>
                        <td class="text-center">${material.odm_cantidad}</td>
                        <td class="text-center">0.00</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-secondary" disabled>Ver detalle</button>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-secondary" disabled>Ver histórico</button>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-responsable" data-index-detalle="${index}">
                                ${material.responsable?.tra_nombre || 'Sin responsable'}
                            </button>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-primary position-relative btn-cotizado" data-detalle="${material.odm_id}">
                                Cotizaciones
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    ${material.cotizaciones_count}
                                </span>
                            </button>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-primary position-relative btn-ordenado" data-detalle="${material.odm_id}">
                                Ordenes de compra
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    ${material.ordenes_compra_count}
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
                }
            })

            $('#data-container-body').html(content)
            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    initDataTable(`${apiURL}?fecha_desde=${moment().startOf('month').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`)

    // ------------ ADMINISTRACION DE FILTROS ---------------
    // filter fechas
    filterFechas.on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}?alm_id=1&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        initDataTable(filteredURL)
    })

    // filter input
    filterButton.on('click', () => {
        const filterField = filterSelector.val().trim()
        const filterValue = filterInput.val().trim()
        let filteredURL = apiURL
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        // filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        }
        initDataTable(filteredURL)
    })

    // filtro multi select
    filterMultiselect.on('click', async () => {
        const filters = $('select[multiple]').val()
        if (filters.length === 0) {
            alert('No se ha seleccionado ningun filtro')
            return
        }
        const fecha_desde = transformarFecha($('#fechaDesde').val())
        const fecha_hasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}?fecha_desde=${fecha_desde}&fecha_hasta=${fecha_hasta}&multifilter=${filters.join('OR')}`

        initDataTable(filteredURL)
    })

    // ---------- ADMINISTRACIÓN DE DETALLE DE DATOS ------------
    $('#data-container-body').on('click', '.btn-detalle', function () {
        const indexDetalle = $(this).data('index-detalle')
        const detalleMaterial = despliegueMaterialesResumido[indexDetalle]

        $("#tbl-despliegue-materiales-body").empty()
        let cantidadTotal = 0;

        // recorremos el detalle material para completar la información
        detalleMaterial.detalle.forEach((material) => {
            const { producto, orden_interna_parte, odm_cantidad, odm_descripcion, odm_observacion, odm_tipo, odm_estado, odm_feccreacion } = material
            const { orden_interna } = orden_interna_parte
            const { odt_numero, oic_tipo } = orden_interna

            const rowItem = document.createElement('tr')
            rowItem.innerHTML = `
                <td class="text-center">
                    ${oic_tipo}
                </td>
                <td>${odt_numero || 'N/A'}</td>
                <td>${parseDate(odm_feccreacion)}</td>
                <td class="text-center">${odm_estado}</td>
                <td class="text-center">
                    ${odm_tipo == 1 ? 'R' : 'A'}
                </td>
                <td>${producto?.pro_codigo || 'N/A'}</td>
                <td>${odm_descripcion || 'N/A'}</td>
                <td>${odm_observacion || 'N/A'}</td>
                <td class="text-center">${producto.unidad?.uni_codigo || 'N/A'}</td>
                <td class="text-center">${odm_cantidad}</td>
            `
            $("#tbl-despliegue-materiales-body").append(rowItem)

            cantidadTotal += parseFloat(odm_cantidad)
        })

        // agregamos un tr para mostrar el total
        const rowTotal = document.createElement('tr')
        rowTotal.innerHTML = `
            <td colspan="9" class="text-end fw-bold">Total</td>
            <td class="text-center">${cantidadTotal.toFixed(2)}</td>
        `
        $("#tbl-despliegue-materiales-body").append(rowTotal)

        const modalDetalleMateriales = new bootstrap.Modal(document.getElementById('modalDetalleMaterialModal'))
        modalDetalleMateriales.show()
    })

    // ------------- GESTION DE HISTORICO --------------
    function initHistoricoCotizaciones(data) {
        console.log(data)
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
        console.log(producto)
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

        const loadModalHistorico = new bootstrap.Modal(document.getElementById('historicoModal'))
        loadModalHistorico.show()
    }

    $("#data-container-body").on('click', '.btn-historico', async function () {
        const producto = $(this).data('historico')
        initHistoricoByProducto(producto)
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

    // ------------ DETALLE DE COTIZACIONES ------------
    $("#data-container-body").on('click', '.btn-cotizado', async function () {
        const indexDetalle = $(this).data('index-detalle')
        let params
        if (indexDetalle === undefined) {
            params = new URLSearchParams({
                param: [$(this).data('detalle')].join(','),
            })
        } else {
            const detalleMaterial = despliegueMaterialesResumido[indexDetalle]
            params = new URLSearchParams({
                param: detalleMaterial.detalle.map(detalle => detalle.odm_id).join(','),
            })
        }

        const { data } = await client.get(`/ordeninternamateriales/cotizacion?${params.toString()}`)
        console.log(data)
        $("#data-container-cotizacion tbody").empty()

        data.forEach(detalle => {
            const { cotizacion } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')

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
            $('#data-container-cotizacion tbody').append(rowItem)
        })

        const loadModalCotizado = new bootstrap.Modal(document.getElementById('cotizadoModal'))
        loadModalCotizado.show()
    })

    // ------------- DETALLE DE ORDEN DE COMPRAS --------------
    $("#data-container-body").on('click', '.btn-ordenado', async function () {
        const indexDetalle = $(this).data('index-detalle')
        let params
        if (indexDetalle === undefined) {
            params = new URLSearchParams({
                param: [$(this).data('detalle')].join(','),
            })
        } else {
            const detalleMaterial = despliegueMaterialesResumido[indexDetalle]
            params = new URLSearchParams({
                param: detalleMaterial.detalle.map(detalle => detalle.odm_id).join(','),
            })
        }
        const { data } = await client.get(`/ordeninternamateriales/ordencompra?${params.toString()}`)

        $("#data-container-ordencompra tbody").empty()

        data.forEach(detalle => {
            const { orden_compra } = detalle
            const { proveedor, moneda } = orden_compra
            const rowItem = document.createElement('tr')

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
            $('#data-container-ordencompra tbody').append(rowItem)
        })

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
        console.log(detalleMaterial)
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
            console.log(formatData)
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
    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    $("#btn-cotizar-materiales").on('click', async function () {
        // vaceamos la informacion de detalle de cotizacion cada vez que abrimos el modal
        detalleCotizacion = []

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
        detalleCotizacion = dataSeleccionada
        // de la data seleccionada extraemos los productos para poder buscar sus proveedores de ordenes de compra correspondientes
        const productosCotizacion = dataSeleccionada.filter(detalle => detalle.odm_id === undefined).map(detalle => {
            return detalle.detalle[0].pro_id
        })

        // con los productos ya seleccionados, hacemos una consulta para saber cual fue el ultimo proveedor que se ordeno la compra de estos
        const formatData = {
            productos: productosCotizacion
        }
        const { data } = await client.post('/ordencompra-detalle/ultimo-proveedor', formatData)

        // reset de los valores de ingreso
        limpiarLista()
        $('#proveedoresInput').val('')
        $('#tipo-proveedor').val('')
        $('#tbl-cotizaciones-proveedores tbody').empty()
        $('#tbl-cotizaciones-materiales tbody').empty()

        // debemos agregar a la información de proveedores
        data.forEach(proveedor => {
            const { prv_id, prv_nrodocumento, prv_direccion, prv_nombre, tdo_codigo, prv_telefono, prv_whatsapp, prv_contacto, prv_correo } = proveedor
            const row = `
                <tr data-id-proveedor="${prv_id}">
                    <input class="direccion-proveedor" type="hidden" value="${prv_direccion || ''}"/>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input filter-check"/>
                    </td>
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
                            <button class="btn btn-sm btn-danger btn-cotizacion-exportar-pdf me-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                                    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                                    <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-primary btn-cotizacion-exportar-text me-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                                    <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-proveedor-eliminar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `
            $('#tbl-cotizaciones-proveedores tbody').append(row)
        })

        // debemos ingresar la informacion de detalle a cotizar
        $('#tbl-cotizaciones-materiales tbody').empty()
        let content = ''
        detalleCotizacion.forEach((detalle, index) => {
            if (detalle.odm_id === undefined) {
                content = `
                <tr data-index="${index}">
                    <td>${detalle.pro_codigo}</td>
                    <td>${detalle.pro_descripcion}</td>
                    <td>
                        <textarea class="form-control observacion-detalle" rows="1"></textarea>
                    </td>
                    <td class="text-center">${detalle.uni_codigo}</td>
                    <td class="text-center cantidad-requerida-detalle">${detalle.cantidad.toFixed(2)}</td>
                    <td class="text-center">
                        <input type="number" class="form-control cantidad-pedida-detalle" value="${detalle.cantidad.toFixed(2)}" min="${detalle.cantidad}"/>
                    </td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center">
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
                content = `
                <tr data-index="${index}">
                    <td>N/A</td>
                    <td>${detalle.odm_descripcion}</td>
                    <td>
                        <textarea class="form-control observacion-detalle" rows="1">${detalle.odm_observacion || ""}</textarea>
                    </td>
                    <td class="text-center">N/A</td>
                    <td class="text-center cantidad-requerida-detalle">${detalle.odm_cantidad}</td>
                    <td class="text-center">
                        <input type="number" class="form-control cantidad-pedida-detalle" value="${detalle.odm_cantidad}" min="${detalle.odm_cantidad}"/>
                    </td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-sm btn-secondary btn-historico-detalle-material me-1" disabled>
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
            }

            $('#tbl-cotizaciones-materiales tbody').append(content)
        })

        const dialogCotizacion = new bootstrap.Modal(document.getElementById('cotizacionesModal'))
        dialogCotizacion.show()
    })

    $('#tbl-cotizaciones-materiales tbody').on('click', '.btn-delete-detalle-material', (event) => {
        const $element = $(event.currentTarget).closest('tr')
        const index = $element.data('index')
        detalleCotizacion[index] = null
        console.log(detalleCotizacion)
        $element.remove()
    })

    $('#tbl-cotizaciones-materiales tbody').on('click', '.btn-historico-detalle-material', async function () {
        const producto = $(this).data('historico')
        initHistoricoByProducto(producto)
    })

    $('#proveedoresInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarProveedores(query)
        } else {
            limpiarLista()
        }
    }))

    // al momento de presionar enter
    $('#searchProveedorSUNAT').on('click', async function (event) {
        console.log("first")
        const query = $('#proveedoresSUNAT').val().trim()
        // si es la tecla de enter
        if (event.keyCode === 13) {
            event.preventDefault();
            await buscarProveedorBySUNAT(query)
        }
    });

    async function buscarProveedorBySUNAT(documento) {
        console.log(documento)
    }

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

    function seleccionarProveedor(proveedor) {
        const { prv_id, prv_nrodocumento, prv_direccion, prv_nombre, tdo_codigo, prv_telefono, prv_whatsapp, prv_contacto, prv_correo } = proveedor

        const $rows = $('#tbl-cotizaciones-proveedores tbody tr')

        const array_prov = $rows.map(function () {
            return $(this).data('id-proveedor')
        }).get()
        const findElement = array_prov.find(element => element == prv_id)

        if (findElement) {
            alert('El proveedor ya fue agregado')
            return
        }

        limpiarLista()
        $('#proveedoresInput').val('')

        const row = `
        <tr data-id-proveedor="${prv_id}">
            <input class="direccion-proveedor" type="hidden" value="${prv_direccion || ''}"/>
            <td class="text-center">
                <input type="checkbox" class="form-check-input filter-check"/>
            </td>
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
                    <button class="btn btn-sm btn-danger btn-cotizacion-exportar-pdf me-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                            <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                            <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-primary btn-cotizacion-exportar-text me-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-proveedor-eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
        `
        $('#tbl-cotizaciones-proveedores tbody').append(row)
    }

    // eliminar detalle de proveedor
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-proveedor-eliminar', (event) => {
        const row = $(event.currentTarget).closest('tr')
        row.remove()
    })

    // exportar en pdf la cotizacion
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-cotizacion-exportar-pdf', async (event) => {
        const row = $(event.currentTarget).closest('tr')
        const id_proveedor = row.data('id-proveedor')

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

        const detalleMateriales = []
        let generarCotizacion = false
        // debemos verificar si se desea generar una cotización o no
        if (confirm('¿Deseas generar una cotización?')) generarCotizacion = true

        const rows = $('#tbl-cotizaciones-materiales tbody tr')
        let cod_orden = 1;

        rows.each(function () {
            const index = $(this).data('index')
            const observacion = $(this).find('.observacion-detalle').val().trim()
            const cantidadPedida = $(this).find('.cantidad-pedida-detalle').val().trim()
            const cantidadRequerida = $(this).find('.cantidad-requerida-detalle').text().trim()

            if (esValorNumericoValidoYMayorQueCero(cantidadPedida) && esValorNumericoValidoYMayorQueCero(cantidadRequerida)) {
                if (parseFloat(cantidadRequerida) > parseFloat(cantidadPedida)) {
                    alert('La cantidad requerida es mayor a la cantidad pedida')
                    return
                }
            } else {
                alert('La cantidad requerida deben ser un valor numérico mayor a 0')
                return
            }

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
                        cod_cantidad: detalle.odm_cantidad
                    })
                })

                // si lo pedido es mayor a lo requerido
                if (parseFloat(cantidadPedida) > parseFloat(cantidadRequerida)) {
                    detalleMateriales.push({
                        cod_orden: cod_orden,
                        pro_id: detalleIndex.pro_id,
                        uni_codigo: detalleIndex.uni_codigo,
                        cod_descripcion: detalleIndex.pro_descripcion,
                        cod_observacion: observacion,
                        cod_cantidad: parseFloat(cantidadPedida) - parseFloat(cantidadRequerida),
                        cod_parastock: 1
                    })
                }
            } else {
                detalleMateriales.push({
                    cod_orden: cod_orden,
                    odm_id: detalleIndex.odm_id,
                    uni_codigo: '',
                    cod_descripcion: detalleIndex.odm_descripcion,
                    cod_observacion: observacion,
                    cod_cantidad: detalleIndex.odm_cantidad
                })

                // si lo pedido es mayor a lo requerido
                if (parseFloat(cantidadPedida) > parseFloat(cantidadRequerida)) {
                    detalleMateriales.push({
                        cod_orden: cod_orden,
                        uni_codigo: '',
                        cod_descripcion: detalleIndex.odm_descripcion,
                        cod_observacion: observacion,
                        cod_cantidad: parseFloat(cantidadPedida) - parseFloat(cantidadRequerida),
                        cod_parastock: 1
                    })
                }
            }
            cod_orden++
        })

        const formatData = {
            proveedor,
            detalle_materiales: detalleMateriales
        }

        console.log(formatData)

        // return
        if (generarCotizacion) {
            try {
                const response = await client.post('/cotizacionesByDespliegue', formatData, {
                    headers: {
                        'Accept': 'application/pdf'
                    },
                    responseType: 'blob'
                })

                const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
                const pdfUrl = URL.createObjectURL(pdfBlob);
                row.addClass('table-success')
                showModalPreview(pdfUrl)
            } catch (error) {
                if (error.response && error.response.data instanceof Blob) {
                    try {
                        const text = await error.response.data.text();
                        const json = JSON.parse(text);

                        console.error('Error del servidor:', json.error || 'Error desconocido');
                        alert(json.error || 'Ocurrió un error inesperado en el servidor');
                    } catch (parseError) {
                        console.error('Error al procesar el JSON del blob:', parseError);
                        alert('No se pudo procesar la respuesta del error');
                    }
                } else {
                    console.error('Error inesperado:', error);
                    alert('Ocurrió un error inesperado al momento de generar la cotización');
                }
            }
        } else {
            try {
                const response = await client.post('/ordeninternamateriales/export-cotizacion', formatData, {
                    headers: {
                        'Accept': 'application/pdf'
                    },
                    responseType: 'blob'
                })

                const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
                const pdfUrl = URL.createObjectURL(pdfBlob);
                showModalPreview(pdfUrl)
            } catch (error) {
                console.log(error)
                alert("Hubo un error al generar el pdf de la cotización")
            }
        }
    })

    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }

    // Funcion para exportar en txt
    $('#tbl-cotizaciones-proveedores tbody').on('click', '.btn-cotizacion-exportar-text', async (event) => {
        const row = $(event.currentTarget).closest('tr')
        const id_proveedor = row.data('id-proveedor')

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

        const detalleMateriales = []

        const rows = $('#tbl-cotizaciones-materiales tbody tr')
        let cod_orden = 1;
        rows.each(function () {
            const index = $(this).data('index')
            const observacion = $(this).find('.observacion-detalle').val().trim()

            const detalleIndex = detalleCotizacion[index]
            if (detalleIndex.odm_id === undefined) {
                detalleIndex.detalle.forEach(detalle => {
                    detalleMateriales.push({
                        cod_orden: cod_orden,
                        uni_codigo: detalle.producto.uni_codigo,
                        cod_descripcion: detalle.producto.pro_descripcion,
                        cod_observacion: observacion,
                        cod_cantidad: detalle.odm_cantidad
                    })
                })
            } else {
                detalleMateriales.push({
                    cod_orden: cod_orden,
                    uni_codigo: '',
                    cod_descripcion: detalleIndex.odm_descripcion,
                    cod_observacion: observacion,
                    cod_cantidad: detalleIndex.odm_cantidad
                })
            }
            cod_orden++
        })

        try {
            const formatData = {
                proveedor,
                detalle_materiales: detalleMateriales
            }
            console.log(formatData)
            const response = await client.post('/ordeninternamateriales/export-cotizacion-text', formatData, {
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

    function showModalPreviewText(pdfUrl) {
        document.getElementById('txt-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewTXTModal"));
        modal.show();
    }
})