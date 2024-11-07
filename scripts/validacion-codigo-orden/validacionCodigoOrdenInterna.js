$(document).ready(() => {

    let abortController
    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna/validacion'
    let idOrdenInternaMaterial = 0

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
        // vaciamos la lista
        $('#data-container-body').empty()
        // recorremos la lista
        data.forEach((material, index) => {
            // obtenemos los datos
            const { producto, orden_interna_parte } = material
            const { orden_interna } = orden_interna_parte
            const { odt_numero } = orden_interna

            const rowItem = document.createElement('tr')
            rowItem.innerHTML = `
                <td>${odt_numero}</td>
                <td>${parseDate(material.odm_feccreacion)}</td>
                <td>${material.odm_usucreacion}</td>
                <td>${producto?.pro_codigo || 'N/A'}</td>
                <td>${material.odm_descripcion}</td>
                <td>${material.odm_observacion || 'N/A'}</td>
                <td class="text-center">${material.odm_cantidad}</td>
                <td class="text-center">
                    <button class="btn btn-primary asignar-codigo" data-detalle="${material.odm_id}">Validar Código</button>
                </td>
            `
            $('#data-container-body').append(rowItem)
        })
    }

    filterFechas.on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const checkedTodos = $("#filter-checkbox").is(':checked')
        let filteredURL = `${apiURL}?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&flag_is_null=${!checkedTodos}`
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
        // filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`

        const checkedTodos = $("#filter-checkbox").is(':checked')
        // debemos adjuntar el filtro de busqueda por criterio
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}&flag_is_null=${!checkedTodos}`
        }

        initPagination(filteredURL, initDataTable, dataTableOptions, 50)
    })

    initPagination(`${apiURL}?fecha_desde=${moment().startOf('month').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}&flag_is_null=true`, initDataTable, dataTableOptions, 50)

    // ------ GESTIÓN DE ASIGNACIÓN DE CÓDIGOS ------

    // al momento de ir ingresando valores en el input
    $('#productosInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarMateriales(query)
        } else {
            limpiarLista()
        }
    }))

    // funcion que limpia la lista
    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    // funcion que busca materiales desde SAP
    async function buscarMateriales(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/productosByQuery?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                // listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - ${material.stock?.alp_stock || 0}`
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Petición abortada');
            } else {
                console.error('Error al buscar materiales:', error);
            }
        }
    }

    // funcion que se ejecuta al seleccionar un material
    function seleccionarMaterial(material) {
        limpiarLista()
        $('#productosInput').val('')
        $("#btn-asignar-codigos").prop('disabled', false)
        const { pro_id, pro_codigo, pro_descripcion, alp_stock, UltimaFechaIngreso } = material

        const row = `
        <tr data-id="${pro_id}">
            <td>${pro_codigo}</td>
            <td>${pro_descripcion}</td>
            <td>${alp_stock}</td>
            <td>${UltimaFechaIngreso}</td>
            <td>
                <button class="btn btn-sm btn-danger eliminar-detalle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>
            </td>
        </tr>
        `
        $("#tbl-asignar-codigos tbody").html(row)
    }

    // gestionamos el modal de asignacion de codigos
    $("#data-container-body").on('click', '.asignar-codigo', function () {
        const id = $(this).data('detalle')
        idOrdenInternaMaterial = id

        // borramos el detalle actual de la asignacion de codigos
        $("#tbl-asignar-codigos tbody").empty()

        // deshabilitamos el boton de asignación
        $("#btn-asignar-codigos").prop('disabled', true)

        const modalAsignacionCodigo = new bootstrap.Modal(document.getElementById('asignacionCodigosModal'))
        modalAsignacionCodigo.show()
    })

    // gestion de eliminacion de detalle de asignacion de codigos
    $("#tbl-asignar-codigos").on('click','.eliminar-detalle', function () {
        const row = $(this).closest('tr')
        row.remove()
        // deshabilitamos el boton de asignación
        $("#btn-asignar-codigos").prop('disabled', true)
    })

    // hacer click en el boton de asginacion
    $("#btn-asignar-codigos").on('click', async function () {
        console.log("Entro")
        try {

        } catch(error) {

        }
    })

})