$(document).ready(() => {

    // OBTENEMOS LA INFORMACION DEL USUARIO
    const { rol } = decodeJWT(localStorage.getItem('authToken'))
    // URL ENDPOINT
    const apiURL = '/ordenesinternas'

    // referencias de filtros
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const yearSelector = $('#year-selector')
    const monthSelector = $('#month-selector')
    const includePeriod = $('#include-period')

    // -------- INICIALIZACION MULTISELECTS --------
    for (let y = 2020; y <= new Date().getFullYear() + 1; y++) {
        const selected = y === new Date().getFullYear() ? 'selected' : ''
        yearSelector.append(`<option value="${y}" ${selected}>${y}</option>`)
    }
    // Seleccionar el mes actual en meses
    const currentMonth = new Date().getMonth() + 1 // 1-12
    monthSelector.find(`option[value="${currentMonth}"]`).prop('selected', true)

    // Gestion de multiselect
    yearSelector.multiselect({
        texts: { placeholder: 'Año' },
        selectAll: "Seleccionar todos",
        unselectAll: "Deseleccionar todos",
    })
    monthSelector.multiselect({
        texts: { placeholder: 'Mes' },
        selectAll: "Seleccionar todos",
        unselectAll: "Deseleccionar todos",
    })

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: false,
        columnDefs: [
            {
                className: 'all',
                targets: [0,1,6,7]
            },
        ],
        columnDefs: [
            {
                className: 'none',
                targets: [2,3,4,5,8,9,10,11]
            },
            {
                targets: 8,
                render: DataTable.render.datetime('DD/MM/YYYY HH:mm:ss', 'DD/MM/YYYY HH:mm:ss')
            }
        ],
        order: [[8, 'desc']],
    }

    // Inicializacion de data table
    function initDataTable(data) {
        let content = ''
        data.forEach((ordenInterna, index) => {
            const habilitadoEditar = ordenInterna.oic_estado === "INGRESO" || ordenInterna.oic_estado === "REABIERTO" ? true : false
            content += `
                <tr>
                    <td>${ordenInterna?.odt_numero ?? 'N/A'}</td>
                    <td>${ordenInterna.cliente?.cli_nombre ?? 'N/A'}</td>
                    <td>${ordenInterna.oic_fecha !== null ? parseDateSimple(ordenInterna.oic_fecha) : 'N/A'}</td>
                    <td>${ordenInterna.oic_fechaaprobacion !== null ? parseDateSimple(ordenInterna.oic_fechaaprobacion) : 'N/A'}</td>
                    <td>${ordenInterna.area?.are_descripcion ?? 'N/A'}</td>
                    <td class="text-center">${ordenInterna.total_materiales}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-orden-interna-change-estado" data-orden-interna="${ordenInterna.oic_id}" ${rol > 3 ? 'disabled' : ''}>${ordenInterna.oic_estado}</button>
                    </td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-primary btn-orden-interna-visualizar me-2" data-orden-interna="${ordenInterna.oic_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm ${habilitadoEditar ? 'btn-warning' : 'btn-secondary'} btn-orden-interna-editar me-2" data-orden-interna="${ordenInterna.oic_id}" ${habilitadoEditar ? '' : 'disabled'}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.5-.5V9h-.5a.5.5 0 0 1-.5-.5V8h-.5a.5.5 0 0 1-.5-.5V7h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-danger btn-orden-interna-pdf me-2" data-orden-interna="${ordenInterna.oic_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                                    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                                    <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-orden-interna-eliminar" data-orden-interna="${ordenInterna.oic_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${ordenInterna.oic_feccreacion === null ? 'N/A' : parseDate(ordenInterna.oic_feccreacion)}</td>
                    <td>${ordenInterna.oic_usucreacion === null ? 'N/A' : ordenInterna.oic_usucreacion}</td>
                    <td>${ordenInterna.oic_fecmodificacion === null ? 'N/A' : parseDate(ordenInterna.oic_fecmodificacion)}</td>
                    <td>${ordenInterna.oic_usumodificacion === null ? 'N/A' : ordenInterna.oic_usumodificacion}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
    }

    function buildFilteredURL() {
        const params = new URLSearchParams()
        const filterValue = filterInput.val().trim()
        if (filterValue.length !== 0) params.append('odt_numero', filterValue)
        if (includePeriod.is(':checked')) {
            const years = yearSelector.val() || []
            const months = monthSelector.val() || []
            years.forEach(y => params.append('years[]', y))
            months.forEach(m => params.append('months[]', m))
        }
        const qs = params.toString()
        return qs.length ? `${apiURL}?${qs}` : apiURL
    }

    filterButton.on('click', () => {
        const filteredURL = buildFilteredURL()
        initPagination(filteredURL, initDataTable, dataTableOptions, 100)
    })

    // inicializamos la paginacion con los filtros por defecto (año y mes actual)
    initPagination(buildFilteredURL(), initDataTable, dataTableOptions, 100)

    // ----------- FUNCIONES PARA GESTIONAR ACCIONES DE BOTONES -------------
    $('#data-container').on('click', '.btn-orden-interna-editar', function () {
        const id = $(this).data('orden-interna')
        window.location.href = `orden-interna/editar/${id}`
    })

    $('#data-container').on('click', '.btn-orden-interna-visualizar', function () {
        const id = $(this).data('orden-interna')
        window.location.href = `orden-interna/detalle/${id}`
    })

    $('#data-container').on('click', '.btn-orden-interna-pdf', async function () {
        const id = $(this).data('orden-interna')
        try {
            const response = await client.get(`/generarReporteOrdenTrabajo?oic_id=${id}`, {
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            showModalPreview(pdfUrl)
        } catch (error) {
            alert('Error al generar el reporte')
        }
    })

    $('#data-container').on('click', '.btn-orden-interna-eliminar', async function () {
        const id = $(this).data('orden-interna')
        if (confirm('¿Desea eliminar esta orden interna?')) {
            try {
                await client.delete(`/ordeninterna/${id}`)
                initPagination(buildFilteredURL(), initDataTable, dataTableOptions, 100)
            } catch (error) {
                const { response } = error
                if (response.status === 400) {
                    alert(response.data.error)
                } else {
                    alert('Error al eliminar la orden interna')
                }
            }
        }
    })

    $('#data-container').on('click', '.btn-orden-interna-change-estado', function () {
        const id = $(this).data('orden-interna')
        const textEstado = $(this).text()
        const modalChangeEstado = new bootstrap.Modal(document.getElementById('changeEstadoOI'))
        modalChangeEstado.show()
        $('#estadoActualOI').text(textEstado)
        $('#idOI').val(id)
        const estado = ['REABIERTO']

        // vaciamos el select
        $('#estadoOISelect').empty()

        $('#estadoOISelect').append(`<option value="">SELECCIONAR ESTADO</option>`)
        // rellenamos el select
        estado.forEach(element => {
            $('#estadoOISelect').append(`<option value="${element}" ${textEstado === "REABIERTO" ? "disabled" : ""}>${element}</option>`)
        })
    })

    $('#changeEstadoOIBtn').on('click', async function () {
        const id = $('#idOI').val()
        const estado = $('#estadoOISelect').val()

        if (estado.length === 0) {
            alert('Debe seleccionar un estado')
            return
        }

        try {
            await client.put(`/ordeninterna/${id}`, { oic_estado: estado })

            const modalChangeEstado = bootstrap.Modal.getInstance(document.getElementById('changeEstadoOI'))
            modalChangeEstado.hide()

            // recargar data con los filtros actuales
            initPagination(buildFilteredURL(), initDataTable, dataTableOptions, 100)
        } catch (error) {
            alert('Error al cambiar el estado')
        }
    })

    $('#limpiar-btn').on('click', function () {
        $('#filter-input').val('')
        
        const currentMonth = (new Date().getMonth() + 1).toString()
        const currentYear = new Date().getFullYear().toString()
        
        $('#year-selector').multiselect('destroy')
        $('#month-selector').multiselect('destroy')
        
        $('#year-selector').empty() 
        
        for (let y = 2020; y <= new Date().getFullYear() + 1; y++) {
            const selected = y.toString() === currentYear ? 'selected' : ''
            $('#year-selector').append(`<option value="${y}" ${selected}>${y}</option>`)
        }
        
        $('#month-selector option').prop('selected', false) 
        $(`#month-selector option[value="${currentMonth}"]`).prop('selected', true) 
        
        $('#year-selector').multiselect()
        $('#month-selector').multiselect()
        
        initPagination(buildFilteredURL(), initDataTable, dataTableOptions, 100)
    })
    
    

    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }
})
