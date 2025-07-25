$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/cotizaciones'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", new Date(new Date().getFullYear(), new Date().getMonth(), 1));

    $("#fechaHasta").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", new Date());

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: false,
        columnDefs: [
            {
                targets: 1,
                type: 'string'
            },
            {
                targets: 3,
                type: 'string'
            }
        ]
    }

    function initDataTable(data) {
        let content = ''
        data.forEach((cotizacion, index) => {
            const { moneda } = cotizacion
            content += `
                <tr>
                    <td>${cotizacion.coc_fechacotizacion !== null ? parseDateSimple(cotizacion.coc_fechacotizacion) : 'No aplica'}</td>
                    <td>${cotizacion.coc_numero || 'No aplica'}</td>
                    <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
                    <td class="text-left">${cotizacion.proveedor?.prv_nrodocumento || 'No aplica'}</td>
                    <td>${cotizacion.proveedor?.prv_nombre || 'No aplica'}</td>
                    <td>${cotizacion.coc_fechavalidez !== null ? parseDateSimple(cotizacion.coc_fechavalidez) : 'N/A'}</td>
                    <td class="text-center">${moneda?.mon_descripcion || 'No aplica'}</td>
                    <td class="text-center">${moneda?.mon_simbolo || ''} ${cotizacion.coc_total || 'No aplica'}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary btn-cotizacion-detalle" data-cotizacion="${cotizacion.coc_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                            </svg>
                        </button>
                    </td>
                    <td class="text-center">
                        <a target="_blank" href="${config.FRONT_EXTRANET_URL}/cotizacion-proveedor.html?coc_id=${cotizacion.coc_id}">
                            <button class="btn btn-sm btn-info me-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                                    <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                                </svg>
                            </button>
                        </a>
                    </td>
                    <td class="text-center">
                        <a target="_blank" href="${config.FRONT_URL}/cotizacion-proveedor.html?coc_id=${cotizacion.coc_id}">Ir enlace</a>
                    </td>
                    <td>
                        <span class="badge ${cotizacion.coc_estado === 'SOL' ? 'bg-danger' : 'bg-success'} btn-cambiar-estado-cotizacion" style="cursor: pointer;" data-cotizacion="${cotizacion.coc_id}">${cotizacion.coc_estado}</span>
                    </td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm ${cotizacion.coc_estado === 'SOL' ? 'btn-secondary' : 'btn-warning'} btn-cotizacion-editar me-1" data-cotizacion="${cotizacion.coc_id}" ${cotizacion.coc_estado === 'SOL' ? 'disabled' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm ${cotizacion.coc_estado === 'SOL' ? 'btn-secondary' : 'btn-danger'} btn-cotizacion-pdf me-1" data-cotizacion="${cotizacion.coc_id}" ${cotizacion.coc_estado === 'SOL' ? 'disabled' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                                    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                                    <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm ${cotizacion.coc_estado === 'RPR' ? 'btn-outline-secondary' : 'btn-outline-danger'} btn-cotizacion-eliminar me-1" data-cotizacion="${cotizacion.coc_id}" ${cotizacion.coc_estado === 'RPR' ? 'disabled' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm ${cotizacion.coc_estado === 'SOL' ? 'btn-secondary' : 'btn-success'} btn-cotizacion-reactivar" data-cotizacion="${cotizacion.coc_id}" ${cotizacion.coc_estado === 'SOL' ? 'disabled' : ''}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16">
                                    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9"/>
                                    <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${cotizacion.coc_feccreacion === null ? 'No aplica' : parseDate(cotizacion.coc_feccreacion)}</td>
                    <td>${cotizacion.coc_usucreacion === null ? 'No aplica' : cotizacion.coc_usucreacion}</td>
                    <td>${cotizacion.coc_fecmodificacion === null ? 'No aplica' : parseDate(cotizacion.coc_fecmodificacion)}</td>
                    <td>${cotizacion.coc_usumodificacion === null ? 'No aplica' : cotizacion.coc_usumodificacion}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
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
        filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`

        // debemos adjuntar el filtro de busqueda por criterio
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `&${filterField}=${encodeURIComponent(filterValue)}`
        }
        initPagination(filteredURL, initDataTable, dataTableOptions)
    })

    // inicializamos la paginacion con datatable
    initPagination(`${apiURL}?fecha_desde=${moment().startOf('month').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`, initDataTable, dataTableOptions)

    // FUNCION PARA VER DETALLE DE COTIZACION
    $('#data-container').on('click', '.btn-cotizacion-detalle', async function () {
        const id = $(this).data('cotizacion')
        try {
            const { data } = await client.get(`/cotizacion-detalle/${id}`)
            const { agrupado, detalle_materiales } = data

            // Llenamos los datos agrupados
            let simbolo = ''
            $('#tbl-cotizacion-detalle-agrupado tbody').empty()
            agrupado.forEach(agrupado => {
                const { cod_orden, cod_descripcion, cod_observacion, cod_observacionproveedor, uni_codigo, cod_cantidad, cod_cantidadcotizada, cod_preciounitario, cod_total, cod_cotizar, cod_tiempoentrega, mon_simbolo } = agrupado
                simbolo = mon_simbolo
                $('#tbl-cotizacion-detalle-agrupado tbody').append(`
                    <tr>
                        <td>${cod_orden}</td>
                        <td class="text-center">
                            <span class="badge ${cod_cotizar == 1 ? 'bg-success' : 'bg-danger'}">${cod_cotizar == 1 ? 'SI' : 'NO'}</span>
                        </td>
                        <td>${cod_descripcion}</td>
                        <td>${cod_observacion || 'N/A'}</td>
                        <td>${cod_observacionproveedor || 'N/A'}</td>
                        <td class="text-center">${cod_tiempoentrega ? `${cod_tiempoentrega} día(s)` : 'N/A'}</td>
                        <td class="text-center">${uni_codigo || 'N/A'}</td>
                        <td class="text-center">${cod_cantidad.toFixed(2) || 'N/A'}</td>
                        <td class="text-center">${cod_cantidadcotizada.toFixed(2) || 'N/A'}</td>
                        <td class="text-center">${mon_simbolo} ${cod_preciounitario || 'N/A'}</td>
                        <td class="text-center">${mon_simbolo} ${cod_total.toFixed(2) || 'N/A'}</td>
                    </tr>
                `)
            })
            $('#tbl-cotizacion-detalle-agrupado tbody').append(`
                <tr>
                    <td colspan="10" class="text-end fw-bold">Total</td>
                    <td class="text-center fw-bold">${simbolo} ${agrupado.reduce((total, agrupado) => total + agrupado.cod_total, 0).toFixed(2)}</td>
                </tr>
            `)

            // Llenamos los datos de los materiales especifico
            $('#tbl-cotizacion-detalle-especifico tbody').empty()
            console.log(detalle_materiales)
            detalle_materiales.forEach(detalle => {
                const { cotizacion, cod_orden, cod_cotizar, cod_descripcion, cod_tiempoentrega, cod_cantidad, cod_cantidadcotizada, cod_preciounitario, cod_total } = detalle
                const { moneda } = cotizacion
                const { detalle_material } = detalle

                $('#tbl-cotizacion-detalle-especifico tbody').append(`
                    <tr>
                        <td>${cod_orden}</td>
                        <td class="text-center">
                            ${detalle_material ? 
                                `<span class="badge ${cod_cotizar == 1 ? 'bg-success' : 'bg-danger'}">${cod_cotizar == 1 ? 'SI' : 'NO'}</span>`
                                :
                                `<span class="badge bg-primary">STOCK</span>`
                            }
                            
                        </td>
                        <td>${detalle_material?.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                        <td>${cod_descripcion}</td>
                        <td class="text-center">${cod_tiempoentrega ? `${cod_tiempoentrega} día(s)` : 'N/A'}</td>
                        <td class="text-center">${cod_cantidad || 'N/A'}</td>
                        <td class="text-center">${cod_cantidadcotizada || 'N/A'}</td>
                        <td class="text-center">${moneda?.mon_simbolo || ''} ${cod_preciounitario || 'N/A'}</td>
                        <td class="text-center">${moneda?.mon_simbolo || ''} ${cod_total || 'N/A'}</td>
                    </tr>
                `)
            })

            // abrimos el modal
            const modalDetalleCotizacion = new bootstrap.Modal(document.getElementById('detalleCotizacionModal'))
            modalDetalleCotizacion.show()
        } catch (error) {
            console.log(error)
            alert('Error al obtener el detalle de la cotización')
        }
    })

    // FUNCTION PARA EDITAR COTIZACION
    $('#data-container').on('click', '.btn-cotizacion-editar', function () {
        const id = $(this).data('cotizacion')
        window.location.href = `cotizacion/editar/${id}`
    })

    // FUNCION PARA ELIMINAR COTIZACION
    $('#data-container').on('click', '.btn-cotizacion-eliminar', async function () {
        const id = $(this).data('cotizacion')
        if (!confirm('¿Desea eliminar esta cotización?')) {
            return
        }
        try {
            await client.delete(`/cotizacion/${id}`)
            const URL = `${apiURL}?fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`
            initPagination(URL, initDataTable, dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al eliminar la cotización')
        }
    })

    //FUNCION PARA REACTIVAR COTIZACION
    $('#data-container').on('click', '.btn-cotizacion-reactivar', async function () {
        const id = $(this).data('cotizacion')
        if (!confirm('¿Desea habilitar esta cotización nuevamente?')) {
            return
        }
        try {
            await client.patch(`/cotizacion/update-estado/${id}`, {coc_estado: 'SOL'})
            const URL = `${apiURL}?fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`
            initPagination(URL, initDataTable, dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al eliminar la cotización')
        }
    })

    // FUNCION PARA GENERAR PDF
    $('#data-container').on('click', '.btn-cotizacion-pdf', async function () {
        const id = $(this).data('cotizacion')
        try {
            const response = await client.get(`/cotizaciones/exportarPDF?coc_id=${id}`, {
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
            alert('Error al generar el reporte')
        }
    })

    // FUNCION PARA CAMBIAR EL ESTADO DE LA COTIZACION
    $('#data-container').on('click', '.btn-cambiar-estado-cotizacion', function () {
        const coc_id = $(this).data('cotizacion')
        const estado = $(this).text()
        if (estado === 'RPR') {
            bootbox.confirm({
                title: 'Cambiar estado de la cotización',
                message: '¿Desea cambiar el estado de la cotización a "SOLICITADO"?, Esto permitira que el proveedor pueda editar la cotización',
                buttons: {
                    confirm: {
                        label: 'Si',
                        className: 'btn-success'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                callback: function (result) {
                    if (result) {
                        client.patch(`/cotizacion/update-estado/${coc_id}`, {coc_estado: 'SOL'})
                        const URL = `${apiURL}?fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`
                        initPagination(URL, initDataTable, dataTableOptions)
                    }
                }
            })
        }

    })

    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }
})