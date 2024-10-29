$(document).ready(() => {
    let abortController
    // URL ENDPOINT
    const apiURL = '/ordenescompra'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')

    // manejador de datos seleccionado
    const selectedRows = new Map()

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
        info: false,
        columnDefs: [
            {
                targets: [0, 1],
                orderable: false,
            }
        ]
    }

    // Inicializacion de data table
    function initDataTable(data) {
        let content = ''
        // vaciamos la lista
        $('#data-container-body').empty()
        // recorremos la lista
        data.forEach((ordecompra, index) => {
            // obtenemos los datos
            const { occ_id, occ_numero, proveedor, occ_fecha, occ_total, occ_subtotal, occ_impuesto, occ_estado, occ_feccreacion, occ_usucreacion, occ_fecmodificacion, occ_usumodificacion } = ordecompra

            const rowItem = document.createElement('tr')
            rowItem.classList.add('row-orden-compra')
            rowItem.setAttribute('data-id', occ_id)
            rowItem.innerHTML = `
            <td></td>
            <td class="text-center">
                <input type="checkbox" style="width: 25px; height: 25px; border: 2px solid black;" class="form-check-input row-select" ${selectedRows.has(occ_id) ? 'checked' : ''}/>
            </td>
            <td>${parseDateSimple(occ_fecha)}</td>
            <td>${occ_numero}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${occ_subtotal}</td>
            <td>${occ_impuesto}</td>
            <td>${occ_total}</td>
            <td class="text-center">
                <span class="badge bg-primary">${occ_estado}</span>
            </td>
            <td>${occ_feccreacion === null ? 'No aplica' : parseDate(occ_feccreacion)}</td>
            <td>${occ_usucreacion === null ? 'No aplica' : occ_usucreacion}</td>
            <td>${occ_fecmodificacion === null ? 'No aplica' : parseDate(occ_fecmodificacion)}</td>
            <td>${occ_usumodificacion === null ? 'No aplica' : occ_usumodificacion}</td>
            `
            // Añadimos el evento `change` al checkbox
            const checkbox = rowItem.querySelector('.row-select');
            checkbox.addEventListener('change', function () {
                const isChecked = this.checked; // Verificamos si está marcado o no
                seleccionarRowDetalle(ordecompra, isChecked); // Pasamos `material` y si está seleccionado
            });

            rowItem.addEventListener('click', function () {
                traerInformacionDetalleOrdenCompra(occ_id)
            })

            $('#data-container-body').append(rowItem)
        })
    }

    function seleccionarRowDetalle(ordecompra, isChecked) {
        if (isChecked) {
            selectedRows.set(ordecompra.occ_id, ordecompra)
        } else {
            selectedRows.delete(ordecompra.occ_id)
        }
        console.log(selectedRows)
    }

    filterFechas.on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}?alm_id=1&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        initPagination(filteredURL, initDataTable, dataTableOptions, 50)
    })

    filterButton.on('click', () => {
        // seleccionamos el valor del selector
        const filterField = filterSelector.val().trim()
        // seleccionamos el valor del criterio de busqueda
        const filterValue = filterInput.val().trim()

        let filteredURL = apiURL

        // primero aplicamos el filtro de fechas
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`

        // debemos adjuntar el filtro de busqueda por criterio
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `&${filterField}=${encodeURIComponent(filterValue)}`
        }

        initPagination(filteredURL, initDataTable, dataTableOptions, 50)
    })

    // inicializamos la paginacion con datatable
    initPagination(`${apiURL}?fecha_desde=${moment().startOf('month').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`, initDataTable, dataTableOptions, 50)

    // funciones de control
    $("#btn-aprobar-ordenes-compra").on('click', function() {
        const loadModalAprobacion = new bootstrap.Modal(document.getElementById('aprobacionesModal'))
        loadModalAprobacion.show()
    })

    const traerInformacionDetalleOrdenCompra = async (id) => {
        const { data } = await client.get(`/ordencompra-detalle/${id}`)
        $("#data-container-detalle tbody").empty()

        data.forEach(detalle => {
            const {detalle_material, ocd_id, odm_id, ocd_orden, ocd_descripcion, ocd_cantidad, ocd_preciounitario, ocd_total, ocd_usucreacion, ocd_usumodificacion, ocd_feccreacion, ocd_fecmodificacion} = detalle

            const rowItem = document.createElement('tr')
            rowItem.className = 'row-orden-compra-detalle'
            rowItem.setAttribute('data-id', ocd_id)

            rowItem.innerHTML = `
            <td>${detalle_material.orden_interna_parte.orden_interna.oic_numero}</td>
            <td>${ocd_orden}</td>
            <td>${ocd_descripcion}</td>
            <td>${ocd_cantidad}</td>
            <td>${ocd_preciounitario}</td>
            <td>${ocd_total}</td>
            <td>${ocd_feccreacion === null ? 'No aplica' : parseDate(ocd_feccreacion)}</td>
            <td>${ocd_usucreacion === null ? 'No aplica' : ocd_usucreacion}</td>
            <td>${ocd_fecmodificacion === null ? 'No aplica' : parseDate(ocd_fecmodificacion)}</td>
            <td>${ocd_usumodificacion === null ? 'No aplica' : ocd_usumodificacion}</td>
            `
            rowItem.addEventListener('click', function () {
                traerInformacionCotizacionAsociada(odm_id)
            })

            $('#data-container-detalle tbody').append(rowItem)
        })
    }

    const traerInformacionCotizacionAsociada = async (id) => {
        console.log(id)
        const {data} = await client.get(`/ordencompra-cotizacion/${id}`)
        console.log(data)
        $("#data-container-cotizacion tbody").empty()

        data.forEach(detalle => {
            const {cotizacion} = detalle
            const {proveedor} = cotizacion
            const rowItem = document.createElement('tr')

            rowItem.innerHTML = `
            <td>${parseDate(cotizacion.coc_fechacotizacion)}</td>
            <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${cotizacion.coc_total}</td>
            <td>
                <span class="badge bg-primary">
                    ${cotizacion.coc_estado}
                </span>
            </td>
            <td>${cotizacion.coc_feccreacion === null ? 'No aplica' : parseDate(cotizacion.coc_feccreacion)}</td>
            <td>${cotizacion.coc_usucreacion === null ? 'No aplica' : cotizacion.coc_usucreacion}</td>
            <td>${cotizacion.coc_fecmodificacion === null ? 'No aplica' : parseDate(cotizacion.coc_fecmodificacion)}</td>
            <td>${cotizacion.coc_usumodificacion === null ? 'No aplica' : cotizacion.coc_usumodificacion}</td>
            `
            $('#data-container-cotizacion tbody').append(rowItem)
        })
    }

})