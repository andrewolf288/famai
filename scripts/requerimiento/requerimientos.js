$(document).ready(() => {

    // OBTENEMOS LA INFORMACION DEL USUARIO
    const { rol } = decodeJWT(localStorage.getItem('authToken'))
    // URL ENDPOINT
    const apiURL = '/requerimientos'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", new Date());

    $("#fechaHasta").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", new Date());

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

    }

    filterFechas.on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
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
        // filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`

        // debemos adjuntar el filtro de busqueda por criterio
        if (filterField.length !== 0 && filterValue.length !== 0) {
            // filteredURL += `&${filterField}=${encodeURIComponent(filterValue)}`
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
            console.log(filteredURL)
        }
        initPagination(filteredURL, initDataTable, dataTableOptions)
    })

    // inicializamos la paginacion con datatable
    initPagination(`${apiURL}?fecha_desde=${moment().format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`, initDataTable, dataTableOptions)

    // ----------- FUNCIONES PARA GESTIONAR ACCIONES DE BOTONES -------------
    $('#data-container').on('click', '.btn-requerimiento-editar', function () {
        const id = $(this).data('requerimiento')
        window.location.href = `requerimiento/editar/${id}`
    })

    $('#data-container').on('click', '.btn-requerimiento-pdf', async function () {
        const id = $(this).data('requerimiento')
        // try {
        //     const response = await client.get(`/generarReporteOrdenTrabajo?oic_id=${id}`, {
        //         headers: {
        //             'Accept': 'application/pdf'
        //         },
        //         responseType: 'blob'
        //     })

        //     const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        //     const pdfUrl = URL.createObjectURL(pdfBlob);
        //     showModalPreview(pdfUrl)
        // } catch (error) {
        //     alert('Error al generar el reporte')
        // }
    })

    $('#data-container').on('click', '.btn-requerimiento-eliminar', async function () {
        const id = $(this).data('requerimiento')
        if (confirm('¿Desea eliminar este requerimiento?')) {
            // try {
            //     await client.delete(`/requerimiento/${id}`)
            //     initPagination(`${apiURL}?fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`, initDataTable, dataTableOptions)
            // } catch (error) {
            //     const { response } = error
            //     if (response.status === 400) {
            //         alert(response.data.error)
            //     } else {
            //         alert('Error al eliminar el requerimiento')
            //     }
            // }
        }
    })

    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }

})