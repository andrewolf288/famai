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
            const { occ_id, occ_numero, proveedor, occ_fecha, occ_fechaentrega, moneda, occ_total, occ_subtotal, occ_impuesto, occ_estado, occ_feccreacion, occ_usucreacion, occ_fecmodificacion, occ_usumodificacion } = ordecompra

            const rowItem = document.createElement('tr')
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
            <td>
                <button class="btn btn-primary btn-detalle-orden-compra">
                    Ver detalle
                </button>
            </td>
            <td>
                <button class="btn btn-primary btn-cotización-asociada">
                    Ver cotización
                </button>
            </td>
            <td>
                <button class="btn btn-primary btn-ordenes-internas-asociada">
                    Ver OIs
                </button>
            </td>
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
    $("#data-container-body").on('click', '.btn-detalle-orden-compra', function () {
        const loadModalDetalle = new bootstrap.Modal(document.getElementById('detalleOrdenCompraModal'))
        loadModalDetalle.show()
    })

    $("#data-container-body").on('click', '.btn-cotización-asociada', function () {
        const loadModalCotizacion = new bootstrap.Modal(document.getElementById('cotizacionAsociadaModal'))
        loadModalCotizacion.show()
    })

    $("#data-container-body").on('click', '.btn-ordenes-internas-asociada', function () {
        const loadModalOIs = new bootstrap.Modal(document.getElementById('otsAsociadasModal'))
        loadModalOIs.show()
    })

    $("#btn-aprobar-ordenes-compra").on('click', function() {
        const loadModalAprobacion = new bootstrap.Modal(document.getElementById('aprobacionesModal'))
        loadModalAprobacion.show()
    })

})