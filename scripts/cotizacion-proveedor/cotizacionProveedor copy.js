$(document).ready(function () {
    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    const coc_id = urlParams.get('coc_id');

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
            console.log(data)
            const { cotizacion, agrupado_detalle, detalle_marcas } = data
            const { proveedor, coc_estado, coc_total, coc_cotizacionproveedor, coc_notas, coc_correocontacto, coc_fechavalidez, mon_codigo, coc_formapago, coc_lugarentrega } = cotizacion

            const formaPago = coc_formapago.split('-')
            const tipoFormaPago = formaPago[0]
            const detalleFormaPago = formaPago[1]

            $("#documentoProveedorInput").val(`${proveedor.tdo_codigo}-${proveedor.prv_nrodocumento}`)
            $("#razonSocialProveedorInput").val(proveedor.prv_nombre || '')
            $("#contactoProveedorInput").val(proveedor.prv_contacto || '')
            $("#telefonoProveedorInput").val(proveedor.prv_telefono || '')
            $("#whatsappProveedorInput").val(proveedor.prv_whatsapp || '')
            $("#correoContactoCotizacionInput").val(`${coc_correocontacto ? coc_correocontacto : proveedor.prv_correo || ''}`)
            $("#direccionProveedorInput").val(proveedor.prv_direccion || '')
            $("#cotizacionProveedorCotizacionInput").val(coc_cotizacionproveedor)
            $("#fechaValidezPicker").datepicker("setDate", coc_fechavalidez ? moment(coc_fechavalidez).toDate() : moment().toDate())
            $("#notasCotizacionInput").val(coc_notas)
            $("#monedaCotizacionInput").val(mon_codigo || 'SOL')
            $("#formapagoCotizacionInput").val(coc_formapago ? tipoFormaPago : 'CONTADO')
            $("#lugarEntregaCotizacionInput").val(coc_lugarentrega || '')
            $("#observacionFormapagoCotizacionInput").val(detalleFormaPago || '')

            // si el estado es SOL, entonces solo permitimos la lectura
            if (coc_estado !== 'SOL') {
                // datos de proveedor
                $("#contactoProveedorInput").attr('disabled', true)
                $("#telefonoProveedorInput").attr('disabled', true)
                $("#whatsappProveedorInput").attr('disabled', true)
                $("#correoContactoCotizacionInput").attr('disabled', true)
                // detalle de cotizacion
                $("#cotizacionProveedorCotizacionInput").attr('disabled', true)
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
                    const { pro_id, cod_orden, cod_cantidad, cod_descripcion, cod_observacion, cod_preciounitario, cod_total, cod_tiempoentrega, cod_cotizar, uni_codigo } = detalle
                    const rowItem = document.createElement('tr')
                    rowItem.classList.add('detalle-cotizacion')
                    rowItem.classList.add(`${coc_estado === 'SOL' ? 'table-light' : cod_cotizar == 1 ? 'table-success' : 'table-light'}`)
                    rowItem.dataset.orden = cod_orden
                    rowItem.dataset.producto = pro_id
                    rowItem.innerHTML = `
                    <td class="text-center">
                        <input class="form-check-input cotizar-checkbox" type="checkbox" ${coc_estado === 'SOL' ? 'checked' : cod_cotizar == 1 ? 'checked' : ''} ${coc_estado !== 'SOL' ? 'disabled' : ''} />
                    </td>
                    <td class="orden">${cod_orden}</td>
                    <td class="descripcion-input">${cod_descripcion || ''}</td>
                    <td class="unidad-input">
                        ${uni_codigo}
                    </td>
                    <td>
                        ${coc_estado === 'SOL' ?
                            `<textarea class="form-control observacion-input" rows="1" readonly>${escapeHTML(cod_observacion) || ''}</textarea>`
                            : `${cod_observacion || ''}`
                        }
                    </td>
                    <td class="text-center">
                        ${coc_estado === 'SOL' ?
                            `<input type="number" class="form-control tiempoentrega-input" value='${cod_tiempoentrega || 0}' readonly/>`
                            : `${cod_tiempoentrega || 'N/A'}`
                        }
                    </td>
                    <td class="text-center">
                    ${coc_estado === 'SOL' ?
                            `<input type="number" class="form-control cantidad-input" value='${cod_cantidad || 0.00}' readonly/>`
                            : `${cod_cantidad.toFixed(2)}`
                        }
                    </td>
                    <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center">
                            <span class="moneda me-1"></span>
                            ${coc_estado === 'SOL' ?
                            `<input type="number" class="form-control precio-input" value='${cod_preciounitario || 0.00}' readonly/>`
                            : `${cod_preciounitario || 'N/A'}`
                        }
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center">
                            <span class="moneda me-1"></span>
                            ${coc_estado === 'SOL' ?
                            `<input type="number" class="form-control total-input" value='${cod_total || 0.00}' readonly/>`
                            : `${cod_total.toFixed(2)}`
                            }
                        </div>
                    </td>
                    <td>
                        ${coc_estado === 'SOL'
                            ? `
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-warning btn-cotizacion-editar me-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-success btn-cotizacion-guardar me-2" style="display: none;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-primary btn-cotizacion-agregar-marca">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
                                </svg>
                            </button>
                        </div>
                        `: ''}
                    </td>
                    `

                    if (coc_estado === 'SOL') {
                        const cantidadDetalle = rowItem.querySelector('.cantidad-input')
                        const precioDetalle = rowItem.querySelector('.precio-input')
                        const botonEditar = rowItem.querySelector('.btn-cotizacion-editar')
                        const botonGuardar = rowItem.querySelector('.btn-cotizacion-guardar')

                        cantidadDetalle.addEventListener('input', function () {
                            const total = parseFloat(cantidadDetalle.value) * parseFloat(precioDetalle.value);
                            if (!isNaN(total)) {
                                rowItem.querySelector('.total-input').value = total.toFixed(2);
                            } else {
                                rowItem.querySelector('.total-input').value = '';
                            }
                        })

                        precioDetalle.addEventListener('input', function () {
                            const total = parseFloat(cantidadDetalle.value) * parseFloat(precioDetalle.value);
                            if (!isNaN(total)) {
                                rowItem.querySelector('.total-input').value = total.toFixed(2);
                            } else {
                                rowItem.querySelector('.total-input').value = '';
                            }
                        });

                        // escuchadores de acciones
                        botonEditar.addEventListener('click', function () { editarDetalleCotizacion(rowItem) })
                        botonGuardar.addEventListener('click', function () { guardarDetalleCotizacion(rowItem) })
                    }

                    $('#productosCotizacionTable tbody').append(rowItem)

                    // manejamos el cambio de checkbox
                    rowItem.querySelector('.cotizar-checkbox').addEventListener('change', function () {
                        calcularResumenCotizacion()
                    })

                    // ahora debemos agregar la información de las marcas
                    detalle_marcas
                        .filter(detalleFilter => detalleFilter.cod_orden == cod_orden)
                        .forEach(detalle => {
                            const rowItemMarca = document.createElement('tr')
                            rowItemMarca.classList.add('detalle-cotizacion-marca')
                            rowItemMarca.dataset.orden = cod_orden
                            rowItemMarca.dataset.producto = pro_id
                            rowItemMarca.innerHTML = `
                                <td></td>
                                <td></td>
                                <td>${detalle.cod_descripcion || ''}</td>
                                <td>${uni_codigo || ''}</td>
                                <td>${detalle.cod_observacion || ''}</td>
                                <td class="text-center">${detalle.cod_tiempoentrega}</td>
                                <td class="text-center">${detalle.cod_cantidad}</td>
                                <td class="text-center">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <span class="moneda me-1"></span>${detalle.cod_preciounitario}
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <span class="moneda me-1"></span>${detalle.cod_total}
                                    </div>
                                </td>
                                <td>
                                ${coc_estado === 'SOL'
                                    ? `
                                    <div class="d-flex justify-content-around">
                                        <button class="btn btn-sm btn-warning btn-cotizacion-marca-editar me-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                            </svg>
                                        </button>
                                        <button class="btn btn-sm btn-success btn-cotizacion-marca-guardar me-2" style="display: none;">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                                                <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                                                <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                                            </svg>
                                        </button>
                                        <button class="btn btn-sm btn-danger btn-cotizacion-marca-eliminar">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                            </svg>
                                        </button>
                                    </div>`
                                    : ''}
                                </td>
                            `
                            $('#productosCotizacionTable tbody').append(rowItemMarca)
                        })
                })

            // debemos controlar el boton de guardado
            if (coc_estado === 'SOL') {
                $("#btn-guardar-cotizacion-proveedor").attr("disabled", false)
                calcularResumenCotizacion()
            } else {
                $("#btn-guardar-cotizacion-proveedor").remove()
                $("#totalCotizacion").text(coc_total)
                const moneda = $('#monedaCotizacionInput').find('option:selected').text()
                const simboloMoneda = moneda.split(' ')[0]
                $('.moneda').text(simboloMoneda)
            }
        } catch (error) {
            console.log(error)
            alert('Error al cargar la cotización')
        }
    }

    traerInformacionCotizacion()

    // ---------- GESTION DE DETALLES DE MARCAS ------------
    $("#productosCotizacionTable tbody").on('click', '.btn-cotizacion-agregar-marca', function () {
        const rowItem = $(this).closest('tr')
        agregarDetalleCotizacionMarca(rowItem)
    })

    function agregarDetalleCotizacionMarca(rowItem) {
        const descripcionMarca = $(rowItem).find('.descripcion-input').text()
        const unidadMarca = $(rowItem).find('.unidad-input').text()
        const cantidadMarca = $(rowItem).find('.cantidad-input').val()
        const orden = $(rowItem).data('orden')
        const producto = $(rowItem).data('producto')

        const rowItemMarca = document.createElement('tr')
        rowItemMarca.classList.add('detalle-cotizacion-marca')
        rowItemMarca.dataset.orden = orden
        rowItemMarca.dataset.producto = producto

        rowItemMarca.innerHTML = `
            <td></td>
            <td></td>
            <td class="descripcion-marca-input">${descripcionMarca}</td>
            <td>
                ${unidadMarca}
            </td>
            <td>
                <textarea class="form-control observacion-marca-input" rows="1" readonly></textarea>
            </td>
            <td>
                <input type="number" class="form-control tiempoentrega-marca-input" value="0" readonly/>
            </td>
            <td>
                <input type="number" class="form-control cantidad-marca-input" value="${cantidadMarca}" readonly/>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="moneda me-1"></span>
                    <input type="number" class="form-control precio-marca-input" value="0" readonly/>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="moneda me-1"></span>
                    <input type="number" class="form-control total-marca-input" value="0" readonly/>
                </div>
            </td>
            <td>
                <div class="d-flex justify-content-around">
                    <button class="btn btn-sm btn-warning btn-cotizacion-marca-editar me-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-success btn-cotizacion-marca-guardar me-2" style="display: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                            <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                            <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger btn-cotizacion-marca-eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                        </svg>
                    </button>
                </div>
            </td>
        `
        const cantidadDetalle = rowItemMarca.querySelector('.cantidad-marca-input')
        const precioDetalle = rowItemMarca.querySelector('.precio-marca-input')
        const botonEditar = rowItemMarca.querySelector('.btn-cotizacion-marca-editar')
        const botonGuardar = rowItemMarca.querySelector('.btn-cotizacion-marca-guardar')
        const botonEliminar = rowItemMarca.querySelector('.btn-cotizacion-marca-eliminar')

        cantidadDetalle.addEventListener('input', function () {
            const total = parseFloat(cantidadDetalle.value) * parseFloat(precioDetalle.value);
            if (!isNaN(total)) {
                rowItemMarca.querySelector('.total-marca-input').value = total.toFixed(2);
            } else {
                rowItemMarca.querySelector('.total-marca-input').value = '';
            }
        })

        precioDetalle.addEventListener('input', function () {
            const total = parseFloat(cantidadDetalle.value) * parseFloat(precioDetalle.value);
            if (!isNaN(total)) {
                rowItemMarca.querySelector('.total-marca-input').value = total.toFixed(2);
            } else {
                rowItemMarca.querySelector('.total-marca-input').value = '';
            }
        });

        // escuchadores de acciones
        botonEditar.addEventListener('click', function () { editarDetalleCotizacionMarca(rowItemMarca) })
        botonGuardar.addEventListener('click', function () { guardarDetalleCotizacionMarca(rowItemMarca) })
        botonEliminar.addEventListener('click', function () { eliminarDetalleCotizacionMarca(rowItemMarca) })

        // agregamos el row despues del rowItem
        $(rowItem).after(rowItemMarca)
    }

    // guardar edicion de detalle de cotizacion marca
    function guardarDetalleCotizacionMarca(rowItem) {
        const cantidadDetalle = $(rowItem).find('.cantidad-marca-input')
        const precioDetalle = $(rowItem).find('.precio-marca-input')

        let handleError = ''
        if (!esValorNumericoValidoYMayorQueCero(cantidadDetalle.val()) || !esValorNumericoValidoYMayorQueCero(precioDetalle.val())) {
            if (!esValorNumericoValidoYMayorQueCero(cantidadDetalle.val())) {
                handleError += '- La cantidad debe ser un valor numérico mayor a 0\n'
            }
            if (!esValorNumericoValidoYMayorQueCero(precioDetalle.val())) {
                handleError += '- El precio debe ser un valor numérico mayor a 0\n'
            }
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        $(rowItem).find('.observacion-marca-input').prop('readonly', true)
        $(rowItem).find('.tiempoentrega-marca-input').prop('readonly', true)
        $(rowItem).find('.cantidad-marca-input').prop('readonly', true)
        $(rowItem).find('.precio-marca-input').prop('readonly', true)
        $(rowItem).find('.btn-cotizacion-marca-guardar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-marca-editar').css('display', '')
    }

    // edicion de detalle de cotizacion marca
    function editarDetalleCotizacionMarca(rowItem) {
        $(rowItem).find('.observacion-marca-input').prop('readonly', false)
        $(rowItem).find('.tiempoentrega-marca-input').prop('readonly', false)
        $(rowItem).find('.cantidad-marca-input').prop('readonly', false)
        $(rowItem).find('.precio-marca-input').prop('readonly', false)
        $(rowItem).find('.btn-cotizacion-marca-editar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-marca-guardar').css('display', '')
    }

    // eliminacion de detalle de cotizacion marca
    function eliminarDetalleCotizacionMarca(rowItem) {
        $(rowItem).remove()
    }

    // ----------- GESTION DE DETALLES DE COTIZACION ..........

    // guardar edicion de detalle de cotizacion
    function guardarDetalleCotizacion(rowItem) {
        const cantidadDetalle = $(rowItem).find('.cantidad-input')
        const precioDetalle = $(rowItem).find('.precio-input')

        let handleError = ''
        if (!esValorNumericoValidoYMayorQueCero(cantidadDetalle.val()) || !esValorNumericoValidoYMayorQueCero(precioDetalle.val())) {
            if (!esValorNumericoValidoYMayorQueCero(cantidadDetalle.val())) {
                handleError += '- La cantidad debe ser un valor numérico mayor a 0\n'
            }
            if (!esValorNumericoValidoYMayorQueCero(precioDetalle.val())) {
                handleError += '- El precio debe ser un valor numérico mayor a 0\n'
            }
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        calcularResumenCotizacion()

        $(rowItem).find('.observacion-input').prop('readonly', true)
        $(rowItem).find('.tiempoentrega-input').prop('readonly', true)
        // $(rowItem).find('.cantidad-input').prop('readonly', true)
        $(rowItem).find('.precio-input').prop('readonly', true)
        $(rowItem).find('.btn-cotizacion-guardar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-editar').css('display', '')
    }

    // edicion de detalle de producto
    function editarDetalleCotizacion(rowItem) {
        $(rowItem).find('.observacion-input').prop('readonly', false)
        $(rowItem).find('.tiempoentrega-input').prop('readonly', false)
        // $(rowItem).find('.cantidad-input').prop('readonly', false)
        $(rowItem).find('.precio-input').prop('readonly', false)
        $(rowItem).find('.btn-cotizacion-editar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-guardar').css('display', '')
    }

    // funcion para calcular resumen de cotizacion
    function calcularResumenCotizacion() {
        const totalCotizacion = $('#totalCotizacion')
        const productos = $('#productosCotizacionTable tbody .detalle-cotizacion')
        let totalCotizacionAcumulado = 0
        productos.each(function (index, row) {
            const cotizar = $(row).find('.cotizar-checkbox').is(':checked')
            if (cotizar) {
                const total = parseFloat($(row).find('.total-input').val() || 0)
                totalCotizacionAcumulado += total
            }
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
        let esValido = true;
        detalle.each(function () {
            const totalInput = $(this).find('.total-input').val();
            const tiempoentrega = $(this).find('.tiempoentrega-input').val();
            if (!esValorNumericoValidoYMayorQueCero(totalInput) || !esValorNumericoValidoYMayorQueCero(tiempoentrega)) {
                esValido = false;
                return false;
            }
        });
        return esValido;
    }

    // validar email
    function validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // funcion para guardar cotizacion
    $("#btn-guardar-cotizacion-proveedor").on('click', async function (e) {
        e.preventDefault()

        const correoContactoCotizacionInput = $('#correoContactoCotizacionInput').val().trim()
        const cotizacionProveedorCotizacionInput = $('#cotizacionProveedorCotizacionInput').val().trim()
        const fechaEntregaPicker = $("#fechaEntregaPicker").val()
        const fechaValidezPicker = $("#fechaValidezPicker").val()
        const formapagoCotizacionInput = $("#formapagoCotizacionInput").val().trim()
        const monedaCotizacionInput = $("#monedaCotizacionInput").val().trim()
        const detalle_productos = $('#productosCotizacionTable tbody .detalle-cotizacion')
            .filter(function () {
                return $(this).find('.cotizar-checkbox').is(':checked');
            })

        const pendientes = detalle_productos.filter(function () {
            return $(this).find('.btn-cotizacion-guardar').is(':visible');
        })

        if (pendientes.length > 0) {
            alert('Existen detalles pendientes de guardar')
            return
        }

        let handleError = ''
        if (correoContactoCotizacionInput.length == 0) {
            handleError += '- El correo de contacto es requerido\n'
        } else {
            if (!validarEmail(correoContactoCotizacionInput)) {
                handleError += '- El correo de contacto es inválido\n'
            }
        }

        if (cotizacionProveedorCotizacionInput.length == 0) {
            handleError += '- El número de cotización del proveedor es requerido\n'
        }

        if (fechaEntregaPicker.length == 0) {
            handleError += '- La fecha de entrega es requerida\n'
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

        if (!validarDetalleCotizacion(detalle_productos)) {
            handleError += '- Asegurese de que todos los detalles tengan en tiempo de entrega, cantidad y precio un valor numérico mayor a 0\n'
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        try {
            const formatDetalleProductos = []
            detalle_productos.each(function (index, row) {
                const orden = $(row).data('orden')
                const producto = $(row).data('producto')
                const detalleMarcasReferencia = $(`#productosCotizacionTable tbody .detalle-cotizacion-marca`).filter(`[data-orden='${orden}']`)

                const item = {
                    cod_orden: orden,
                    pro_id: producto,
                    cod_observacion: $(row).find('.observacion-input').val(),
                    cod_tiempoentrega: $(row).find('.tiempoentrega-input').val(),
                    cod_cantidad: $(row).find('.cantidad-input').val(),
                    cod_preciounitario: $(row).find('.precio-input').val(),
                    cod_total: $(row).find('.total-input').val(),
                    cod_cotizar: $(row).find('.cotizar-checkbox').is(':checked'),
                    detalle_marcas: detalleMarcasReferencia
                        .filter((index, marca) => esValorNumericoValidoYMayorQueCero($(marca).find('.total-marca-input').val()) && $(marca).find('.observacion-marca-input').val().trim().length > 0)
                        .map((index, marca) => {
                            return {
                                pro_id: producto,
                                cod_descripcion: $(marca).find('.descripcion-marca-input').text(),
                                cod_observacion: $(marca).find('.observacion-marca-input').val(),
                                cod_tiempoentrega: $(marca).find('.tiempoentrega-marca-input').val(),
                                cod_cantidad: $(marca).find('.cantidad-marca-input').val(),
                                cod_preciounitario: $(marca).find('.precio-marca-input').val(),
                                cod_total: $(marca).find('.total-marca-input').val(),
                            }
                        }).get()
                }
                formatDetalleProductos.push(item)
            })

            const formatData = {
                coc_cotizacionproveedor: cotizacionProveedorCotizacionInput,
                coc_correocontacto: correoContactoCotizacionInput,
                coc_fechaentrega: transformarFecha(fechaEntregaPicker),
                coc_fechavalidez: transformarFecha(fechaValidezPicker),
                coc_notas: $('#notasCotizacionInput').val().trim(),
                coc_total: $('#totalCotizacion').text(),
                mon_codigo: monedaCotizacionInput,
                coc_formapago: formapagoCotizacionInput,
                detalle_cotizacion: formatDetalleProductos
            }

            const response = await axios.put(`${config.BACK_URL}/cotizacion-proveedor/${coc_id}`, formatData, {
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })

            // // descargar directamente PDF de cotizacion

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

            // debemos descargar automaticamente el PDF generado
        } catch (error) {
            alert('Hubo un error en el envio de la cotizacion. Intentelo más tarde.')
        }
    })
});
