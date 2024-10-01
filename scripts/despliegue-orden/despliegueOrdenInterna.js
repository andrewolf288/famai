$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')

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
        info: false
    }

    // Inicializacion de data table
    function initDataTable(data) {
        let content = ''
        console.log(data)
        data.forEach((material, index) => {
            // obtenemos los datos
            const { producto, orden_interna_parte } = material
            const { orden_interna } = orden_interna_parte
            const { oic_numero, odt_numero } = orden_interna

            // debemos obtener la condicion de reserva segun los stocks requeridos y disponibles
            let condicionalReserva = true
            if (producto === null) {
                condicionalReserva = false
            } else {
                if (producto.stock === null) {
                    condicionalReserva = false
                } else {
                    if (parseFloat(producto.stock.alp_stock) < parseFloat(material.odm_cantidad)) {
                        console.log(producto.stock.alp_stock, material.odm_cantidad)
                        condicionalReserva = false
                    }
                }
            }

            content += `
                <tr>
                    <td>${odt_numero}</td>
                    <td>${oic_numero}</td>
                    <td>${parseDate(material.odm_feccreacion)}</td>
                    <td>${material.odm_tipo == 1 ? 'P' : 'A'}</td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td>${material.odm_descripcion}</td>
                    <td>${material.odm_observacion || 'N/A'}</td>
                    <td>${material.odm_cantidad}</td>
                    <td>${producto?.unidad?.uni_codigo || 'N/A'}</td>
                    <td>${producto?.stock?.alp_stock || "0.00"}</td>
                    <td>0.00</td>
                    <td>0.00</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm ${condicionalReserva ? 'btn-primary' : 'btn-secondary'} me-2" ${condicionalReserva ? '' : 'disabled'}>
                                Reservar
                            </button>
                            <button class="btn btn-sm btn-success">
                                Cotizar
                            </button>
                        </div>
                    </td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
    }

    filterFechas.on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}?alm_id=1&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        initPagination(filteredURL, initDataTable, dataTableOptions)
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

        initPagination(filteredURL, initDataTable, dataTableOptions)
    })

    // inicializamos la paginacion con datatable
    initPagination(`${apiURL}?alm_id=1&fecha_desde=${moment().startOf('month').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`, initDataTable, dataTableOptions)

    // exportamos a excel
    $('#btn-export-data').click(async function () {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `/ordeninternamateriales/export-excel?alm_id=1&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`

        try {
            const response = await client.get(filteredURL, {
                responseType: 'blob',
            })
            console.log("Response:", response); // Agrega esto para depuración
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
})