$(document).ready(() => {

    let abortController
    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna/validacion'
    let idOrdenInternaMaterial = 0
    let dataTable;
    const dataContainer = $('#data-container')

    // gestion de multiselect
    $('select[multiple]').multiselect()

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')
    const filterMultiselect = $('#filtermultiselect-button')

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate());
    $("#fechaHasta").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate());

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 25,
        lengthMenu: [25, 50, 100, 250],
        searching: true,
        info: true,
        language: {
            lengthMenu: "Mostrar _MENU_ registros por página",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            search: "Buscar:",
            zeroRecords: "No se encontraron resultados",
            select: {
                rows: {
                    _: " - %d filas seleccionadas",
                    0: " - Ninguna fila seleccionada",
                    1: " - 1 fila seleccionada"
                }
            },
        },
        columnDefs: [
            {
                targets: 0,
                orderable: false,
            },
            {
                orderable: false,
                render: DataTable.render.select(),
                targets: 1,
                className: 'form-check-input'
            },
            { targets: 8, searchable: true },
            { targets: [2, 3, 4, 5, 6, 7, 9, 10, 11], searchable: false },
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
        order: [[2, 'asc']],
    }

    // Inicializacion de data table
    async function initDataTable(URL = apiURL) {
        // verificamos que no se haya inicializado el datatable
        if ($.fn.DataTable.isDataTable(dataContainer)) {
            dataContainer.DataTable().destroy();
        }
        // vaciamos la lista
        $('#data-container-body').empty()

        try {
            const { data } = await client.get(URL)
            console.log(data)
            // recorremos la lista
            data.forEach((material, index) => {
                // obtenemos los datos
                const { producto, orden_interna_parte } = material
                const { orden_interna } = orden_interna_parte
                const { odt_numero, area } = orden_interna

                const rowItem = document.createElement('tr')
                rowItem.dataset.detalle = material.odm_id
                rowItem.innerHTML = `
                    <td></td>
                    <td></td>
                    <td>${odt_numero || 'N/A'}</td>
                    <td>${area.are_descripcion}</td>
                    <td class="text-center">${material.odm_tipo == 1 ? 'R' : 'A'}</td>
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
            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    function filterData() {
        const fecha_desde = transformarFecha($('#fechaDesde').val())
        const fecha_hasta = transformarFecha($('#fechaHasta').val())

        let filteredURL = `${apiURL}?fecha_desde=${fecha_desde}&fecha_hasta=${fecha_hasta}`

        const filters = $('select[multiple]').val()
        if (filters.length !== 0) {
            filteredURL += `&multifilter=${filters.join('OR')}`
        }

        initDataTable(filteredURL)
    }

    filterFechas.on('click', () => {
        filterData()
    })

    // filtro multi select
    filterMultiselect.on('click', async () => {
        filterData()
    })

    filterButton.on('click', () => {
        // seleccionamos el valor del selector
        const filterField = filterSelector.val().trim()
        // seleccionamos el valor del criterio de busqueda
        const filterValue = filterInput.val().trim()

        let filteredURL = apiURL

        // debemos adjuntar el filtro de busqueda por criterio
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
            const filters = $('select[multiple]').val()
            if (filters.length !== 0) {
                filteredURL += `&multifilter=${filters.join('OR')}`
            }
        }

        initDataTable(filteredURL)
    })

    initDataTable(`${apiURL}?fecha_desde=${moment().format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}&multifilter=no_verificados`)

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
        $("#btn-asignar-codigo").prop('disabled', false)
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
        // limpiamos la lista
        limpiarLista()
        $('#productosInput').val('')
        // deshabilitamos el boton de asignación
        $("#btn-asignar-codigo").prop('disabled', true)

        const modalAsignacionCodigo = new bootstrap.Modal(document.getElementById('asignacionCodigosModal'))
        modalAsignacionCodigo.show()
    })

    // gestion de eliminacion de detalle de asignacion de codigos
    $("#tbl-asignar-codigos").on('click', '.eliminar-detalle', function () {
        const row = $(this).closest('tr')
        row.remove()
        // deshabilitamos el boton de asignación
        $("#btn-asignar-codigo").prop('disabled', true)
    })

    // hacer click en el boton de asginacion
    $("#btn-asignar-codigo").on('click', async function () {
        var pro_codigo = $('#tbl-asignar-codigos tbody tr:first').data('id');
        // buscamos el codigo 
        const formatData = {
            odm_id: idOrdenInternaMaterial,
            pro_codigo: pro_codigo
        }

        try {
            await client.post('/ordeninternamateriales/validar-codigo', formatData)
            // cerramos el modal
            const modalAsignacionCodigo = bootstrap.Modal.getInstance(document.getElementById('asignacionCodigosModal'))
            modalAsignacionCodigo.hide()

            // cargamos la informacion
            filterData()
        } catch (error) {
            console.log(error)
            alert('Error al asignar el codigo')
        }
    })

    // ------------- GESTION DE VERIFICACION -------------
    $("#btn-validar-materiales").on('click', async function () {
        const filasSeleccionadas = dataTable.rows({ selected: true }).nodes();
        const indicesSeleccionados = [];
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).data('detalle');
            indicesSeleccionados.push(valor);
        });

        // debe al menos seleccionarse un item
        if (indicesSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un material')
            return
        }

        const formatData = {
            materiales: indicesSeleccionados
        }

        try {
            await client.post('detalleMaterialesOrdenInterna/verificar-materiales', formatData)
            filterData()
        } catch (error) {
            console.log(error)
            alert('Error al verificar los materiales')
        }
    })

    // ------------ GESTION DE EXCEL DE ALMACEN -------------
    $("#btn-export-data-almacen").on('click', function () {
        // abrimos el modal de ingreso de informacion
        const loaderModalSearchOI = new bootstrap.Modal(document.getElementById('ordenInternaSearchModal'))
        loaderModalSearchOI.show()
    })

    $("#btnExportarExcelAlmacen").on('click', function (event) {
        event.preventDefault()
        exportarExcelAlmacen()
        const loaderModalSearchOI = bootstrap.Modal.getInstance(document.getElementById('ordenInternaSearchModal'))
        loaderModalSearchOI.hide()
    })

    async function exportarExcelAlmacen() {
        var oiValue = $('#ordenInternaInput').val().trim()

        // Validar si el campo está vacío
        if (oiValue.length === 0) {
            alert('Por favor, ingrese un valor de Orden Interna para buscar.')
            return
        }

        try {
            let filteredURL = `/ordeninternamateriales/export-excel-almacen?odt_numero=${oiValue}`
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
            if (error.response && error.response.data) {
                try {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const errorMessage = JSON.parse(reader.result).error || "Ocurrió un error desconocido.";
                        alert(`Error al exportar: ${errorMessage}`);
                    };
                    reader.readAsText(error.response.data);
                } catch (parseError) {
                    alert("Error desconocido al procesar la respuesta del servidor.");
                }
            } else {
                console.error(error);
                alert("Error al exportar el archivo. Por favor, inténtalo de nuevo.");
            }
        }
    }

})