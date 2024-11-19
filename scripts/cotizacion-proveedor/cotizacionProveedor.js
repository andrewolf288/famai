$(document).ready(function () {
    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    const coc_id = urlParams.get('coc_id');

    $("#fechaEntregaPicker").datepicker({
        dateFormat: 'dd/mm/yy',
    })

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
            const { proveedor, detalle_cotizacion, coc_estado, coc_total, coc_cotizacionproveedor, coc_notas, coc_correocontacto, coc_fechaentrega, coc_fechavalidez, mon_codigo, coc_formapago } = data
            $("#documentoProveedorInput").val(`${proveedor.tdo_codigo}-${proveedor.prv_nrodocumento}`)
            $("#razonSocialProveedorInput").val(proveedor.prv_nombre || '')
            $("#contactoProveedorInput").val(proveedor.prv_contacto || '')
            $("#telefonoProveedorInput").val(proveedor.prv_telefono || '')
            $("#whatsappProveedorInput").val(proveedor.prv_whatsapp || '')
            $("#correoContactoCotizacionInput").val(`${coc_correocontacto ? coc_correocontacto : proveedor.prv_correo || ''}`)
            $("#direccionProveedorInput").val(proveedor.prv_direccion || '')
            $("#cotizacionProveedorCotizacionInput").val(coc_cotizacionproveedor)
            $("#fechaEntregaPicker").datepicker("setDate", coc_fechaentrega ? moment(coc_fechaentrega).toDate() : moment().toDate())
            $("#fechaValidezPicker").datepicker("setDate", coc_fechavalidez ? moment(coc_fechavalidez).toDate() : moment().toDate())
            $("#notasCotizacionInput").val(coc_notas)
            $("#monedaCotizacionInput").val(mon_codigo)
            $("#formapagoCotizacionInput").val(coc_formapago)

            // si el estado es SOL, entonces solo permitimos la lectura
            if (coc_estado !== 'SOL') {
                $("#correoContactoCotizacionInput").attr('readonly', true)
                $("#cotizacionProveedorCotizacionInput").attr('readonly', true)
                $("#fechaEntregaPicker").datepicker('disable')
                $("#fechaValidezPicker").datepicker('disable')
                $("#notasCotizacionInput").attr('readonly', true)
                $("#monedaCotizacionInput").attr('disabled', true)
                $("#formapagoCotizacionInput").attr('disabled', true)
            }

            // recorremos el detalle
            detalle_cotizacion.forEach(detalle => {
                const { odm_id, cod_id, cod_cantidad, cod_descripcion, cod_observacion, cod_orden, cod_preciounitario, cod_total, cod_tiempoentrega, cod_cotizar, cod_marcas, detalle_material } = detalle
                const {producto} = detalle_material

                const rowItem = document.createElement('tr')
                rowItem.classList.add('detalle-cotizacion')
                // inicializamos su dataset
                rowItem.dataset.id = cod_id
                rowItem.dataset.odmId = odm_id
                // construimos la información a mostrar
                rowItem.innerHTML = `
                    <td class="text-center">
                        <input class="form-check-input cotizar-checkbox" type="checkbox" ${coc_estado === 'SOL' ? 'checked' : cod_cotizar == 1 ? 'checked' : ''} ${coc_estado !== 'SOL' ? 'disabled' : ''} />
                    </td>
                    <td class="orden">${cod_orden}</td>
                    <td>
                        ${escapeHTML(cod_descripcion) || ''}
                    </td>
                    <td>
                        ${producto ? producto.unidad?.uni_codigo || '' : ''}
                    </td>
                    <td>
                        <textarea class="form-control observacion-input" rows="1" readonly>${escapeHTML(cod_observacion) || ''}</textarea>
                    </td>
                    <td>
                        <input type="number" class="form-control tiempoentrega-input" value='${cod_tiempoentrega || 0}' readonly/>
                    </td>
                    <td>
                        <input type="number" class="form-control cantidad-input" value='${cod_cantidad || 0.00}' readonly/>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="moneda me-1"></span>
                            <input type="number" class="form-control precio-input" value='${cod_preciounitario || 0.00}' readonly/>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="moneda me-1"></span>
                            <input type="number" class="form-control total-input" value='${cod_total || 0.00}' readonly/>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex justify-content-around">
                            ${coc_estado === 'SOL'
                        ? `<button class="btn btn-sm btn-warning btn-cotizacion-editar me-2">
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
                            `: ''}
                            <button class="btn btn-sm btn-primary btn-cotizacion-marcas">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16">
                                    <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                                </svg>
                            </button>
                        </div>
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

                // añadimos informacion de las marcas
                const marcasRow = document.createElement('tr')
                marcasRow.classList.add('marcas-row')
                marcasRow.dataset.id = cod_id
                marcasRow.style.display = 'none'
                marcasRow.innerHTML = `
                    <td colspan="9">
                        <ul class="list-group marcas-list">
                            ${
                                cod_marcas ? cod_marcas.split('|').map(marca => 
                                    `<li class="list-group-item d-flex align-items-center marca-list">
                                        <input type="text" class="form-control marca-input" value="${escapeHTML(marca)}" ${coc_estado === 'SOL' ? '' : 'readonly'}/>
                                        ${coc_estado === 'SOL' 
                                        ? `<button class="btn btn-danger btn-sm btn-remove-marca ms-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                                </svg>
                                            </button>`
                                        : ''}
                                    </li>`).join('')
                                : ''
                            }
                        </ul>
                        ${
                        coc_estado === 'SOL' 
                        ? `<div class="input-group mt-2">
                                <input type="text" class="form-control nueva-marca-input" placeholder="Añadir nueva marca" />
                                <button class="btn btn-success btn-add-marca" type="button">Añadir</button>
                            </div>`
                        : ''}
                    </td>
                `
                rowItem.insertAdjacentElement('afterend', marcasRow)
                rowItem.querySelector('.btn-cotizacion-marcas').addEventListener('click', () => {
                    marcasRow.style.display = marcasRow.style.display === 'none' ? 'table-row' : 'none'
                })

                if(coc_estado === 'SOL'){
                    marcasRow.querySelector('.btn-add-marca').addEventListener('click', () => {
                        const nuevaMarcaInput = marcasRow.querySelector('.nueva-marca-input')
                        const nuevaMarca = nuevaMarcaInput.value.trim()
    
                        if (nuevaMarca) {
                            const newMarcaItem = document.createElement('li')
                            newMarcaItem.classList.add('list-group-item', 'd-flex', 'align-items-center', 'marca-list')
                            newMarcaItem.innerHTML = `
                                <input type="text" class="form-control marca-input" value="${nuevaMarca}" ${coc_estado === 'SOL' ? '' : 'readonly'}/>
                                <button class="btn btn-danger btn-sm btn-remove-marca ms-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                    </svg>
                                </button>
                            `
    
                            newMarcaItem.querySelector('.btn-remove-marca').addEventListener('click', () => {
                                newMarcaItem.remove();
                            })
    
                            marcasRow.querySelector('.marcas-list').appendChild(newMarcaItem);
    
                            nuevaMarcaInput.value = ''
                        }
                    })
    
                    marcasRow.querySelectorAll('.btn-remove-marca').forEach(button => {
                        button.addEventListener('click', () => {
                            button.parentElement.remove();
                        });
                    });
                }
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
        $(rowItem).find('.cantidad-input').prop('readonly', true)
        $(rowItem).find('.precio-input').prop('readonly', true)
        $(rowItem).find('.btn-cotizacion-guardar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-editar').css('display', '')
    }

    // edicion de detalle de producto
    function editarDetalleCotizacion(rowItem) {
        $(rowItem).find('.observacion-input').prop('readonly', false)
        $(rowItem).find('.tiempoentrega-input').prop('readonly', false)
        $(rowItem).find('.cantidad-input').prop('readonly', false)
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
            const cotizar = $(this).find('.cotizar-checkbox').is(':checked');
            if (cotizar) {
                const totalInput = $(this).find('.total-input').val();
                if (!esValorNumericoValidoYMayorQueCero(totalInput)) {
                    esValido = false;
                    return false;
                }
            }
        });
        return esValido;
    }

    // validar detalle de tiempo de entrega cotizacion
    function validarDetalleTiempoEntregaCotizacion(detalle) {
        let esValido = true;
        detalle.each(function () {
            const cotizar = $(this).find('.cotizar-checkbox').is(':checked');
            if (cotizar) {
                const tiempoentrega = $(this).find('.tiempoentrega-input').val();
                if (!esValorNumericoValidoYMayorQueCero(tiempoentrega)) {
                    esValido = false;
                    return false;
                }
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
        const detalle_productos = $('#productosCotizacionTable tbody .detalle-cotizacion')
        const formapagoCotizacionInput = $('#formapagoCotizacionInput').val().trim()
        const monedaCotizacionInput = $('#monedaCotizacionInput').val().trim()

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

        if(formapagoCotizacionInput.length == 0) {
            handleError += '- La forma de pago es requerida\n'
        }

        if(monedaCotizacionInput.length == 0) {
            handleError += '- La moneda es requerida\n'
        }

        if (!validarDetalleCotizacion(detalle_productos)) {
            handleError += '- Asegurese de que todos los detalles tengan en cantidad y precio un valor numérico mayor a 0\n'
        }

        if (!validarDetalleTiempoEntregaCotizacion(detalle_productos)) {
            handleError += '- Asegurese de que todos los detalles tengan en tiempo de entrega un valor numérico mayor a 0\n'
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        try {
            const formatDetalleProductos = []
            detalle_productos.each(function (index, row) {
                // solo si se indica que sera cotizado
                const cotizar = $(row).find('.cotizar-checkbox').is(':checked')
                if(cotizar) {
                    // obtener el td siguietne
                    const nextRow = $(row).next('tr')
                    const listaItems = $(nextRow).find('.marca-list')
                    const marcas = []

                    listaItems.each(function(){
                        const listItem = $(this).find('.marca-input').val().trim()
                        if(listItem.length > 0) {
                            marcas.push(listItem)
                        }
                    })

                    const item = {
                        cod_id: $(row).data('id'),
                        cod_observacion: $(row).find('.observacion-input').val(),
                        cod_tiempoentrega: $(row).find('.tiempoentrega-input').val(),
                        cod_cantidad: $(row).find('.cantidad-input').val(),
                        cod_preciounitario: $(row).find('.precio-input').val(),
                        cod_total: $(row).find('.total-input').val(),
                        cod_cotizar: $(row).find('.cotizar-checkbox').is(':checked'),
                        cod_marcas: marcas.join('|')
                    }
                    formatDetalleProductos.push(item)
                }
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
