$(document).ready(() => {
    let abortController
    // inicializamos la data
    const detalle_archivos = []

    $("#fechaCotizacionPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $("#fechaEntregaCotizacionPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // gestionamos informacion de proveedor
    $('#proveedoresInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarProveedores(query)
        } else {
            limpiarListaProveedores()
        }
    }))

    // al momento de presionar enter
    $('#searchProveedorSUNAT').on('click', async function (event) {
        console.log("first")
        const query = $('#proveedoresSUNAT').val().trim()
        // si es la tecla de enter
        if (event.keyCode === 13) {
            event.preventDefault();
            await buscarProveedorBySUNAT(query)
        }
    });

    async function buscarProveedorBySUNAT(documento) {
        console.log(documento)
    }

    async function buscarProveedores(query) {
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        try {
            const queryEncoded = encodeURIComponent(query)
            const { data } = await client.get(`/proveedoresByQuery?query=${queryEncoded}`)
            // Limpiamos la lista
            limpiarListaProveedores()
            // formamos la lista
            data.forEach(proveedor => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                listItem.textContent = `${proveedor.prv_nrodocumento} - ${proveedor.prv_nombre}`
                listItem.dataset.id = proveedor.prv_id
                listItem.addEventListener('click', () => seleccionarProveedor(proveedor))
                // agregar la lista completa
                $('#resultadosListaProveedores').append(listItem)
            })
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Petición abortada'); // Maneja el error de la petición abortada
            } else {
                console.error('Error al buscar proveedores:', error);
                alert('Error al buscar proveedores. Inténtalo de nuevo.'); // Muestra un mensaje de error al usuario
            }
        }
    }

    function limpiarListaProveedores() {
        $('#resultadosListaProveedores').empty()
    }

    function seleccionarProveedor(proveedor) {
        const { prv_id, prv_nrodocumento, prv_nombre, tdo_codigo, prv_correo, prv_telefono, prv_whatsapp, prv_contacto, prv_direccion } = proveedor

        limpiarListaProveedores()
        $('#proveedoresInput').val('')

        $('#idProveedorInput').val(prv_id)
        $('#documentoProveedorInput').val(`${tdo_codigo} - ${prv_nrodocumento}`)
        $('#razonSocialProveedorInput').val(prv_nombre || '')
        $('#correoProveedorInput').val(prv_correo || '')
        $('#contactoProveedorInput').val(prv_contacto || '')
        $('#whatsappProveedorInput').val(prv_whatsapp || '')
        $('#direccionProveedorInput').val(prv_direccion || '')
    }

    $('#fileInput').on('change', function (e) {
        // Obtenemos los archivos seleccionados
        var files = e.target.files;

        // Recorremos los archivos y los agregamos al arreglo y a la lista
        $.each(files, function (i, file) {
            detalle_archivos.push(file);

            // Agregar el archivo a la lista
            var li = $('<li class="list-group-item d-flex justify-content-between align-items-center"></li>').text(file.name);

            // Botón de eliminar
            var removeButton = $('<button class="btn btn-danger btn-sm">Eliminar</button>');
            removeButton.on('click', function () {
                // Eliminar archivo del arreglo y de la lista
                removeArchivo(i);
                li.remove();
            });

            li.append(removeButton);
            $('#fileList').append(li);
        });

        // Limpiamos el input para que se puedan volver a seleccionar los mismos archivos si se desea
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
                // listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion} - ${material.stock?.alp_stock || 0}`
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
                botonEliminar.addEventListener('click', function () { eliminarDetalleCotizacion(rowData, rowItem) })

                $('#productosCotizacionTable tbody').append(rowItem)
                $('#tbl-cotizacion-productos tbody').empty()
                calcularResumenCotizacion()
            }
        } else {
            alert('Por favor, agregue un producto')
        }
    })

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
        const subtotalCotizacion = $('#subtotalCotizacion')
        const igvCotizacion = $('#igvCotizacion')
        const totalCotizacion = $('#totalCotizacion')

        const productos = $('#productosCotizacionTable tbody tr')
        let subtotalCotizacionAcumulado = 0
        productos.each(function (index, row) {
            const total = parseFloat($(row).find('.total-input').val())
            subtotalCotizacionAcumulado += total
        })

        subtotalCotizacion.text(subtotalCotizacionAcumulado.toFixed(2))
        igvCotizacion.text((subtotalCotizacionAcumulado * 0.18).toFixed(2))
        totalCotizacion.text((subtotalCotizacionAcumulado * 1.18).toFixed(2))
    }

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

    $('#btn-guardar-cotizacion').on('click', async function () {
        const prv_id = $('#idProveedorInput').val()
        const coc_fechacotizacion = $('#fechaCotizacionPicker').val()
        const coc_fechaentrega = $('#fechaEntregaCotizacionPicker').val()
        const mon_codigo = $('#monedaInput').val()
        const coc_referencia = $('#referenciaCotizacionInput').val()
        const coc_formapago = $('#formaDePagoInput').val()
        const tra_solicitante = $('#solicitanteCotizacionInput').val()
        const coc_notas = $('#notaCotizacionInput').val()
        const coc_total = $('#totalCotizacion').text()
        const coc_subtotal = $('#subtotalCotizacion').text()
        const coc_impuesto = $('#igvCotizacion').text()
        const detalle_productos = $('#productosCotizacionTable tbody tr')

        let handleError = ''
        if(coc_fechacotizacion.length === 0 || prv_id.length === 0 || detalle_productos.length === 0) {
            if(coc_fechacotizacion.length === 0) {
                handleError += '- La fecha de cotización es requerida\n'
            }
            if(prv_id.length === 0) {
                handleError += '- El proveedor es requerido\n'
            }
            if(detalle_productos.length === 0) {
                handleError += '- Se debe agregar al menos un producto al detalle\n'
            }

        }
        
        if(handleError.length > 0) {
            alert(handleError)
            return
        }

        const formatDetalleProductos = []
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

        const data = {
            prv_id,
            coc_fechacotizacion: transformarFecha(coc_fechacotizacion),
            coc_fechaentrega: transformarFecha(coc_fechaentrega),
            coc_referencia: coc_referencia || null,
            mon_codigo: mon_codigo || null,
            coc_formapago: coc_formapago || null,
            tra_solicitante: tra_solicitante || null,
            coc_notas: coc_notas || null,
            coc_total: coc_total,
            coc_subtotal: coc_subtotal,
            coc_impuesto: coc_impuesto,
            detalle_productos: formatDetalleProductos,
        }
        console.log(data)

        const formData = new FormData()
        formData.append('cotizacion', JSON.stringify(data))
        for (let i = 0; i < detalle_archivos.length; i++) {
            formData.append('files[]', detalle_archivos[i])
        }

        try {
            const response = await client.post('/cotizaciones', formData, {
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
})