$(document).ready(function () {
    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    const coc_id = urlParams.get('coc_id');

    const cuentaConSeparadoresRegex = /^.*$/

    $("#fechaValidezPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    })

    // manejo de cambio de moneda
    $("#monedaCotizacionInput").on('change', function () {
        const moneda = $(this).find('option:selected').text()
        const simboloMoneda = moneda.split(' ')[0]
        $('.moneda').text(simboloMoneda)
    })

    async function traerInformacionCotizacion() {
        try {
            const { data } = await axios.get(`${config.BACK_URL}/cotizacion-proveedor/${coc_id}`)
            const { cotizacion, agrupado_detalle, monedas, bancos, flete } = data
            const { proveedor, coc_estado, coc_total, coc_cotizacionproveedor, coc_notas, coc_correocontacto, coc_fechavalidez, mon_codigo, coc_formapago, coc_lugarentrega } = cotizacion
            const { cuentas_bancarias, prv_id, tdo_codigo, prv_nrodocumento, prv_nombre, prv_contacto, prv_telefono, prv_whatsapp, prv_direccion, prv_correo } = proveedor

            const formaPago = coc_formapago ? coc_formapago.split('-') : null
            const tipoFormaPago = formaPago ? formaPago[0] : null
            const detalleFormaPago = formaPago ? formaPago[1] : null

            // agregamos informacion de las monedas
            monedas.forEach((moneda) => {
                const option = $('<option>').val(moneda["mon_codigo"]).text(`${moneda["mon_simbolo"]} ${moneda["mon_descripcion"]}`)
                $("#monedaCotizacionInput").append(option)
            })

            // agregamos informacion de las entidades bancarias
            const defaultOptionEntidadBancararia = $('<option>').val('').text('Seleccione una entidad bancaria')
            $("#cuentaSolesProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaDolaresProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            $("#cuentaBancoNacionProveedorSelect").append(defaultOptionEntidadBancararia.clone())
            bancos.forEach((banco) => {
                const option = $('<option>').val(banco["eba_id"]).text(banco["eba_descripcion"])
                $("#cuentaSolesProveedorSelect").append(option.clone())
                $("#cuentaDolaresProveedorSelect").append(option.clone())
                if (banco["eba_codigo"] === 'BN') {
                    $("#cuentaBancoNacionProveedorSelect").append(option.clone())
                }
            })

            // datos de proveedor
            $("#idProveedorInput").val(prv_id)
            $("#documentoProveedorInput").val(`${tdo_codigo}-${prv_nrodocumento}`)
            $("#razonSocialProveedorInput").val(prv_nombre || '')
            $("#contactoProveedorInput").val(prv_contacto || '')
            $("#telefonoProveedorInput").val(prv_telefono || '')
            $("#whatsappProveedorInput").val(prv_whatsapp || '')
            $("#direccionProveedorInput").val(prv_direccion || '')
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
            // datos de cotizacion
            $("#correoContactoCotizacionInput").val(`${coc_correocontacto ? coc_correocontacto : prv_correo || ''}`)
            $("#cotizacionProveedorCotizacionInput").val(coc_cotizacionproveedor)
            $("#fechaValidezPicker").datepicker("setDate", coc_fechavalidez ? moment(coc_fechavalidez).toDate() : moment().toDate())
            $("#monedaCotizacionInput").val(mon_codigo || 'SOL')

            await cargasFormasPago()

            $("#formapagoCotizacionInput").val(coc_formapago ? tipoFormaPago : '')
            $("#lugarEntregaCotizacionInput").val(coc_lugarentrega || '')
            $("#observacionFormapagoCotizacionInput").val(detalleFormaPago || '')
            $("#notasCotizacionInput").val(coc_notas)

            // si el estado es SOL, entonces solo permitimos la lectura
            if (coc_estado !== 'SOL') {
                // datos de proveedor
                $("#contactoProveedorInput").attr('disabled', true)
                $("#telefonoProveedorInput").attr('disabled', true)
                $("#whatsappProveedorInput").attr('disabled', true)
                $("#direccionProveedorInput").attr('disabled', true)
                $("#cuentaSolesProveedorSelect").attr('disabled', true)
                $("#cuentaSolesProveedorInput").attr('disabled', true)
                $("#cuentaDolaresProveedorSelect").attr('disabled', true)
                $("#cuentaDolaresProveedorInput").attr('disabled', true)
                $("#cuentaBancoNacionProveedorSelect").attr('disabled', true)
                $("#cuentaBancoNacionProveedorInput").attr('disabled', true)
                // detalle de cotizacion
                $("#cotizacionProveedorCotizacionInput").attr('disabled', true)
                $("#correoContactoCotizacionInput").attr('disabled', true)
                $("#fechaValidezPicker").datepicker('disable')
                $("#monedaCotizacionInput").attr('disabled', true)
                $("#formapagoCotizacionInput").attr('disabled', true)
                $("#observacionFormapagoCotizacionInput").attr('disabled', true)
                $("#lugarEntregaCotizacionInput").attr('disabled', true)
                // nota de cotizacion
                $("#notasCotizacionInput").attr('disabled', true)
                // flete
                $("#div-flete-cotizacion-proveedor").addClass('d-none')
            } else {
                // Mostrar div de flete solo cuando el estado es SOL
                $("#div-flete-cotizacion-proveedor").removeClass('d-none')
            }

            // el detalle agrupado se debe recorrer
            agrupado_detalle
                .forEach(detalle => {
                    const { pro_id, cod_orden, cod_cantidad, cod_cantidadcotizada, cod_descripcion, cod_observacion, cod_observacionproveedor, cod_preciounitario, cod_total, cod_tiempoentrega, cod_cotizar, uni_codigo } = detalle
                    const lineasObservaciones = cod_observacion?.split("\n").length || 1
                    const rowItem = document.createElement('tr')
                    rowItem.classList.add(`${coc_estado === 'SOL' ? 'table-light' : cod_cotizar == 1 ? 'table-success' : 'table-light'}`)
                    rowItem.dataset.orden = cod_orden
                    rowItem.dataset.producto = pro_id
                    rowItem.innerHTML = `
                    <td class="orden">${cod_orden}</td>
                    <td class="descripcion-input">${cod_descripcion || ''}</td>
                    <td>
                        <textarea class="form-control observacion-input" rows="${Math.max(1, lineasObservaciones)}" disabled>${escapeHTML(cod_observacion) || ''}</textarea>
                    </td>
                    <td>
                        <textarea class="form-control observacionproveedor-input" rows="${Math.max(1, lineasObservaciones)}" ${coc_estado === 'SOL' ? '' : 'disabled'}>${escapeHTML(cod_observacionproveedor) || ''}</textarea>
                    </td>
                    <td class="unidad-input">${uni_codigo}</td>
                    <td class="text-center">
                        ${coc_estado === 'SOL' ?
                            `<input type="number" class="form-control tiempoentrega-input" value='${cod_tiempoentrega || 0}'/>`
                            : `${cod_tiempoentrega || 'N/A'}`
                        }
                    </td>
                    <td class="text-center cantidadrequerida-input">${cod_cantidad.toFixed(2)}</td>
                    <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center">
                            ${coc_estado === 'SOL' ?
                            `<input type="number" class="form-control cantidadcotizada-input" max="${cod_cantidad}" value='${cod_cantidadcotizada || 0.00}'/>`
                            : `${cod_cantidadcotizada || 'N/A'}`
                        }
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center">
                            <span class="moneda me-1"></span>
                            ${coc_estado === 'SOL' ?
                            `<input type="number" class="form-control precio-input" value='${cod_preciounitario || 0.00}'/>`
                            : `${cod_preciounitario || 'N/A'}`
                        }
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center">
                            <input style="width: 100px;" type="number" class="form-control descuento-input" value='${detalle.detalle[0].cod_descuento == '.00' ? '0.00' : parseFloat(detalle.detalle[0].cod_descuento).toFixed(2)}' /> %
                        </div >
                    </td >
                    <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center">
                            <span class="moneda me-1"></span><span class="total-input">${cod_total.toFixed(4)}</span>
                        </div>
                    </td>
                    `

                    if (coc_estado === 'SOL') {
                        const cantidadDetalle = rowItem.querySelector('.cantidadcotizada-input')
                        const precioDetalle = rowItem.querySelector('.precio-input')
                        const descuentoDetalle = rowItem.querySelector('.descuento-input')

                        cantidadDetalle.addEventListener('input', function () {
                            const descuento = parseFloat(descuentoDetalle.value)
                            const precio = parseFloat(precioDetalle.value)
                            const total = precio * (1 - descuento / 100) * parseFloat(cantidadDetalle.value)

                            if (!isNaN(total)) {
                                rowItem.querySelector('.total-input').textContent = total.toFixed(4);
                            } else {
                                rowItem.querySelector('.total-input').textContent = '';
                            }
                            calcularResumenCotizacion()
                        })

                        precioDetalle.addEventListener('input', function () {
                            const descuento = parseFloat(descuentoDetalle.value)
                            const precio = parseFloat(precioDetalle.value)
                            const total = precio * (1 - descuento / 100) * parseFloat(cantidadDetalle.value)

                            if (!isNaN(total)) {
                                rowItem.querySelector('.total-input').textContent = total.toFixed(4);
                            } else {
                                rowItem.querySelector('.total-input').textContent = '';
                            }
                            calcularResumenCotizacion()
                        });

                        descuentoDetalle.addEventListener('input', function () {
                            const descuento = parseFloat(descuentoDetalle.value)
                            const precio = parseFloat(precioDetalle.value)
                            const total = precio * (1 - descuento / 100) * parseFloat(cantidadDetalle.value)

                            if (!isNaN(total)) {
                                rowItem.querySelector('.total-input').textContent = total.toFixed(4)
                            } else {
                                rowItem.querySelector('.total-input').textContent = '';
                            }
                            calcularResumenCotizacion()
                        })
                    }

                    $('#productosCotizacionTable tbody').append(rowItem)
                })

            // Cargar información de flete si existe
            if (flete && coc_estado === 'SOL') {
                $('#incluyeFleteCotizacionProveedorInput').prop('checked', true)
                $('#codigoFleteCotizacionProveedorInput').val(flete.codigo || 'MA409253')
                $('#descripcionFleteCotizacionProveedorInput').val(flete.descripcion || 'EMBALAJES - FLETE - CERTIFICADO - CORTES - EXPORT')
                $('#precioUnitarioFleteCotizacionProveedorInput').val(flete.precio_unitario || '')
                $('.div-flete-proveedor').removeClass('d-none')
            }

            // debemos controlar el boton de guardado
            if (coc_estado === 'SOL') {
                $("#btn-guardar-cotizacion-proveedor").attr("disabled", false)
                calcularResumenCotizacion()
            } else {
                $("#btn-guardar-cotizacion-proveedor").remove()
                $("#totalCotizacion").text(coc_total)
            }
            // parseamos el valor de la moneda
            const moneda = $('#monedaCotizacionInput').find('option:selected').text()
            const simboloMoneda = moneda.split(' ')[0]
            $('.moneda').text(simboloMoneda)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la cotización')
        }
    }

    const cargasFormasPago = async () => {
        try {
            const { data } = await axios.get(`${config.BACK_URL}/formaspagoSimpleProveedor`)
            const defaultOptionFormaPago = $('<option>').val('').text('Seleccione una forma de pago')
            $("#formapagoCotizacionInput").empty()
            $("#formapagoCotizacionInput").append(defaultOptionFormaPago)

            data.forEach((formaPago) => {
                const option = $('<option>').val(formaPago["fpa_descripcion"]).text(formaPago["fpa_descripcion"])
                $("#formapagoCotizacionInput").append(option)
            })
        } catch (error) {
            console.log(error)
        }
    }

    traerInformacionCotizacion()

    // ---------- GESTION DE INCLUSION DE IGV ------------
    $("#incluyeIGVCotizacion").on('change', function () {
        $(".flagIGV").text($(this).is(':checked') ? 'c/IGV' : 's/IGV')
    })

    // ---------- GESTION DE FLETE ------------
    $('#incluyeFleteCotizacionProveedorInput').on('change', function () {
        const checked = $(this).is(':checked')
        $('#precioUnitarioFleteCotizacionProveedorInput').val('')
        $('#codigoFleteCotizacionProveedorInput').val('MA409253')
        $('#descripcionFleteCotizacionProveedorInput').val('EMBALAJES - FLETE - CERTIFICADO - CORTES - EXPORT')
        if (checked) {
            $('.div-flete-proveedor').removeClass('d-none')
        } else {
            $('.div-flete-proveedor').addClass('d-none')
        }
        calcularResumenCotizacion()
    })

    $('#btnEditarFleteCotizacionProveedor').on('click', async function () {
        const modo = $(this).data('modo')
        if (modo === 'editar') {
            $(this).data('modo', 'guardar')
            $(this).removeClass("btn-warning")
            $(this).addClass("btn-success")
            $(this).html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                            <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"></path>
                            <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"></path>
                        </svg>`)
            $('#codigoFleteCotizacionProveedorInput').prop('readonly', false)
        } else {
            const continuar = await new Promise(resolve => {
                confirm(`¿Está seguro que desea cambiar el código asociado al flete?`) ? resolve(true) : resolve(false)
            })

            if (!continuar) {
                $('#codigoFleteCotizacionProveedorInput').val('MA409253')
                $('#descripcionFleteCotizacionProveedorInput').val('EMBALAJES - FLETE - CERTIFICADO - CORTES - EXPORT')
            } else {
                try {
                    const { data } = await axios.get(`${config.BACK_URL}/productoByCodigoPublico`, {
                        params: {
                            pro_codigo: $('#codigoFleteCotizacionProveedorInput').val()
                        }
                    })
                    $('#codigoFleteCotizacionProveedorInput').val(data.pro_codigo)
                    $('#descripcionFleteCotizacionProveedorInput').val(data.pro_descripcion)
                } catch (error) {
                    alert('Error al buscar el producto. Por favor, verifique el código.')
                    $('#codigoFleteCotizacionProveedorInput').val('MA409253')
                    $('#descripcionFleteCotizacionProveedorInput').val('EMBALAJES - FLETE - CERTIFICADO - CORTES - EXPORT')
                }
            }

            $(this).data('modo', 'editar')
            $(this).addClass("btn-warning")
            $(this).removeClass("btn-success")
            $(this).html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"></path>
                        </svg>`)
            $('#codigoFleteCotizacionProveedorInput').prop('readonly', true)
        }
    })

    // Recalcular totales cuando cambia el precio del flete
    $('#precioUnitarioFleteCotizacionProveedorInput').on('input', function () {
        calcularResumenCotizacion()
    })

    // ----------- GESTION DE DETALLES DE COTIZACION ..........
    // funcion para calcular resumen de cotizacion
    function calcularResumenCotizacion() {
        const totalCotizacion = $('#totalCotizacion')
        const productos = $('#productosCotizacionTable tbody tr')
        let totalCotizacionAcumulado = 0
        productos.each(function (_, row) {
            const total = parseFloat($(row).find('.total-input').text() || 0)
            totalCotizacionAcumulado += total
        })
        
        // Agregar flete si está marcado
        if ($('#incluyeFleteCotizacionProveedorInput').is(':checked')) {
            const precioFlete = parseFloat($('#precioUnitarioFleteCotizacionProveedorInput').val() || 0)
            totalCotizacionAcumulado += precioFlete
        }
        
        totalCotizacion.text((totalCotizacionAcumulado).toFixed(4))
    }

    // escape HTML
    function escapeHTML(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // buscar banco de la nacion
    function compareStringsIgnoreCaseAndAccents(str1, str2) {
        const normalize = (str) =>
            str
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();

        return normalize(str1) === normalize(str2);
    }

    // funcion de validacion
    function esValorNumericoValidoYMayorQueCero(inputElement) {
        const numero = parseFloat(inputElement);
        return !isNaN(numero) && numero > 0;
    }

    // transformar fecha
    function transformarFecha(fecha) {
        const [dia, mes, año] = fecha.split('/');
        return `${año}-${mes}-${dia}`;
    }

    // validar detalle de cotizacion
    function validarDetalleCotizacion(detalle) {
        const detalleCotizacionErrores = [];
        const detalleCotizacionValidos = []
        detalle.each(function () {
            const totalInput = $(this).find('.total-input').text();
            const tiempoentrega = $(this).find('.tiempoentrega-input').val();

            const validoTotal = esValorNumericoValidoYMayorQueCero(totalInput)
            const validoTiempoentrega = esValorNumericoValidoYMayorQueCero(tiempoentrega)
            if (!validoTotal || !validoTiempoentrega) {
                const errores = []
                if (!validoTotal) {
                    errores.push('El total debe ser un valor numérico mayor a 0')
                }

                if (!validoTiempoentrega) {
                    errores.push('El tiempo de entrega debe ser un valor numérico mayor a 0')
                }

                const formatError = {
                    descripcion: $(this).find('.descripcion-input').text(),
                    cantidad: $(this).find('.cantidadrequerida-input').text(),
                    error: errores
                }
                detalleCotizacionErrores.push(formatError)
            } else {
                const formatDetalle = {
                    cod_orden: $(this).data('orden'),
                    pro_id: $(this).data('producto'),
                    cod_observacionproveedor: $(this).find('.observacionproveedor-input').val(),
                    cod_tiempoentrega: $(this).find('.tiempoentrega-input').val(),
                    cod_cantidadcotizada: $(this).find('.cantidadcotizada-input').val(),
                    cod_preciounitario: $(this).find('.precio-input').val() * (1 - $(this).find('.descuento-input').val() / 100),
                    cod_total: $(this).find('.total-input').text(),
                    cod_cotizar: 1,
                    cod_descuento: $(this).find('.descuento-input').val(),
                    cod_preciounitariopuro: $(this).find('.precio-input').val()
                }
                detalleCotizacionValidos.push(formatDetalle)
            }
        });

        return {
            validos: detalleCotizacionValidos,
            errores: detalleCotizacionErrores
        }
    }

    // validar email
    function validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // funcion para guardar cotizacion
    $("#btn-guardar-cotizacion-proveedor").on('click', async function (e) {
        e.preventDefault()
        // datos del proveedor
        const idProveedorInput = $("#idProveedorInput").val().trim()
        const correoContactoCotizacionInput = $('#correoContactoCotizacionInput').val().trim()
        const contactoProveedorInput = $("#contactoProveedorInput").val().trim()
        const telefonoProveedorInput = $("#telefonoProveedorInput").val().trim()
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
        // datos de la cotizacion
        const cotizacionProveedorCotizacionInput = $('#cotizacionProveedorCotizacionInput').val().trim()
        const fechaValidezPicker = $("#fechaValidezPicker").val()
        const formapagoCotizacionInput = $("#formapagoCotizacionInput").val().trim()
        const monedaCotizacionInput = $("#monedaCotizacionInput").val().trim()
        const detalleFormaPagoCotizacionInput = $("#observacionFormapagoCotizacionInput").val().trim()
        const lugarEntregaCotizacionInput = $("#lugarEntregaCotizacionInput").val().trim()

        const detalle_productos = $('#productosCotizacionTable tbody tr')

        let handleError = ''
        if (correoContactoCotizacionInput.length != 0) {
            if (!validarEmail(correoContactoCotizacionInput)) {
                handleError += '- El correo de contacto es inválido\n'
            }
        }

        if (cotizacionProveedorCotizacionInput.length == 0) {
            handleError += '- El número de cotización del proveedor es requerido\n'
        }

        if (fechaValidezPicker.length == 0) {
            handleError += '- La fecha de validez es requerida\n'
        }

        if (formapagoCotizacionInput.length == 0) {
            handleError += '- La forma de pago es requerida\n'
        }

        if (monedaCotizacionInput.length == 0) {
            handleError += '- La moneda es requerida\n'
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        try {
            const { validos, errores } = validarDetalleCotizacion(detalle_productos)
            let confirmarCotizacion = true

            if (errores.length > 0) {
                const listaErrores = []
                errores.forEach(detalleError => {
                    const { descripcion, cantidad, error } = detalleError
                    listaErrores.push(`- El detalle ${descripcion} con cantidad:  ${cantidad}, tiene los siguientes errores: ${error}`)
                })
                const mensajeError = "No se completaron los siguientes detalles de la cotización:\n" + listaErrores.join("\n") + "\n" + "¿Desea guardar la cotización?"
                confirmarCotizacion = confirm(mensajeError)
            }

            if (confirmarCotizacion) {
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
                        mon_codigo: 'USD'
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

                if (handleErrorsCuentasBancarias.length > 0) {
                    const mensajeErrorCuentas = "¿Deseas continuar?\nSe encontraron los siguientes errores en las cuentas bancarias:\n" + handleErrorsCuentasBancarias.join("\n")
                    if (!confirm(mensajeErrorCuentas)) {
                        return
                    }
                }

                if (validos.length > 0) {
                    const formatData = {
                        coc_conigv: $("#incluyeIGVCotizacion").is(':checked') ? 1 : 0,
                        mon_codigo: monedaCotizacionInput,
                        coc_formapago: `${formapagoCotizacionInput}-${detalleFormaPagoCotizacionInput}`,
                        coc_cotizacionproveedor: cotizacionProveedorCotizacionInput,
                        coc_fechavalidez: transformarFecha(fechaValidezPicker),
                        coc_correocontacto: correoContactoCotizacionInput,
                        coc_lugarentrega: lugarEntregaCotizacionInput,
                        coc_total: $('#totalCotizacion').text(),
                        coc_notas: $('#notasCotizacionInput').val().trim(),
                        detalle_cotizacion: validos,
                        proveedor: {
                            prv_id: idProveedorInput,
                            prv_contacto: contactoProveedorInput,
                            prv_telefono: telefonoProveedorInput,
                            prv_whatsapp: whatsappProveedorInput,
                            prv_direccion: direccionProveedorInput,
                            prv_correo: correoContactoCotizacionInput,
                            cuentas_bancarias: cuentasBancarias
                        }
                    }

                    // Incluir flete si está marcado
                    if ($('#incluyeFleteCotizacionProveedorInput').is(':checked')) {
                        const codigoFlete = $('#codigoFleteCotizacionProveedorInput').val()?.trim()
                        const descripcionFlete = $('#descripcionFleteCotizacionProveedorInput').val()?.trim()
                        const precioUnitarioFleteStr = $('#precioUnitarioFleteCotizacionProveedorInput').val()
                        const precioUnitarioSinIgv = parseFloat(precioUnitarioFleteStr || '0')
                        const tieneIgvIncluido = $("#incluyeIGVCotizacion").is(':checked')
                        
                        if (precioUnitarioSinIgv <= 0) {
                            alert('El precio unitario del flete debe ser mayor a 0')
                            return
                        }

                        if (codigoFlete && !isNaN(precioUnitarioSinIgv) && precioUnitarioSinIgv > 0) {
                            // Calcular precio con IGV si aplica
                            const precioUnitarioConIgv = tieneIgvIncluido
                                ? precioUnitarioSinIgv
                                : precioUnitarioSinIgv * 1.18

                            formatData.incluye_flete = true
                            formatData.flete = {
                                codigo: codigoFlete,
                                descripcion: descripcionFlete || '',
                                precio_unitario: precioUnitarioSinIgv,
                                precio_con_igv: parseFloat(precioUnitarioConIgv.toFixed(4)),
                                impuesto: 'igv'
                            }
                        }
                    }
                    console.log(formatData)
                    // return
                    const response = await axios.put(`${config.BACK_URL}/cotizacion-proveedor/${coc_id}`, formatData, {
                        headers: {
                            'Accept': 'application/pdf'
                        },
                        responseType: 'blob'
                    })

                    const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `cotizacion_${coc_id}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(pdfUrl);

                    // ocultamos el formulario
                    $('#formContent').fadeOut();
                    // mostramos cuador de exito de envio
                    $('#mensajeExito').fadeIn();
                } else {
                    alert("No se ha completado ningún detalle de la cotización")
                }
            }
        } catch (error) {
            let errorMessage = 'Hubo un error en el envio de la cotizacion.\n\n';
            
            if (error.response) {
                errorMessage += `Status: ${error.response.status}\n\n`;
                
                // Si el error.response.data es un Blob, convertirlo a texto
                if (error.response.data instanceof Blob) {
                    error.response.data.text().then(text => {
                        try {
                            const jsonError = JSON.parse(text);
                            alert(errorMessage + 'Error del servidor:\n' + JSON.stringify(jsonError, null, 2));
                        } catch (e) {
                            alert(errorMessage + 'Error del servidor:\n' + text);
                        }
                    });
                } else {
                    errorMessage += 'Error del servidor:\n' + JSON.stringify(error.response.data, null, 2);
                    alert(errorMessage);
                }
            } else if (error.request) {
                errorMessage += 'No se recibió respuesta del servidor.\n';
                errorMessage += 'Detalles: ' + error.message;
                alert(errorMessage);
            } else {
                errorMessage += 'Error: ' + error.message;
                alert(errorMessage);
            }
        }
    })
});
