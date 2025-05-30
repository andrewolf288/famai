$(document).ready(() => {
    let abortController

    const path = window.location.pathname
    const segments = path.split('/')
    const id = segments.pop()
    let dataCotizacion = {}
    const detalle_archivos = []

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
        dataCotizacion = data
        // cotizacion de proveedor
        $('#numeroCotizacionProveedorInput').val(data.coc_cotizacionproveedor || '')
        // datos de proveedor
        $('#idProveedorInput').val(data.proveedor.prv_id)
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
            var li = $(`<li class="list-group-item list-group-item-primary d-flex justify-content-between align-items-center row-editable" data-id="${cda_id}"></li>`);
            var fileNameText = $('<span></span>').text(fileName);
            var descriptionInput = $(`<input type="text" class="form-control mx-2 descripcion-file" placeholder="Descripción del archivo" value="${cda_descripcion || ''}" readonly/>`);
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

            // definimos la función de visualizaicon del recurso
            downloadButton.on('click', function () {
                descargarRecurso(cda_url)
            })

            // definimos la función de eliminación del recurso
            removeButton.on('click', function(){
                removeArchivo(li);   
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
            if (!pro_id) {
                rowItem.classList.add('sin-asociar');
            }
            //debemos indicar que son ediciones directas en base de datos
            rowItem.classList.add('row-editable');
            rowItem.classList.add('table-primary')
            // inicializamos su dataset
            rowItem.dataset.id = cod_id
            // construimos la información a mostrar
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
            botonEliminar.addEventListener('click', function () { eliminarDetalleCotizacion(rowItem) })

            $('#productosCotizacionTable tbody').append(rowItem)
            $('#tbl-cotizacion-productos tbody').empty()
            calcularResumenCotizacion()
        })
    }

    // --------------- FUNCIONES PARA GESTIONAR DETALLE DE ARCHIVOS DE COTIZACION -----------
    async function removeArchivo(element) {
        if(element.hasClass('row-editable')) {
            const id = element.data('id')
            try {
                await client.delete(`/cotizacion-archivo/${id}`)
            } catch(error) {
                console.log(error)
                alert('Error al eliminar el archivo')
                return
            }
        }
        element.remove()
    }

    function descargarRecurso(urlParam) {
        const urlRecurso = `${config.BACK_STORAGE_URL}${urlParam}`
        window.open(urlRecurso, '_blank');
    }

    // -------------- FUNCIONES PARA GESTIONAR DETALLE DE COTIZACION -------------

    // funcion para eliminar detalle de cotizacion
    async function eliminarDetalleCotizacion(rowItem) {
        if ($(rowItem).hasClass('row-editable')) {
            const idDetalleCotizacion = $(rowItem).data('id')
            try {
                await client.delete(`/cotizacion-detalle/${idDetalleCotizacion}`)
            } catch(error) {
                alert('Error al eliminar el detalle de cotizacion')
                return
            }

        }

        // eliminamos la fila de la tabla
        $(rowItem).remove()

        // ordenamos los indices
        const productos = $('#productosCotizacionTable tbody tr')
        productos.each(function (index, row) {
            var input = $(row).find('.orden')
            input.text(index + 1)
        })

        // calculamos el resumen de cotizacion
        calcularResumenCotizacion()
    }

    // funcion para guardar detalle de cotizacion
    async function guardarDetalleCotizacion(rowItem) {
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

        // debemos verificar si es un tr editable
        if ($(rowItem).hasClass('row-editable')) {
            const totalDetalle = $(rowItem).find('.total-input')
            const descripcionDetalle = $(rowItem).find('.descripcion-input')
            const idDetalleCotizacion = $(rowItem).data('id')
            // debemos actualizar el tr
            try {
                const formatData = {
                    cod_descripcion: descripcionDetalle.val(),
                    cod_cantidad: cantidadDetalle.val(),
                    cod_preciounitario: precioDetalle.val(),
                    cod_total: totalDetalle.val()
                }
                const {data} = await client.put(`/cotizacion-detalle/${idDetalleCotizacion}`, formatData)
            } catch(error) {
                // si ocurrio un error, dejamos la data como estaba antes
                const detalleAnterior = dataCotizacion.detalle_cotizacion.find(detalle => detalle.coc_id === idDetalleCotizacion)
                cantidadDetalle.val(detalleAnterior.coc_cantidad)
                precioDetalle.val(detalleAnterior.cod_preciounitario)
                totalDetalle.val(detalleAnterior.cod_total)
                descripcionDetalle.val(detalleAnterior.cod_descripcion)
                // mostramos alerta de error
                alert(error)
            }
        }

        calcularResumenCotizacion()

        $(rowItem).find('.descripcion-input').prop('readonly', true)
        $(rowItem).find('.cantidad-input').prop('readonly', true)
        $(rowItem).find('.precio-input').prop('readonly', true)
        $(rowItem).find('.btn-cotizacion-guardar').css('display', 'none')
        $(rowItem).find('.btn-cotizacion-editar').css('display', '')
    }

    // funcion para editar detalle de cotizacion
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
            console.log(error)
            alert("Error al cargar los datos")
        }
    }

    // inicializamos la informacion
    initInformacion()

    $('#fileInput').on('change', function (e) {
        // Obtenemos los archivos seleccionados
        var files = e.target.files;

        $.each(files, function (i, file) {
            // Añadimos el archivo al arreglo
            detalle_archivos.push(file);

            // Crear el elemento de lista
            var li = $('<li class="list-group-item list-group-item-warning d-flex justify-content-between align-items-center"></li>');

            // Crear el contenedor de nombre de archivo
            var fileNameText = $('<span></span>').text(file.name);

            // Crear el input para la descripción del archivo
            var descriptionInput = $('<input type="text" class="form-control mx-2 descripcion-file" placeholder="Descripción del archivo">');

            // Crear el botón de eliminar
            var removeButton = $(`<button class="btn btn-danger btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                    </svg>
                </button>`);

            // Acción del botón de eliminar
            removeButton.on('click', function () {
                removeArchivo(i);
                li.remove();
            });

            // Agregar todos los elementos al <li>
            li.append(fileNameText);
            li.append(descriptionInput);
            li.append(removeButton);

            // Añadir el <li> al contenedor de la lista
            $('#fileList').append(li);
        });

        $('#fileInput').val('');
    });

    // Función para eliminar un archivo del arreglo
    function removeArchivo(index) {
        detalle_archivos.splice(index, 1);
    }

    // funcion cargar modal de productos
    $('#addProductBtn').on('click', async (event) => {
        // reseteamos el modal
        $('#checkAsociarProducto').prop('checked', false)
        $('#productosInput').val('')
        limpiarLista()
        $('#tbl-cotizacion-productos tbody').empty()
        // mostramos el modal
        $('#addProductModal').modal('show')
    })

    // al momento de ir ingresando valores en el input
    $('#productosInput').on('input', debounce(async function () {
        const isChecked = $('#checkAsociarProducto').is(':checked')
        const query = $(this).val().trim()
        if (query.length >= 3 && !isChecked) {
            await buscarMateriales(query)
        } else {
            limpiarLista()
        }
    }))

    // al momento de presionar enter
    $('#productosInput').on('keydown', function (event) {
        // si es la tecla de enter
        if (event.keyCode === 13) {
            event.preventDefault();
            const isChecked = $('#checkAsociarProducto').is(':checked')
            // si se desea agregar un producto sin código
            if (isChecked) {
                ingresarProductoSinCodigo()
            } else {
                return
            }
        }
    });

    async function buscarMateriales(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/productosByQuery?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - Stock: ${material.alp_stock || '0.000000'} - Fec. Ult. Ingreso: ${material["UltimaFechaIngreso"] ? parseDateSimple(material["UltimaFechaIngreso"]) : 'No Aplica'}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
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

    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    function ingresarProductoSinCodigo() {
        const pro_codigo = ""
        const pro_id = obtenerIdUnico()
        const pro_descripcion = $.trim($('#productosInput').val())

        if (pro_descripcion.length < 3) {
            alert('La descripción debe tener al menos 3 caracteres')
        } else {
            $('#productosInput').val('')
            const rowItem = document.createElement('tr')
            rowItem.classList.add('sin-asociar');
            rowItem.innerHTML = `
                <input class="producto-id" value="${pro_id}" type="hidden"/>
                <td>${pro_codigo}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${pro_descripcion}'/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='1.00'/>
                </td>
                <td>
                    <input type="number" class="form-control precio-input" value=''/>
                </td>
                <td>
                    <input type="number" class="form-control total-input" value='' readonly/>
                </td>
             `
            const cantidad = rowItem.querySelector('.cantidad-input')
            const precio = rowItem.querySelector('.precio-input')

            cantidad.addEventListener('input', function () {
                const total = parseFloat(cantidad.value) * parseFloat(precio.value);
                if (!isNaN(total)) {
                    rowItem.querySelector('.total-input').value = total.toFixed(2);
                } else {
                    rowItem.querySelector('.total-input').value = '';
                }
            })

            precio.addEventListener('input', function () {
                const total = parseFloat(cantidad.value) * parseFloat(precio.value);
                if (!isNaN(total)) {
                    rowItem.querySelector('.total-input').value = total.toFixed(2);
                } else {
                    rowItem.querySelector('.total-input').value = '';
                }
            });
            $('#tbl-cotizacion-productos tbody').html(rowItem)
        }
    }

    function seleccionarMaterial(material) {
        const { pro_id, pro_codigo, pro_descripcion } = material

        // limpiamos el input
        limpiarLista()
        $('#productosInput').val('')

        const rowItem = document.createElement('tr')
        rowItem.innerHTML = `
        <input class="producto-id" value="${pro_id}" type="hidden"/>
        <td>${pro_codigo}</td>
        <td>
            <input type="text" class="form-control descripcion-input" value='${pro_descripcion}' readonly/>
        </td>
        <td>
            <input type="number" class="form-control cantidad-input" value='1.00'/>
        </td>
        <td>
            <input type="number" class="form-control precio-input" value=''/>
        </td>
        <td>
            <input type="number" class="form-control total-input" value='' readonly/>
        </td>
        `

        const cantidad = rowItem.querySelector('.cantidad-input')
        const precio = rowItem.querySelector('.precio-input')

        cantidad.addEventListener('input', function () {
            const total = parseFloat(cantidad.value) * parseFloat(precio.value);
            if (!isNaN(total)) {
                rowItem.querySelector('.total-input').value = total.toFixed(2);
            } else {
                rowItem.querySelector('.total-input').value = '';
            }
        })

        precio.addEventListener('input', function () {
            const total = parseFloat(cantidad.value) * parseFloat(precio.value);
            if (!isNaN(total)) {
                rowItem.querySelector('.total-input').value = total.toFixed(2);
            } else {
                rowItem.querySelector('.total-input').value = '';
            }
        });

        $('#tbl-cotizacion-productos tbody').html(rowItem)
    }

    // boton de agregar producto
    $('#btn-agregar-producto').on('click', function () {
        const productos = $('#tbl-cotizacion-productos tbody tr')

        let handleError = ''
        if (productos.length > 0) {
            let fila = $(productos[0])
            const asociar = fila.hasClass('sin-asociar') ? false : true
            const producto = fila.find('.producto-id').val()
            const descripcion = fila.find('.descripcion-input').val().trim()
            const cantidad = fila.find('.cantidad-input').val()
            const precio = fila.find('.precio-input').val()
            const total = fila.find('.total-input').val()

            if (!esValorNumericoValidoYMayorQueCero(cantidad) || !esValorNumericoValidoYMayorQueCero(precio) || descripcion.length < 3) {
                if (descripcion.length < 3) {
                    handleError += '- La descripción debe tener al menos 3 caracteres\n'
                }

                if (!esValorNumericoValidoYMayorQueCero(cantidad)) {
                    handleError += '- La cantidad debe ser un valor numérico mayor a 0\n'
                }

                if (!esValorNumericoValidoYMayorQueCero(precio)) {
                    handleError += '- El precio debe ser un valor numérico mayor a 0\n'
                }
            }

            if (handleError.length > 0) {
                alert(handleError)
                return
            } else {
                if (buscarDetalleProducto(producto)) {
                    alert('Este producto ya fue agregado')
                    return
                }
                // debemos asegurarnos que este producto no fue agregado al detalle
                const rowData = {
                    pro_id: producto,
                    cod_orden: $('#productosCotizacionTable tbody tr').length + 1,
                    cod_descripcion: descripcion,
                    cod_cantidad: cantidad,
                    cod_precio: precio,
                    cod_total: total,
                    cod_asociar: asociar
                }

                // agregamos al detalle general
                const rowItem = document.createElement('tr')
                rowItem.classList.add(rowData.cod_asociar ? '' : 'sin-asociar');
                rowItem.classList.add('table-warning')
                rowItem.innerHTML = `
                <input class="producto-id" value="${rowData.pro_id}" type="hidden"/>
                <td class="orden">${rowData.cod_orden}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${rowData.cod_descripcion}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${rowData.cod_cantidad}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control precio-input" value='${rowData.cod_precio}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control total-input" value='${rowData.cod_total}' readonly/>
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
                botonEliminar.addEventListener('click', function () { eliminarDetalleCotizacion(rowItem) })

                $('#productosCotizacionTable tbody').append(rowItem)
                $('#tbl-cotizacion-productos tbody').empty()
                calcularResumenCotizacion()
            }
        } else {
            alert('Por favor, agregue un producto')
        }
    })

    // funcion para validar ingreso unico de producto
    function buscarDetalleProducto(id) {
        const productos = $('#productosCotizacionTable tbody tr')
        productos.each(function (index, row) {
            const productoId = $(row).find('.producto-id').val()
            if (productoId == id) {
                return true
            }
        })
        return false
    }

    $('#btn-editar-cotizacion').on('click', async function () {
        const prv_id = $('#idProveedorInput').val()
        const coc_fechacotizacion = $('#fechaCotizacionPicker').val()
        const coc_cotizacionproveedor = $('#numeroCotizacionProveedorInput').val()
        const mon_codigo = $('#monedaInput').val()
        const coc_formapago = $('#formaDePagoInput').val()
        const tra_solicitante = $('#solicitanteCotizacionInput').val()
        const coc_notas = $('#notaCotizacionInput').val()
        const coc_total = $('#totalCotizacion').text()
        const detalle_productos = $('#productosCotizacionTable tbody tr.table-warning')
        const detalle_descripciones = $('#fileList').find('li.list-group-item-warning')

        let handleError = ''
        if (coc_fechacotizacion.length === 0) {
            handleError += '- La fecha de cotización es requerida\n'
        }
        if (prv_id.length === 0) {
            handleError += '- El proveedor es requerido\n'
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        const formatDetalleProductos = []
        const formatDetalleDescripciones = []
        detalle_productos.each(function (index, row) {
            const item = {
                cod_orden: $(row).find('.orden').text(),
                pro_id: $(row).hasClass('sin-asociar') ? null : $(row).find('.producto-id').val(),
                cod_descripcion: $(row).find('.descripcion-input').val(),
                cod_cantidad: $(row).find('.cantidad-input').val(),
                cod_preciounitario: $(row).find('.precio-input').val(),
                cod_total: $(row).find('.total-input').val(),
            }
            formatDetalleProductos.push(item)
        })

        detalle_descripciones.each(function (index, row) {
            const cda_descripcion = $(row).find('.descripcion-file').val() || null
            formatDetalleDescripciones.push(cda_descripcion)
        })

        const data = {
            prv_id,
            coc_cotizacionproveedor: coc_cotizacionproveedor || null,
            coc_fechacotizacion: transformarFecha(coc_fechacotizacion),
            mon_codigo: mon_codigo || null,
            coc_formapago: coc_formapago || null,
            tra_solicitante: tra_solicitante || null,
            coc_notas: coc_notas || null,
            coc_total: coc_total,
            detalle_productos: formatDetalleProductos,
            detalle_descripciones: formatDetalleDescripciones
        }

        console.log(data)

        const formData = new FormData()
        formData.append('cotizacion', JSON.stringify(data))
        for (let i = 0; i < detalle_archivos.length; i++) {
            formData.append('files[]', detalle_archivos[i])
        }

        try {
            const response = await client.post(`/cotizacion/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            window.location.href = 'cotizacion'
        } catch (error) {
            console.log(error)
            alert('Error al crear la cotización')
        }
    })

    $('#btn-cancelar-cotizacion').on('click', function () {
        window.location.href = 'cotizacion'
    })
})