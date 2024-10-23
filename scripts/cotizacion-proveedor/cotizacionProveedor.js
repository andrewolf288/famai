$(document).ready(function() {
    // Inicializar el modal
    var modal = new bootstrap.Modal($('#accessCodeModal'), {
        backdrop: 'static',  // No permite cerrar el modal haciendo clic fuera de él
        keyboard: false      // Deshabilita cerrar con la tecla "Esc"
    });

    // Mostrar modal cuando cargue la página
    modal.show();

    // Código de acceso válido
    var validCode = "1234";  // Cambia esto por el código real que deseas usar

    // Validar el código de acceso cuando se envíe el formulario
    $('#accessForm').on('submit', function(event) {
        event.preventDefault();
        var enteredCode = $('#accessCodeInput').val();

        if (enteredCode === validCode) {
            // Código correcto: ocultar el modal y mostrar el formulario
            modal.hide();
            $('#formContent').show();
        } else {
            // Código incorrecto: mostrar mensaje de error
            $('#error-message').show();
        }
    });

    // ---------- JAVASCRIPT PARA EL MANEJO DE MATERIALES ----------
    // funcion cargar modal de productos
    $('#addProductBtn').on('click', async (event) => {
        $('#productosInput').val('')
        $('#tbl-cotizacion-productos tbody').empty()
        $('#addProductModal').modal('show')
    })

    // al momento de presionar enter
    $('#productosInput').on('keydown', function (event) {
        // si es la tecla de enter
        if (event.keyCode === 13) {
            event.preventDefault();
            ingresarProductoSinCodigo()
        }
    });

    function ingresarProductoSinCodigo() {
        const pro_descripcion = $.trim($('#productosInput').val())

        if (pro_descripcion.length < 3) {
            alert('La descripción debe tener al menos 3 caracteres')
        } else {
            $('#productosInput').val('')
            const rowItem = document.createElement('tr')
            rowItem.classList.add('sin-asociar');
            rowItem.innerHTML = `
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

    // boton de agregar producto
    $('#btn-agregar-producto').on('click', function () {
        const productos = $('#tbl-cotizacion-productos tbody tr')

        let handleError = ''
        if (productos.length > 0) {
            let fila = $(productos[0])
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
                // debemos asegurarnos que este producto no fue agregado al detalle
                const rowData = {
                    cod_orden: $('#productosCotizacionTable tbody tr').length + 1,
                    cod_descripcion: descripcion,
                    cod_cantidad: cantidad,
                    cod_precio: precio,
                    cod_total: total,
                }

                // agregamos al detalle general
                const rowItem = document.createElement('tr')
                rowItem.innerHTML = `
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

    function eliminarDetalleCotizacion(rowItem) {
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

    // funcion de validacion
    function esValorNumericoValidoYMayorQueCero(inputElement) {
        const numero = parseFloat(inputElement);
        return !isNaN(numero) && numero > 0;
    }
});
