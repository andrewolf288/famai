$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/ordenescompra'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().subtract(30, 'days').toDate());

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
        order: [[13, 'desc']]
    }

    function initDataTable(data) {
        let content = ''
        data.forEach((ordenCompra, index) => {
            const { moneda } = ordenCompra

            content += `
                <tr>
                    <td>${ordenCompra.occ_fecha !== null ? parseDateSimple(ordenCompra.occ_fecha) : 'No aplica'}</td>
                    <td class="text-start">${ordenCompra.occ_numero ?? 'No aplica'}</td>
                    <td>${ordenCompra.proveedor?.prv_nrodocumento ?? 'No aplica'}</td>
                    <td>${ordenCompra.proveedor?.prv_nombre ?? 'No aplica'}</td>
                    <td class="text-center">${moneda?.mon_descripcion ?? 'No aplica'}</td>
                    <td class="text-center">${moneda?.mon_simbolo ?? ''} ${parseFloat(ordenCompra.occ_subtotal).toFixed(4)}</td>
                    <td class="text-center">${moneda?.mon_simbolo ?? ''} ${parseFloat(ordenCompra.occ_impuesto).toFixed(4)}</td>
                    <td class="text-center">${moneda?.mon_simbolo ?? ''} ${parseFloat(ordenCompra.occ_total).toFixed(4)}</td>
                    <td class="text-center">${ordenCompra.occ_nrosap ?? ''}</td>
                    <td class="text-center">
                        ${(() => {
                            if (ordenCompra.occ_descargado == 1) {
                                const tieneInfo = ordenCompra.occ_fechadescargado && ordenCompra.occ_usuariodescargado;
                                const fechaFormateada = tieneInfo 
                                    ? moment(ordenCompra.occ_fechadescargado).format('DD/MM/YYYY hh:mm A')
                                    : '';
                                const tooltipAttrs = tieneInfo 
                                    ? `data-bs-toggle="tooltip" data-bs-placement="top" title="Descargado el ${fechaFormateada} por ${ordenCompra.occ_usuariodescargado}"`
                                    : '';
                                const cursorStyle = tieneInfo ? 'help' : 'default';
                                return `
                                    <span class="icono-descarga" ${tooltipAttrs}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="24" height="24" style="color: green; cursor: ${cursorStyle};">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                        </svg>
                                    </span>
                                `;
                            } else {
                                return `
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="24" height="24" style="color: red;">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                `;
                            }
                        })()}
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary btn-ordencompra-detalle" data-ordencompra="${ordenCompra.occ_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                            </svg>
                        </button>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-primary">${ordenCompra.occ_estado}</span>
                    </td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-danger btn-orden-compra-pdf" data-ordencompra="${ordenCompra.occ_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                                    <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                                    <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                                </svg>
                            </button>

                            <button class="btn btn-sm btn-outline-danger btn-orden-compra-anular d-flex align-items-center justify-content-center" data-ordencompra="${ordenCompra.occ_id}" ${ordenCompra.occ_estado === 'SAP' || ordenCompra.occ_estado === 'ANU' ? 'disabled' : ''} title="Anular orden de compra">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"></path>
                                </svg>
                            </button>

                            <button class="btn btn-sm btn-warning btn-orden-compra-editar" data-ordencompra="${ordenCompra.occ_id}" ${ordenCompra.occ_estado === 'SAP' || ordenCompra.occ_estado === 'ANU' ? 'disabled' : ''} title="Editar orden de compra">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>

                            <button class="btn btn-sm btn-outline-primary btn-ver-orden-compra text-center d-flex align-items-center justify-content-center" data-ordencompra="${ordenCompra.occ_id}" title="Ver orden de compra">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                </svg>
                            </button>

                            <button class="btn btn-sm btn-outline-info btn-adjuntos-orden-compra text-center d-flex align-items-center justify-content-center" data-ordencompra="${ordenCompra.occ_id}" title="Ver archivos adjuntos">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td data-order="${ordenCompra.occ_feccreacion ? moment(ordenCompra.occ_feccreacion).valueOf() : 0}">${ordenCompra.occ_feccreacion === null ? 'No aplica' : parseDate(ordenCompra.occ_feccreacion)}</td>
                    <td>${ordenCompra.occ_usucreacion === null ? 'No aplica' : ordenCompra.occ_usucreacion}</td>
                    <td>${ordenCompra.occ_fecmodificacion === null ? 'No aplica' : parseDate(ordenCompra.occ_fecmodificacion)}</td>
                    <td>${ordenCompra.occ_usumodificacion === null ? 'No aplica' : ordenCompra.occ_usumodificacion}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
        
        // Destruir tooltips existentes antes de crear nuevos
        const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        existingTooltips.forEach(function (tooltipEl) {
            const existingTooltip = bootstrap.Tooltip.getInstance(tooltipEl)
            if (existingTooltip) {
                existingTooltip.dispose()
            }
        })
        
        // Inicializar tooltips de Bootstrap
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })
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
    initPagination(`${apiURL}?fecha_desde=${moment().subtract(30, 'days').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`, initDataTable, dataTableOptions)

    // FUNCION PARA VER DETALLE DE ORDEN DE COMPRA
    $('#data-container').on('click', '.btn-ordencompra-detalle', async function () {
        const id = $(this).data('ordencompra')
        try {
            const { data } = await client.get(`/ordencompra-detalle/${id}`)
            // llenamos la tabla con los datos
            $('#tbl-ordencompra-detalle tbody').empty()
            data.forEach(detalle => {
                const { orden_compra, producto } = detalle
                const { moneda } = orden_compra

                $('#tbl-ordencompra-detalle tbody').append(`
                    <tr>
                        <td>${detalle.ocd_orden}</td>
                        <td>${detalle.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                        <td>${producto.pro_codigo}</td>
                        <td>${detalle.ocd_descripcion}</td>
                        <td class="text-center">${producto ? producto.uni_codigo : 'N/A'}</td>
                        <td class="text-center">${detalle.ocd_cantidad || 'N/A'}</td>
                        <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_preciounitario || 'N/A'}</td>
                        <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_total || 'N/A'}</td>
                    </tr>
                `)
            })

            // abrimos el modal
            const modalDetalleCotizacion = new bootstrap.Modal(document.getElementById('detalleOrdenCompraModal'))
            modalDetalleCotizacion.show()
        } catch (error) {
            console.log(error)
            alert('Error al obtener el detalle de la orde de compra')
        }
    })

    // ----------- FUNCIONES PARA GESTIONAR ACCIONES DE BOTONES -------------

    // ANULAR ORDEN DE COMPRA
    $('#data-container').on('click', '.btn-orden-compra-anular', function () {
        const id = $(this).data('ordencompra')
        $('#oc-id').val(id)
        const modalAnular = new bootstrap.Modal(document.getElementById('anularOrdenCompraModal'))
        modalAnular.show()
    })

    $('#btn-anular-orden-compra').on('click', async () => {
        const id = $('#oc-id').val()
        try {
            await client.post(`/ordencompra/anular/${id}`)
            const modalAnular = bootstrap.Modal.getInstance(document.getElementById('anularOrdenCompraModal'))
            modalAnular.hide()
            alert('Orden de compra anulada correctamente')
            initPagination(`${apiURL}?fecha_desde=${moment().subtract(30, 'days').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`, initDataTable, dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al anular la orden de compra')
        }
    })

    $('#data-container').on('click', '.btn-orden-compra-editar', function () {
        const id = $(this).data('ordencompra')
        window.location.href = `orden-compra/editar/${id}`
    })

    $('#data-container').on('click', '.btn-orden-compra-pdf', async function () {
        $('#oc-id').val($(this).data('ordencompra'))
        const modal = new bootstrap.Modal(document.getElementById("imprimirModal"));
        modal.show();
    })

    $('#btn-imprimir').on('click', async () => {
        const id = $('#oc-id').val()
        const formato = $('#formato-impresion').val()
        const imprimirModal = bootstrap.Modal.getInstance(document.getElementById("imprimirModal"));

        try {
            const response = await client.get(`/ordenescompra/exportarPDF?occ_id=${id}&imprimir_disgregado=${formato === '1' ? 1 : 0}`, {
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            imprimirModal.hide()
            showModalPreview(pdfUrl)
        } catch (error) {
            console.log(error)
            alert('Error al generar el reporte')
        }
    })

    $('#data-container').on('click', '.btn-orden-compra-editar', function () {
        const id = $(this).data('ordencompra')
        router.navigate(`/orden-compra/editar/${id}`)
    })

    $('#data-container').on('click', '.btn-ver-orden-compra', function () {
        const id = $(this).data('ordencompra')
        router.navigate(`/orden-compra/ver/${id}`)
    })

    // Ver archivos adjuntos de orden de compra
    $('#data-container').on('click', '.btn-adjuntos-orden-compra', async function () {
        const occ_id = $(this).data('ordencompra')
        
        // Mostrar loading
        $('#loading-adjuntos').show()
        $('#tabla-adjuntos-orden-compra').hide()
        $('#sin-adjuntos').hide()
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById("adjuntosOrdenCompraModal"))
        modal.show()
        
        try {
            const { data } = await client.get(`/ordenescompra/${occ_id}/adjuntos`)
            
            $('#loading-adjuntos').hide()
            
            if (data && data.length > 0) {
                $('#tabla-adjuntos-orden-compra').show()
                $('#tabla-adjuntos-orden-compra-body').empty()
                
                data.forEach((adjunto, index) => {
                    const row = `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${adjunto.oca_descripcion || 'Sin descripción'}</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-primary btn-descargar-adjunto" data-url="${adjunto.oca_url}" data-nombre="${adjunto.oca_descripcion || 'archivo'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5h2a.5.5 0 0 1 0 1h-2A1.5 1.5 0 0 1 0 11V4a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 5 4v1a.5.5 0 0 1-1 0V4a.5.5 0 0 0-.5-.5h-2A.5.5 0 0 0 1 4v7a.5.5 0 0 0 .5.5h2a.5.5 0 0 1 0 1h-2z"/>
                                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                    </svg>
                                    Descargar
                                </button>
                            </td>
                        </tr>
                    `
                    $('#tabla-adjuntos-orden-compra-body').append(row)
                })
            } else {
                $('#sin-adjuntos').show()
            }
        } catch (error) {
            console.error('Error al cargar adjuntos:', error)
            $('#loading-adjuntos').hide()
            $('#sin-adjuntos').show()
            $('#sin-adjuntos').html('<p class="text-danger">Error al cargar los archivos adjuntos.</p>')
        }
    })

    // Descargar archivo adjunto
    $('#tabla-adjuntos-orden-compra-body').on('click', '.btn-descargar-adjunto', async function () {
        const url = $(this).data('url')
        const descripcion = $(this).data('nombre') // Este es el campo oca_descripcion
        
        try {
            const response = await client.get(`/ordenescompra/adjuntos/descargar?url=${encodeURIComponent(url)}`, {
                responseType: 'blob'
            })
            
            // Verificar si la respuesta es un error JSON verificando el Content-Type
            const contentType = response.headers['content-type'] || ''
            if (contentType.includes('application/json')) {
                // Es un error JSON, leerlo y mostrar el mensaje
                const text = await response.data.text()
                try {
                    const errorData = JSON.parse(text)
                    alert('Error: ' + (errorData.error || 'Error al descargar el archivo'))
                    return
                } catch (e) {
                    alert('Error al descargar el archivo')
                    return
                }
            }
            
            // Obtener la extensión del archivo desde la URL
            let extension = ''
            if (url) {
                const urlParts = url.split('/')
                const lastPart = urlParts[urlParts.length - 1]
                if (lastPart && lastPart.includes('.')) {
                    const extensionMatch = lastPart.match(/\.([^.]+)$/)
                    if (extensionMatch) {
                        extension = extensionMatch[1]
                    }
                }
            }
            
            // Usar la descripción como nombre del archivo, agregando la extensión si existe
            let filename = descripcion || 'archivo'
            if (extension && !filename.endsWith('.' + extension)) {
                filename = filename + '.' + extension
            }
            
            // Limpiar el nombre del archivo de caracteres inválidos
            filename = filename.replace(/[<>:"/\\|?*]/g, '_')
            
            // Obtener el tipo MIME correcto de la respuesta
            const mimeType = contentType || response.data.type || 'application/octet-stream'
            
            // Crear el blob con el tipo MIME correcto
            const blob = new Blob([response.data], { type: mimeType })
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            console.error('Error al descargar archivo:', error)
            
            // Intentar leer el error si viene como blob
            if (error.response && error.response.data) {
                try {
                    const errorBlob = error.response.data
                    if (errorBlob instanceof Blob) {
                        const errorText = await errorBlob.text()
                        try {
                            const errorData = JSON.parse(errorText)
                            alert('Error: ' + (errorData.error || 'Error al descargar el archivo'))
                        } catch (e) {
                            alert('Error al descargar el archivo')
                        }
                    } else {
                        alert('Error al descargar el archivo: ' + (error.message || 'Error desconocido'))
                    }
                } catch (e) {
                    alert('Error al descargar el archivo')
                }
            } else {
                alert('Error al descargar el archivo: ' + (error.message || 'Error desconocido'))
            }
        }
    })

    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }
})