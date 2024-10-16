$(document).ready(() => {
    let abortController

    const path = window.location.pathname
    const segments = path.split('/')
    const id = segments.pop()

    // cargar areas
    async function cargarTipoMonedas() {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaInput')

            data.forEach((moneda) => {
                const option = $(`<option ${moneda["mon_codigo"] == 'SOL' ? 'selected' : ''}>`).val(moneda["mon_codigo"]).text(moneda["mon_descripcion"])
                $monedaSelect.append(option)
            })

        } catch (error) {
            alert('Error al obtener las areas')
        }
    }

    // cargamos responsables
    async function cargarTrabajadores() {
        try {
            const { data } = await client.get('/trabajadoresSimple')
            const $solicitanteCotizacion = $('#solicitanteCotizacionInput')

            // Ordenar la data alfabéticamente según el nombre (índice [1])
            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(trabajador => {
                const option = $('<option>').val(trabajador.tra_id).text(trabajador.tra_nombre)
                $solicitanteCotizacion.append(option.clone())
            })
        } catch (error) {
            alert('Error al obtener los encargados')
        }
    }

    async function cargarCotizacion() {
        const { data } = await client.get(`/cotizacion/${id}`)
        console.log(data)
        // cotizacion de proveedor
        $('#numeroCotizacionProveedorInput').val(data.coc_cotizacionproveedor || '')
        // datos de proveedor
        $('#documentoProveedorInput').val(`${data.proveedor.tdo_codigo} - ${data.proveedor.prv_nrodocumento}`)
        $('#razonSocialProveedorInput').val(data.proveedor.prv_nombre)
        $('#correoProveedorInput').val(data.proveedor.prv_correo || '')
        $('#contactoProveedorInput').val(data.proveedor.prv_contacto || '')
        $('#whatsappProveedorInput').val(data.proveedor.prv_whatsapp || '')
        // datos de la cotizacion
        $('#monedaInput').val(data.moneda.mon_codigo)
        $('#formaDePagoInput').val(data.coc_formapago || '')
        $('#fechaCotizacionPicker').datepicker({
            dateFormat: 'dd/mm/yy',
        }).datepicker("setDate", moment(data.coc_fechacotizacion).toDate())
        $('#solicitanteCotizacionInput').val(data.tra_solicitante || '')
        $('#notaCotizacionInput').val(data.coc_notas || '')
        // debemos recorrer el detalle de adjuntos
        data.detalle_cotizacion_archivos.forEach((archivo, index) => {
            const { cda_url, cda_descripcion, cda_id, } = archivo
            const fileName = `Archivo ${index + 1}`
            var li = $(`<li class="list-group-item d-flex justify-content-between align-items-center editable" data-id="${cda_id}"></li>`);
            var fileNameText = $('<span></span>').text(fileName);
            var descriptionInput = $(`<input type="text" class="form-control mx-2 descripcion-file" placeholder="Descripción del archivo" value="${cda_descripcion || ''}" />`);
            var removeButton = $(`<button class="btn btn-danger btn-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                                    </svg>
                                </button>`);
            var downloadButton = $(`<button class="btn btn-primary btn-sm ms-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16">
                                            <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                                            <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                                        </svg>
                                    </button>`);

            downloadButton.on('click', function () {
                descargarRecurso(cda_url)
            })

            removeButton.on('click', function () {
                removeArchivo(li);
                li.remove(); // Elimina el <li> de la lista
            });
            li.append(fileNameText);
            li.append(descriptionInput);
            li.append(removeButton);
            li.append(downloadButton)
            $('#fileList').append(li);
        })
        // debemos recorrer el detalle
        data.detalle_cotizacion.forEach(detalle => {
            const { cod_id, cod_cantidad, cod_descripcion, cod_orden, cod_preciounitario, cod_total, pro_id } = detalle
            const producto_id = pro_id ? pro_id : obtenerIdUnico()
            const rowItem = document.createElement('tr')
            rowItem.classList.add(pro_id ? '' : 'sin-asociar');
            rowItem.classList.add('editable');
            rowItem.dataset.id = cod_id
            rowItem.innerHTML = `
                <input class="producto-id" value="${producto_id}" type="hidden"/>
                <td class="orden">${cod_orden}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${cod_descripcion}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${cod_cantidad}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control precio-input" value='${cod_preciounitario}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control total-input" value='${cod_total}' readonly/>
                </td>
                <td>
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
                        <button class="btn btn-sm btn-danger btn-cotizacion-eliminar me-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
                `
            const cantidadDetalle = rowItem.querySelector('.cantidad-input')
            const precioDetalle = rowItem.querySelector('.precio-input')
            const botonEditar = rowItem.querySelector('.btn-cotizacion-editar')
            const botonEliminar = rowItem.querySelector('.btn-cotizacion-eliminar')
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
            botonEliminar.addEventListener('click', function () { eliminarDetalleCotizacion(rowData, rowItem) })

            $('#productosCotizacionTable tbody').append(rowItem)
            $('#tbl-cotizacion-productos tbody').empty()
            calcularResumenCotizacion()
        })
    }

    function removeArchivo(element) {
        console.log(element)
        // detalle_archivos.splice(index, 1);
    }

    function descargarRecurso(urlParam) {
        const urlRecurso = `http://localhost:8080/storage/${urlParam}`
        window.open(urlRecurso, '_blank');
    }

    function eliminarDetalleCotizacion(rowData, rowItem) {
        $(rowItem).remove()
        const productos = $('#productosCotizacionTable tbody tr')
        productos.each(function (index, row) {
            var input = $(row).find('.orden')
            input.text(index + 1)
        })
        calcularResumenCotizacion()
    }

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

        $(rowItem).find('.descripcion-input').prop('readonly', true)
        $(rowItem).find('.cantidad-input').prop('readonly', true)
        $(rowItem).find('.precio-input').prop('readonly', true)
        $(rowItem).find('.btn-cotizacion-guardar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-editar').css('display', '')
    }

    function editarDetalleCotizacion(rowItem) {
        $(rowItem).find('.descripcion-input').prop('readonly', false)
        $(rowItem).find('.cantidad-input').prop('readonly', false)
        $(rowItem).find('.precio-input').prop('readonly', false)
        $(rowItem).find('.btn-cotizacion-editar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-guardar').css('display', '')
    }

    // funcion para calcular resumen de cotizacion
    function calcularResumenCotizacion() {
        const totalCotizacion = $('#totalCotizacion')
        const productos = $('#productosCotizacionTable tbody tr')
        let totalCotizacionAcumulado = 0
        productos.each(function (index, row) {
            const total = parseFloat($(row).find('.total-input').val())
            totalCotizacionAcumulado += total
        })

        totalCotizacion.text((totalCotizacionAcumulado).toFixed(2))
    }

    async function initInformacion() {
        try {
            await Promise.all([
                cargarTipoMonedas(),
                cargarTrabajadores(),
            ])
            await cargarCotizacion()
        } catch (error) {
            alert("Error al cargar los datos")
        }
    }

    initInformacion()
})