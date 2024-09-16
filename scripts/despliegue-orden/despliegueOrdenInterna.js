$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna?alm_id=1'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')
    // const filterFechas = $('#filter-dates')

    // -------- MANEJO DE FECHA ----------
    // $("#fechaDesde").datepicker({
    //     dateFormat: 'dd/mm/yy',
    //     setDate: new Date()
    // }).datepicker("setDate", new Date())
    // $("#fechaHasta").datepicker({
    //     dateFormat: 'dd/mm/yy',
    //     setDate: new Date()
    // }).datepicker("setDate", new Date())

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
        console.log(data)
        data.forEach((material, index) => {
            // obtenemos los datos
            const {producto, orden_interna_parte} = material
            const {orden_interna} = orden_interna_parte
            const {oic_numero, odt_numero} = orden_interna

            // debemos obtener la condicion de reserva segun los stocks requeridos y disponibles
            let condicionalReserva = true
            if(producto === null){
                condicionalReserva = false
            } else {
                if(producto.stock === null){
                    condicionalReserva = false
                } else {
                    if(parseFloat(producto.stock.alp_stock) < parseFloat(material.odm_cantidad)){
                        console.log(producto.stock.alp_stock, material.odm_cantidad)
                        condicionalReserva = false
                    }
                }
            }

            content += `
                <tr>
                    <td>${odt_numero}</td>
                    <td>${oic_numero}</td>
                    <td>${parseDateSimple(material.odm_feccreacion)}</td>
                    <td>${material.odm_tipo == 1 ? 'P' : 'A'}</td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td>${material.odm_descripcion}</td>
                    <td>${material.odm_observacion || 'N/A'}</td>
                    <td>${material.odm_cantidad}</td>
                    <td>${producto?.unidad?.uni_codigo || 'N/A'}</td>
                    <td>${producto?.stock?.alp_stock || "0.00"}</td>
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
        })
        $('#data-container-body').html(content)
    }

    // filterFechas.on('click', () => {
    //     const fechaDesde = transformarFecha($('#fechaDesde').val())
    //     const fechaHasta = transformarFecha($('#fechaHasta').val())
    //     let filteredURL = `${apiURL}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
    //     initPagination(filteredURL, initDataTable, dataTableOptions)
    // })

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
        console.log(filteredURL)

        initPagination(filteredURL, initDataTable, dataTableOptions)
    })

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)

    // async function traerDatosMaterialesConStockAlmacen(ordenInternaId, idAlmacen) {
    //     // vaciamos la tabla del modal
    //     $('#tableBody_detalle_materiales_orden').empty()

    //     // obtenemos los materiales de la orden interna
    //     const {data} = await client.get(`/materialesByOrdenInterna/${ordenInternaId}?alm_id=${idAlmacen}`)
    //     const {ordenInterna, materiales} = data
    //     materiales.forEach(material => {
    //         let condicionalReserva = true
    //         if(producto === null){
    //             condicionalReserva = false
    //         } else {
    //             if(producto.stock === null){
    //                 condicionalReserva = false
    //             } else {
    //                 if(parseFloat(producto.stock.alp_stock) < parseFloat(material.odm_cantidad)){
    //                     console.log(producto.stock.alp_stock, material.odm_cantidad)
    //                     condicionalReserva = false
    //                 }
    //             }
    //         }

    //         let content = `
    //             <tr data-detalle-material="${material.odm_id}">
    //                 <td>${ordenInterna.odt_numero}</td>
    //                 <td>${ordenInterna.oic_numero}</td>
    //                 <td>${parseDateSimple(material.odm_feccreacion)}</td>
    //                 <td>${material.odm_tipo == 1 ? 'P' : 'A'}</td>
    //                 <td>${producto?.pro_codigo || 'N/A'}</td>
    //                 <td>${material.odm_descripcion}</td>
    //                 <td>${material.odm_observacion || 'N/A'}</td>
    //                 <td>${material.odm_cantidad}</td>
    //                 <td>${producto?.unidad?.uni_codigo || 'N/A'}</td>
    //                 <td>${producto?.stock?.alp_stock || "0.00"}</td>
    //                 <td>
    //                     <div class="d-flex justify-content-around">
    //                         <button class="btn btn-sm ${condicionalReserva ? 'btn-primary': 'btn-secondary'} me-2" ${condicionalReserva ? '' : 'disabled'}>
    //                             Reservar
    //                         </button>
    //                         <button class="btn btn-sm btn-success">
    //                             Cotizar
    //                         </button>
    //                     </div>
    //                 </td>
    //                 <td>No aplica</td>
    //             </tr>
    //         `
    //         $('#tableBody_detalle_materiales_orden').append(content)
    //     })
    // }

    // $('#data-container').on('click', '.btn-orden-interna-view-materiales', async function () {
    //     const ordenInternaId = $(this).data('orden-interna')
    //     const almacenDefault = 1

    //     // consultamos la informacion de almacenes
    //     const {data:almacenes} =  await client.get('/almacenesSimple')

    //     let selectorAlmacen = ''
    //     almacenes.forEach(almacen => {
    //         selectorAlmacen += `<option value="${almacen.alm_id}" ${almacen.alm_id === 1 ? 'selected' : ''}>${almacen.alm_descripcion}</option>`
    //     })

    //     $('#selector-almacen').html(selectorAlmacen)
    //     $('#selector-almacen').attr('data-orden-interna', ordenInternaId)

    //     await traerDatosMaterialesConStockAlmacen(ordenInternaId, almacenDefault)

    //     // cargamos el modal
    //     const loaderModalView = new bootstrap.Modal(document.getElementById('detalleMaterialesOrdenModal'))
    //     loaderModalView.show()
    // })

    // // cambiar almacen
    // $('#consultar-almacen').on('click', async function () {
    //     const alm_id = $('#selector-almacen').val()
    //     const ordenInternaId = $('#selector-almacen').data('orden-interna')
    //     await traerDatosMaterialesConStockAlmacen(ordenInternaId, alm_id)
    // })
})