$(document).ready(() => {
    let abortController
    // inicializamos la data
    let dataTableMateriales
    let dataTableCotizaciones
    let dataTableOrdenesCompra

    let indiceSeleccionado

    const dataMaterialesContainer = $("#orden-materiales-container")
    const dataCotizacionesContainer = $("#cotizaciones-container")
    const dataOrdenesCompraContainer = $("#ordenes-compra-container")

    let detalleMateriales = []

    $("#fechaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $("#fechaEntregaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // ---------- CARGA DE AREAS INICIALES -----------
    const cargarTipoMonedas = async () => {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaOrdenCompraInput')

            data.forEach((moneda) => {
                const option = $(`<option ${moneda["mon_codigo"] == 'SOL' ? 'selected' : ''}>`).val(moneda["mon_codigo"]).text(moneda["mon_descripcion"])
                $monedaSelect.append(option)
            })

        } catch (error) {
            alert('Error al obtener las areas')
        }
    }

    // ---------- CARGA DE TRABAJADORES INCIALES ------------
    const cargarTrabajadores = async () => {
        try {
            const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
            const { data } = await client.get('/trabajadoresSimple')
            const $elaboradoOrdenCompraInput = $('#elaboradoOrdenCompraInput')
            const $solicitadoOrdenCompraInput = $('#solicitadoOrdenCompraInput')
            const $autorizadoOrdenCompraInput = $('#autorizadoOrdenCompraInput')

            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(trabajador => {
                const option = $('<option>').val(trabajador.tra_id).text(trabajador.tra_nombre)
                $elaboradoOrdenCompraInput.append(option.clone())
                $solicitadoOrdenCompraInput.append(option.clone())
                $autorizadoOrdenCompraInput.append(option.clone())
            })

            const { data: trabajador } = await client.get(`/trabajadorByUsuario/${usu_codigo}`)
            $elaboradoOrdenCompraInput.val(trabajador.tra_id)
        } catch (error) {
            alert('Error al obtener los encargados')
        }
    }

    // ---------- FUNCION DE INICIALIZACION DE INFORMACION ----------
    const initInformacion = async () => {
        try {
            await Promise.all([
                cargarTipoMonedas(),
                cargarTrabajadores(),
            ])
        } catch (error) {
            alert("Error al cargar los datos")
        }
    }

    // ----------- GESTION DE CREACION DE ORDEN DE COMPRA JALANDO UNA COTIZACION ------------
    const dataTableOptionsMateriales = {
        dom: '<"top d-flex justify-content-between align-items-center"<"info"i><"pagination"p>>rt',
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        info: true,
        language: {
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
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    const dataTableOptionsHistorico = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: true,
        language: {
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
        ],
        select: {
            style: 'single',
            selector: 'td.form-check-input'
        },
    }

    // ------- GESTION DE COTZACIONES DESPLEGABLE PARA CREACION DE ORDEN DE COMPRA -------

    async function initDetalleMateriales() {
        const modalDetalleMateriales = new bootstrap.Modal(document.getElementById('ordenMaterialesModal'))
        modalDetalleMateriales.show()

        try {

            if ($.fn.DataTable.isDataTable(dataMaterialesContainer)) {
                dataMaterialesContainer.DataTable().destroy();
            }

            const { data } = await client.get('/detalleMaterialesOrdenInterna-resumido-ordencompra')
            detalleMateriales = data
            let content = ''
            $('#orden-materiales-container tbody').empty()
            data.forEach((detalle, index) => {
                const { pro_id } = detalle
                content += `
                    <tr>
                        <td>
                            <input class="indice-detalle" value="${index}" type="hidden"/>
                        </td>
                        <td></td>
                        <td>
                            ${pro_id ? detalle.pro_descripcion : detalle.odm_descripcion}
                        </td>
                        <td>
                            ${pro_id ? detalle.uni_codigo : 'N/A'}
                        </td>
                        <td>
                            ${pro_id ? detalle.cantidad : detalle.odm_cantidad}
                        </td>
                        <td>
                            <select class="form-select form-select-md">
                                <option selected>Elige una opción</option>
                                <option value="">Cotización</option>
                                <option value="">Orden de Compra</option>
                                <option value="">Nuevo</option>
                            </select>
                        </td>
                        <td>
                            ${pro_id
                            ?
                            `<button class="btn btn-outline-dark w-100 btn-cotizacion">
                                ${detalle.cotizacion ?
                                `${detalle.cotizacion?.cotizacion?.proveedor?.prv_nombre || 'N/A'} - ${detalle.cotizacion?.cotizacion?.moneda?.mon_simbolo || ''} ${detalle.cotizacion?.cod_preciounitario || 'N/A'}`
                                : `Sin información`}  
                            </button>`
                            :
                            `<button class="btn btn-outline-dark w-100 btn-cotizacion">
                                Sin información
                            </button>`
                            }
                        </td>
                        <td>
                            ${pro_id
                            ?
                            `<button class="btn btn-outline-dark w-100 btn-ordencompra">
                            ${detalle.orden_compra ?
                                `${detalle.orden_compra?.orden_compra?.proveedor?.prv_nombre || 'N/A'} - ${detalle.orden_compra?.orden_compra?.moneda?.mon_simbolo || ''} ${detalle.orden_compra?.ocd_preciounitario || 'N/A'}`
                                : `Sin información`}
                            </button>`
                            :
                            `<button class="btn btn-outline-dark w-100 btn-ordencompra">
                                Sin información
                            </button>`
                        }
                        </td>
                        <td>
                            <button class="btn btn-outline-dark w-100 btn-nuevoproveedor">
                                Sin información
                            </button>
                        </td>
                    </tr>
                `
            })

            $('#orden-materiales-container tbody').html(content)
            dataTableMateriales = dataMaterialesContainer.DataTable(dataTableOptionsMateriales)
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener las ordenes de materiales")
        }
    }

    // inicializamos la información de detalle de materiales
    initDetalleMateriales()

    function initHistoricoCotizaciones(data) {
        $('#historico-cotizaciones-container-body').empty()
        data.forEach(detalle => {
            const { cotizacion, cod_preciounitario, cod_id } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')

            rowItem.innerHTML = `
            <td>
                <input class="cotizacion-detalle" type="hidden" value="${cod_id}"/>
            </td>
            <td></td>
            <td>${proveedor.prv_nombre}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${moneda.mon_simbolo} ${cod_preciounitario}</td>
            <td>${parseDateSimple(cotizacion.coc_fechacotizacion)}</td>
            <td>
                <button class="btn btn-sm btn-primary">Ver detalle</button>
            </td>
            `
            $('#historico-cotizaciones-container-body').append(rowItem)
        })
    }

    // abrimos modal de cotizaciones
    $('#orden-materiales-container tbody').on('click', '.btn-cotizacion', function() {
        const row = $(this).closest('tr')
        const index = row.find('.indice-detalle').val()
        indiceSeleccionado = index
        const detalle = detalleMateriales[index]
        if (detalle.pro_id === null) {
            alert('Este detalle no tiene asignado un producto.')
            return
        }

        try {
            const params = new URLSearchParams({
                pro_id: detalle.pro_id
            })
            const urlCotizacion = `/cotizacion-detalle-findByProducto?${params.toString()}`

            initPagination(
                urlCotizacion,
                initHistoricoCotizaciones,
                dataTableOptionsHistorico,
                10,
                "#historico-cotizaciones-container",
                "#historico-cotizaciones-container-body",
                "#pagination-container-historico-cotizaciones"
            )

        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener la información de históricos")
        }

        const modalCotizaciones = new bootstrap.Modal(document.getElementById('cotizacionesModal'))
        modalCotizaciones.show()
    })

    $("#btn-seleccionar-cotizacion").on('click', async function() {
        const dataTableCotizaciones = $("#cotizaciones-container").DataTable()
        const filasSeleccionadas = dataTableCotizaciones.row({selected: true}).nodes()
        let indiceSeleccionado = null
        $(filasSeleccionadas).each(function (index, node) {
            indiceSeleccionado = $(node).find('.cotizacion-detalle').val()
        })

        if (indiceSeleccionado === null) {
            alert('Debe seleccionar una cotización')
            return
        }

        try {
            
            const detalle = detalleMateriales[indiceSeleccionado]

        } catch(error) {

        }

    })

    // // abrimos modal de ordenes de compra
    // $('#orden-materiales-container-body').on('click', '.btn-ordencompra', function () {
    //     const index = $(this).closest('tr').data('index')
    //     console.log(index)
    //     const detalle = detalleMateriales[index]
    //     if (detalle.pro_id === null) {
    //         alert('Este detalle no tiene asignado un producto.')
    //         return
    //     }
    //     const modalOrdenesCompra = new bootstrap.Modal(document.getElementById('ordenesCompraModal'))
    //     modalOrdenesCompra.show()
    // })

    // // abrimos modal de nuevo proveedor
    // $('#orden-materiales-container-body').on('click', '.btn-nuevoproveedor', function () {
    //     const index = $(this).closest('tr').data('index')
    //     console.log(index)
    //     const modalNuevosProveedores = new bootstrap.Modal(document.getElementById('nuevoProveedorModal'))
    //     modalNuevosProveedores.show()
    // })
})