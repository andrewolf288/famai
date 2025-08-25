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
            const { cotizacion, agrupado_detalle, monedas, bancos } = data
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
                            <span class="moneda me-1"></span><span class="total-input">${cod_total.toFixed(2)}</span>
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
                                rowItem.querySelector('.total-input').textContent = total.toFixed(2);
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
                                rowItem.querySelector('.total-input').textContent = total.toFixed(2);
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
                                rowItem.querySelector('.total-input').textContent = total.toFixed(2)
                            } else {
                                rowItem.querySelector('.total-input').textContent = '';
                            }
                            calcularResumenCotizacion()
                        })
                    }

                    $('#productosCotizacionTable tbody').append(rowItem)
                })

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
        totalCotizacion.text((totalCotizacionAcumulado).toFixed(2))
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
                    cod_descuento: $(this).find('.descuento-input').val()
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
            console.log(error)
            alert('Hubo un error en el envio de la cotizacion. Intentelo más tarde.')
        }
    })
});
