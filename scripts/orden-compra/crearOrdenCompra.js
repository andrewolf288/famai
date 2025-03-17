$(document).ready(() => {
    let dataInformacion = []
    let detallesOrdenCompra = []
    let impuestos = []
    const cuentaConSeparadoresRegex = /^[\d\- ]{8,30}$/

    $("#fechaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate())

    $("#fechaEntregaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate())

    // funcion que inicializa la información de proveedores que tienen cotizaciones
    async function initDataInformacion() {
        const { data } = await client.get('cotizacion-proveedores')
        $("#data-container-body").empty()

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
        $("#data-container-body").append(content)
    }

    initDataInformacion()

    // ------------- GESTION DE VER DETALLE DE MATERIALES COTIZADOS ------------
    $("#data-container-body").on('click', '.btn-detalle', async function () {
        const { data } = await getInformacionDetalleMateriales(this)
        let content = ''
        let contentDetalle = ''

        $("#agrupadoDetalleMaterialesBody").empty()
        $("#disgregadoDetalleMaterialesBody").empty()
        const { detalles } = data
        let counterIndex = 0
        detalles.forEach((element, index) => {
            const { producto, precio_unitario, detalles, cantidad_requerida } = element
            content += `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${producto.pro_codigo}</td>
                <td>${producto.pro_descripcion}</td>
                <td class="text-center">${producto.uni_codigo}</td>
                <td class="text-center">${cantidad_requerida}</td>
                <td class="text-center">${precio_unitario || 0.00}</td>
            </tr>
            `
            detalles.forEach((detalle) => {
                contentDetalle += `
                <tr>
                    <td class="text-center">${counterIndex + 1}</td>
                    <td class="text-center">${detalle.detalle_material?.orden_interna_parte?.orden_interna?.odt_numero || 'N/A'}</td>
                    <td>${detalle.detalle_material.odm_feccreacion ? parseDateSimple(detalle.detalle_material.odm_feccreacion) : 'N/A'}</td>
                    <td>${producto.pro_descripcion}</td>
                    <td>${detalle.detalle_material?.odm_observacion || 'N/A'}</td>
                    <td class="text-center">${producto.uni_codigo}</td>
                    <td class="text-center">${detalle.detalle_material?.odm_cantidadpendiente || 0.00}</td>
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
            $("#formaDePagoOrdenCompraInput").append(defaultOptionFormaPago)

            data.forEach((formaPago) => {
                const option = $('<option>').val(formaPago["fpa_codigo"]).text(formaPago["fpa_descripcion"])
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
    // traer información de trabajadores
    const cargarTrabajadores = async () => {
        try {
            const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
            const { data } = await client.get('/trabajadoresSimple')
            const defaultOptionTrabajador = '<option value="" selected>Seleccione un trabajador</option>'
            const $elaboradoOrdenCompraInput = $('#elaboradoOrdenCompraInput')

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

        // establecemos la forma de pago
        $("#formaDePagoOrdenCompraInput").val(forma_pago || '')
        // establecemos el impuesto por defecto
        $("#impuestoOrdenCompraInput").val('IGV')
    }

    // inicializamos la informacion de orden de compra
    $("#data-container-body").on('click', '.btn-crear-orden-compra', async function () {
        // cargamos la información de maestros
        await initInformacionMaestros()
        // obtenemos la información de detalle de materiales
        const { data } = await getInformacionDetalleMateriales(this)
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
            const { detalles, precio_unitario } = detalle
            detalles.forEach((detalleMaterial) => {
                const { detalle_material } = detalleMaterial
                const formatDetalle = {
                    ...detalle_material,
                    ocd_porcentajedescuento: 0.00,
                    ocd_cantidad: detalle_material["odm_cantidadpendiente"],
                    ocd_preciounitario: parseFloat(precio_unitario),
                    ocd_total: parseFloat(detalle_material["odm_cantidadpendiente"]) * parseFloat(precio_unitario),
                    // imp_codigo: 'IGV',
                    ocd_fechaentrega: ""
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
                        descripcion: item.odm_descripcion,
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
            const { odm_id, producto, orden_interna_parte, odm_descripcion, odm_observacion, odm_cantidadpendiente, ocd_cantidad, ocd_preciounitario, ocd_total, ocd_fechaentrega, ocd_porcentajedescuento, imp_codigo } = material
            const { orden_interna } = orden_interna_parte
            const { odt_numero } = orden_interna

            const rowItem = document.createElement('tr')
            rowItem.dataset.detalle = odm_id
            rowItem.dataset.producto = producto?.pro_id
            rowItem.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${odt_numero || 'N/A'}</td>
                <td class="text-center align-middle">
                    <input type="number" class="form-control porcentaje-descuento-input" value="${ocd_porcentajedescuento}"/>
                </td>
                <td class="text-center">
                    <input type="text" class="form-control fecha-entrega-input"/>
                </td>
                <td>${producto?.pro_codigo || ''}${producto?.pro_codigo ? ' - ' : ''}${odm_descripcion || 'N/A'}</td>
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
                        ${ocd_total.toFixed(2)}
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

        $("#subtotalOrdenCompra").text(subtotal.toFixed(2))
        $("#impuestoOrdenCompra").text(impuesto.toFixed(2))
        $("#totalOrdenCompra").text(total.toFixed(2))
    }

    // funcion para renderizar la vista
    function renderizarVista() {
        renderizarAgrupadoOrdenCompra()
        renderizarDisgregadoOrdenCompra()
        renderizarResumenOrdenCompra()
    }

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
        const totalText = `${simboloMoneda} ${precioTotalDetalle.toFixed(2)}`
        row.find('.total-input').text(totalText)
        // renderizamos las demas vistas
        renderizarAgrupadoOrdenCompra()
        renderizarResumenOrdenCompra()
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
        crearOrdenCompra()
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
            return
        }

        // validamos la información de cuentas bancarias
        const { cuentas_bancarias, handle_errors_cuentas_bancarias } = validarCuentasBancarias(
            entidadBancariaSolesInput, cuentaBancariaSolesInput, idCuentaBancariaSolesInput,
            entidadBancariaDolaresInput, cuentaBancariaDolaresInput, idCuentaBancariaDolaresInput,
            entidadBancariaBancoNacionInput, cuentaBancariaBancoNacionInput, idCuentaBancariaBancoNacionInput)
        
        if (cuentas_bancarias.length === 0) {
            const errorValidacionCuentasBancarias = 'No se pudo verificar correctamente la información de ninguna cuenta bancaria. Se presentan los siguientes errores:\n' + handle_errors_cuentas_bancarias.join('\n')
            alert(errorValidacionCuentasBancarias)
            return
        }

        // formamos la información de detalle de la orden de compra
        const porcentajeImpuesto = obtenerImpuestoPorcentaje()
        const formatDetalle = formatDetalleOrdenCompra(impuestoOrdenCompra, porcentajeImpuesto)
        console.log(formatDetalle)

        // validamos que todos los datos del detalle de orden de compra
        const errorsDetalle = validarDetalleOrdenCompra(formatDetalle)

        if (errorsDetalle.length > 0) {
            alert(errorsDetalle)
            return
        }

        // verificamos la forma de impresión
        const confirmar = confirm('¿Deseas imprimir la orden de compra de manera disgregada?')

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
            imprimir_disgregado: confirmar
        }

        console.log(formatData)
        // return
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
            alert("Hubo un error al crear la orden de compra")
        }
    }

    // ----------- FUNCIONES UTILITARIAS ------------
    function openDialogDetalle() {
        const modal = new bootstrap.Modal(document.getElementById('detalleModal'))
        modal.show()
    }

    function openDialogCrearOrdenCompra() {
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
        const moneda = $("#monedaOrdenCompraInput").find('option:selected').text()
        const simboloMoneda = moneda.split(' ')[0]
        $('.moneda').text(simboloMoneda)
    }

    function obtenerImpuestoPorcentaje() {
        const impuestoValor = $("#impuestoOrdenCompraInput").val()
        const impuestoObjeto = impuestos.find(impuesto => impuesto.imp_codigo === impuestoValor)
        const impuestoPorcentaje = impuestoObjeto ? parseFloat(impuestoObjeto.imp_porcentaje) : 0.00
        return impuestoPorcentaje
    }

    function formatDetalleOrdenCompra(impuesto, porcentaje_impuesto) {
        const formatDetalleOrdenCompra = []
        detallesOrdenCompra.forEach((detalle, index) => {
            const odm_id = detalle.odm_id
            // buscamos en el dom del table disgregado
            const row = $(`#disgregadoDetalleOrdenCompraBody tr[data-detalle="${odm_id}"]`)
            const fecha_entrega = row.find('.fecha-entrega-input').val()
            const observacion = row.find('.observacion-input').val()
            const formatDetalle = {
                ocd_orden: index + 1, // orden
                odm_id: detalle.odm_id, // detalle material
                pro_id: detalle.pro_id, // producto
                ocd_descripcion: detalle.odm_descripcion, // descripcion
                ocd_cantidad: detalle.ocd_cantidad, // cantidad
                odm_cantidadpendiente: detalle.odm_cantidadpendiente,
                ocd_preciounitario: detalle.ocd_preciounitario, // precio unitario
                ocd_total: detalle.ocd_total, // total
                ocd_porcentajedescuento: detalle.ocd_porcentajedescuento, // porcentaje descuento
                ocd_fechaentrega: transformarFecha(fecha_entrega), // fecha de entrega
                ocd_observacion: observacion, // observacion
                imp_codigo: impuesto, // impuesto
                ocd_porcentajeimpuesto: porcentaje_impuesto // porcentaje impuesto
            }

            formatDetalleOrdenCompra.push(formatDetalle)
        })

        return formatDetalleOrdenCompra
    }

    function validarDetalleOrdenCompra(detallesOrdenCompra) {
        let handleError = []
        detallesOrdenCompra.forEach(detalle => {
            let messageErrorValidation = ""
            // validacion de cantidad
            if (!esValorNumericoValidoYMayorQueCero(detalle.ocd_cantidad)) {
                messageErrorValidation += "- La cantidad pedida debe ser un número mayor que cero\n"
            } else {
                if (obtenerValorNumerico(detalle.ocd_cantidad) > obtenerValorNumerico(detalle.odm_cantidadpendiente)) {
                    messageErrorValidation += "- La cantidad pedida debe ser menor o igual a la cantidad requerida\n"
                }
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
            if (!esFechaValida(detalle.ocd_fechaentrega)) {
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
                mon_codigo: 'DOL'
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