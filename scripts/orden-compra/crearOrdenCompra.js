$(document).ready(() => {
    let dataInformacion = []
    let detallesOrdenCompra = []
    let impuestos = []

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
        const impuestoValor = $("#impuestoOrdenCompraInput").val()
        console.log(impuestoValor)
        const impuestoObjeto = impuestos.find(impuesto => impuesto.imp_codigo === impuestoValor)
        const impuestoPorcentaje = impuestoObjeto ? parseFloat(impuestoObjeto.imp_porcentaje) : 0.00
        console.log(impuestoPorcentaje)
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
    /*
        - Debe existir información de por lo menos una cuenta bancaria
        - Debe seleccionarse una moneda
        - Debe seleccionarse una forma de pago
        - Debe ingresarse la fecha de orden de compra
        - Debe ingresarse la fecha de entrega
        - Debe ingresarse el trabajador que lo elaboró
        - Debe ingresarse el impuesto
        - El detalle de orden de compra no debe estar vacio
        - La cantidad, el precio y el total de cada detalle deben ser mayor que 0
    */
    function crearOrdenCompra(){
        console.log("Crear orden de compra")

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
})