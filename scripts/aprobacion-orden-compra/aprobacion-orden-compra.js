$(document).ready(() => {
    let abortController
    // URL ENDPOINT
    const apiURL = '/ordenescompra'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    const filterFechas = $('#filter-dates')

    // manejador de datos seleccionado
    const selectedRows = new Map()

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
        info: false,
        columnDefs: [
            {
                targets: [0, 1],
                orderable: false,
            }
        ]
    }

    // Inicializacion de data table
    function initDataTable(data) {
        let content = ''
        // vaciamos la lista
        $('#data-container-body').empty()
        // recorremos la lista
        data.forEach((ordecompra, index) => {
            // obtenemos los datos
            const { occ_id, occ_numero, proveedor, occ_fecha, occ_total, occ_subtotal, occ_impuesto, occ_estado, occ_fecautorizacion, occ_feccreacion, occ_usucreacion, occ_fecmodificacion, occ_usumodificacion, autorizador, tra_autorizado } = ordecompra

            const rowItem = document.createElement('tr')
            rowItem.classList.add('row-orden-compra')
            rowItem.setAttribute('data-id', occ_id)
            rowItem.innerHTML = `
            <td></td>
            <td class="text-center">
                <input type="checkbox" style="width: 25px; height: 25px; border: 2px solid black;" class="form-check-input row-select" ${selectedRows.has(occ_id) ? 'checked' : ''}/>
            </td>
            <td>${parseDateSimple(occ_fecha)}</td>
            <td>${occ_numero}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td class="text-center">${occ_subtotal}</td>
            <td class="text-center">${occ_impuesto}</td>
            <td class="text-center">${occ_total}</td>
            <td>${tra_autorizado ? autorizador.tra_nombre : 'Aún no aprobado'}</td>
            <td>${occ_fecautorizacion === null ? 'N/A' : parseDate(occ_fecautorizacion)}</td>
            <td class="text-center">
                <span class="badge bg-primary">${occ_estado}</span>
            </td>
            <td>${occ_feccreacion === null ? 'N/A' : parseDate(occ_feccreacion)}</td>
            <td>${occ_usucreacion === null ? 'N/A' : occ_usucreacion}</td>
            <td>${occ_fecmodificacion === null ? 'N/A' : parseDate(occ_fecmodificacion)}</td>
            <td>${occ_usumodificacion === null ? 'N/A' : occ_usumodificacion}</td>
            `
            // Añadimos el evento `change` al checkbox
            const checkbox = rowItem.querySelector('.row-select');
            checkbox.addEventListener('change', function () {
                const isChecked = this.checked; // Verificamos si está marcado o no
                seleccionarRowDetalle(ordecompra, isChecked); // Pasamos `material` y si está seleccionado
            });

            rowItem.addEventListener('click', function () {
                traerInformacionDetalleOrdenCompra(occ_id)
            })

            $('#data-container-body').append(rowItem)
        })
    }

    function seleccionarRowDetalle(ordecompra, isChecked) {
        if (isChecked) {
            selectedRows.set(ordecompra.occ_id, ordecompra)
        } else {
            selectedRows.delete(ordecompra.occ_id)
        }
        console.log(selectedRows)
    }

    filterFechas.on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        let filteredURL = `${apiURL}?alm_id=1&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
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
        filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`

        // debemos adjuntar el filtro de busqueda por criterio
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `&${filterField}=${encodeURIComponent(filterValue)}`
        }

        initPagination(filteredURL, initDataTable, dataTableOptions, 50)
    })

    // inicializamos la paginacion con datatable
    initPagination(`${apiURL}?fecha_desde=${moment().startOf('month').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`, initDataTable, dataTableOptions, 50)

    const traerInformacionDetalleOrdenCompra = async (id) => {
        const { data } = await client.get(`/ordencompra-detalle/${id}`)
        $("#data-container-detalle tbody").empty()
        $("#data-container-materiales tbody").empty()

        data.forEach(detalle => {
            const { detalle_material, ocd_id, odm_id, ocd_descripcion, ocd_cantidad, ocd_preciounitario, ocd_total, ocd_usucreacion, ocd_usumodificacion, ocd_feccreacion, ocd_fecmodificacion, producto } = detalle

            // creamos el row para la tabla de detalle de orden de compra
            const rowItem = document.createElement('tr')
            rowItem.className = 'row-orden-compra-detalle'
            rowItem.setAttribute('data-id', ocd_id)

            rowItem.innerHTML = `
            <td class="text-center">${detalle_material.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
            <td>${ocd_descripcion}</td>
            <td class="text-center">${producto?.uni_codigo || 'N/A'}</td>
            <td class="text-center">${ocd_cantidad}</td>
            <td class="text-center">${ocd_preciounitario}</td>
            <td class="text-center">${ocd_total}</td>
            <td>${ocd_feccreacion === null ? 'No aplica' : parseDate(ocd_feccreacion)}</td>
            <td>${ocd_usucreacion === null ? 'No aplica' : ocd_usucreacion}</td>
            <td>${ocd_fecmodificacion === null ? 'No aplica' : parseDate(ocd_fecmodificacion)}</td>
            <td>${ocd_usumodificacion === null ? 'No aplica' : ocd_usumodificacion}</td>
            `
            // rowItem.addEventListener('click', function () {
            //     traerInformacionCotizacionAsociada(odm_id)
            // })

            $('#data-container-detalle tbody').append(rowItem)

            // creamos el row para la tabla de materiales
            if(detalle_material) {
                const rowMaterial = document.createElement('tr')
                rowMaterial.className = 'row-detalle-material'
                rowMaterial.setAttribute('data-id', odm_id)

                const {odm_descripcion, odm_cantidad, odm_cantidadpendiente, odm_observacion, odm_usucreacion, odm_feccreacion, odm_usumodificacion, odm_fecmodificacion} = detalle_material

                rowMaterial.innerHTML = `
                <td class="text-center">${detalle_material.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                <td>${odm_descripcion || 'N/A'}</td>
                <td>${odm_observacion || 'N/A'}</td>
                <td class="text-center">${producto?.uni_codigo || 'N/A'}</td>
                <td>${odm_cantidad}</td>
                <td>${odm_cantidadpendiente || ''}</td>
                <td>${odm_feccreacion === null ? 'No aplica' : parseDate(odm_feccreacion)}</td>
                <td>${odm_usucreacion === null ? 'No aplica' : odm_usucreacion}</td>
                <td>${odm_fecmodificacion === null ? 'No aplica' : parseDate(odm_fecmodificacion)}</td>
                <td>${odm_usumodificacion === null ? 'No aplica' : odm_usumodificacion}</td>
                `
                $("#data-container-materiales tbody").append(rowMaterial)
            }
        })
    }

    // validacion que ordenes de compra seleccionadas no hayan sido ya aprobadas
    function validarOrdenesCompra(){
        let handleError = ""
        selectedRows.forEach((value, key) => {
            if(value.occ_estado == 'APR'){
                handleError += `- La orden de compra ${value.occ_numero} ya fué aprobada\n`
            }
        })
        return handleError
    }

    // gestion de aprobaciones, se debe seleccionar
    $("#btn-aprobar-ordenes-compra").on('click', function () {
        $("#tbl-aprobaciones-orden-compra tbody").empty()
        // si no hay ninguno seleccionado hacer validacion
        if (selectedRows.size === 0) {
            alert('Debe seleccionar al menos un registro para aprobar')
            return
        }

        // validamos que no se agregen ordenes de compra ya aprobadas
        const messagesError = validarOrdenesCompra()
        if(messagesError.length !== 0){
            alert(messagesError)
            return
        }

        selectedRows.forEach((value, key) => {
            content = `
            <tr data-id="${value.occ_id}">
                <td>${parseDate(value.occ_fecha)}</td>
                <td>${value.occ_numero}</td>
                <td>${value.proveedor.prv_nrodocumento}</td>
                <td>${value.proveedor.prv_nombre}</td>
                <td>${value.occ_subtotal}</td>
                <td>${value.occ_impuesto}</td>
                <td>${value.occ_total}</td>
                <td>
                    <span class="badge bg-primary">${value.occ_estado}</span>
                </td>
            </tr>
            `
            $("#tbl-aprobaciones-orden-compra tbody").append(content)
        })

        // abrimos el modal
        const dialogAprobacionOrdenCompra = new bootstrap.Modal(document.getElementById('aprobacionesModal'))
        dialogAprobacionOrdenCompra.show()
    })

    // accion al momento de apretar boton de aprobar
    $("#btn-aprobar-orden-compra").on('click', function () {
        const dialogModalValidacionClave = new bootstrap.Modal(document.getElementById('confirmarClavePresupuestoModal'))
        dialogModalValidacionClave.show()
        // vaceamos el input de clave
        $("#inputClaveValidacion").val('')
    })

    // validación de clave
    $("#btn-validar-clave").on('click', async function () {
        const clave = $("#inputClaveValidacion").val().trim()
        if(clave.length === 0){
            alert("La clave no puede estar vacia")
            return
        }

        const formatData = {
            ordenesCompra: [],
            clave
        }
        // debemos formar la data a aprobar
        selectedRows.forEach((value, key) => {
            formatData.ordenesCompra.push(value.occ_id)
        })

        try {
            console.log(formatData)
            await client.post('/ordencompra/aprobar-masivo', formatData)
            // cerramos el modal de clave
            const dialogModalValidacionClave = bootstrap.Modal.getInstance(document.getElementById('confirmarClavePresupuestoModal'))
            dialogModalValidacionClave.hide()

            // cerramos el modal de aprobaciones
            const dialogAprobacionOrdenCompra = bootstrap.Modal.getInstance(document.getElementById('aprobacionesModal'))
            dialogAprobacionOrdenCompra.hide()

            // vacemoas el mapa de seleccionados
            selectedRows.clear()

            // limpiamos las tablas de informacion
            limpiarTablas()

            initPagination(`${apiURL}?fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`, initDataTable, dataTableOptions, 50)
        } catch (error) {
            console.log(error)
            alert('La clave es incorrecta')
            // vaceamos el input de clave
            $("#inputClaveValidacion").val('')
        }
    })

    // limpiar tablas
    function limpiarTablas() {
        $('#data-container-materiales tbody').empty()
        $("#data-container-detalle tbody").empty()
    }
})