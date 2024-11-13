$(document).ready(() => {
    // abort controller
    let abortController

    // variables para el manejo de datatable
    let dataTable;
    const dataContainer = $('#data-container')

    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna'

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
        paging: false,
        searching: false,
        info: true,
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
            style: 'multi',
            selector: 'td.form-check-input'
        },
        order: [[2, 'asc']],
    }

    // gestion de multiselect
    $('select[multiple]').multiselect()

    // Inicializacion de data table
    async function initDataTable(URL = apiURL) {
        // verificamos que no se haya inicializado el datatable
        if ($.fn.DataTable.isDataTable(dataContainer)) {
            dataContainer.DataTable().destroy();
        }

        // vaciamos la lista
        $('#data-container-body').empty()

        try {
            const { data } = await client.get(URL)
            data.forEach((material, index) => {
                // obtenemos los datos
                const { producto, orden_interna_parte } = material
                const { orden_interna } = orden_interna_parte
                const { odt_numero, oic_tipo } = orden_interna

                const rowItem = document.createElement('tr')
                rowItem.innerHTML = `
                    <td>
                        <input type="hidden" value="${material.odm_id}"/>
                    </td>
                    <td></td>
                    <td class="text-center">
                        ${oic_tipo}
                    </td>
                    <td>${odt_numero || 'N/A'}</td>
                    <td>${parseDate(material.odm_feccreacion)}</td>
                    <td>${material.odm_estado}</td>
                    <td class="text-center">
                        ${material.odm_tipo == 1 ? 'R' : 'A'}
                    </td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td>${material.odm_descripcion}</td>
                    <td>${material.odm_observacion || 'N/A'}</td>
                    <td class="text-center">${material.odm_cantidad}</td>
                    <td class="text-center">${producto?.unidad?.uni_codigo || 'N/A'}</td>
                    <td class="text-center">${producto?.stock?.alp_stock || "0.00"}</td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-historico" data-historico="${material.odm_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-primary btn-responsable" data-responsable="${material.tra_responsable}" data-detalle="${material.odm_id}">${material.tra_responsable ? material.responsable.tra_nombre : 'Sin responsable'}</button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-cotizado" data-detalle="${material.odm_id}">Cotizaciones</button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-ordenado" data-detalle="${material.odm_id}">Ordenes de compra</button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-reservado">0.00</button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-atendido">0.00</button>
                    </td>
                    <td>
                        <button class="btn btn-primary btn-presupuesto" data-notapresupuesto="${material.odm_notapresupuesto}" data-adjuntopresupuesto="${material.odm_adjuntopresupuesto}" data-detalle="${material.odm_id}">Presupuesto</button>
                    </td>
                `
                $('#data-container-body').append(rowItem)
            })

            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    // ------------ INCIIALIZAMOS EL DATATABLE ------------
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
        const id = $(this).data('detalle')
        const { data } = await client.get(`/ordeninternamateriales/cotizacion/${id}`)
        console.log(data)
        $("#data-container-cotizacion tbody").empty()

        data.forEach(detalle => {
            const { cotizacion } = detalle
            const { proveedor } = cotizacion
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${cotizacion.coc_estado === 'SOL' ? 'table-danger' : 'table-success'}`)

            rowItem.innerHTML = `
            <td>${parseDateSimple(cotizacion.coc_fechacotizacion)}</td>
            <td>${cotizacion.coc_numero}</td>
            <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
            <td>
                <span class="badge bg-primary">
                    ${cotizacion.coc_estado}
                </span>
            </td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${detalle.cod_descripcion}</td>
            <td class="text-center">${detalle.cod_cantidad || 'N/A'}</td>
            <td class="text-center">${detalle.cod_preciounitario || 'N/A'}</td>
            <td class="text-center">${detalle.cod_total || 'N/A'}</td>
            <td class="text-center">${detalle.cod_tiempoentrega ? `${detalle.cod_tiempoentrega} día(s)` : 'N/A'}</td>
            `
            $('#data-container-cotizacion tbody').append(rowItem)
        })

        const loadModalCotizado = new bootstrap.Modal(document.getElementById('cotizadoModal'))
        loadModalCotizado.show()
    })

    // ------------- DETALLE DE ORDEN DE COMPRAS --------------

    $("#data-container-body").on('click', '.btn-ordenado', async function () {
        const id = $(this).data('detalle')
        console.log(id)
        const { data } = await client.get(`/ordeninternamateriales/ordencompra/${id}`)

        $("#data-container-ordencompra tbody").empty()

        data.forEach(detalle => {
            const { orden_compra } = detalle
            const { proveedor } = orden_compra
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
            <td class="text-center">${detalle.ocd_preciounitario || 'N/A'}</td>
            <td class="text-center">${detalle.ocd_total || 'N/A'}</td>
            `
            $('#data-container-ordencompra tbody').append(rowItem)
        })

        const loadModalOrdenado = new bootstrap.Modal(document.getElementById('ordenadoModal'))
        loadModalOrdenado.show()
    })

    // ------------------ GESTION DE PRESUPUESTO -------------------
    $("#data-container-body").on('click', '.btn-presupuesto', async function () {
        const idDetalleMaterial = $(this).data('detalle')
        const notapresupuesto = $(this).data('notapresupuesto')
        const adjuntopresupuesto = $(this).data('adjuntopresupuesto')

        // establecemos los valores
        $("#idDetalleMaterialByPresupuesto").val(idDetalleMaterial)
        // restablecemos el adjuntos
        $("#idPresupuestoAdjunto").val('')

        $("#idPresupuestoNota").val(notapresupuesto)

        if (adjuntopresupuesto) {
            $("#linkPresupuestoAdjunto")
                .attr('href', `${config.BACK_STORAGE_URL}${adjuntopresupuesto}`)
                .text('Ver archivo adjunto')
                .off('click')
                .on('click', function (e) {
                })
        } else {
            $("#linkPresupuestoAdjunto")
                .attr('href', '#')
                .text('No hay archivo adjunto')
                .off('click')
                .on('click', function (e) {
                    e.preventDefault();
                })
        }

        // abrimos el modal
        const loadModalPresupuesto = new bootstrap.Modal(document.getElementById('presupuestoModal'))
        loadModalPresupuesto.show()
    })

    $("#btn-cambiar-presupuesto-detalle").on('click', async function () {
        // obtenemos el valor del id del detalle de material
        const idDetalleMaterial = $("#idDetalleMaterialByPresupuesto").val()
        const notapresupuesto = $('#idPresupuestoNota').val()
        const archivoAdjunto = document.getElementById('idPresupuestoAdjunto').files[0]

        if (!notapresupuesto || notapresupuesto.length == 0) {
            alert('Debe ingresar una nota de presupuesto');
            return;
        }

        const formatData = {
            odm_notapresupuesto: notapresupuesto
        }

        // obtenemos el file adjunto
        const formData = new FormData();
        formData.append('notapresupuesto', JSON.stringify(formatData));
        if (archivoAdjunto) {
            formData.append('adjuntopresupuesto', archivoAdjunto);
        }

        // hacemos un form data
        try {
            await client.post(`/ordeninternamateriales/presupuesto/${idDetalleMaterial}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            // cerramos el modal
            const loadModalPresupuesto = bootstrap.Modal.getInstance(document.getElementById('presupuestoModal'))
            loadModalPresupuesto.hide()
            // initPagination(`${apiURL}?alm_id=1&fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`, initDataTable, dataTableOptions, 50)
        } catch (error) {
            console.log(error)
            alert('Error al cambiar presupuesto')
        }
    })

    // ------------------ GESTION DE RESPONSABLE -------------------
    $("#data-container-body").on('click', '.btn-responsable', async function () {
        // obtenemos el valor del id del detalle de material
        const idDetalleMaterial = $(this).data('detalle')
        const responsable = $(this).data('responsable')
        // establecemos los valores
        $("#idDetalleMaterialByResponsable").val(idDetalleMaterial)
        // hacemos llamado a la lista de trabajadores
        const { data } = await client.get('/trabajadoresSimple')

        if (responsable) {
            const trabajadorResponsable = data.find(trabajador => trabajador.tra_id == responsable)
            $("#responsableDetalleMaterial").text(trabajadorResponsable.tra_nombre)
        } else {
            $("#responsableDetalleMaterial").text("Sin responsable")
        }

        const $selectorResponsable = $('#selectorResponsableDetalleMaterial')
        $selectorResponsable.empty()

        // Ordenar la data alfabéticamente según el nombre (índice [1])
        data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

        $selectorResponsable.append($('<option>').val('').text('Sin responsable'))
        data.forEach(trabajador => {
            const option = $(`<option ${trabajador.tra_id == responsable ? 'selected' : ''}>`).val(trabajador.tra_id).text(trabajador.tra_nombre)
            $selectorResponsable.append(option.clone())
        })
        // abrimos el modal
        const loadModalResponsable = new bootstrap.Modal(document.getElementById('responsableModal'))
        loadModalResponsable.show()
    })

    $("#btn-cambiar-responsable-detalle").on('click', async function () {
        // obtenemos el valor del id del detalle de material
        const idDetalleMaterial = $("#idDetalleMaterialByResponsable").val()
        const responsable = $.trim($("#selectorResponsableDetalleMaterial").val())

        if (responsable.length == 0) {
            alert('Debe seleccionar un responsable')
            return
        }

        const formatData = {
            tra_responsable: responsable
        }
        try {
            await client.put(`/ordeninternamateriales/responsable/${idDetalleMaterial}`, formatData)
            const loadModalResponsable = bootstrap.Modal.getInstance(document.getElementById('responsableModal'))
            loadModalResponsable.hide()
            // initPagination(`${apiURL}?alm_id=1&fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`, initDataTable, dataTableOptions, 50)
        } catch (error) {
            console.log(error)
            alert('Error al cambiar responsable')
        }
    })

    // -------------- GESTION DE EXPORTACIONES -----------------
    // exportacion de excel de datos
    $('#btn-export-data').click(async function () {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const filterField = filterSelector.val().trim()
        const filterValue = filterInput.val().trim()

        let filteredURL = `/ordeninternamateriales/export-excel`

        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        } else {
            filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        }

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

    // exportamos excel presupuesto
    $('#btn-export-data-presupuesto').click(async function () {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const filterField = filterSelector.val().trim()
        const filterValue = filterInput.val().trim()

        let filteredURL = `/ordeninternamateriales/export-excel-presupuesto`

        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        } else {
            filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        }

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

    // exportamos excel almacen
    $('#btn-export-data-almacen').click(async function () {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const filterField = filterSelector.val().trim()
        const filterValue = filterInput.val().trim()

        let filteredURL = `/ordeninternamateriales/export-excel-almacen`

        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        } else {
            filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        }

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

    // --------------- MANEJO DE COTIZACIONES --------------
    $('#btn-cotizar-materiales').on('click', async (event) => {
        const filasSeleccionadas = dataTable.rows({ selected: true }).nodes();
        const valoresSeleccionados = [];
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).find('input[type="hidden"]').val(); // Extrae el valor del checkbox
            valoresSeleccionados.push(valor);
        });

        if(valoresSeleccionados.length === 0){
            alert('Debe seleccionar al menos un material')
            return
        }

        const formatData = {
            materiales: valoresSeleccionados
        }

        try {
            const {data} = await client.post('/detalleMaterialesOrdenInterna/materiales-cotizar',formatData)
            let content = ''
            // reset de los valores de ingreso
            limpiarLista()
            $('#proveedoresInput').val('')
            $('#tipo-proveedor').val('')
            $('#tbl-cotizaciones-proveedores tbody').empty()
            $('#tbl-cotizaciones-materiales tbody').empty()
            // debemos formar los materiales seleccionados
            data.forEach((material, key) => {
                content = `
                    <tr data-id="${material.odm_id}">
                        <td>${material.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                        <td>${material.producto?.pro_codigo || 'N/A'}</td>
                        <td class="unidad-detalle">${material.producto?.unidad?.uni_codigo || 'N/A'}</td>
                        <td>
                            <input type="text" class="form-control descripcion-detalle" value="${escapeHTML(material.odm_descripcion)}"/>
                        </td>
                        <td>
                            <input type="text" class="form-control observacion-detalle" value="${escapeHTML(material.odm_observacion)}"/>
                        </td>
                        <td>
                            <input type="number" class="form-control cantidad-detalle" value="${material.odm_cantidad}"/>
                        </td>
                        <td>
                            <div class="d-flex justify-content-around">
                                <button class="btn btn-sm btn-primary btn-historico-detalle-material me-1">
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
                $('#tbl-cotizaciones-materiales tbody').append(content)
            })
            // abrimos el modal
            const dialogCotizacion = new bootstrap.Modal(document.getElementById('cotizacionesModal'))
            dialogCotizacion.show()
        } catch(error) {
            console.log(error)
            alert('Error al obtener información de cotización')
        }
    })

    $('#tbl-cotizaciones-materiales tbody').on('click', '.btn-delete-detalle-material', (event) => {
        const $element = $(event.currentTarget).closest('tr')
        $element.remove()
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

        if (confirm('¿Deseas generar una cotización?')) {
            const rows = $('#tbl-cotizaciones-materiales tbody tr')
            rows.each(function () {
                const data = {
                    odm_id: $(this).data('id'),
                    uni_codigo: $(this).find('.unidad-detalle').text(),
                    cod_descripcion: $(this).find('.descripcion-detalle').val(),
                    cod_observacion: $(this).find('.observacion-detalle').val(),
                    cod_cantidad: $(this).find('.cantidad-detalle').val(),
                }
                detalleMateriales.push(data)
            })

            const formatData = {
                proveedor,
                detalle_materiales: detalleMateriales
            }

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
                console.log(error)
                alert('Ocurrió un error al momento de generar la cotización')
            }
        } else {
            const rows = $('#tbl-cotizaciones-materiales tbody tr')
            rows.each(function () {
                const data = {
                    uni_codigo: $(this).find('.unidad-detalle').text(),
                    cod_descripcion: $(this).find('.descripcion-detalle').val(),
                    cod_observacion: $(this).find('.observacion-detalle').val(),
                    cod_cantidad: $(this).find('.cantidad-detalle').val(),
                }
                detalleMateriales.push(data)
            })

            const formatData = {
                proveedor,
                detalle_materiales: detalleMateriales
            }

            try {
                console.log(formatData)
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
        rows.each(function () {
            const data = {
                uni_codigo: $(this).find('td').eq(1).text(),
                cod_descripcion: $(this).find('.descripcion-detalle').val(),
                cod_observacion: $(this).find('.observacion-detalle').val(),
                cod_cantidad: $(this).find('.cantidad-detalle').val(),
            }
            detalleMateriales.push(data)
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
