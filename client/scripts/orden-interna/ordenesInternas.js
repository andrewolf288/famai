$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/ordenesinternas'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')

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
        data.forEach((ordenInterna, index) => {
            content += `
                <tr>
                    <td>${ordenInterna.odt_numero}</td>
                    <td>${ordenInterna.cliente?.cli_nombre ?? 'No aplica'}</td>
                    <td>${ordenInterna.oic_numero}</td>
                    <td>${ordenInterna.oic_fecha !== null ? parseDate(ordenInterna.oic_fecha) : 'No aplica'}</td>
                    <td>${ordenInterna.area?.are_descripcion ?? 'No aplica'}</td>
                    <td class="text-center">${ordenInterna.total_materiales}</td>
                    <td>${ordenInterna.oic_estado == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-warning btn-orden-interna-editar" data-orden-interna="${ordenInterna.oic_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-danger btn-orden-interna-pdf" data-orden-interna="${ordenInterna.oic_numero}" data-orden-trabajo="${ordenInterna.odt_numero}"">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                                    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                                    <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${ordenInterna.oic_usucreacion === null ? 'No aplica' : ordenInterna.oic_usucreacion}</td>
                    <td>${ordenInterna.oic_feccreacion === null ? 'No aplica' : parseDate(ordenInterna.oic_feccreacion)}</td>
                    <td>${ordenInterna.oic_usumodificacion === null ? 'No aplica' : ordenInterna.oic_usumodificacion}</td>
                    <td>${ordenInterna.oic_fecmodificacion === null ? 'No aplica' : parseDate(ordenInterna.oic_fecmodificacion)}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
    }

    filterButton.on('click', () => {
        // seleccionamos el valor del selector
        const filterField = filterSelector.val().trim()
        // seleccionamos el valor del criterio de busqueda
        const filterValue = filterInput.val().trim()

        let filteredURL = apiURL
        // si se aplica un filtro y se ingresa un criterio de busqueda
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        }

        initPagination(filteredURL, initDataTable, dataTableOptions)
    })

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)

    // ----------- FUNCIONES PARA GESTIONAR ACCIONES DE BOTONES -------------
    $('#data-container').on('click', '.btn-orden-interna-editar', function () {
        const id = $(this).data('orden-interna')
        // localStorage.setItem('ordenInternaId', id)
        window.location.href = `/orden-interna/editar/${id}`
    })

    $('#data-container').on('click', '.btn-orden-interna-pdf', async (event) => {
        const oi_numero = $(event.currentTarget).data('orden-interna')
        const ot_numero = $(event.currentTarget).data('orden-trabajo')
        try {
            const response = await client.get(`/generarReporteOrdenTrabajo`, {
                params: {
                    oi_numero: oi_numero,
                    ot_numero: ot_numero
                },
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })
    
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `reporte_orden_trabajo_${oi_numero}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            alert('Error al generar el reporte')
        }
    })
})