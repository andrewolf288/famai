$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/ordenesinternas?oic_activo=1'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())
    $("#fechaHasta").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

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
                    <td>${ordenInterna.orden_trabajo?.odt_numero ?? 'No aplica'}</td>
                    <td>${ordenInterna.orden_trabajo?.odt_estado ?? 'No aplica'}</td>
                    <td>${ordenInterna.cliente?.cli_nombre ?? 'No aplica'}</td>
                    <td>${ordenInterna.oic_numero}</td>
                    <td>${ordenInterna.oic_fecha !== null ? parseDateSimple(ordenInterna.oic_fecha) : 'No aplica'}</td>
                    <td>${ordenInterna.area?.are_descripcion ?? 'No aplica'}</td>
                    <td class="text-center">${ordenInterna.total_materiales}</td>
                    <td>${ordenInterna.oic_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-primary btn-orden-interna-view-materiales" data-orden-interna="${ordenInterna.oic_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${ordenInterna.oic_feccreacion === null ? 'No aplica' : parseDate(ordenInterna.oic_feccreacion)}</td>
                    <td>${ordenInterna.oic_usucreacion === null ? 'No aplica' : ordenInterna.oic_usucreacion}</td>
                    <td>${ordenInterna.oic_fecmodificacion === null ? 'No aplica' : parseDate(ordenInterna.oic_fecmodificacion)}</td>
                    <td>${ordenInterna.oic_usumodificacion === null ? 'No aplica' : ordenInterna.oic_usumodificacion}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
    }

    filterFechas.on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        initPagination(filteredURL, initDataTable, dataTableOptions)
    })

    filterButton.on('click', () => {
        // seleccionamos el valor del selector
        const filterField = filterSelector.val().trim()
        // seleccionamos el valor del criterio de busqueda
        const filterValue = filterInput.val().trim()

        let filteredURL = apiURL
        // si se aplica un filtro y se ingresa un criterio de busqueda
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `&${filterField}=${encodeURIComponent(filterValue)}`
        }

        initPagination(filteredURL, initDataTable, dataTableOptions)
    })

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)

    async function traerDatosMaterialesConStockAlmacen(ordenInternaId, idAlmacen) {
        // vaciamos la tabla del modal
        $('#tableBody_detalle_materiales_orden').empty()

        // obtenemos los materiales de la orden interna
        const {data} = await client.get(`/materialesByOrdenInterna/${ordenInternaId}?alm_id=${idAlmacen}`)
        const {ordenInterna, materiales} = data
        materiales.forEach(material => {
            let condicionalReserva = true
            if(material.producto === null){
                condicionalReserva = false
            } else {
                if(material.producto.stock === null){
                    condicionalReserva = false
                } else {
                    if(parseFloat(material.producto.stock.alp_stock) < parseFloat(material.odm_cantidad)){
                        console.log(material.producto.stock.alp_stock, material.odm_cantidad)
                        condicionalReserva = false
                    }
                }
            }

            let content = `
                <tr data-detalle-material="${material.odm_id}">
                    <td>${ordenInterna.odt_numero}</td>
                    <td>${ordenInterna.oic_numero}</td>
                    <td>${parseDateSimple(material.odm_feccreacion)}</td>
                    <td>${material.odm_tipo == 1 ? 'P' : 'A'}</td>
                    <td>${material.producto?.pro_codigo || 'N/A'}</td>
                    <td>${material.odm_descripcion}</td>
                    <td>${material.odm_observacion || 'N/A'}</td>
                    <td>${material.odm_cantidad}</td>
                    <td>${material.producto?.unidad?.uni_codigo || 'N/A'}</td>
                    <td>${material.producto?.stock?.alp_stock || "0.00"}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm ${condicionalReserva ? 'btn-primary': 'btn-secondary'} me-2" ${condicionalReserva ? '' : 'disabled'}>
                                Reservar
                            </button>
                            <button class="btn btn-sm btn-success">
                                Cotizar
                            </button>
                        </div>
                    </td>
                    <td>No aplica</td>
                </tr>
            `
            $('#tableBody_detalle_materiales_orden').append(content)
        })
    }

    $('#data-container').on('click', '.btn-orden-interna-view-materiales', async function () {
        const ordenInternaId = $(this).data('orden-interna')
        const almacenDefault = 1

        // consultamos la informacion de almacenes
        const {data:almacenes} =  await client.get('/almacenesSimple')

        let selectorAlmacen = ''
        almacenes.forEach(almacen => {
            selectorAlmacen += `<option value="${almacen.alm_id}" ${almacen.alm_id === 1 ? 'selected' : ''}>${almacen.alm_descripcion}</option>`
        })

        $('#selector-almacen').html(selectorAlmacen)
        $('#selector-almacen').attr('data-orden-interna', ordenInternaId)

        await traerDatosMaterialesConStockAlmacen(ordenInternaId, almacenDefault)

        // cargamos el modal
        const loaderModalView = new bootstrap.Modal(document.getElementById('detalleMaterialesOrdenModal'))
        loaderModalView.show()
    })

    // cambiar almacen
    $('#consultar-almacen').on('click', async function () {
        const alm_id = $('#selector-almacen').val()
        const ordenInternaId = $('#selector-almacen').data('orden-interna')
        await traerDatosMaterialesConStockAlmacen(ordenInternaId, alm_id)
    })
})