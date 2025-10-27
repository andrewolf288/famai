$(document).ready(async () => {
    let dataInformacion = []
    let detallesOrdenCompra = []
    let impuestos = []
    const cuentaConSeparadoresRegex = /^.*$/
    const filterSolicitante = $('#filtrar-solicitante')
    const apiUrl = 'cotizacion-proveedores'

    $("#fechaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate())

    $("#fechaEntregaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate())

    // declaracion de multiselect
    $('#solicitanteSelect').multiselect({
        selectAll: true,
        search: true,
        texts: {
            selectAll: "Seleccionar todos",
            search: "Buscar",
            unselectAll: "Deseleccionar todos",
            placeholder: "Seleccionar solicitantes"
        }
    })

    // traer informacion de trabajadores
    async function traerInformacionSolicitantes() {
        const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
        const { data } = await client.get('/cotizacion-solicitantes')
        const options = []
        data.forEach(responsable => {
            options.push({
                name: responsable["tra_nombre"],
                value: responsable["tra_id"],
                checked: usu_codigo == responsable['usu_codigo']
            })
        })
        $('#solicitanteSelect').multiselect('loadOptions', options);
    }

    const initInformacionFiltros = async () => {
        return Promise.all(
            [
                traerInformacionSolicitantes()
            ]
        )
    }

    // funcion que inicializa la información de proveedores que tienen cotizaciones
    async function initDataInformacion(urlEndpoint = apiUrl) {
        const { data } = await client.get(urlEndpoint)

        // vaceamos la informacion
        $("#data-container-body").empty()
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

        let content = ''
        data.forEach((element, index) => {
            content += `
            <tr data-index="${index}">
                <td>${element.proveedor.prv_nrodocumento}</td>
                <td>${element.proveedor.prv_nombre}</td>
                <td>${element.moneda?.mon_descripcion || 'N/A'}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary btn-detalle">${element.total_items} items</button>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary btn-crear-orden-compra">Crear Orden de Compra</button>
                </td>
            </tr>
            `
        })

        dataInformacion = data
        $("#data-container-body").html(content)
    }

    // obtener filtros
    function obtenerFiltrosActuales(urlAPI = apiUrl) {
        const solicitantes = $("#solicitanteSelect").val()
        let filteredURL = urlAPI

        if (solicitantes.length !== 0) {
            let counter = 0
            solicitantes.forEach((solicitante) => {
                if (counter === 0) {
                    filteredURL += `?solicitantes[]=${solicitante}`
                } else {
                    filteredURL += `&solicitantes[]=${solicitante}`
                }
                counter++
            })
        }

        return filteredURL
    }

    // filtro de responsables
    $(filterSolicitante).on('click', function () {
        const filteredURL = obtenerFiltrosActuales()
        initDataInformacion(filteredURL)
    })

    await initInformacionFiltros()
    initDataInformacion(obtenerFiltrosActuales())

    // ------------- GESTION DE VER DETALLE DE MATERIALES COTIZADOS ------------
    $("#data-container-body").on('click', '.btn-detalle', async function () {
        const { data } = await getInformacionDetalleMateriales(this)
        let content = ''
        let contentDetalle = ''
        const precioIncluyeIGV = data.cotizacion.coc_conigv == 1

        $("#agrupadoDetalleMaterialesBody").empty()
        $("#disgregadoDetalleMaterialesBody").empty()
        const { detalles } = data
        let counterIndex = 0
        detalles.forEach((element, index) => {
            const { producto, precio_unitario, detalles, cantidad_requerida } = element
            let precioMostrar = precio_unitario || 0.00
            if (precioIncluyeIGV) {
                precioMostrar = (precio_unitario * 0.82).toFixed(2)
            }
            content += `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${producto.pro_codigo}</td>
                <td>${producto.pro_descripcion}</td>
                <td class="text-center">${producto.uni_codigo}</td>
                <td class="text-center">${cantidad_requerida}</td>
                <td class="text-center">${precioMostrar}</td>
            </tr>
            `
            detalles.forEach((detalle) => {
                contentDetalle += `
                <tr>
                    <td class="text-center">${counterIndex + 1}</td>
                    <td class="text-center">${detalle?.detalle_material?.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                    <td>${detalle?.detalle_material?.odm_feccreacion ? parseDateSimple(detalle?.detalle_material?.odm_feccreacion) : 'N/A'}</td>
                    <td>${producto.pro_descripcion}</td>
                    <td>${detalle?.detalle_material?.odm_observacion || 'N/A'}</td>
                    <td class="text-center">${producto.uni_codigo}</td>
                    <td class="text-center">${detalle?.detalle_material?.odm_cantidadpendiente || 0.00}</td>
                </tr>
                `
                counterIndex++
            })
        })

        // llenamos la tabla de agrupado
        $("#agrupadoDetalleMaterialesBody").html(content)
        // llenamos la tabla de disgregado
        $("#disgregadoDetalleMaterialesBody").html(contentDetalle)

        // abrimos el modal
        openDialogDetalle()
    })

    // ------------- GESTION DE CREAR ORDEN DE COMPRA ------------
    const cargarTipoMonedas = async () => {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaOrdenCompraInput')
            $monedaSelect.empty()

            const optionDefault = '<option value="">Seleccione una moneda</option>'
            $monedaSelect.append(optionDefault)

            data.forEach((moneda) => {
                const option = $(`<option ${moneda["mon_codigo"] === 'SOL' ? 'selected' : ''}>`).val(moneda["mon_codigo"]).text(`${moneda["mon_simbolo"]} ${moneda["mon_descripcion"]}`)
                $monedaSelect.append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }
    // traer información de formas de pago
    const cargasFormasPago = async () => {
        try {
            const { data } = await client.get('/formaspagoSimple')
            const defaultOptionFormaPago = $('<option>').val('').text('Seleccione una forma de pago')
            $("#formaDePagoOrdenCompraInput").empty()
            $("#formaDePagoOrdenCompraInput").append(defaultOptionFormaPago)

            data.forEach((formaPago) => {
                const option = $('<option>')
                    .val(formaPago["fpa_codigo"])
                    .text(formaPago["fpa_descripcion"])
                    .attr('data-adelanto', formaPago["fpa_porcadelanto"] || 0);
                $("#formaDePagoOrdenCompraInput").append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }
    // traer información de bancos
    const cargarBancos = async () => {
        try {
            const { data } = await client.get('/entidadesbancariasSimple')
            // vaceamos la data
            $("#cuentaSolesProveedorSelect").empty()
            $("#cuentaDolaresProveedorSelect").empty()
            $("#cuentaBancoNacionProveedorSelect").empty()
            // agregamos valor por defecto
            const defaultOptionEntidadBancararia = $('<option>').val('').text('Seleccione una entidad bancaria')
            $("#cuentaSolesProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaDolaresProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaBancoNacionProveedorSelect").append(defaultOptionEntidadBancararia.clone())

            data.forEach((banco) => {
                const option = $('<option>').val(banco["eba_id"]).text(banco["eba_descripcion"])
                $("#cuentaSolesProveedorSelect").append(option.clone())
                $("#cuentaDolaresProveedorSelect").append(option.clone())
                if (banco["eba_codigo"] === 'BN') {
                    $("#cuentaBancoNacionProveedorSelect").append(option.clone())
                }
            })
        } catch (error) {
            console.log(error)
        }
    }
    // traer información de trabajadores
    const cargarTrabajadores = async () => {
        try {
            const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
            const { data } = await client.get('/trabajadoresSimple')
            const defaultOptionTrabajador = '<option value="" selected>Seleccione un trabajador</option>'
            const $elaboradoOrdenCompraInput = $('#elaboradoOrdenCompraInput')
            $elaboradoOrdenCompraInput.empty()

            // ingresamos el valor por defecto
            $elaboradoOrdenCompraInput.append(defaultOptionTrabajador)

            // ingresamos la información de valores
            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))
            data.forEach(trabajador => {
                const option = $('<option>').val(trabajador.tra_id).text(trabajador.tra_nombre)
                $elaboradoOrdenCompraInput.append(option.clone())
            })

            const { data: trabajador } = await client.get(`/trabajadorByUsuario/${usu_codigo}`)
            $elaboradoOrdenCompraInput.val(trabajador.tra_id)
        } catch (error) {
            console.log(error)
        }
    }
    // traer información de impuestos
    const cargarImpuestos = async () => {
        try {
            const { data } = await client.get('/impuestosSimple')
            // es importante guardar la informacion de impuestos
            impuestos = data
            const defaultOptionImpuesto = $('<option>').val('').text('Seleccione un impuesto')
            const $impuestoSelect = $('#impuestoOrdenCompraInput')
            $impuestoSelect.empty()
            // agregamos el valor por defecto
            $impuestoSelect.append(defaultOptionImpuesto)
            // agregamos lso valores de impuestos
            data.forEach((impuesto) => {
                const option = $(`<option ${impuesto["imp_codigo"] === "IGV" ? 'selected' : ''}>`).val(impuesto["imp_codigo"]).text(`${impuesto["imp_codigo"]} - ${impuesto["imp_descripcion"]} - ${impuesto["imp_porcentaje"]}`)
                $impuestoSelect.append(option)
            })
        } catch (error) {
        }
    }

    // ---------- FUNCION DE INICIALIZACION DE INFORMACION ----------
    const initInformacionMaestros = () => {
        return Promise.all([
            cargarTipoMonedas(),
            cargasFormasPago(),
            cargarBancos(),
            cargarTrabajadores(),
            cargarImpuestos()
        ])
    }

    // inicializamos información del proveedor
    const initInformacionProveedor = (proveedor) => {
        const { prv_id, prv_nrodocumento, prv_direccion, prv_nombre, tdo_codigo, prv_whatsapp, prv_contacto, prv_correo, cuentas_bancarias, forma_pago } = proveedor

        $("#idProveedorOrdenCompraInput").val(prv_id)
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

        // establecemos el impuesto por defecto
        if ($("#impuestoOrdenCompraInput").val() === '') {
            $("#impuestoOrdenCompraInput").val('IGV')
        }
    }

    // inicializamos información de la cotización
    const initInformacionCotizacion = (cotizacion) => {
        $("#monedaOrdenCompraInput").val(cotizacion.mon_codigo || '')
        $("#referenciaOrdenCompraInput").val(cotizacion.coc_cotizacionproveedor || '')
        if (cotizacion.detalle_cotizacion[0]?.detalle_material?.orden_interna_parte?.orden_interna?.motivo_requerimiento?.mrq_descripcion) {
            $("#notaOrdenCompraInput").val(cotizacion.detalle_cotizacion[0].detalle_material.orden_interna_parte.orden_interna.motivo_requerimiento.mrq_descripcion)
        }
        if (cotizacion.detalle_cotizacion[0].cod_impuesto) {
            $("#impuestoOrdenCompraInput").val(cotizacion.detalle_cotizacion[0].cod_impuesto.toUpperCase())
        }
    }

    // refresh informacion bancos
    $("#refresh-bancos").on('click', function () {
        refreshInformacionBancos()
    })

    const refreshInformacionBancos = async () => {
        try {
            const { data } = await client.get('/entidadesbancariasSimple')
            // valores ya seleccionados
            const valorCuentasSoles = $("#cuentaSolesProveedorSelect").val()
            const valorCuentasDolates = $("#cuentaDolaresProveedorSelect").val()
            const valorCuentaBancoNacion = $("#cuentaBancoNacionProveedorSelect").val()
            // vaceamos la data
            $("#cuentaSolesProveedorSelect").empty()
            $("#cuentaDolaresProveedorSelect").empty()
            $("#cuentaBancoNacionProveedorSelect").empty()
            // agregamos valor por defecto
            const defaultOptionEntidadBancararia = $('<option>').val('').text('Seleccione una entidad bancaria')
            $("#cuentaSolesProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaDolaresProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaBancoNacionProveedorSelect").append(defaultOptionEntidadBancararia.clone())

            data.forEach((banco) => {
                const option = $('<option>').val(banco["eba_id"]).text(banco["eba_descripcion"])
                $("#cuentaSolesProveedorSelect").append(option.clone())
                $("#cuentaDolaresProveedorSelect").append(option.clone())
                if (banco["eba_codigo"] === 'BN') {
                    $("#cuentaBancoNacionProveedorSelect").append(option.clone())
                }
            })

            // establecer valores por defecto
            $("#cuentaSolesProveedorSelect").val(valorCuentasSoles)
            $("#cuentaDolaresProveedorSelect").val(valorCuentasDolates)
            $("#cuentaBancoNacionProveedorSelect").val(valorCuentaBancoNacion)
        } catch (error) {
            console.log(error)
        }
    }

    // inicializamos la informacion de orden de compra
    $("#data-container-body").on('click', '.btn-crear-orden-compra', async function () {
        // cargamos la información de maestros
        await initInformacionMaestros()
        // resetar fecha de entrega
        $('#fechaEntregaOrdenCompraPicker').val(moment().format('DD/MM/YYYY'))
        // obtenemos la información de detalle de materiales
        const { data } = await getInformacionDetalleMateriales(this)

        // cargamos la informacion de cotizacion
        initInformacionCotizacion(data.cotizacion)
        // cargamos la informacion del proveedor
        initInformacionProveedor(data.proveedor)
        // cargamos la informacion de la orden de compra
        initInformacionOrdenCompra(data.detalles)
        // abrimos el modal
        openDialogCrearOrdenCompra()
    })

    const initInformacionOrdenCompra = (detalles) => {
        const formatData = []
        detalles.forEach((detalle, index) => {
            const { detalles } = detalle
            detalles.forEach((detalleMaterial) => {
                const precio_unitario = detalleMaterial.cod_preciounitario
                const { detalle_material } = detalleMaterial
                const precio_real = detalleMaterial.cod_preciounitariopuro || precio_unitario / (1 - detalleMaterial.cod_descuento / 100)
                const precio_unitario_igv = precio_real * (detalleMaterial.cotizacion.coc_conigv == 1 ? (1 / 1.18) : 1)

                const formatDetalle = {
                    producto: detalleMaterial.producto,
                    odm_cantidadpendiente: 1,
                    ...detalle_material,
                    ocd_porcentajedescuento: detalleMaterial.cod_descuento,
                    ocd_cantidad: detalle_material?.odm_cantidadpendiente || 1,
                    ocd_preciounitario: parseFloat(precio_unitario_igv).toFixed(4),
                    ocd_total: (parseFloat(detalle_material?.odm_cantidadpendiente || 1) * parseFloat(precio_unitario_igv).toFixed(4)) * (1 - detalleMaterial.cod_descuento / 100),
                    ocd_fechaentrega: detalleMaterial["cod_fecentregaoc"],
                    coc_formapago: detalleMaterial.cotizacion.coc_formapago
                }
                formatData.push(formatDetalle)
            })
        })

        detallesOrdenCompra = formatData
        // renderizamos la vista
        renderizarVista()
        // establecemos simbolo de moneda
        establecerSimboloMoneda()
    }

    // funcion para renderizar detalle de orden de compra
    function renderizarAgrupadoOrdenCompra() {
        let content = ''
        $("#agrupadoDetalleOrdenCompraBody").empty()
        // agrupamos de la siguiente manera
        const formatDataAgrupada = Object.values(
            detallesOrdenCompra.reduce((acumulador, item) => {

                const key = item.pro_id !== null ? `${item.pro_id}-${item.ocd_preciounitario}` : obtenerIdUnico()

                if (!acumulador[key]) {
                    acumulador[key] = {
                        pro_id: item.pro_id,
                        codigo: item.producto?.pro_codigo || null,
                        descripcion: item.odm_descripcion || item.producto?.pro_descripcion,
                        unidad: item.producto?.uni_codigo || null,
                        cantidad_requerida: 0,
                        cantidad_pedida: 0,
                        precio_unitario: parseFloat(item.ocd_preciounitario),
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
            console.log(detalle)
            const { pro_id, descripcion, codigo, unidad, cantidad_requerida, cantidad_pedida, precio_unitario, precio_total } = detalle
            content += `
            <tr data-index="${index}">
                <td class="text-center">${index + 1}</td>
                <td>${codigo || 'N/A'}</td>
                <td>${descripcion}</td>
                <td class="text-center">${unidad || 'N/A'}</td>
                <td class="text-center">${cantidad_requerida.toFixed(2)}</td>
                <td class="text-center">${cantidad_pedida.toFixed(2)}</td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="moneda me-1"></span>
                        ${precio_unitario.toFixed(4)}
                    </div>
                </td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center">
                        <span class="moneda me-1"></span>
                        ${precio_total.toFixed(4)}
                    </div>
                </td>
                <td class="text-center">
                    <!--
                    <button class="btn btn-sm ${pro_id == null ? 'btn-secondary' : 'btn-primary'} btn-cotizacion me-2" data-producto="${pro_id}" ${pro_id == null ? 'disabled' : ''}>
                        CT
                    </button>
                    <button class="btn btn-sm ${pro_id == null ? 'btn-secondary' : 'btn-primary'} btn-ordencompra me-2" data-producto="${pro_id}" ${pro_id == null ? 'disabled' : ''}>
                        OC
                    </button>
                    <button class="btn btn-sm ${pro_id == null ? 'btn-secondary' : 'btn-primary'} btn-precionuevo" data-producto="${pro_id}" ${pro_id == null ? 'disabled' : ''}>
                        NP
                    </button> -->
                    <button class="btn btn-sm btn-danger eliminar-agrupado-material" data-producto="${pro_id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
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
        // recorremos el detalle material para completar la información
        detallesOrdenCompra.forEach((material, index) => {
            const { odm_id, producto, orden_interna_parte, odm_descripcion, odm_observacion, odm_cantidadpendiente, ocd_cantidad, ocd_preciounitario, ocd_total, ocd_fechaentrega, ocd_porcentajedescuento, imp_codigo, coc_formapago } = material

            const rowItem = document.createElement('tr')
            rowItem.dataset.detalle = odm_id
            rowItem.dataset.producto = producto?.pro_id
            rowItem.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                <td class="text-center align-middle">
                    <input type="number" class="form-control porcentaje-descuento-input" value="${ocd_porcentajedescuento}"/>
                </td>
                <td class="text-center">
                    <input type="text" class="form-control fecha-entrega-input"/>
                </td>
                <td>${producto?.pro_codigo || ''}${producto?.pro_codigo ? ' - ' : ''}${odm_descripcion || producto?.pro_descripcion || 'N/A'}</td>
                <td class="text-center align-middle">${producto?.uni_codigo || 'N/A'}</td>
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
                        ${ocd_total.toFixed(4)}
                    </div>
                </td>
                <td>${odm_observacion || 'N/A'}</td>
                <td>
                    <textarea class="form-control observacion-input" rows="1"></textarea>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-danger eliminar-detalle-material" data-id-detalle="${odm_id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                </td>
            `
            $(rowItem).find('.fecha-entrega-input').datepicker({
                dateFormat: 'dd/mm/yy',
            }).datepicker('setDate', moment(ocd_fechaentrega).toDate())
            const fechaActualPicker = $('#fechaEntregaOrdenCompraPicker').val()
            const fechaEntregaDetalle = moment(ocd_fechaentrega).format('DD/MM/YYYY')

            if (moment(ocd_fechaentrega).isAfter(moment(fechaActualPicker, 'DD/MM/YYYY'))) {
                $('#fechaEntregaOrdenCompraPicker').val(fechaEntregaDetalle)
            }

            $("#formaDePagoOrdenCompraInput option").each(function () {
                if (!coc_formapago) return
                let formapago = coc_formapago.includes('-') ? coc_formapago.split('-')[0] : coc_formapago
                if (this.innerText.toLowerCase() === (formapago.toLowerCase())) {
                    $("#formaDePagoOrdenCompraInput").val(this.value)
                }
            })

            $("#disgregadoDetalleOrdenCompraBody").append(rowItem)
        })
    }

    // funcion para actualizar resumen de orden de compra
    function renderizarResumenOrdenCompra() {
        const impuestoPorcentaje = obtenerImpuestoPorcentaje()
        let subtotal = 0.00
        let impuesto = 0.00
        let total = 0.00
        detallesOrdenCompra.forEach(detalle => {
            subtotal += detalle.ocd_total
            impuesto += detalle.ocd_total * impuestoPorcentaje / 100
        })

        total = subtotal + impuesto

        $("#subtotalOrdenCompra").text(subtotal.toFixed(4))
        $("#impuestoOrdenCompra").text(impuesto.toFixed(4))
        $("#totalOrdenCompra").text(total.toFixed(4))
    }

    // funcion para renderizar la vista
    function renderizarVista() {
        renderizarAgrupadoOrdenCompra()
        renderizarDisgregadoOrdenCompra()
        renderizarResumenOrdenCompra()
    }

    // CUANDO CAMBIE EL INPUT DE LA FORMA DE PAGO
    $("#formaDePagoOrdenCompraInput").on('change', function () {
        const total = $("#totalOrdenCompra").text()
        console.log($("#formaDePagoOrdenCompraInput option:selected").attr('data-adelanto'))
        const adelanto = +total * $("#formaDePagoOrdenCompraInput option:selected").attr('data-adelanto') / 100
        $("#adelantoOrdenCompraInput").val(adelanto.toFixed(4))
        $("#saldoOrdenCompraInput").val((total - adelanto).toFixed(4))
    })

    // -----------GESTION DE CAMBIOS DE ORDEN DE COMPRA -----------

    // escuchamos los cambios en los inputs de cantidad y de precio unitario
    $(`#disgregadoDetalleOrdenCompraBody`).on('input', '.cantidad-pedido-input, .precio-unitario-input, .porcentaje-descuento-input', function () {
        // obtenemos el id del detalle
        const row = $(this).closest('tr')
        const id_detalle = row.data('detalle')
        // obtenemos los valores involucrados
        const cantidadDetalle = obtenerValorNumerico(row.find('.cantidad-pedido-input').val())
        const precioUnitarioDetalle = obtenerValorNumerico(row.find('.precio-unitario-input').val())
        const porcentajeDescuentoDetalle = obtenerValorNumerico(row.find('.porcentaje-descuento-input').val())
        // calculamos el total
        const precioTotalDetalle = cantidadDetalle * precioUnitarioDetalle * (1 - porcentajeDescuentoDetalle / 100)
        // obtenemos el indice del detalle
        const indice = detallesOrdenCompra.findIndex(detalle => detalle.odm_id == id_detalle)
        detallesOrdenCompra[indice].ocd_cantidad = cantidadDetalle
        detallesOrdenCompra[indice].ocd_preciounitario = precioUnitarioDetalle
        detallesOrdenCompra[indice].ocd_porcentajedescuento = porcentajeDescuentoDetalle
        detallesOrdenCompra[indice].ocd_total = precioTotalDetalle
        // volvemos a renderizar
        const moneda = $(this).find('option:selected').text()
        const simboloMoneda = moneda.split(' ')[0]
        const totalText = `${simboloMoneda} ${precioTotalDetalle.toFixed(4)}`
        row.find('.total-input').text(totalText)
        // renderizamos las demas vistas
        renderizarAgrupadoOrdenCompra()
        renderizarResumenOrdenCompra()

        // calculamos el adelanto
        const adelanto = total * $("#formaDePagoOrdenCompraInput option:selected").attr('data-adelanto') / 100
        $("#adelantoOrdenCompraInput").val(adelanto.toFixed(4))
        $("#saldoOrdenCompraInput").val((total - adelanto).toFixed(4))
    })

    // gestionamos la funcion de eliminacion
    $(`#disgregadoDetalleOrdenCompraBody`).on('click', '.eliminar-detalle-material', function () {
        // obtenemos el id del detalle
        const id_detalle = $(this).data('id-detalle')
        // obtenemos el indice del detalle
        const indice = detallesOrdenCompra.findIndex(material => material.odm_id == id_detalle)
        // eliminamos el detalle
        detallesOrdenCompra.splice(indice, 1)
        // eliminamos la información del DOM
        $(this).closest('tr').remove()
        // renderizamos la vista
        renderizarAgrupadoOrdenCompra()
        renderizarResumenOrdenCompra()
    })

    // gestionamos la funcion de eliminacion agrupado
    $("#agrupadoDetalleOrdenCompraTable").on('click', '.eliminar-agrupado-material', function () {
        const id_producto = $(this).data('producto')
        const data_filtrados = detallesOrdenCompra.filter(detalle => detalle.pro_id != id_producto)
        detallesOrdenCompra = data_filtrados

        // eliminamos la información del DOM
        $(this).closest('tr').remove()
        // eliminamos la informacion del detalle que este incluido en data eliminada segun el data-id-detalle
        $("#disgregadoDetalleOrdenCompraBody").find('tr').each(function (index, element) {
            const id_detalle = $(element).data('producto')
            if (id_detalle == id_producto) {
                $(element).remove()
            }
        })
        // renderizamos la vista de resumen
        renderizarResumenOrdenCompra()
    })

    // cambiar la moneda
    $("#monedaOrdenCompraInput").on('change', function () {
        establecerSimboloMoneda()
    })

    // cambiar la información de impuesto
    $("#impuestoOrdenCompraInput").on('change', function () {
        renderizarResumenOrdenCompra()
    })

    // --------- CREACION DE ORDEN DE COMPRA ----------
    $("#guardar-orden-compra").on('click', function () {
        // Deshabilitar botón al iniciar el proceso
        const $btnGuardar = $(this)
        $btnGuardar.prop('disabled', true)
        const textoOriginal = $btnGuardar.html()
        $btnGuardar.html('<i class="fa fa-spinner fa-spin"></i> Procesando...')
        
        crearOrdenCompra().catch(() => {
            // Rehabilitar botón si hay error en el proceso
            $btnGuardar.prop('disabled', false)
            $btnGuardar.html(textoOriginal)
        })
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
        const impuestoOrdenCompra = $("#impuestoOrdenCompraInput").val()
        const subtotal = $("#subtotalOrdenCompra").text()
        const impuesto = $("#impuestoOrdenCompra").text()
        const total = $("#totalOrdenCompra").text()
        const tipoOrdenCompraInput = $("#tipoOrdenCompraSelect").val().trim()
        const esActivoOrdenCompraInput = $("#activoOrdenCompra").is(":checked")

        let handleError = ""
        if (detallesOrdenCompra.length == 0) {
            handleError += "- Debe ingresar un detalle de orden de compra\n"
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
        if (impuestoOrdenCompra.length === 0) {
            handleError += "- Debe seleccionar un impuesto\n"
        }
        if (tipoOrdenCompraInput.length === 0) {
            handleError += "- Debe seleccionar un tipo de orden de compra\n"
        }

        // manejar alerta de error
        if (handleError.length > 0) {
            alert(handleError)
            throw new Error('Validación fallida')
        }

        // validamos la información de cuentas bancarias
        const { cuentas_bancarias, handle_errors_cuentas_bancarias } = validarCuentasBancarias(
            entidadBancariaSolesInput, cuentaBancariaSolesInput, idCuentaBancariaSolesInput,
            entidadBancariaDolaresInput, cuentaBancariaDolaresInput, idCuentaBancariaDolaresInput,
            entidadBancariaBancoNacionInput, cuentaBancariaBancoNacionInput, idCuentaBancariaBancoNacionInput)

        if (cuentas_bancarias.length === 0) {
            const errorValidacionCuentasBancarias = 'No se pudo verificar correctamente la información de ninguna cuenta bancaria. Se presentan los siguientes errores:\n' + handle_errors_cuentas_bancarias.join('\n')
            alert(errorValidacionCuentasBancarias)
            throw new Error('Validación de cuentas bancarias fallida')
        }

        // formamos la información de detalle de la orden de compra
        const porcentajeImpuesto = obtenerImpuestoPorcentaje()
        const { formatDetalle, formatDetalleExedentes } = formatDetalleOrdenCompra(impuestoOrdenCompra, porcentajeImpuesto)
        console.log(formatDetalle)

        // validamos que todos los datos del detalle de orden de compra
        const errorsDetalle = validarDetalleOrdenCompra(formatDetalle)

        if (errorsDetalle.length > 0) {
            bootbox.alert({
                title: 'Error',
                message: errorsDetalle.join('\n'),
                className: 'bootbox-alert-modal'
            })
            throw new Error('Validación de detalles fallida')
        }

        let oic_otsap;
        if (formatDetalleExedentes.length > 0) {
            oic_otsap = await new Promise((resolve) => {
                const modal = new bootstrap.Modal(document.getElementById('dialogPedirOT'), {
                    backdrop: 'static',
                    keyboard: false
                })

                $("#otInput").val('')

                $("#continuar-ot").off('click').on('click', async function () {
                    const otValue = $("#otInput").val().trim()

                    if (otValue.length === 0) {
                        const continuarSinOT = await new Promise((resolve) => {
                            const modal = new bootstrap.Modal(document.getElementById('continuarSinOTModal'), {
                                backdrop: 'static',
                                keyboard: false
                            })

                            $("#continuar-sin-ot").off('click').on('click', function () {
                                modal.hide()
                                resolve(true)
                            })

                            $("#cancelar-sin-ot").off('click').on('click', function () {
                                modal.hide()
                                resolve(false)
                            })

                            modal.show()
                        })
                        console.log(continuarSinOT)
                        if (!continuarSinOT) return

                        resolve('')
                        modal.hide()
                        return
                    }

                    $("#continuar-ot").prop('disabled', true)
                    $("#continuar-ot").html('<i class="fa fa-spinner fa-spin"></i> Buscando...')
                    try {
                        const { data } = await client.get(`/ordenestrabajosByNumeroRequerimiento/${otValue}`)
                        if (!data || !data.odt_numero) {
                            bootbox.alert({
                                title: 'Error',
                                message: 'No se encontro la orden de trabajo en la base de datos',
                                className: 'bootbox-alert-modal'
                            })
                            throw new Error('Orden de trabajo no encontrada')
                        }
                        resolve(otValue)
                        modal.hide()
                    } catch (error) {
                        console.log(error)
                        const { response } = error
                        if (response && response.status === 404) {
                            alert(response.data.error)
                        } else {
                            alert('Error al buscar la orden de trabajo')
                        }
                        throw new Error('Error en la búsqueda de orden de trabajo')
                    } finally {
                        $("#continuar-ot").prop('disabled', false)
                        $("#continuar-ot").html('Continuar')
                    }
                })

                $("#cancelar-ot").off('click').on('click', function () {
                    modal.hide()
                    resolve(null)
                })

                modal.show()
            })
        }

        if (oic_otsap == null && formatDetalleExedentes.length > 0) {
            throw new Error('Proceso cancelado por el usuario')
        }

        // verificamos la forma de impresión
        const confirmar = await new Promise((resolve, reject) => {
            const modal = new bootstrap.Modal(document.getElementById('imprimirModal'), {
                backdrop: 'static',
                keyboard: false
            })
            
            $("#btn-imprimir").off('click').on('click', function () {
                resolve($("#formato-impresion").val())
                modal.hide()
            })

            // Agregar manejador para cancelar
            $("#btn-cancelar-impresion").off('click').on('click', function () {
                modal.hide()
                reject(new Error('Impresión cancelada por el usuario'))
            })

            modal.show()
        })

        // formamos la informacion de la orden de compra
        const formatData = {
            occ_fecha: transformarFecha(fecha_orden),
            occ_fechaentrega: transformarFecha(fecha_entrega),
            mon_codigo: moneda,
            occ_referencia: referencia || null,
            fpa_codigo: forma_pago,
            tra_elaborado: elaborante,
            occ_notas: notas || null,
            occ_adelanto: adelanto || null,
            occ_saldo: saldo || null,
            occ_observacionpago: observacion_pago || null,
            occ_subtotal: subtotal,
            occ_impuesto: impuesto,
            occ_total: total,
            detalle_productos: formatDetalle,
            occ_tipo: tipoOrdenCompraInput,
            occ_esactivo: esActivoOrdenCompraInput,
            proveedor: {
                prv_id: idProveedorInput,
                prv_nombre: razonsocialProveedorInput,
                prv_nrodocumento: documentoProveedorInput.split('-')[1].trim(),
                prv_correo: correoProveedorInput,
                prv_contacto: contactoProveedorInput,
                prv_whatsapp: whatsappProveedorInput,
                prv_direccion: direccionProveedorInput,
                cuentas_bancarias: cuentas_bancarias
            },
            imprimir_disgregado: confirmar == 'true',
            detalle_productos_exedentes: formatDetalleExedentes,
            oic_otsap: oic_otsap
        }

        console.log(formatData)
        const continuar = await new Promise((resolve) => {
            bootbox.confirm({
                title: 'Confirmar',
                message: 'Se emitira la orden de compra, ¿Desea continuar?',
                className: 'bootbox-confirm-modal',
                callback: function (result) {
                    resolve(result)
                }
            })
        })

        if (!continuar) {
            throw new Error('Proceso cancelado por el usuario')
        }

        // Deshabilitar botón y mostrar estado de carga
        const $btnGuardar = $("#guardar-orden-compra")
        $btnGuardar.prop('disabled', true)
        const textoOriginal = $btnGuardar.html()
        $btnGuardar.html('<i class="fa fa-spinner fa-spin"></i> Guardando...')

        try {
            const response = await client.post('ordenescompra', formatData, {
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

            let mensajeError = "Error desconocido"

            try {
                if (error.response?.data) {
                    // Si es blob, convertir a texto
                    if (error.response.data instanceof Blob) {
                        mensajeError = await error.response.data.text()
                    } else {
                        // Cualquier otra cosa, convertir a string
                        mensajeError = JSON.stringify(error.response.data)
                    }
                } else {
                    mensajeError = error.message || error.toString()
                }
            } catch {
                mensajeError = "Error al procesar respuesta"
            }

            alert("Hubo un error al crear la orden de compra: " + mensajeError)
            
            // Rehabilitar botón solo en caso de error
            $btnGuardar.prop('disabled', false)
            $btnGuardar.html(textoOriginal)
        }
    }

    // ----------- FUNCIONES UTILITARIAS ------------
    function openDialogDetalle() {
        const modal = new bootstrap.Modal(document.getElementById('detalleModal'))
        modal.show()
    }

    function openDialogCrearOrdenCompra() {
        // Habilitar botón al abrir el modal
        const $btnGuardar = $("#guardar-orden-compra")
        $btnGuardar.prop('disabled', false)
        $btnGuardar.html('Guardar')
        
        const modal = new bootstrap.Modal(document.getElementById('crearOrdenCompraModal'))
        modal.show()
    }

    async function getInformacionDetalleMateriales(refer) {
        const index = $(refer).closest('tr').data('index')
        // accedemos a la informacion
        const detalleCotizaciones = dataInformacion[index].items.map(element => element.cod_id)
        const formatData = {
            proveedor: dataInformacion[index].proveedor.prv_id,
            detalles: detalleCotizaciones
        }

        return client.post('cotizacion-proveedores-detalles', formatData)
    }

    function establecerSimboloMoneda() {
        const monedaSelected = $("#monedaOrdenCompraInput").find('option:selected').val()
        if (monedaSelected.length !== 0) {
            const moneda = $("#monedaOrdenCompraInput").find('option:selected').text()
            const simboloMoneda = moneda.split(' ')[0]
            $('.moneda').text(simboloMoneda)
        } else {
            $('.moneda').text('')
        }
    }

    function obtenerImpuestoPorcentaje() {
        const impuestoValor = $("#impuestoOrdenCompraInput").val()
        const impuestoObjeto = impuestos.find(impuesto => impuesto.imp_codigo === impuestoValor)
        const impuestoPorcentaje = impuestoObjeto ? parseFloat(impuestoObjeto.imp_porcentaje) : 0.00
        return impuestoPorcentaje
    }

    function formatDetalleOrdenCompra(impuesto, porcentaje_impuesto) {
        const formatDetalle = []
        const formatDetalleExedentes = []
        let ocd_orden = 1
        detallesOrdenCompra.forEach((detalle, index) => {
            const odm_id = detalle.odm_id
            // buscamos en el dom del table disgregado
            const row = $(`#disgregadoDetalleOrdenCompraBody tr[data-detalle="${odm_id}"]`)
            const fecha_entrega = row.find('.fecha-entrega-input').val()
            const observacion = row.find('.observacion-input').val()
            const cantidad_real = Math.min(obtenerValorNumerico(detalle.ocd_cantidad), obtenerValorNumerico(detalle.odm_cantidadpendiente))
            const cantidad_exedente = obtenerValorNumerico(detalle.ocd_cantidad) - obtenerValorNumerico(detalle.odm_cantidadpendiente)
            const formatDetalleItem = {
                ocd_orden: ocd_orden++, // orden
                odm_id: detalle.odm_id, // detalle material
                pro_id: detalle.pro_id || detalle.producto.pro_id, // producto
                ocd_descripcion: detalle.odm_descripcion || detalle.producto.pro_descripcion, // descripcion
                ocd_cantidad: cantidad_real, // cantidad
                odm_cantidadpendiente: detalle.odm_cantidadpendiente,
                ocd_preciounitario: detalle.ocd_preciounitario, // precio unitario
                ocd_total: detalle.ocd_total, // total
                ocd_porcentajedescuento: detalle.ocd_porcentajedescuento, // porcentaje descuento
                ocd_fechaentrega: transformarFecha(fecha_entrega), // fecha de entrega
                ocd_observacion: observacion, // observacion
                imp_codigo: impuesto, // impuesto
                ocd_porcentajeimpuesto: porcentaje_impuesto // porcentaje impuesto
            }

            if (cantidad_exedente > 0) {
                const formatDetalleExedente = {
                    ocd_orden: ocd_orden++, // orden
                    odm_id: detalle.odm_id, // detalle material
                    pro_id: detalle.pro_id, // producto
                    ocd_descripcion: detalle.odm_descripcion, // descripcion
                    ocd_cantidad: cantidad_exedente, // cantidad
                    odm_cantidadpendiente: detalle.odm_cantidadpendiente,
                    ocd_preciounitario: detalle.ocd_preciounitario, // precio unitario
                    ocd_total: detalle.ocd_total, // total
                    ocd_porcentajedescuento: detalle.ocd_porcentajedescuento, // porcentaje descuento
                    ocd_fechaentrega: transformarFecha(fecha_entrega), // fecha de entrega
                    ocd_observacion: observacion, // observacion
                    imp_codigo: impuesto, // impuesto
                    ocd_porcentajeimpuesto: porcentaje_impuesto // porcentaje impuesto
                }
                formatDetalleExedentes.push(formatDetalleExedente)
            }

            formatDetalle.push(formatDetalleItem)
        })

        return {
            formatDetalle,
            formatDetalleExedentes
        }
    }

    function validarDetalleOrdenCompra(detallesOrdenCompra) {
        let handleError = []
        detallesOrdenCompra.forEach(detalle => {
            let messageErrorValidation = ""
            // validacion de cantidad
            if (!esValorNumericoValidoYMayorQueCero(detalle.ocd_cantidad)) {
                messageErrorValidation += "- La cantidad pedida debe ser un número mayor que cero\n"
            }
            // validacion de precio unitario
            if (!esValorNumericoValidoYMayorQueCero(detalle.ocd_preciounitario)) {
                messageErrorValidation += "- El precio unitario debe ser un número mayor que cero\n"
            }
            // validacion de porcentaje de descuento
            if (!esValorNumericoValidoMayorIgualQueCero(detalle.ocd_porcentajedescuento)) {
                messageErrorValidation += "- El porcentaje de descuento debe ser un número mayor o igual que cero\n"
            }
            // validacion de fecha de entrega
            if (!esFechaValida(moment(detalle.ocd_fechaentrega).format('YYYY-MM-DD'))) {
                messageErrorValidation += "- La fecha de entrega debe ser una fecha valida\n"
            }

            if (messageErrorValidation.length > 0) {
                const messageError = `El item ${detalle.ocd_orden} presenta los siguientes errores:\n ${messageErrorValidation}`
                handleError.push(messageError)
            }
        })

        return handleError;
    }

    function validarCuentasBancarias(entidadBancariaSolesInput, cuentaBancariaSolesInput, idCuentaBancariaSolesInput,
        entidadBancariaDolaresInput, cuentaBancariaDolaresInput, idCuentaBancariaDolaresInput,
        entidadBancariaBancoNacionInput, cuentaBancariaBancoNacionInput, idCuentaBancariaBancoNacionInput
    ) {
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
            if (entidadBancariaSolesInput.length == 0) {
                handleErrorsCuentasBancarias.push('- No se ingreso una entidad bancaria para la cuenta en soles')
            }

            if (!cuentaConSeparadoresRegex.test(cuentaBancariaSolesInput)) {
                handleErrorsCuentasBancarias.push('- La cuenta bancaria en soles es inválida')
            }
        }

        // validamos cuenta en dolares
        if (entidadBancariaDolaresInput.length != 0 && cuentaConSeparadoresRegex.test(cuentaBancariaDolaresInput)) {
            cuentasBancarias.push({
                pvc_id: idCuentaBancariaDolaresInput.length != 0 ? idCuentaBancariaDolaresInput : null,
                eba_id: entidadBancariaDolaresInput,
                pvc_numerocuenta: cuentaBancariaDolaresInput,
                mon_codigo: 'USD'
            })
        } else {
            if (entidadBancariaDolaresInput.length == 0) {
                handleErrorsCuentasBancarias.push('- No se ingreso una entidad bancaria para la cuenta en dolares')
            }

            if (!cuentaConSeparadoresRegex.test(cuentaBancariaDolaresInput)) {
                handleErrorsCuentasBancarias.push('- La cuenta bancaria en dolares es inválida')
            }
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
            if (entidadBancariaBancoNacionInput.length == 0) {
                handleErrorsCuentasBancarias.push('- No se ingreso una entidad bancaria para la cuenta Banco de la Nación')
            }

            if (!cuentaConSeparadoresRegex.test(cuentaBancariaBancoNacionInput)) {
                handleErrorsCuentasBancarias.push('- La cuenta bancaria Banco de la Nación es inválida')
            }
        }

        return {
            cuentas_bancarias: cuentasBancarias,
            handle_errors_cuentas_bancarias: handleErrorsCuentasBancarias
        }
    }
})