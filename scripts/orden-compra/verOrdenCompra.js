$(document).ready(async () => {
    let detallesOrdenCompra = []
    const modalLoader = new bootstrap.Modal(document.getElementById('loadingModal'), {
        backdrop: 'static',
        keyboard: false
    })

    // Inicializar información de la orden de compra
    const initInformacionOrdenCompra = (ordenCompra) => {
        // Datos de la cabecera
        $('#oc-numero').text(ordenCompra.occ_numero || 'N/A')
        
        // Mostrar solo los valores como texto (sin opciones de selects)
        $('#monedaOrdenCompraInput').html(`<option selected>${ordenCompra.moneda?.mon_descripcion || 'N/A'}</option>`)
        $('#formaDePagoOrdenCompraInput').html(`<option selected>${ordenCompra.forma_pago?.fpa_descripcion || 'N/A'}</option>`)
        $('#elaboradoOrdenCompraInput').html(`<option selected>${ordenCompra.elaborador?.tra_nombre || 'N/A'}</option>`)
        $('#impuestoOrdenCompraInput').html(`<option selected>IGV - Impuesto General a las Ventas - 18%</option>`)
        
        $('#activoOrdenCompra').prop('checked', ordenCompra.occ_esactivo == 1)
        $('#adelantoOrdenCompraInput').val(ordenCompra.occ_adelanto || '')
        $('#saldoOrdenCompraInput').val(ordenCompra.occ_saldo || '')
        $('#tipoOrdenCompraSelect').val(ordenCompra.occ_tipo || 'SUM')
        $('#observacionPagoOrdenCompraInput').val(ordenCompra.occ_observacionpago || '')
        $('#fechaOrdenCompraPicker').val(moment(ordenCompra.occ_fecha).format('DD/MM/YYYY'))
        $('#fechaEntregaOrdenCompraPicker').val(moment(ordenCompra.occ_fechaentrega).format('DD/MM/YYYY'))
        $('#referenciaOrdenCompraInput').val(ordenCompra.occ_referencia || '')
        $('#notaOrdenCompraInput').val(ordenCompra.occ_notas || '')

        // Datos del resumen
        $('#subtotalOrdenCompra').text(parseFloat(ordenCompra.occ_subtotal || 0).toFixed(4))
        $('#impuestoOrdenCompra').text(parseFloat(ordenCompra.occ_impuesto || 0).toFixed(4))
        $('#totalOrdenCompra').text(parseFloat(ordenCompra.occ_total || 0).toFixed(4))
        
        // Establecer símbolo de moneda
        $('.moneda').text(ordenCompra.moneda?.mon_simbolo || '')
    }

    // Inicializar información del proveedor
    const initInformacionProveedor = (proveedor) => {
        if (!proveedor) return
        
        $('#idProveedorOrdenCompraInput').val(proveedor.prv_id || '')
        $('#documentoProveedorInput').val(`${proveedor.tipo_documento?.tdo_codigo || ''} - ${proveedor.prv_nrodocumento || ''}`)
        $('#razonSocialProveedorInput').val(proveedor.prv_nombre || '')
        $('#correoProveedorInput').val(proveedor.prv_correo || '')
        $('#contactoProveedorInput').val(proveedor.prv_contacto || '')
        $('#whatsappProveedorInput').val(proveedor.prv_whatsapp || '')
        $('#direccionProveedorInput').val(proveedor.prv_direccion || '')

        // Cuentas bancarias
        if (proveedor.cuentas_bancarias && proveedor.cuentas_bancarias.length > 0) {
            const cuentaBancoNacion = proveedor.cuentas_bancarias.find(cuenta => cuenta.entidad_bancaria?.eba_codigo === 'BN')
            const cuentaSoles = proveedor.cuentas_bancarias.find(cuenta => {
                if (cuentaBancoNacion) {
                    return cuenta.mon_codigo === 'SOL' && cuenta.pvc_id !== cuentaBancoNacion.pvc_id
                } else {
                    return cuenta.mon_codigo === 'SOL'
                }
            })
            const cuentaDolares = proveedor.cuentas_bancarias.find(cuenta => {
                if (cuentaBancoNacion) {
                    return cuenta.mon_codigo === 'USD' && cuenta.pvc_id !== cuentaBancoNacion.pvc_id
                } else {
                    return cuenta.mon_codigo === 'USD'
                }
            })

            // Llenar selects con solo el valor correspondiente
            $('#cuentaSolesProveedorSelect').html(`<option selected>${cuentaSoles?.entidad_bancaria?.eba_descripcion || 'N/A'}</option>`)
            $('#cuentaSolesProveedorInput').val(cuentaSoles?.pvc_numerocuenta || '')
            $('#idCuentaBancariaSoles').val(cuentaSoles?.pvc_id || '')
            $('#cuentaDolaresProveedorSelect').html(`<option selected>${cuentaDolares?.entidad_bancaria?.eba_descripcion || 'N/A'}</option>`)
            $('#cuentaDolaresProveedorInput').val(cuentaDolares?.pvc_numerocuenta || '')
            $('#idCuentaBancariaDolares').val(cuentaDolares?.pvc_id || '')
            $('#cuentaBancoNacionProveedorSelect').html(`<option selected>${cuentaBancoNacion?.entidad_bancaria?.eba_descripcion || 'N/A'}</option>`)
            $('#cuentaBancoNacionProveedorInput').val(cuentaBancoNacion?.pvc_numerocuenta || '')
            $('#idCuentaBancariaBancoNacion').val(cuentaBancoNacion?.pvc_id || '')
        }
    }

    // Renderizar detalle agrupado
    function renderizarAgrupadoOrdenCompra() {
        let content = ''
        $("#agrupadoDetalleOrdenCompraBody").empty()
        
        // Agrupamos por producto y precio unitario
        const formatDataAgrupada = Object.values(
            detallesOrdenCompra.reduce((acumulador, item) => {
                const key = item.pro_id !== null ? `${item.pro_id}-${item.ocd_preciounitario}` : `temp-${Math.random()}`
                
                if (!acumulador[key]) {
                    acumulador[key] = {
                        pro_id: item.pro_id,
                        codigo: item.producto?.pro_codigo || null,
                        descripcion: item.ocd_descripcion,
                        unidad: item.producto?.unidad?.uni_codigo || null,
                        cantidad_requerida: 0,
                        cantidad_pedida: 0,
                        precio_unitario: parseFloat(item.ocd_preciounitario),
                        precio_total: 0
                    }
                }
                
                acumulador[key].cantidad_pedida += parseFloat(item.ocd_cantidad) || 0
                acumulador[key].precio_total += parseFloat(item.ocd_total) || 0
                
                return acumulador
            }, {})
        )
        
        // Construir HTML
        formatDataAgrupada.forEach((detalle, index) => {
            const { codigo, descripcion, unidad, cantidad_pedida, precio_unitario, precio_total } = detalle
            content += `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${codigo || 'N/A'}</td>
                    <td>${descripcion}</td>
                    <td class="text-center">${unidad || 'N/A'}</td>
                    <td class="text-center">-</td>
                    <td class="text-center">${cantidad_pedida.toFixed(2)}</td>
                    <td class="text-center">
                        ${precio_unitario.toFixed(4)}
                    </td>
                    <td class="text-center">
                        ${precio_total.toFixed(4)}
                    </td>
                </tr>
            `
        })
        
        $("#agrupadoDetalleOrdenCompraBody").html(content)
    }

    // Renderizar detalle disgregado
    function renderizarDisgregadoOrdenCompra() {
        $("#disgregadoDetalleOrdenCompraBody").empty()
        
        detallesOrdenCompra.forEach((detalle, index) => {
            const { ocd_id, producto, ocd_descripcion, ocd_observacion, ocd_cantidad, ocd_preciounitario, ocd_total, ocd_fechaentrega, ocd_porcentajedescuento } = detalle
            
            const rowItem = document.createElement('tr')
            rowItem.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>N/A</td>
                <td class="text-center">${ocd_porcentajedescuento || 0}%</td>
                <td class="text-center">${moment(ocd_fechaentrega).format('DD/MM/YYYY')}</td>
                <td>${producto?.pro_codigo || ''}${producto?.pro_codigo ? ' - ' : ''}${ocd_descripcion || 'N/A'}</td>
                <td class="text-center">${producto?.unidad?.uni_codigo || 'N/A'}</td>
                <td class="text-center">-</td>
                <td class="text-center">${parseFloat(ocd_cantidad).toFixed(2)}</td>
                <td class="text-center">
                    ${parseFloat(ocd_preciounitario).toFixed(4)}
                </td>
                <td class="text-center">
                    ${parseFloat(ocd_total).toFixed(4)}
                </td>
                <td>${ocd_observacion || 'N/A'}</td>
            `
            
            $("#disgregadoDetalleOrdenCompraBody").append(rowItem)
        })
    }

    // Establecer símbolo de moneda
    function establecerSimboloMoneda() {
        const monedaSelected = $("#monedaOrdenCompraInput").find('option:selected').val()
        if (monedaSelected && monedaSelected.length !== 0) {
            const moneda = $("#monedaOrdenCompraInput").find('option:selected').text()
            const simboloMoneda = moneda.split(' ')[0]
            $('.moneda').text(simboloMoneda)
        } else {
            $('.moneda').text('')
        }
    }

    // Renderizar vista completa
    function renderizarVista() {
        renderizarAgrupadoOrdenCompra()
        renderizarDisgregadoOrdenCompra()
        establecerSimboloMoneda()
    }

    try {
        modalLoader.show()
        
        const pathParts = window.location.pathname.split('/').filter(Boolean)
        let occ_id = null
        for (let i = pathParts.length - 1; i >= 0; i--) {
            if (!isNaN(Number(pathParts[i]))) {
                occ_id = pathParts[i]
                break
            }
        }
        if (!occ_id) {
            const urlParams = new URLSearchParams(window.location.search)
            occ_id = urlParams.get('id')
        }
        if (!occ_id) {
            alert('Error: No se proporcionó el ID de la orden de compra')
            return
        }
        
        // Obtener datos de la orden de compra con detalles completos
        const { data: ordenCompra } = await client.get(`/ordencompra-detalles/${occ_id}`)
        
        // Inicializar información
        initInformacionOrdenCompra(ordenCompra)
        initInformacionProveedor(ordenCompra.proveedor)
        
        // Obtener detalles de la orden de compra
        detallesOrdenCompra = ordenCompra.detalle_orden_compra || []
        
        // Renderizar vista
        renderizarVista()
        
    } catch (error) {
        console.log(error)
        alert('Error al cargar la información de la orden de compra')
    } finally {
        modalLoader.hide()
    }
})
