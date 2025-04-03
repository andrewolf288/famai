$(document).ready(() => {
    let abortController
    let dataTable
    const dataContainer = $('#data-container')
    const apiURL = '/ordencompra-pendientes-ingresar'

    $("#fechaDocumentoReferenciaPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate())

    $("#fechaMovimientoNotaIngresoPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate())

    // configuracion de opciones de datatable
    const dataTableOptionsOrdenesCompraPendientes = {
        detroy: true,
        reponsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        searching: false,
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
            }
        ],
        select: {
            style: 'single',
            selector: 'td.form-check-input'
        },
    }

    const dataTableOptionsMaterialesOrdenInterna = {
        detroy: true,
        reponsive: true,
        paging: true,
        pageLength: 20,
        lengthMenu: [20, 50, 100, 150],
        searching: false,
        info: false,
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
            }
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    async function initDataTable(URL = apiURL) {
        // verificamos que no se haya inicializado el datatable
        if ($.fn.DataTable.isDataTable(dataContainer)) {
            dataContainer.DataTable().destroy();
        }

        // vaciamos la lista
        $('#data-container-body').empty()
        // agregamos un loader
        $('#data-container-body').append(`
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
            const { data } = await client.get(URL)
            let content = ''
            data.forEach((ordenCompra, index) => {
                const { occ_id, moneda, proveedor, occ_numero, occ_fecha, occ_total, occ_subtotal, occ_impuesto, items_pendientes } = ordenCompra

                content += `
                <tr data-detalle=${occ_id}>
                    <td></td>
                    <td></td>
                    <td>${parseDateSimple(occ_fecha)}</td>
                    <td>${occ_numero}</td>
                    <td>${proveedor.prv_nrodocumento || 'N/A'}</td>
                    <td>${proveedor.prv_nombre || 'N/A'}</td>
                    <td>${moneda.mon_descripcion}</td>
                    <td>${moneda.mon_simbolo} ${occ_subtotal}</td>
                    <td>${moneda.mon_simbolo} ${occ_impuesto}</td>
                    <td>${moneda.mon_simbolo} ${occ_total}</td>
                    <td>
                        <button class="btn btn-sm btn-primary detalle-items-pendientes">${items_pendientes} item(s) por ingresar</button>
                    </td>
                </tr>
                `
            })

            $('#data-container-body').html(content)
            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptionsOrdenesCompraPendientes)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    // initializamos el datatable
    initDataTable(apiURL)

    // accion para cuando se quiera ver el detalle de orde de compra pendientes
    $('#data-container').on('click', '.detalle-items-pendientes', async function () {
        const row = $(this).closest('tr')
        const id_detalle = row.data('detalle')

        $("#data-container-pendiente-detalle-ordencompra tbody").empty()

        try {
            const { data } = await client.get(`/ordencompra-pendientes-entregar/${id_detalle}`)
            const { orden_compra, detalles } = data
            const { moneda } = orden_compra
            let content = ''
            detalles.forEach((detalle, index) => {
                const { detalle_material, ocd_porcentajedescuento, ocd_fechaentrega, ocd_descripcion, producto, ocd_cantidad, ocd_cantidadingresada, ocd_preciounitario, ocd_total, ocd_observaciondetalle, ocd_observacion } = detalle
                content += `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${detalle_material?.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                        <td>${ocd_porcentajedescuento}</td>
                        <td>${parseDateSimple(ocd_fechaentrega)}</td>
                        <td>${ocd_descripcion}</td>
                        <td class="text-center">${producto?.uni_codigo}</td>
                        <td class="text-center">${ocd_cantidad}</td>
                        <td class="text-center">${ocd_cantidadingresada}</td>
                        <td class="text-center">${moneda.mon_simbolo} ${ocd_preciounitario}</td>
                        <td class="text-center">${moneda.mon_simbolo} ${ocd_total}</td>
                        <td>${ocd_observaciondetalle || 'N/A'}</td>
                        <td>${ocd_observacion || 'N/A'}</td>
                    </tr>
                `
            })

            $("#data-container-pendiente-detalle-ordencompra tbody").html(content)

            showModalDetallesPendientesOrdenCompra()
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    })

    // ------ GESTION DE EMISIÓN DE NOTA DE INGRESO -------
    $("#btn-crear-nota-ingreso").on('click', async function () {
        // primero debemos verificar si se esta jalando de una orden de compra
        const filasSeleccionadas = dataTable.rows({ selected: true }).nodes()
        let valorSeleccionado = null
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).closest('tr').data('detalle')
            valorSeleccionado = valor;
        });

        // inicializamos la información
        initInformacionMaestros()

        // debemos completar las 2 casuisticas
        if (!valorSeleccionado) {
            $("#agregarItemButton").removeClass('d-none')
        } else {
            // si es de una orden de compra entonces habilitamos el boton de agregar productos de modal
            $("#agregarItemButton").addClass('d-none')
            const { data } = await client.get(`ordencompra-pendientes-entregar/${valorSeleccionado}`)
            const { orden_compra, detalles } = data

            establecerInformacionProveedor(orden_compra.proveedor)
            establecerInformacionOrdenCompra(orden_compra)
            establecerInformacionDetalles(detalles)
        }

        showModalCreacionNotaIngreso()
    })

    // ------- ACCION DE EDICION DE ALMACEN -------
    $("#btn-cambiar-almacen").on('click', function () {
        $("#almacenNotaIngresoInput").prop('disabled', false)
        $("#almacenNotaIngresoInput").focus()
    })

    // --------- GESTION DE INFORMACION DE MAESTROS NECESARIOS -----------
    // cargar motivos de movimiento
    async function cargarMotivoMovimiento() {
        try {
            const { data } = await client.get('/motivosmovimiento?mtm_tipomovimiento=I')
            const $motivomovimiento = $("#motivoMovimientoInput")
            $motivomovimiento.empty()
            // añadimos una opcion por defecto
            const defaultOptionMotivoMovimiento = $('<option>').val('').text('Seleccione un motivo de movimiento')
            $motivomovimiento.append(defaultOptionMotivoMovimiento)

            data.forEach(motivo => {
                const option = $(`<option ${motivo["mtm_codigo"] === 'COM' ? 'selected' : ''}>`).val(motivo["mtm_codigo"]).text(`${motivo["mtm_descripcion"]}`)
                $motivomovimiento.append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }

    // cargar tipos de documentos de referencia
    async function cargarTipoDocumentoReferencia() {
        try {
            const { data } = await client.get('/tiposdocumentosreferenciaSimple')
            const $tipodocumentoreferencia = $("#documentoReferenciaInput")
            $tipodocumentoreferencia.empty()
            // añadimos una opcion por defecto
            const defaultOptionTipoDocumentoReferencia = $('<option selected>').val('').text('Seleccione un tipo de documento de referencia')
            $tipodocumentoreferencia.append(defaultOptionTipoDocumentoReferencia)

            data.forEach(tipoDocumentoReferencia => {
                const option = $(`<option>`).val(tipoDocumentoReferencia["tdr_codigo"]).text(`${tipoDocumentoReferencia["tdr_descripcion"]}`)
                $tipodocumentoreferencia.append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }

    // cargar informacion de almacenes
    async function cargarAlmacenes() {
        // primero obtenemos informacion de la sede del trabajador que esta usando el sistema
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        let sed_codigo = "10" // por defecto almacen de Arequipa
        try {
            const { data } = await client.get(`/trabajadorByUsuario?usu_codigo=${usu_codigo}`)
            sed_codigo = data.sed_codigo
        } catch (error) {
            alert("No se encontró un trabajador asignado a este usuario")
        }

        // establecemos los almacenes
        const { data } = await client.get('/almacenes?alm_esprincipal=1')
        const $almacenes = $("#almacenNotaIngresoInput")
        $almacenes.empty()
        data.forEach(almacen => {
            const option = $(`<option ${almacen["sed_codigo"] === sed_codigo ? 'selected' : ''}>`).val(almacen["alm_id"]).text(almacen["alm_descripcion"])
            $almacenes.append(option)
        })
    }

    // cargar informacion de monedas
    async function cargarMonedas() {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaNotaIngresoInput')
            $monedaSelect.empty()

            data.forEach((moneda) => {
                const option = $(`<option ${moneda["mon_codigo"] === 'SOL' ? 'selected' : ''}>`).val(moneda["mon_codigo"]).text(`${moneda["mon_simbolo"]} ${moneda["mon_descripcion"]}`)
                $monedaSelect.append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }

    const initInformacionMaestros = () => {
        return Promise.all([
            cargarAlmacenes(),
            cargarMotivoMovimiento(),
            cargarTipoDocumentoReferencia(),
            cargarMonedas(),
        ])
    }

    // inicializar información de proveedor
    function establecerInformacionProveedor(proveedor) {
        const { prv_id, prv_nombre, tdo_codigo, prv_nrodocumento, prv_correo, prv_contacto, prv_whatsapp, prv_direccion } = proveedor
        $("#idProveedorNotaIngresoInput").val(prv_id)
        $("#documentoProveedorInput").val(`${tdo_codigo} - ${prv_nrodocumento}`)
        $("#razonSocialProveedorInput").val(prv_nombre)
        $("#correoProveedorInput").val(prv_correo)
        $("#contactoProveedorInput").val(prv_contacto)
        $("#whatsappProveedorInput").val(prv_whatsapp)
        $("#direccionProveedorInput").val(prv_direccion)

        // deshabilitar inputs de busqueda de proveedor
        $("#proveedoresSUNAT").prop('disabled', true)
        $("#searchProveedorSUNAT").prop('disabled', true)
        $("#proveedoresInput").prop('disabled', true)
    }

    // incializar información de orden de compra
    function establecerInformacionOrdenCompra(ordenCompra) {
        const { moneda, elaborador } = ordenCompra
        $("#monedaNotaIngresoInput").val(moneda.mon_codigo)

        // obtenemos informacion de sede de trabajador Elaborador
        const { sed_codigo } = elaborador
        const opcionSeleccionada = $("#almacenNotaIngresoInput option[data-sede='" + sed_codigo + "']");
        const valueOpcionSeleccionada = opcionSeleccionada.val();
        $("#almacenNotaIngresoInput").val(valueOpcionSeleccionada);
    }

    // inicializar información de detalles
    function establecerInformacionDetalles(detalles) {
        $("#detalleNotaIngresoTableBody").empty()

        let content = ''
        detalles.forEach((detalle) => {
            const { ocd_id, detalle_material, producto, ocd_descripcion, ocd_cantidadpendiente } = detalle
            content += `
            <tr>
                <input type="hidden" class="producto-id" value="${producto.pro_id}"/>
                <input type="hidden" class="orden-compra-detalle-id" value="${ocd_id}"/>
                <input type="hidden" class="detalle-material-id" value="${detalle_material?.odm_id}"/>
                <td>${detalle_material?.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                <td>${producto?.pro_codigo || 'N/A'}</td>
                <td>${ocd_descripcion}</td>
                <td>
                    <input type="text" class="form-control ubicacion-input"/>
                </td>
                <td>
                    <input type="text" class="form-control serie-input"/>
                </td>
                <td>
                    <input type="number" class="form-control precio-unitario-input" value="0"/>
                </td>
                <td class="text-center">${producto?.uni_codigo || 'N/A'}</td>
                <td class="text-center cantidad-pendiente-input">${ocd_cantidadpendiente}</td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-ingreso-input" value='${ocd_cantidadpendiente}' max="${ocd_cantidadpendiente}"/>
                </td>
            </tr>
            `
        })

        $("#detalleNotaIngresoTableBody").html(content)
    }

    // ------------ GESTION DE NUEVO PROVEEDOR -------------
    function limpiarListaProveedores() {
        $('#resultadosListaProveedores').empty()
    }

    $('#proveedoresInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarProveedores(query)
        } else {
            limpiarListaProveedores()
        }
    }))

    $('#proveedoresSUNAT').keypress(function (e) {
        var key = e.which
        if (key == 13) {
            const query = $('#proveedoresSUNAT').val().trim()
            buscarProveedorBySUNAT(query)
        }
    })

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
            limpiarListaProveedores()
            // formamos la lista
            data.forEach(proveedor => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                listItem.textContent = `${proveedor.prv_nrodocumento} - ${proveedor.prv_nombre}`
                listItem.dataset.id = proveedor.prv_id
                listItem.addEventListener('click', () => seleccionarProveedor(proveedor))
                // agregar la lista completa
                $('#resultadosListaProveedores').append(listItem)
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

        $("#idProveedorNotaIngresoInput").val(prv_id)
        $("#documentoProveedorInput").val(`${tdo_codigo} - ${prv_nrodocumento}`)
        $("#razonSocialProveedorInput").val(prv_nombre)
        $("#correoProveedorInput").val(prv_correo)
        $("#contactoProveedorInput").val(prv_contacto)
        $("#whatsappProveedorInput").val(prv_whatsapp)
        $("#direccionProveedorInput").val(prv_direccion)

        // establecemos información de las cuentas bancarias
        const cuenta_banco_nacion = cuentas_bancarias.find(cuenta => cuenta.entidad_bancaria?.eba_codigo === 'BN')
        const cuenta_soles = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'SOL' && cuenta.pvc_id !== cuenta_banco_nacion.pvc_id
            } else {
                return cuenta.mon_codigo === 'SOL'
            }
        })
        const cuenta_dolares = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'USD' && cuenta.pvc_id !== cuenta_banco_nacion.pvc_id
            } else {
                return cuenta.mon_codigo === 'USD'
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

        $('#resultadosListaProveedores').empty()
        $('#proveedoresInput').val('')
    }

    // ------------ GESTION DE MODAL DE PRODUCTO ---------------
    function limpiarListaProductos() {
        $('#resultadosListaProductos').empty()
    }

    $('#productosInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarMateriales(query)
        } else {
            limpiarListaProductos()
        }
    }))

    $("#agregarItemButton").on('click', function () {
        showModalProducto()
    })

    async function buscarMateriales(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/productosByQuery2?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarListaProductos()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                // listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - ${material.stock?.alp_stock || 0}`
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosListaProductos').append(listItem)
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

    function seleccionarMaterial(material) {
        const { pro_codigo, pro_descripcion, uni_codigo } = material
        // limpiamos el input
        limpiarListaProductos()
        $('#productosInput').val('')

        const rowItem = document.createElement('tr')
        rowItem.innerHTML = `
        <input class="producto-id" value="${pro_codigo}" type="hidden"/>
        <input class="detalle-material-id" value="" type="hidden"/>
        <td class="text-center odt-numero">N/A</td>
        <td class="codigo-producto">${pro_codigo}</td>
        <td class="descripcion-producto">${pro_descripcion}</td>
        <td class="text-center unidad-producto">${uni_codigo}</td>
        <td class="text-center">
            <input type="number" class="form-control precio-unitario-producto-input" value='1'/>
        </td>
        <td class="text-center">
            <input type="number" class="form-control cantidad-producto-input" value='0'/>
        </td>
        <td class="text-center">
            <button class="btn btn-sm btn-danger delete-detalle-producto">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                </svg>
            </button>
        </td>
        `
        $('#tbl-detalle-productos-nota-ingreso-body').append(rowItem)
    }

    $('#btn-agregar-producto').on('click', function () {
        const detalle = []
        const identificadores = []

        $("#tbl-detalle-productos-nota-ingreso-body tr").each(function () {
            const odm_id = $(this).find('.detalle-material-id').val();
            const pro_id = $(this).find('.producto-id').val();

            identificadores.push(odm_id)

            const content = `
            <tr>
                <input type="hidden" class="producto-id" value="${pro_id}"/>
                <input type="hidden" class="orden-compra-detalle-id" value=""/>
                <input type="hidden" class="detalle-material-id" value="${odm_id}"/>
                <td>${$(this).find('.odt-numero').text()}</td>
                <td>${$(this).find('.codigo-producto').text()}</td>
                <td>${$(this).find('.descripcion-producto').text()}</td>
                <td>
                    <input type="text" class="form-control ubicacion-input"/>
                </td>
                <td>
                    <input type="text" class="form-control serie-input"/>
                </td>
                <td>
                    <input type="number" class="form-control precio-unitario-input" value="${$(this).find('.precio-unitario-producto-input').val()}"/>
                </td>
                <td class="text-center">${$(this).find('.unidad-producto').text()}</td>
                <td class="text-center cantidad-pendiente-input">${$(this).find('.cantidad-producto-input').val()}</td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-ingreso-input" value='${$(this).find('.cantidad-producto-input').val()}' max="${$(this).find('.cantidad-producto-input').val()}"/>
                </td>
            </tr>
            `
            detalle.push(content)
        });

        if(comprobarDetalleMaterialDuplicado(identificadores, $("#detalleNotaIngresoTableBody tr"))){
            alert("Los detalles de materiales que tienen una OT deben ser únicos")
            return
        }

        detalle.forEach(detalle => {
            $("#detalleNotaIngresoTableBody").append(detalle)
        })

        // cerramos el modal de producto
        const modalProductoDetalle = bootstrap.Modal.getInstance(document.getElementById('addProductModal'))
        modalProductoDetalle.hide()
    })

    // -------------- GESTION DE MODAL DE OT -------------------
    $("#btn-buscar-materiales-OT").on("click", function () {
        const valueOT = $("#ordenInternaInput").val().trim()
        if (valueOT.length === 0) {
            alert("Por favor, ingrese un número de OT")
        } else {
            buscarMaterialesPendientesByOT(valueOT)
        }
    })

    async function buscarMaterialesPendientesByOT(numeroOT) {
        const { data } = await client.post(`detalleMaterialesOrdenInterna-pendientes-by-orden-interna`, {
            odt_numero: numeroOT
        })
        if (data.length === 0) {
            alert("No hay materiales pendientes en la OT ingresada")
        } else {
            // verificamos que no se haya inicializado el datatable
            if ($.fn.DataTable.isDataTable("#tbl-detalles-materiales-OT")) {
                $("#tbl-detalles-materiales-OT").DataTable().destroy();
            }

            let content = ''
            data.forEach((detalle) => {
                content += `
                <tr>
                    <td></td>
                    <td></td>
                    <td class="text-center odt-numero">${detalle.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                    <td class="codigo-producto">${detalle.producto?.pro_codigo || 'N/A'}</td>
                    <td class="descripcion-producto">${detalle.odm_descripcion}</td>
                    <td class="text-center unidad-producto">${detalle.producto?.uni_codigo}</td>
                    <td class="text-center cantidad-pendiente">${detalle.odm_cantidadpendiente}</td>
                    <td class="producto-id d-none">${detalle.pro_id}</td>
                    <td class="detalle-material-id d-none">${detalle.odm_id}</td>
                </tr>
                `
            })

            $("#tbl-detalles-materiales-OT-body").html(content)

            $("#tbl-detalles-materiales-OT").DataTable(dataTableOptionsMaterialesOrdenInterna)

            showModalOTMateriales()
        }
    }

    $("#btn-seleccionar-detalles-materiales").on('click', function () {
        const dataTableContainer = $("#tbl-detalles-materiales-OT").DataTable()
        const filasSeleccionadas = dataTableContainer.rows({ selected: true }).nodes();
        if (filasSeleccionadas.length === 0) {
            alert('Debe seleccionar al menos un material')
            return
        }

        const identificadores = []
        const domDetalle = []

        $(filasSeleccionadas).each(function (index, node) {
            const $node = $(node)
            const odm_id = $node.find('.detalle-material-id').text()
            const pro_id = $node.find('.producto-id').text()

            identificadores.push(odm_id)

            const content = `
            <tr>
                <input class="producto-id" value="${pro_id}" type="hidden"/>
                <input type="hidden" class="detalle-material-id" value="${odm_id}"/>
                <td class="text-center odt-numero">${$node.find('.odt-numero').text()}</td>
                <td class="codigo-producto">${$node.find('.codigo-producto').text()}</td>
                <td class="descripcion-producto">${$node.find('.descripcion-producto').text()}</td>
                <td class="text-center unidad-producto">${$node.find('.unidad-producto').text()}</td>
                <td class="text-center">
                    <input type="number" class="form-control precio-unitario-producto-input" value="0" />
                </td>
                <td class="text-center">
                    <input type="number" class="form-control cantidad-producto-input" value="${$node.find('.cantidad-pendiente').text()}"/>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger delete-detalle-producto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                </td>
            </tr>
            `
            domDetalle.push(content)
        })

        // realizamos la validacion de materiales unicos de materiales
        if(comprobarDetalleMaterialDuplicado(identificadores, $("#tbl-detalle-productos-nota-ingreso-body"))){
            alert("Los detalles de materiales que tienen una OT deben ser únicos")
            return
        }

        // ingresamos los datos correspondientes
        domDetalle.forEach((detalle) => {
            $('#tbl-detalle-productos-nota-ingreso-body').append(detalle)
        })

        // ocultamos el modal
        const modalOrdenInternaMateriales = bootstrap.Modal.getInstance(document.getElementById('detalleMaterialesOTModal'))
        modalOrdenInternaMateriales.hide()
    })

    $("#tbl-detalle-productos-nota-ingreso-body").on('click', '.delete-detalle-producto', function () {
        $(this).closest('tr').remove()
    })

    // ------------ CREACION DE NOTA DE INGRESO -----------------
    $("#btn-guardar-nota-ingreso").on('click', function () {
        crearNotaIngreso()
    })

    async function crearNotaIngreso() {
        // proveedor
        const proveedorId = $("#idProveedorNotaIngresoInput").val().trim()
        // fecha documento referencia
        const fechaDocumentoReferencia = $("#fechaDocumentoReferenciaPicker").val().trim()
        // fecha movimiento de almacen
        const fechaMovimiento = $("#fechaMovimientoNotaIngresoPicker").val().trim()
        // moneda
        const moneda = $("#monedaNotaIngresoInput").val().trim()
        // documento de referencia
        const documentoReferencia = $("#documentoReferenciaInput").val().trim()
        // serie de documento
        const serieNotaIngreso = $("#serieNotaIngresoInput").val().trim()
        // numero de documento
        const numeroNotaIngreso = $("#numeroNotaIngresoInput").val().trim()
        // consumo directo
        const consumoDirecto = $("#consumoDirectoNotaIngresoInput").val()
        // motivo de movimiento
        const motivoMovimiento = $("#motivoMovimientoInput").val().trim()
        // almacen de ingreso
        const almacenIngreso = $("#almacenNotaIngresoInput").val().trim()

        // realizamos las validaciones correspondientes
        let handleError = ''
        if (proveedorId.length === 0) {
            handleError += '- Se debe ingresar un proveedor\n'
        }
        if (fechaDocumentoReferencia.length === 0) {
            handleError += '- Se debe ingresar una fecha de documento de referencia\n'
        }
        if (fechaMovimiento.length === 0) {
            handleError += '- Se debe ingresar una fecha de movimiento\n'
        }
        if (moneda.length === 0) {
            handleError += '- Se debe ingresar una moneda\n'
        }
        if (documentoReferencia.length === 0) {
            handleError += '- Se debe ingresar un documento de referencia\n'
        }
        if (serieNotaIngreso.length === 0) {
            handleError += '- Se debe ingresar una serie de nota de ingreso\n'
        }
        if (numeroNotaIngreso.length === 0) {
            handleError += '- Se debe ingresar un numero de nota de ingreso\n'
        }
        if (motivoMovimiento.length === 0) {
            handleError += '- Se debe ingresar un motivo de movimiento\n'
        }
        if (almacenIngreso.length === 0) {
            handleError += '- Se debe ingresar un almacen de ingreso\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        // detalle de nota de ingreso
        const detalleFormatNotaIngreso = obtenerDetalleNotaIngreso()
        // validamos la información de detalle
        if (detalleFormatNotaIngreso.length === 0) {
            alert('Debe ingresar al menos un producto para la nota de ingreso')
            return
        }

        const validacionDetalle = validarDetalleNotaIngreso(detalleFormatNotaIngreso)
        if (validacionDetalle.length !== 0) {
            alert(validacionDetalle)
            return
        }

        const formatData = {
            alm_id: almacenIngreso,
            prv_id: proveedorId, // proveedor
            mon_codigo: moneda, // moneda
            tdr_codigo: documentoReferencia, // documento de referencia
            mtm_codigo: motivoMovimiento, // motivo de movimiento
            amc_fechamovimiento: transformarFecha(fechaMovimiento),
            amc_documentoreferenciafecha: transformarFecha(fechaDocumentoReferencia),
            amc_documentoreferenciaserie: serieNotaIngreso, // serie de documento
            amc_documentoreferencianumero: numeroNotaIngreso, // numero de documento
            amc_consumodirecto: consumoDirecto === "1" ? true : false,
            detalle: detalleFormatNotaIngreso
        }

        console.log(formatData)
        try {
            const { data } = await client.post('almacen-movimiento/ingreso', formatData)
            alert('Nota de ingreso creada exitosamente')
            // cerramos el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('crearNotaIngresoModal'))
            modal.hide()
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al crear la nota de ingreso")
        }
    }

    // ------- FUNCIONES UTILITARIAS PARA EL MODULO -------
    // cerrar modal de nota de ingreso modal
    $('#crearNotaIngresoModal').on('hide.bs.modal', function (e) {
        limpiarFormularioNotaIngreso()
        initDataTable(apiURL)
    })

    // cerrar modal de producto modal
    $('#addProductModal').on('hide.bs.modal', function (e) {
        limpiarFormularioProducto()
    })

    // funcion para mostrar el detalle de pendientes de orden de compra
    function showModalDetallesPendientesOrdenCompra() {
        const modal = new bootstrap.Modal(document.getElementById('detallePendienteModal'))
        modal.show()
    }

    // funcion para mostrar modal de creacion de nota de ingreso
    function showModalCreacionNotaIngreso() {
        const modalElement = document.getElementById("crearNotaIngresoModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    // funcion para modal de agregar producto
    function showModalProducto() {
        const modalElement = document.getElementById("addProductModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    // funcion para modal de materiales pendientes por OT
    function showModalOTMateriales() {
        const modalElement = document.getElementById("detalleMaterialesOTModal");
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    // obtener detalle de nota de ingreso para creacion
    function obtenerDetalleNotaIngreso() {
        // referencia del cuerpo de la tabla
        const productos = $('#detalleNotaIngresoTableBody tr')
        const detalle = []
        if (productos.length > 0) {
            productos.each(function (index, row) {
                const formatData = {
                    ocd_id: $(row).find('.orden-compra-detalle-id').val() || null,
                    odm_id: $(row).find('.detalle-material-id').val() || null,
                    pro_id: $(row).find('.producto-id').val(),
                    amd_cantidad: $(row).find('.cantidad-ingreso-input').val(),
                    ocd_cantidadpendiente: $(row).find('.cantidad-pendiente-input').text(),
                    amd_ubicacion: $(row).find('.ubicacion-input').val(),
                    amd_serie: $(row).find('.serie-input').val(),
                    amd_preciounitario: $(row).find('.precio-unitario-input').val(),
                }
                detalle.push(formatData)
            })
        }

        return detalle
    }

    // funcion para validar detalle de nota de ingreso
    function validarDetalleNotaIngreso(detalles) {
        let handleError = ''
        detalles.forEach((detalle, index) => {
            const { amd_cantidad, amd_preciounitario, ocd_cantidadpendiente, odm_id } = detalle
            // la cantidad debe ser un valor numerico
            if (odm_id) {
                if (!esValorNumericoValidoMayorIgualQueCero(amd_cantidad)) {
                    handleError += `El detalle ${index + 1} debe tener una cantidad mayor o igual que cero\n`
                } else {
                    // buscamos en el arreglo de detalles
                    if (obtenerValorNumerico(amd_cantidad) > obtenerValorNumerico(ocd_cantidadpendiente)) {
                        handleError += `El detalle ${index + 1} debe tener una cantidad menor o igual a la cantidad\n`
                    }
                }
            } else {
                if (!esValorNumericoValidoYMayorQueCero(amd_cantidad)) {
                    handleError += `El detalle ${index + 1} debe tener una cantidad mayor que cero\n`
                }
            }

            // el precio unitario debe ser un valor numerico
            if (!esValorNumericoValidoMayorIgualQueCero(amd_preciounitario)) {
                handleError += `El detalle ${index + 1} debe tener un precio unitario mayor o igual que cero\n`
            }
        })

        return handleError
    }

    // funcion para limpiar el formulario de creacion de nota de ingreso
    function limpiarFormularioNotaIngreso() {
        $("#proveedoresSUNAT").val('')
        $("#proveedoresSUNAT").prop('disabled', false)
        $("#searchProveedorSUNAT").prop('disabled', false)
        $("#proveedoresInput").val('')
        $("#proveedoresInput").prop('disabled', false)
        $("#resultadosListaProveedores").empty()
        $("#documentoProveedorInput").val('')
        $("#razonSocialProveedorInput").val('')
        $("#correoProveedorInput").val('')
        $("#contactoProveedorInput").val('')
        $("#whatsappProveedorInput").val('')
        $("#direccionProveedorInput").val('')
        $("#fechaDocumentoReferenciaPicker").datepicker({
            dateFormat: 'dd/mm/yy',
        }).datepicker("setDate", moment().toDate())
        $("#fechaMovimientoNotaIngresoPicker").datepicker({
            dateFormat: 'dd/mm/yy',
        }).datepicker("setDate", moment().toDate())
        $("#serieNotaIngresoInput").val('')
        $("#numeroNotaIngresoInput").val('')
        $("#consumoDirectoNotaIngresoInput").val('0')
        $("#detalleNotaIngresoTableBody").empty()
    }

    // funcion para limpiar tabla de modal de agregar productos
    function limpiarFormularioProducto() {
        $("#productosInput").val('')
        $("#resultadosListaProductos").empty()
        $("#tbl-detalle-productos-nota-ingreso-body").empty()
        $("#ordenInternaInput").val('')
    }

    // comprobar que el detalle de materiales sea unico
    function comprobarDetalleMaterialDuplicado(identificadores, dom) {
        let materialDuplicado = false;
        dom.each(function () {
            const odm_id = $(this).find('.detalle-material-id').val();
            if (odm_id && identificadores.includes(odm_id)) {
                materialDuplicado = true
            }
        });
        return materialDuplicado;
    }
    
})