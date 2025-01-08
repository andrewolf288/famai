$(document).ready(() => {
    let abortController
    // inicializamos el datatable
    let dataTableMateriales

    let indiceSeleccionado
    const dataMaterialesContainer = $("#orden-materiales-container")
    const cuentaConSeparadoresRegex = /^[\d\- ]{8,30}$/

    // materiales disponibles para realizar orden de compra
    let detalleMateriales = []
    // detalle de orden de compra seleccionados
    let detallesOrdenCompra = []

    $("#fechaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $("#fechaEntregaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // ---------- CARGA INFORMACION DE MONEDAS --------------
    $("#monedaOrdenCompraInput").on('change', function () {
        const moneda = $(this).find('option:selected').text()
        const simboloMoneda = moneda.split(' ')[0]
        $('.moneda').text(simboloMoneda)
    })

    const cargarTipoMonedas = async () => {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaOrdenCompraInput')

            data.forEach((moneda) => {
                const option = $(`<option ${moneda["mon_codigo"] == 'SOL' ? 'selected' : ''}>`).val(moneda["mon_codigo"]).text(`${moneda["mon_simbolo"]} ${moneda["mon_descripcion"]}`)
                $monedaSelect.append(option)
            })

            const moneda = $monedaSelect.find('option:selected').text()
            const simboloMoneda = moneda.split(' ')[0]
            $('.moneda').text(simboloMoneda)
        } catch (error) {
            alert('Error al obtener las areas')
        }
    }

    // ---------- CARGA INFORMACION DE BANCOS --------------
    const cargarBancos = async () => {
        try {
            const { data } = await client.get('/entidadesbancariasSimple')
            // agregamos valor por defecto
            const defaultOptionEntidadBancararia = $('<option>').val('').text('Seleccione una entidad bancaria')
            $("#cuentaSolesProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaDolaresProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaBancoNacionProveedorSelect").append(defaultOptionEntidadBancararia.clone())

            data.forEach((banco) => {
                const option = $('<option>').val(banco["eba_id"]).text(banco["eba_descripcion"])
                $("#cuentaSolesProveedorSelect").append(option.clone())
                $("#cuentaDolaresProveedorSelect").append(option.clone())
                if (compareStringsIgnoreCaseAndAccents(banco["eba_descripcion"], 'Banco de la Nación')) {
                    $("#cuentaBancoNacionProveedorSelect").append(option.clone())
                }
            })
        } catch (error) {
            console.log(error)
        }
    }

    // ---------- CARGA DE TRABAJADORES INCIALES ------------
    const cargarTrabajadores = async () => {
        try {
            const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
            const { data } = await client.get('/trabajadoresSimple')
            const $elaboradoOrdenCompraInput = $('#elaboradoOrdenCompraInput')

            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(trabajador => {
                const option = $('<option>').val(trabajador.tra_id).text(trabajador.tra_nombre)
                $elaboradoOrdenCompraInput.append(option.clone())
            })

            const { data: trabajador } = await client.get(`/trabajadorByUsuario/${usu_codigo}`)
            $elaboradoOrdenCompraInput.val(trabajador.tra_id)
        } catch (error) {
            // alert('Error al obtener los encargados')
        }
    }

    // ---------- FUNCION DE INICIALIZACION DE INFORMACION ----------
    const initInformacion = async () => {
        try {
            await Promise.all([
                cargarTipoMonedas(),
                cargarBancos(),
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
        responsive: false,
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

        if ($.fn.DataTable.isDataTable(dataMaterialesContainer)) {
            dataMaterialesContainer.DataTable().destroy();
        }

        $('#orden-materiales-container tbody').empty()
        $('#orden-materiales-container tbody').append(`
            <tr>
                <td colspan="100%">
                    <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div class="mt-2">Cargando...</div>
                        </div>
                    </div>
                </td>
            </tr>
        `)

        try {
            const { data } = await client.get('/detalleMaterialesOrdenInterna-resumido-ordencompra')
            detalleMateriales = data
            let content = ''
            data.forEach((detalle, index) => {
                const { pro_id, pro_descripcion, uni_codigo, cantidad, cotizacion, orden_compra } = detalle
                content += `
                    <tr data-index="${index}">
                        <td>
                            <input class="indice-detalle" value="${index}" type="hidden"/>
                        </td>
                        <td></td>
                        <td>
                            ${pro_descripcion}
                        </td>
                        <td>
                            ${uni_codigo || 'N/A'}
                        </td>
                        <td>
                            ${cantidad}
                        </td>
                        <td>
                            <select class="form-select form-select-md seleccion-origen" data-indice="${index}">
                                <option value="">Elige una opción</option>
                                <option value="cotizacion">Cotización</option>
                                <option value="orden_compra">Orden de Compra</option>
                                <option selected value="nuevo_proveedor">Nuevo proveedor</option>
                            </select>
                        </td>
                        <td class="origen_cotizacion">
                            ${pro_id
                        ?
                        `<button class="btn btn-outline-dark w-100 btn-cotizacion" data-indice="${index}">
                                ${cotizacion ? `${cotizacion?.cotizacion?.proveedor?.prv_nombre || 'N/A'} - ${cotizacion?.cotizacion?.moneda?.mon_simbolo || ''} ${cotizacion?.cod_preciounitario || 'N/A'}` : `Sin información`}  
                            </button>`
                        :
                        `<button class="btn btn-outline-dark w-100 btn-cotizacion" data-indice="${index}">
                                Sin información
                            </button>`
                    }
                        </td>
                        <td class="origen_orden_compra">
                            ${pro_id
                        ?
                        `<button class="btn btn-outline-dark w-100 btn-ordencompra" data-indice="${index}">
                                ${orden_compra ? `${orden_compra?.orden_compra?.proveedor?.prv_nombre || 'N/A'} - ${orden_compra?.orden_compra?.moneda?.mon_simbolo || ''} ${orden_compra?.ocd_preciounitario || 'N/A'}` : `Sin información`}
                            </button>`
                        :
                        `<button class="btn btn-outline-dark w-100 btn-ordencompra" data-indice="${index}">
                                Sin información
                            </button>`
                    }
                        </td>
                        <td class="origen_nuevo_proveedor" data-indice="${index}">
                            <button class="btn btn-outline-dark w-100 btn-nuevoproveedor" data-indice="${index}">
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

    // --------------- GESTION DE COTIZACIONES ----------------
    // funcion que nos sirve para poder inicializar el datatable de historico de cotizaciones
    function initHistoricoCotizaciones(data) {
        $('#historico-cotizaciones-container-body').empty()
        data.forEach(detalle => {
            const { cotizacion, cod_preciounitario, cod_id } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')
            rowItem.dataset.detalle = cod_id

            rowItem.innerHTML = `
            <td></td>
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

    // Abrir modal de cotizaciones y traer cotizaciones relacionadas a producto
    $('#agrupadoDetalleOrdenCompraBody').on('click', '.btn-cotizacion', function () {
        const row = $(this)
        const producto = row.data('producto')
        try {
            const params = new URLSearchParams({
                pro_id: producto
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

        const modalCotizaciones = new bootstrap.Modal(document.getElementById('historicoCotizacionesModal'))
        modalCotizaciones.show()
    })

    $('#orden-materiales-container-body').on('click', '.btn-cotizacion', function () {
        const row = $(this)
        const index = row.data('indice')
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

        const modalCotizaciones = new bootstrap.Modal(document.getElementById('historicoCotizacionesModal'))
        modalCotizaciones.show()
    })

    // gestion de seleccion de cotizacion para orden de compra
    $("#btn-seleccionar-cotizacion").on('click', async function () {
        const dataTableCotizaciones = $("#historico-cotizaciones-container").DataTable()
        const filaSeleccionada = dataTableCotizaciones.rows({ selected: true }).nodes()
        let idDetalleCotizacion = null

        if (filaSeleccionada.length > 0) {
            idDetalleCotizacion = $(filaSeleccionada).data('detalle')
        }

        if (idDetalleCotizacion === null) {
            alert('Debe seleccionar una cotización')
            return
        }

        try {
            const { data } = await client.get(`/cotizacion-detalle-view/${idDetalleCotizacion}`)
            replicarPrecioUnitario(data.cod_preciounitario, data.detalle_material.pro_id)

            // const detalle = detalleMateriales[indiceSeleccionado]
            // detalle["cotizacion"] = data

            // // actualizamos el dom del detalle
            // const textButton = `${data.cotizacion?.proveedor?.prv_nombre || 'N/A'} - ${data.cotizacion?.moneda?.mon_simbolo || ''} ${data.cod_preciounitario || 'N/A'}`
            // $(`.btn-cotizacion[data-indice="${indiceSeleccionado}"]`).text(textButton);

            const modalCotizaciones = bootstrap.Modal.getInstance(document.getElementById('historicoCotizacionesModal'))
            modalCotizaciones.hide()
        } catch (error) {
            console.log(error)
        }
    })

    // --------------- GESTION DE ORDENES DE COMPRA ---------------
    // funcion que nos sirve para poder inicializar el datatable de historico de cotizaciones
    function initHistoricoOrdenesCompra(data) {
        $('#historico-ordenes-compra-container-body').empty()
        data.forEach(detalle => {
            const { orden_compra, ocd_preciounitario, ocd_id } = detalle
            const { proveedor, moneda } = orden_compra
            const rowItem = document.createElement('tr')
            rowItem.dataset.detalle = ocd_id

            rowItem.innerHTML = `
            <td></td>
            <td></td>
            <td>${proveedor.prv_nombre}</td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${moneda.mon_simbolo} ${ocd_preciounitario}</td>
            <td>${parseDateSimple(orden_compra.occ_fecha)}</td>
            <td>
                <button class="btn btn-sm btn-primary">Ver detalle</button>
            </td>
            `
            $('#historico-ordenes-compra-container-body').append(rowItem)
        })
    }

    // Abrir modal de cotizaciones y traer cotizaciones relacionadas a producto
    function replicarPrecioUnitario(precio_unitario, producto){
        detallesOrdenCompra.forEach(detalle => {
            if (detalle.pro_id == producto) {
                const preciounitario = obtenerValorNumerico(precio_unitario)
                const cantidad = obtenerValorNumerico(detalle.ocd_cantidad)
                detalle["ocd_preciounitario"] = preciounitario
                detalle["ocd_total"] = cantidad * preciounitario
            }
        })
        renderizarVista()
    }

    $('#agrupadoDetalleOrdenCompraBody').on('click', '.btn-ordencompra', function () {
        const row = $(this)
        const producto = row.data('producto')

        try {
            const params = new URLSearchParams({
                pro_id: producto
            })
            const urlOrdenCompra = `/ordencompra-detalle-findByProducto?${params.toString()}`

            initPagination(
                urlOrdenCompra,
                initHistoricoOrdenesCompra,
                dataTableOptionsHistorico,
                10,
                "#historico-ordenes-compra-container",
                "#historico-ordenes-compra-container-body",
                "#pagination-container-historico-ordenes-compra"
            )

        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener la información de históricos")
        }

        const modalOrdenesCompra = new bootstrap.Modal(document.getElementById('historicoOrdenesCompraModal'))
        modalOrdenesCompra.show()
    })

    $('#orden-materiales-container-body').on('click', '.btn-ordencompra', function () {
        const row = $(this)
        const index = row.data('indice')
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
            const urlOrdenCompra = `/ordencompra-detalle-findByProducto?${params.toString()}`

            initPagination(
                urlOrdenCompra,
                initHistoricoOrdenesCompra,
                dataTableOptionsHistorico,
                10,
                "#historico-ordenes-compra-container",
                "#historico-ordenes-compra-container-body",
                "#pagination-container-historico-ordenes-compra"
            )

        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener la información de históricos")
        }

        const modalOrdenesCompra = new bootstrap.Modal(document.getElementById('historicoOrdenesCompraModal'))
        modalOrdenesCompra.show()
    })

    // gestion de seleccion de cotizacion para orden de compra
    $("#btn-seleccionar-orden-compra").on('click', async function () {
        const dataTableOrdenesCompra = $("#historico-ordenes-compra-container").DataTable()
        const filaSeleccionada = dataTableOrdenesCompra.rows({ selected: true }).nodes()

        let idDetalleOrdenCompra = null

        if (filaSeleccionada) {
            idDetalleOrdenCompra = $(filaSeleccionada).data('detalle')
        }

        if (idDetalleOrdenCompra === null) {
            alert('Debe seleccionar una orden de compra')
            return
        }

        try {
            const { data } = await client.get(`/ordencompra-detalle-view/${idDetalleOrdenCompra}`)
            replicarPrecioUnitario(data.ocd_preciounitario, data.detalle_material.pro_id)

            // const detalle = detalleMateriales[indiceSeleccionado]
            // detalle["orden_compra"] = data

            // // actualizamos el dom del detalle
            // const textButton = `${data.orden_compra?.proveedor?.prv_nombre || 'N/A'} - ${data.orden_compra?.moneda?.mon_simbolo || ''} ${data.ocd_preciounitario || 'N/A'}`
            // $(`.btn-ordencompra[data-indice="${indiceSeleccionado}"]`).text(textButton);

            const modalOrdenesCompra = bootstrap.Modal.getInstance(document.getElementById('historicoOrdenesCompraModal'))
            modalOrdenesCompra.hide()
        } catch (error) {
            console.log(error)
        }
    })
    // ---------------- GESTION DE NUEVO PRECIO UNITARIO ---------------
    $('#agrupadoDetalleOrdenCompraBody').on('click', '.btn-precionuevo', function() {
        const row = $(this)
        const producto = row.data('producto')
        $("#producto-id").val(producto)

        const modalPrecioUnitarioModal = new bootstrap.Modal(document.getElementById('precioProductoModal'))
        modalPrecioUnitarioModal.show()
    })

    $("#btn-replicar-precio-unitario").on('click', function() {
        const id_producto = $("#producto-id").val()
        const precio_unitario_input = $("#precio-unitario-input-modal").val().trim()

        if(!esValorNumericoValidoYMayorQueCero(precio_unitario_input)){
            alert("Debes ingresat un valor numérico mayor a 0")
            return
        }
        replicarPrecioUnitario(precio_unitario_input, id_producto)
        $("#precio-unitario-input-modal").val("")

        const modalPrecioUnitarioModal = bootstrap.Modal.getInstance(document.getElementById('precioProductoModal'))
        modalPrecioUnitarioModal.hide()
    })

    // ----------- GESTION DE CAMBIO DE OPCION ------------
    $("#orden-materiales-container-body").on('change', '.seleccion-origen', function () {
        const rowTable = $(this).closest('tr')
        // limpiamos las clases anteriores
        rowTable.find('.origen_cotizacion').removeClass('table-success')
        rowTable.find('.origen_orden_compra').removeClass('table-success')
        rowTable.find('.origen_nuevo_proveedor').removeClass('table-success')

        // obtenemos el origen para asignar
        const origenSeleccionado = $(this).val()

        // debemos verificar que se ingreso un valor valido
        const index = $(this).data('indice')
        const detalle = detalleMateriales[index]
        if (detalle[origenSeleccionado] === undefined || detalle[origenSeleccionado] === null) {
            $(this).val('')
            alert("Seleccione un origen con un valor ingresado")
            return
        }

        const origenRow = `.origen_${origenSeleccionado}`
        rowTable.find(origenRow).addClass('table-success')
    })

    // ------------ GESTION DE NUEVO PROVEEDOR -------------
    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    $('#proveedoresInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarProveedores(query)
        } else {
            limpiarLista()
        }
    }))

    $('#proveedoresSUNAT').keypress(function (e) {
        var key = e.which
        if (key == 13) {
            const query = $('#proveedoresSUNAT').val().trim()
            buscarProveedorBySUNAT(query)
        }
    })

    // al momento de presionar enter
    $('#searchProveedorSUNAT').on('click', async function (event) {
        const query = $('#proveedoresSUNAT').val().trim()
        buscarProveedorBySUNAT(query)
    });

    async function buscarProveedorBySUNAT(documento) {
        if (documento.length < 8) {
            alert('El documento debe tener más de 8 dígitos')
            return
        }

        try {
            const { data } = await client.get(`/padronSunat?nrodocumento=${documento}`)
            const { xps_nrodocumento, xps_nombre } = data
            const formatData = {
                prv_id: null,
                prv_nrodocumento: xps_nrodocumento,
                prv_nombre: xps_nombre,
                prv_direccion: '',
                tdo_codigo: 'RUC',
                prv_telefono: '',
                prv_whatsapp: '',
                prv_contacto: '',
                prv_correo: '',
                cuentas_bancarias: []
            }
            seleccionarProveedor(formatData)
        } catch (error) {
            const { data, status } = error.response
            if (status === 404) {
                alert(data.error)
            } else {
                alert('Error al realizar la búsqueda')
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

    function seleccionarProveedor(proveedor) {
        const { prv_id, prv_nrodocumento, prv_direccion, prv_nombre, tdo_codigo, prv_whatsapp, prv_contacto, prv_correo, cuentas_bancarias } = proveedor

        $("#idProveedorOrdenCompraInput").val(prv_id)
        $("#documentoProveedorInput").val(`${tdo_codigo} - ${prv_nrodocumento}`)
        $("#razonSocialProveedorInput").val(prv_nombre)
        $("#correoProveedorInput").val(prv_correo)
        $("#contactoProveedorInput").val(prv_contacto)
        $("#whatsappProveedorInput").val(prv_whatsapp)
        $("#direccionProveedorInput").val(prv_direccion)

        // establecemos información de las cuentas bancarias
        const cuenta_banco_nacion = cuentas_bancarias.find(cuenta => compareStringsIgnoreCaseAndAccents(cuenta.entidad_bancaria?.eba_descripcion, 'Banco de la Nación'))
        const cuenta_soles = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'SOL' && cuenta.pvc_numerocuenta !== cuenta_banco_nacion.pvc_numerocuenta
            } else {
                return cuenta.mon_codigo === 'SOL'
            }
        })
        const cuenta_dolares = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'DOL' && cuenta.pvc_numerocuenta !== cuenta_banco_nacion.pvc_numerocuenta
            } else {
                return cuenta.mon_codigo === 'DOL'
            }
        })

        $("#cuentaSolesProveedorSelect").val(cuenta_soles?.eba_id || '')
        $("#cuentaSolesProveedorInput").val(cuenta_soles?.pvc_numerocuenta || '')
        $("#idCuentaBancariaSoles").val(cuenta_soles?.pvc_id || '')
        $("#cuentaDolaresProveedorSelect").val(cuenta_dolares?.eba_id || '')
        $("#cuentaDolaresProveedorInput").val(cuenta_dolares?.pvc_numerocuenta || '')
        $("#idCuentaBancariaDolares").val(cuenta_dolares?.pvc_id || '')
        $("#cuentaBancoNacionProveedorSelect").val(cuenta_banco_nacion?.eba_id || '')
        $("#cuentaBancoNacionProveedorInput").val(cuenta_banco_nacion?.pvc_numerocuenta || '')
        $("#idCuentaBancariaBancoNacion").val(cuenta_banco_nacion?.pvc_id || '')

        $('#resultadosLista').empty()
        $('#proveedoresInput').val('')
    }

    // ---------- GESTIÓN DE ITEMS SELECCIONADOS -----------
    function renderizarVista() {
        renderizarAgrupadoOrdenCompra()
        renderizarDisgregadoOrdenCompra()
        renderizarResumenOrdenCompra()
    }

    $("#btn-seleccionar-materiales-orden-compra").on('click', function () {
        // recorremos las filas seleccionadas
        const filasSeleccionadas = dataTableMateriales.rows({ selected: true }).nodes()
        const indicesSeleccionados = []
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).data('index')
            indicesSeleccionados.push(valor)
        })
        // debe al menos seleccionarse un item
        if (indicesSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un material')
            return
        }
        const dataSeleccionada = detalleMateriales.filter((detalle, index) => indicesSeleccionados.includes(index))
        const formatData = []
        // ahora debemos agregar variables adicionales para cada item
        dataSeleccionada.forEach((detalle, index) => {
            detalle.detalle.forEach(detalleMaterial => {
                const formatDetalle = {
                    ...detalleMaterial,
                    ocd_cantidad: detalleMaterial["odm_cantidad"],
                    ocd_preciounitario: 0.00,
                    ocd_total: 0.00
                }
                formatData.push(formatDetalle)
            })
        })
        detallesOrdenCompra = [...formatData]
        // mostramos la información en el detalle de orden de compra
        renderizarVista()
        // traemos la información inicial para crear la orden de compra
        initInformacion()
        // cerramos el modal de seleccion de detalles de materiales agrupados
        cerrarModalRenderDetalle()
    })

    // evento para cambiar el valor de igv
    $("#porcentajeIGVOrdenCompra").on("input", function () {
        const porcentajeIGV = $(this).val()
        if (esValorNumericoValidoYMayorQueCero(porcentajeIGV)) {
            renderizarResumenOrdenCompra()
        } else {
            alert('El porcentaje de IGV debe ser un valor numérico mayor que cero')
            $(this).val(18)
        }
    })

    // funcion para actualizar resumen de orden de compra
    function renderizarResumenOrdenCompra() {
        let subtotal = 0.00
        detallesOrdenCompra.forEach(detalle => {
            subtotal += detalle.ocd_total
        })

        const igvPorcentaje = obtenerValorNumerico($("#porcentajeIGVOrdenCompra").val())
        const igv = (subtotal * igvPorcentaje) / 100
        const total = subtotal + igv;

        $("#subtotalOrdenCompra").text(subtotal.toFixed(2))
        $("#igvOrdenCompra").text(igv.toFixed(2))
        $("#totalOrdenCompra").text(total.toFixed(2))
    }

    // funcion para renderizar detalle de orden de compra
    function renderizarAgrupadoOrdenCompra() {
        let content = ''
        $("#agrupadoDetalleOrdenCompraBody").empty()
        // agrupamos de la siguiente manera
        const formatDataAgrupada = Object.values(
            detallesOrdenCompra.reduce((acumulador, item) => {
                const key = `${item.pro_id}-${item.ocd_preciounitario}`

                if (!acumulador[key]) {
                    acumulador[key] = {
                        pro_id: item.pro_id,
                        descripcion: item.odm_descripcion,
                        unidad: item.producto?.uni_codigo || null,
                        cantidad_requerida: 0,
                        cantidad_pedida: 0,
                        precio_unitario: item.ocd_preciounitario,
                        precio_total: 0
                    }
                }

                acumulador[key].cantidad_requerida += parseFloat(item.odm_cantidadpendiente) || 0
                acumulador[key].cantidad_pedida += parseFloat(item.ocd_cantidad) || 0
                acumulador[key].precio_total += parseFloat(item.ocd_total) || 0

                return acumulador
            }, {})
        )

        // construimos el HTML
        formatDataAgrupada.forEach((detalle, index) => {
            const { pro_id, descripcion, unidad, cantidad_requerida, cantidad_pedida, precio_unitario, precio_total } = detalle
            content += `
            <tr data-index="${index}">
                <td class="text-center">${index + 1}</td>
                <td>${descripcion}</td>
                <td class="text-center">${unidad || 'N/A'}</td>
                <td class="text-center">${cantidad_requerida.toFixed(2)}</td>
                <td class="text-center">${cantidad_pedida.toFixed(2)}</td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="moneda me-1"></span>
                        ${precio_unitario.toFixed(2)}
                    </div>
                </td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="moneda me-1"></span>
                        ${precio_total.toFixed(2)}
                    </div>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm ${pro_id == null ? 'btn-secondary' : 'btn-primary'} btn-cotizacion me-2" data-producto="${pro_id}" ${pro_id == null ? 'disabled' : ''}>
                        CT
                    </button>
                    <button class="btn btn-sm ${pro_id == null ? 'btn-secondary' : 'btn-primary'} btn-ordencompra me-2" data-producto="${pro_id}" ${pro_id == null ? 'disabled' : ''}>
                        OC
                    </button>
                    <button class="btn btn-sm ${pro_id == null ? 'btn-secondary' : 'btn-primary'} btn-precionuevo" data-producto="${pro_id}" ${pro_id == null ? 'disabled' : ''}>
                        NP
                    </button>
                </td>
            </tr>
            `
        })
        $("#agrupadoDetalleOrdenCompraBody").html(content)
    }

    // funcion para renderizar detalle agrupado de materiales
    function renderizarDisgregadoOrdenCompra() {
        $("#disgregadoDetalleOrdenCompraBody").empty()
        console.log(detallesOrdenCompra)
        // recorremos el detalle material para completar la información
        detallesOrdenCompra.forEach((material, index) => {
            const { odm_id, producto, orden_interna_parte, odm_descripcion, odm_observacion, odm_feccreacion, odm_cantidadpendiente, ocd_cantidad, ocd_preciounitario, ocd_total } = material
            const { orden_interna } = orden_interna_parte
            const { odt_numero } = orden_interna

            const rowItem = document.createElement('tr')
            rowItem.dataset.detalle = odm_id
            rowItem.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${odt_numero || 'N/A'}</td>
                <td>${parseDate(odm_feccreacion)}</td>
                <td>${producto?.pro_codigo || ''}${producto?.pro_codigo ? ' - ' : ''}${odm_descripcion || 'N/A'}</td>
                <td>${odm_observacion || 'N/A'}</td>
                <td class="text-center">${producto?.uni_codigo || 'N/A'}</td>
                <td class="text-center align-middle">${odm_cantidadpendiente}</td>
                <td class="text-center align-middle">
                    <input type="number" class="form-control cantidad-pedido-input" value="${ocd_cantidad}" />
                </td>
                <td class="text-center align-middle">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="moneda me-1"></span>
                        <input type="number" class="form-control precio-unitario-input" value="${ocd_preciounitario}" />
                    </div>
                </td>
                <td class="text-center align-middle total-input">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="moneda me-1"></span>
                        ${ocd_total}
                    </div>
                </td>
                <td class="text-center">
                    <!--
                    <button class="btn btn-sm btn-warning editar-detalle-material" data-id-detalle="${odm_id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-success guardar-detalle-material" data-id-detalle="${odm_id}" style="display: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                            <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                            <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                        </svg>
                    </button>-->
                    <button class="btn btn-sm btn-danger eliminar-detalle-material me-2" data-id-detalle="${odm_id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                </td>
            `
            $("#disgregadoDetalleOrdenCompraBody").append(rowItem)
        })
    }

    // gestionamos la funcion de eliminacion
    $(`#disgregadoDetalleOrdenCompraBody`).on('click', '.eliminar-detalle-material', function () {
        // obtenemos el id del detalle
        const id_detalle = $(this).data('id-detalle')
        // obtenemos el detalle del material
        // obtenemos el indice del detalle
        const indice = detallesOrdenCompra.findIndex(material => material.odm_id == id_detalle)
        // eliminamos el detalle
        detallesOrdenCompra.splice(indice, 1)
        // renderizamos la vista
        renderizarVista()
    })

    // escuchamos los cambios en los inputs de cantidad y de precio unitario
    $(`#disgregadoDetalleOrdenCompraBody`).on('input', '.cantidad-pedido-input, .precio-unitario-input', function () {
        // obtenemos el id del detalle
        const row = $(this).closest('tr')
        const id_detalle = row.data('detalle')
        const cantidadDetalle = obtenerValorNumerico(row.find('.cantidad-pedido-input').val())
        const precioUnitarioDetalle = obtenerValorNumerico(row.find('.precio-unitario-input').val())
        const precioTotalDetalle = cantidadDetalle * precioUnitarioDetalle
        // obtenemos el indice del detalle
        const indice = detallesOrdenCompra.findIndex(detalle => detalle.odm_id == id_detalle)
        detallesOrdenCompra[indice].ocd_cantidad = cantidadDetalle
        detallesOrdenCompra[indice].ocd_preciounitario = precioUnitarioDetalle
        detallesOrdenCompra[indice].ocd_total = precioTotalDetalle
        // volvemos a renderizar
        row.find('.total-input').text(precioTotalDetalle)
        // renderizarVista()
        renderizarAgrupadoOrdenCompra()
        renderizarResumenOrdenCompra()
    })

    function cerrarModalRenderDetalle() {
        const modalMateriales = bootstrap.Modal.getInstance(document.getElementById('ordenMaterialesModal'))
        modalMateriales.hide()
    }

    // funcion para crear orden de compra
    $("#btn-guardar-orden-compra").on('click', function () {
        crearOrdenCompra()
    })

    // funcion para validar
    function validarDetalleOrdenCompra() {
        let handleError = []
        detallesOrdenCompra.forEach(detalle => {
            let messageErrorValidation = ""
            if (!esValorNumericoValidoYMayorQueCero(detalle.ocd_cantidad)) {
                messageErrorValidation += "- La cantidad pedida debe ser un número mayor que cero\n"
            }
            if (!esValorNumericoValidoYMayorQueCero(detalle.ocd_preciounitario)) {
                messageErrorValidation += "- El precio unitario debe ser un número mayor que cero\n"
            }
            if (esValorNumericoValidoYMayorQueCero(detalle.ocd_cantidad) && esValorNumericoValidoYMayorQueCero(detalle.odm_cantidadpendiente)) {
                if (detalle.ocd_cantidad > detalle.odm_cantidadpendiente) {
                    messageErrorValidation += "- La cantidad pedida debe ser menor o igual a la cantidad requerida\n"
                }
            }

            if (messageErrorValidation.length > 0) {
                const messageError = `El detalle \"${detalle.odm_descripcion}\" ${detalle.orden_interna_parte?.orden_interna?.odt_numero ? `de la OT ${detalle.orden_interna_parte.orden_interna.odt_numero}` : ""} tiene los siguientes errores:\n ${messageErrorValidation}`
                handleError.push(messageError)
            }
        })

        return handleError;
    }

    // -------- GESTIONAMOS EL INGRESO DE PRODUCTOS ADICIONALES ----------
    function limpiarListaMateriales() {
        $("#resultadosListaMateriales").empty()
    }
    // funcion cargar modal de productos
    $('#addProductBtn').on('click', async (event) => {
        // reseteamos el modal
        $('#productosInput').val('')
        limpiarListaMateriales()
        $('#tbl-orden-compra-productos tbody').empty()
        // mostramos el modal
        $('#addProductModal').modal('show')
    })

    // al momento de ir ingresando valores en el input
    $('#productosInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarMateriales(query)
        } else {
            limpiarListaMateriales()
        }
    }))

    // al momento de presionar enter
    // $('#productosInput').on('keydown', function (event) {
    //     // si es la tecla de enter
    //     if (event.keyCode === 13) {
    //         event.preventDefault();
    //         const isChecked = $('#checkAsociarProducto').is(':checked')
    //         // si se desea agregar un producto sin código
    //         if (isChecked) {
    //             ingresarProductoSinCodigo()
    //         } else {
    //             return
    //         }
    //     }
    // });

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
            limpiarListaMateriales()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Petición abortada'); // Maneja el error de la petición abortada
            } else {
                console.error('Error al buscar materiales:', error);
                alert('Error al buscar materiales. Inténtalo de nuevo.'); // Muestra un mensaje de error al usuario
            }
        }
    }

    // function ingresarProductoSinCodigo() {
    //     const pro_codigo = ""
    //     const pro_descripcion = $.trim($('#productosInput').val())

    //     if (pro_descripcion.length < 3) {
    //         alert('La descripción debe tener al menos 3 caracteres')
    //     } else {
    //         $('#productosInput').val('')
    //         const rowItem = document.createElement('tr')
    //         rowItem.innerHTML = `
    //             <td class="producto-codigo">${pro_codigo}</td>
    //             <td>
    //                 <input type="text" class="form-control descripcion-input" value='${pro_descripcion}'/>
    //             </td>
    //             <td class="text-center unidad-codigo">N/A</td>
    //             <td class="text-center">
    //                 <input type="number" class="form-control cantidad-input" value='1.00'/>
    //             </td>
    //             <td class="text-center">
    //                 <input type="number" class="form-control precio-input" value=''/>
    //             </td>
    //             <td class="text-center total-input"></td>
    //          `
    //         const cantidad = rowItem.querySelector('.cantidad-input')
    //         const precio = rowItem.querySelector('.precio-input')

    //         cantidad.addEventListener('input', function () {
    //             const total = parseFloat(cantidad.value) * parseFloat(precio.value);
    //             if (!isNaN(total)) {
    //                 rowItem.querySelector('.total-input').textContent = total.toFixed(2);
    //             } else {
    //                 rowItem.querySelector('.total-input').textContent = '';
    //             }
    //         })

    //         precio.addEventListener('input', function () {
    //             const total = parseFloat(cantidad.value) * parseFloat(precio.value);
    //             if (!isNaN(total)) {
    //                 rowItem.querySelector('.total-input').textContent = total.toFixed(2);
    //             } else {
    //                 rowItem.querySelector('.total-input').textContent = '';
    //             }
    //         });
    //         $('#tbl-orden-compra-productos tbody').html(rowItem)
    //     }
    // }

    async function seleccionarMaterial(material) {
        const { pro_codigo, pro_descripcion, uni_codigo } = material
        let producto

        // consultamos si el material ya existe en nuestra base de datos
        try {
            const {data} = await client.get(`/productoByCodigo?pro_codigo=${pro_codigo}`)
            producto = data
        } catch (error) {
            producto = null
        }

        // limpiamos el input
        limpiarListaMateriales()
        $('#productosInput').val('')

        const rowItem = document.createElement('tr')
        rowItem.innerHTML = `
        <input class="producto-id" value="${producto ? producto.pro_id : null}" type="hidden"/>
        <td class="producto-codigo">${producto ? producto.pro_codigo : pro_codigo}</td>
        <td class="descripcion-input">${producto ? producto.pro_descripcion : pro_descripcion}</td>
        <td class="text-center unidad-codigo">${producto ? producto.uni_codigo : uni_codigo}</td>
        <td class="text-center">
            <input type="number" class="form-control cantidad-input" value='1.00'/>
        </td>
        <td class="text-center">
            <input type="number" class="form-control precio-input" value=''/>
        </td>
        <td class="text-center total-input"></td>
        `

        const cantidad = rowItem.querySelector('.cantidad-input')
        const precio = rowItem.querySelector('.precio-input')

        cantidad.addEventListener('input', function () {
            const total = parseFloat(cantidad.value) * parseFloat(precio.value);
            if (!isNaN(total)) {
                rowItem.querySelector('.total-input').textContent = total.toFixed(2);
            } else {
                rowItem.querySelector('.total-input').textContent = '';
            }
        })

        precio.addEventListener('input', function () {
            const total = parseFloat(cantidad.value) * parseFloat(precio.value);
            if (!isNaN(total)) {
                rowItem.querySelector('.total-input').textContent = total.toFixed(2);
            } else {
                rowItem.querySelector('.total-input').textContent = '';
            }
        });

        $('#tbl-orden-compra-productos tbody').html(rowItem)
    }

    // boton de agregar producto
    $('#btn-agregar-producto').on('click', function () {
        const productos = $('#tbl-orden-compra-productos tbody tr')
        let handleError = ''
        if (productos.length > 0) {
            let fila = $(productos[0])

            const pro_id = fila.find('.producto-id').val()
            const uni_codigo = fila.find('.unidad-codigo').text()
            const pro_codigo = fila.find('.producto-codigo').text()
            const descripcion = fila.find('.descripcion-input').text().trim()
            const precio_unitario = fila.find('.precio-input').val().trim()
            const cantidad = fila.find('.cantidad-input').val().trim()
            const total = fila.find('.total-input').text()

            if (!esValorNumericoValidoYMayorQueCero(cantidad) || !esValorNumericoValidoYMayorQueCero(precio_unitario) || descripcion.length < 3) {
                if (!esValorNumericoValidoYMayorQueCero(cantidad)) {
                    handleError += '- La cantidad debe ser un valor numérico mayor a 0\n'
                }
                if (!esValorNumericoValidoYMayorQueCero(precio_unitario)) {
                    handleError += '- El precio debe ser un valor numérico mayor a 0\n'
                }
            }

            if (handleError.length > 0) {
                alert(handleError)
                return
            } else {
                const formatData = {
                    odm_id: null,
                    producto: {
                        pro_id: pro_id,
                        pro_codigo: pro_codigo,
                        uni_codigo: uni_codigo
                    },
                    odm_descripcion: descripcion,
                    odm_observacion: null,
                    odm_feccreacion: null,
                    odm_cantidadpendiente: obtenerValorNumerico(cantidad),
                    orden_interna_parte: {
                        orden_interna: {
                            odt_numero: null,
                        }
                    },
                    ocd_cantidad: obtenerValorNumerico(cantidad),
                    ocd_preciounitario: obtenerValorNumerico(precio_unitario),
                    ocd_total: obtenerValorNumerico(total),
                }

                detallesOrdenCompra.push(formatData)
                renderizarVista()

                // ocultamos el modal de ingreso de información de producto
                const getInstanceModal = bootstrap.Modal.getInstance(modalAgregarProducto)
                getInstanceModal.hide()
            }
        } else {
            alert('Por favor, agregue un producto')
        }
    })

    async function crearOrdenCompra() {
        // datos del proveedor
        const idProveedorInput = $("#idProveedorOrdenCompraInput").val()
        const razonsocialProveedorInput = $("#razonSocialProveedorInput").val().trim()
        const documentoProveedorInput = $("#documentoProveedorInput").val().trim()
        const correoProveedorInput = $("#correoProveedorInput").val().trim()
        const contactoProveedorInput = $("#contactoProveedorInput").val().trim()
        const whatsappProveedorInput = $("#whatsappProveedorInput").val().trim()
        const direccionProveedorInput = $("#direccionProveedorInput").val().trim()
        const entidadBancariaSolesInput = $("#cuentaSolesProveedorSelect").val().trim()
        const cuentaBancariaSolesInput = $("#cuentaSolesProveedorInput").val().trim()
        const idCuentaBancariaSolesInput = $("#idCuentaBancariaSoles").val().trim()
        const entidadBancariaDolaresInput = $("#cuentaDolaresProveedorSelect").val().trim()
        const cuentaBancariaDolaresInput = $("#cuentaDolaresProveedorInput").val().trim()
        const idCuentaBancariaDolaresInput = $("#idCuentaBancariaDolares").val().trim()
        const entidadBancariaBancoNacionInput = $("#cuentaBancoNacionProveedorSelect").val().trim()
        const cuentaBancariaBancoNacionInput = $("#cuentaBancoNacionProveedorInput").val().trim()
        const idCuentaBancariaBancoNacionInput = $("#idCuentaBancariaBancoNacion").val().trim()

        // datos de la orden de compra
        const moneda = $("#monedaOrdenCompraInput").val()
        const forma_pago = $("#formaDePagoOrdenCompraInput").val()
        const fecha_orden = $("#fechaOrdenCompraPicker").val()
        const fecha_entrega = $("#fechaEntregaOrdenCompraPicker").val()
        const referencia = $("#referenciaOrdenCompraInput").val()
        const elaborante = $("#elaboradoOrdenCompraInput").val()
        const notas = $("#notaOrdenCompraInput").val()
        const adelanto = $("#adelantoOrdenCompraInput").val()
        const saldo = $("#saldoOrdenCompraInput").val()
        const observacion_pago = $("#observacionPagoOrdenCompraInput").val()
        const subtotal = $("#subtotalOrdenCompra").text()
        const porcentajeigv = $("#porcentajeIGVOrdenCompra").val()
        const impuesto = $("#igvOrdenCompra").text()
        const total = $("#totalOrdenCompra").text()

        let handleError = ""

        if (detallesOrdenCompra.length === 0) {
            handleError += "- Debe ingresar un detalle de orden de compra\n"
        }
        if (documentoProveedorInput.length === 0) {
            handleError += "- Debe seleccionar un proveedor\n"
        }
        if (moneda.length === 0) {
            handleError += "- Debe seleccionar una moneda\n"
        }
        if (forma_pago.length === 0) {
            handleError += "- Debe seleccionar una forma de pago\n"
        }
        if (fecha_orden.length === 0) {
            handleError += "- Debe seleccionar una fecha de orden de compra\n"
        }
        if (fecha_entrega.length === 0) {
            handleError += "- Debe seleccionar una fecha de entrega\n"
        }
        if (elaborante.length === 0) {
            handleError += "- Debe ingresar el trabajador elaborador\n"
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        // debemos validar la informacion
        const arrayError = validarDetalleOrdenCompra()
        if (arrayError.length > 0) {
            const messageError = arrayError.join("\n")
            alert(messageError)
            return
        }

        // debemos formar la data de cuentas bancarias
        const cuentasBancarias = []
        const handleErrorsCuentasBancarias = []

        // validamos cuenta en soles
        if (entidadBancariaSolesInput.length != 0 && cuentaConSeparadoresRegex.test(cuentaBancariaSolesInput)) {
            cuentasBancarias.push({
                pvc_id: idCuentaBancariaSolesInput.length != 0 ? idCuentaBancariaSolesInput : null,
                eba_id: entidadBancariaSolesInput,
                pvc_numerocuenta: cuentaBancariaSolesInput,
                mon_codigo: 'SOL'
            })
        } else {
            handleErrorsCuentasBancarias.push('La cuenta bancaria en soles es inválida')
        }

        // validamos cuenta en dolares
        if (entidadBancariaDolaresInput.length != 0 && cuentaConSeparadoresRegex.test(cuentaBancariaDolaresInput)) {
            cuentasBancarias.push({
                pvc_id: idCuentaBancariaDolaresInput.length != 0 ? idCuentaBancariaDolaresInput : null,
                eba_id: entidadBancariaDolaresInput,
                pvc_numerocuenta: cuentaBancariaDolaresInput,
                mon_codigo: 'DOL'
            })
        } else {
            handleErrorsCuentasBancarias.push('La cuenta bancaria en dolares es inválida')
        }

        // validamos cuenta del banco de la nacion
        if (entidadBancariaBancoNacionInput.length != 0 && cuentaConSeparadoresRegex.test(cuentaBancariaBancoNacionInput)) {
            cuentasBancarias.push({
                pvc_id: idCuentaBancariaBancoNacionInput.length != 0 ? idCuentaBancariaBancoNacionInput : null,
                eba_id: entidadBancariaBancoNacionInput,
                pvc_numerocuenta: cuentaBancariaBancoNacionInput,
                mon_codigo: 'SOL'
            })
        } else {
            handleErrorsCuentasBancarias.push('La cuenta bancaria del banco de la nación es inválida')
        }

        if (cuentasBancarias.length == 0) {
            alert('Debes agregar información válida de al menos una cuenta bancaria')
            return
        }

        // verificamos la forma de impresión
        const confirmar = confirm('¿Deseas imprimir la orden de compra de manera disgregada?')

        // formateamos el detalle de orden de compra
        const formatDataDetalles = []
        detallesOrdenCompra.forEach((detalle, index) => {
            formatDataDetalles.push({
                ocd_orden: index + 1,
                odm_id: detalle.odm_id,
                pro_id: detalle.pro_id,
                ocd_descripcion: detalle.odm_descripcion,
                ocd_cantidad: detalle.ocd_cantidad,
                ocd_preciounitario: detalle.ocd_preciounitario,
                ocd_total: detalle.ocd_total,
            })
        })

        // formateamos la data de orden de compra
        const formatDataOrdenCompra = {
            occ_fecha: fecha_orden,
            occ_fechaentrega: fecha_entrega,
            mon_codigo: moneda,
            occ_referencia: referencia || null,
            occ_formapago: forma_pago,
            tra_elaborado: elaborante,
            occ_notas: notas || null,
            occ_adelanto: adelanto || null,
            occ_saldo: saldo || null,
            occ_observacionpago: observacion_pago || null,
            occ_subtotal: subtotal,
            occ_impuesto: impuesto,
            occ_total: total,
            occ_igv: porcentajeigv,
            detalle_productos: formatDataDetalles,
            proveedor: {
                prv_id: idProveedorInput,
                prv_nombre: razonsocialProveedorInput,
                prv_nrodocumento: documentoProveedorInput.split('-')[1].trim(),
                prv_correo: correoProveedorInput,
                prv_contacto: contactoProveedorInput,
                prv_whatsapp: whatsappProveedorInput,
                prv_direccion: direccionProveedorInput,
                cuentas_bancarias: cuentasBancarias
            },
            imprimir_disgregado: confirmar
        }

        console.log(formatDataOrdenCompra)

        try {
            const response = await client.post('ordenescompra', formatDataOrdenCompra, {
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `ordencompra.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);
            window.location.href = `orden-compra`
        } catch (error) {
            console.log(error)
            alert("Hubo un error al crear la orden de compra")
        }
    }
})