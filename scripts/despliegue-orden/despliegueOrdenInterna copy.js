$(document).ready(() => {
    let abortController
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
                        condicionalReserva = false
                    }
                }
            }

            content += `
                <tr>
                    <td data-id-detalle="${material.odm_id}" class="text-center">
                        <input type="checkbox" class="row-select">
                    </td>
                    <td>${odt_numero}</td>
                    <td>${oic_numero}</td>
                    <td>${parseDate(material.odm_feccreacion)}</td>
                    <td class="text-center">${material.odm_tipo == 1 ? 'R' : 'A'}</td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td>${material.odm_descripcion}</td>
                    <td>${material.odm_observacion || 'N/A'}</td>
                    <td>${material.odm_cantidad}</td>
                    <td class="text-center">${producto?.unidad?.uni_codigo || 'N/A'}</td>
                    <td class="text-center">${producto?.stock?.alp_stock || "0.00"}</td>
                    <td class="text-center">
                        <button class="btn btn-primary">0.00</button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary">0.00</button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary">0.00</button>
                    </td>
                    <td>
                        <button class="btn btn-primary">Responsable</button>
                    </td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm ${condicionalReserva ? 'btn-primary' : 'btn-secondary'} me-2" ${condicionalReserva ? '' : 'disabled'}>
                                Reservar
                            </button>
                            <button class="btn btn-sm btn-success btn-cotizar" data-id="${material.odm_id}">
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

    // ---------- MANEJO DE COTIZACIONES -----------
    $('#data-container-body').on('click', '.btn-cotizar', async (event) => {
        const id = $(event.currentTarget).data('id')
        // seteamos el detalle de materiales
        $('#id-detalle-materiales').val(id)
        // reset de los valores de ingreso
        limpiarLista()
        $('#proveedoresInput').val('')
        $('#tipo-proveedor').val('')
        $('#tbl-despliegue-materiales-cotizaciones tbody').empty()
        // abrimos el modal
        const dialogCotizacion = new bootstrap.Modal(document.getElementById('cotizacionesModal'))
        dialogCotizacion.show()
    })

    $('#tipo-proveedor').on('change', () => {
        const value = $('#tipo-proveedor').val().trim()
        if (value.length !== 0) {
            limpiarLista()
            $('#proveedoresInput').val('')
            $('#proveedoresInput').attr('placeholder', 'Ingrese el número de documento...');
        } else {
            limpiarLista()
            $('#proveedoresInput').val('')
            $('#proveedoresInput').attr('placeholder', 'Buscar proveedor...');
        }
    })

    $('#proveedoresInput').on('input', debounce(async function () {
        const isTyping = $('#tipo-proveedor').val().trim().length === 0
        const query = $(this).val().trim()
        if (query.length >= 3 && isTyping) {
            await buscarProveedores(query)
        } else {
            limpiarLista()
        }
    }))

    // al momento de presionar enter
    $('#proveedoresInput').on('keydown', async function (event) {
        const query = $(this).val().trim()
        // si es la tecla de enter
        if (event.keyCode === 13) {
            event.preventDefault();
            const isTyping = $('#tipo-proveedor').val().trim().length === 0
            // si se desea agregar un producto sin código
            if (!isTyping) {
                await buscarProveedorByDocumento(query)
            } else {
                return
            }
        }
    });

    async function buscarProveedorByDocumento(documento) {
        try {
            const tipoDocumento = $('#tipo-proveedor').val().trim()
            const queryEncoded = encodeURIComponent(documento)
            const queryEncoded2 = encodeURIComponent(tipoDocumento)
            const { data } = await client.get(`/proveedoresByDocumento?query=${queryEncoded}&tdo_codigo=${queryEncoded2}`)
            // Limpiamos la lista
            limpiarLista()
            // si la data esta vacia
            if (data.length === 0) {
                alert('No se encontró ninguño proveedor con ese documento')
                return
            }
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
        const { prv_id, prv_nrodocumento, prv_nombre, tdo_codigo } = proveedor

        const $rows = $('#tbl-despliegue-materiales-cotizaciones tbody tr')

        const array_prov = $rows.map(function () {
            return $(this).data('id-proveedor')
        }).get()
        console.log(array_prov)
        const findElement = array_prov.find(element => element == prv_id)

        if (findElement) {
            alert('El proveedor ya fue agregado')
            return
        }

        limpiarLista()
        $('#proveedoresInput').val('')

        const row = `
        <tr data-id-proveedor="${prv_id}">
            <td>${prv_nombre}</td>
            <td>${tdo_codigo}</td>
            <td>${prv_nrodocumento}</td>
            <td>No aplica</td>
            <td>No aplica</td>
            <td>
                <div class="d-flex justify-content-around">
                    <button class="btn btn-sm btn-danger btn-cotizacion-exportar-pdf me-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-pdf-fill" viewBox="0 0 16 16">
                            <path d="M5.523 12.424q.21-.124.459-.238a8 8 0 0 1-.45.606c-.28.337-.498.516-.635.572l-.035.012a.3.3 0 0 1-.026-.044c-.056-.11-.054-.216.04-.36.106-.165.319-.354.647-.548m2.455-1.647q-.178.037-.356.078a21 21 0 0 0 .5-1.05 12 12 0 0 0 .51.858q-.326.048-.654.114m2.525.939a4 4 0 0 1-.435-.41q.344.007.612.054c.317.057.466.147.518.209a.1.1 0 0 1 .026.064.44.44 0 0 1-.06.2.3.3 0 0 1-.094.124.1.1 0 0 1-.069.015c-.09-.003-.258-.066-.498-.256M8.278 6.97c-.04.244-.108.524-.2.829a5 5 0 0 1-.089-.346c-.076-.353-.087-.63-.046-.822.038-.177.11-.248.196-.283a.5.5 0 0 1 .145-.04c.013.03.028.092.032.198q.008.183-.038.465z"/>
                            <path fill-rule="evenodd" d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m5.5 1.5v2a1 1 0 0 0 1 1h2zM4.165 13.668c.09.18.23.343.438.419.207.075.412.04.58-.03.318-.13.635-.436.926-.786.333-.401.683-.927 1.021-1.51a11.7 11.7 0 0 1 1.997-.406c.3.383.61.713.91.95.28.22.603.403.934.417a.86.86 0 0 0 .51-.138c.155-.101.27-.247.354-.416.09-.181.145-.37.138-.563a.84.84 0 0 0-.2-.518c-.226-.27-.596-.4-.96-.465a5.8 5.8 0 0 0-1.335-.05 11 11 0 0 1-.98-1.686c.25-.66.437-1.284.52-1.794.036-.218.055-.426.048-.614a1.24 1.24 0 0 0-.127-.538.7.7 0 0 0-.477-.365c-.202-.043-.41 0-.601.077-.377.15-.576.47-.651.823-.073.34-.04.736.046 1.136.088.406.238.848.43 1.295a20 20 0 0 1-1.062 2.227 7.7 7.7 0 0 0-1.482.645c-.37.22-.699.48-.897.787-.21.326-.275.714-.08 1.103"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-primary btn-cotizacion-exportar-text">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
        `
        $('#tbl-despliegue-materiales-cotizaciones tbody').append(row)
    }
})
