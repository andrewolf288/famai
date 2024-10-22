$(document).ready(() => {
    let abortController
    // inicializamos la data
    let cotizacionRelacionada = null

    $("#fechaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $("#fechaEntregaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // cargar areas
    const cargarTipoMonedas = async () => {
        try {
            const { data } = await client.get('/monedasSimple')
            const $monedaSelect = $('#monedaOrdenCompraInput')

            data.forEach((moneda) => {
                const option = $(`<option ${moneda["mon_codigo"] == 'SOL' ? 'selected' : ''}>`).val(moneda["mon_codigo"]).text(moneda["mon_descripcion"])
                $monedaSelect.append(option)
            })

        } catch (error) {
            alert('Error al obtener las areas')
        }
    }

    // cargamos responsables
    const cargarTrabajadores = async () => {
        try {
            const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
            const { data } = await client.get('/trabajadoresSimple')
            const $elaboradoOrdenCompraInput = $('#elaboradoOrdenCompraInput')
            const $solicitadoOrdenCompraInput = $('#solicitadoOrdenCompraInput')
            const $autorizadoOrdenCompraInput = $('#autorizadoOrdenCompraInput')

            // Ordenar la data alfabéticamente según el nombre (índice [1])
            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(trabajador => {
                const option = $('<option>').val(trabajador.tra_id).text(trabajador.tra_nombre)
                $elaboradoOrdenCompraInput.append(option.clone())
                $solicitadoOrdenCompraInput.append(option.clone())
                $autorizadoOrdenCompraInput.append(option.clone())
            })

            // debo buscar el trabajador que corresponda al usuario logeado
            const { data: trabajador } = await client.get(`/trabajadorByUsuario/${usu_codigo}`)
            $elaboradoOrdenCompraInput.val(trabajador.tra_id)
        } catch (error) {
            alert('Error al obtener los encargados')
        }
    }

    const initInformacion = async () => {
        try {
            await Promise.all([
                cargarTipoMonedas(),
                cargarTrabajadores(),
            ])
        } catch (error) {
            alert("Error al cargar los datos")
        }
    }

    initInformacion()

    // jalar de cotizacion
    $('#btn-buscar-cotizacion').on('click', async function () {
        const query = $('#numeroCotizacionInput').val().trim()
        if (query.length >= 3) {
            await buscarCotizacion(query)
        }
    })

    async function buscarCotizacion(query) {
        try {
            const queryEncoded = encodeURIComponent(query)
            console.log(queryEncoded)
            const { data } = await client.get(`/cotizacionByNumero?numero=${queryEncoded}`)
            console.log(data)
            // DATOS DE LA COTIZACION
            cotizacionRelacionada = data.coc_id
            // DATOS DEL PROVEEDOR
            const {proveedor, moneda, detalle_cotizacion} = data
            $('#idProveedorOrdenCompraInput').val(proveedor.prv_id)
            $('#documentoProveedorInput').val(`${proveedor.tdo_codigo} - ${proveedor.prv_nrodocumento}`)
            $('#razonSocialProveedorInput').val(proveedor.prv_nombre || '')
            $('#correoProveedorInput').val(proveedor.prv_correo || '')
            $('#contactoProveedorInput').val(proveedor.prv_contacto || '')
            $('#whatsappProveedorInput').val(proveedor.prv_whatsapp || '')
            $('#direccionProveedorInput').val(proveedor.prv_direccion || '')
            // DATOS DE ORDEN DE COMPRA
            $('#monedaOrdenCompraInput').val(moneda.mon_codigo)
            $('#formaDePagoOrdenCompraInput').val(data.coc_formapago || '')
            $('#notaOrdenCompraInput').val(data.coc_notas || '')
            // DETALLE DE ORDEN DE COMPRA
            $('#productosOrdenCompraBody').empty()

            // recorremos la data del detalle de producto
            detalle_cotizacion.forEach((detalle, index) => {
                // debemos asegurarnos que este producto no fue agregado al detalle
                const rowData = {
                    pro_id: detalle.pro_id ? detalle.pro_id : obtenerIdUnico(),
                    ocd_orden: index + 1,
                    ocd_descripcion: detalle.cod_descripcion,
                    ocd_cantidad: detalle.cod_cantidad,
                    ocd_preciounitario: detalle.cod_preciounitario,
                    ocd_total: detalle.cod_total,
                    ocd_asociar: detalle.pro_id ? true : false
                }

                // agregamos al detalle general
                const rowItem = document.createElement('tr')
                rowItem.classList.add(rowData.ocd_asociar ? '' : 'sin-asociar');
                rowItem.innerHTML = `
                <input class="producto-id" value="${rowData.pro_id}" type="hidden"/>
                <td class="orden">${rowData.ocd_orden}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${rowData.ocd_descripcion}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${rowData.ocd_cantidad}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control precio-input" value='${rowData.ocd_preciounitario}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control total-input" value='${rowData.ocd_total}' readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-orden-compra-editar me-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-success btn-orden-compra-guardar me-2" style="display: none;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                                <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                                <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-orden-compra-eliminar me-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
                `

                const cantidadDetalle = rowItem.querySelector('.cantidad-input')
                const precioDetalle = rowItem.querySelector('.precio-input')
                const botonEditar = rowItem.querySelector('.btn-orden-compra-editar')
                const botonEliminar = rowItem.querySelector('.btn-orden-compra-eliminar')
                const botonGuardar = rowItem.querySelector('.btn-orden-compra-guardar')

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
                botonEditar.addEventListener('click', function () { editarDetalleOrdenCompra(rowItem) })
                botonGuardar.addEventListener('click', function () { guardarDetalleOrdenCompra(rowItem) })
                botonEliminar.addEventListener('click', function () { eliminarDetalleOrdenCompra(rowData, rowItem) })

                $('#productosOrdenCompraBody').append(rowItem)
                calcularResumenOrdenCompra()
            })

        } catch(error){
            console.log(error)
        }
        
    }

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
        const { prv_id, prv_nrodocumento, prv_nombre, tdo_codigo, prv_correo, prv_whatsapp, prv_contacto, prv_direccion } = proveedor

        limpiarListaProveedores()
        $('#proveedoresInput').val('')

        $('#idProveedorOrdenCompraInput').val(prv_id)
        $('#documentoProveedorInput').val(`${tdo_codigo} - ${prv_nrodocumento}`)
        $('#razonSocialProveedorInput').val(prv_nombre || '')
        $('#correoProveedorInput').val(prv_correo || '')
        $('#contactoProveedorInput').val(prv_contacto || '')
        $('#whatsappProveedorInput').val(prv_whatsapp || '')
        $('#direccionProveedorInput').val(prv_direccion || '')
    }

    // funcion cargar modal de productos
    $('#addProductBtn').on('click', async (event) => {
        // reseteamos el modal
        $('#checkAsociarProducto').prop('checked', false)
        $('#productosInput').val('')
        limpiarLista()
        $('#tbl-orden-compra-productos tbody').empty()
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
            $('#tbl-orden-compra-productos tbody').html(rowItem)
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

        $('#tbl-orden-compra-productos tbody').html(rowItem)
    }

    // boton de agregar producto
    $('#btn-agregar-producto').on('click', function () {
        const productos = $('#tbl-orden-compra-productos tbody tr')

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
                    ocd_orden: $('#productosOrdenCompraTable tbody tr').length + 1,
                    ocd_descripcion: descripcion,
                    ocd_cantidad: cantidad,
                    ocd_preciounitario: precio,
                    ocd_total: total,
                    ocd_asociar: asociar
                }

                // agregamos al detalle general
                const rowItem = document.createElement('tr')
                rowItem.classList.add(rowData.ocd_asociar ? '' : 'sin-asociar');
                rowItem.innerHTML = `
                <input class="producto-id" value="${rowData.pro_id}" type="hidden"/>
                <td class="orden">${rowData.ocd_orden}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${rowData.ocd_descripcion}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${rowData.ocd_cantidad}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control precio-input" value='${rowData.ocd_preciounitario}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control total-input" value='${rowData.ocd_total}' readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-orden-compra-editar me-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-success btn-orden-compra-guardar me-2" style="display: none;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                                <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                                <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-orden-compra-eliminar me-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
                `

                const cantidadDetalle = rowItem.querySelector('.cantidad-input')
                const precioDetalle = rowItem.querySelector('.precio-input')
                const botonEditar = rowItem.querySelector('.btn-orden-compra-editar')
                const botonEliminar = rowItem.querySelector('.btn-orden-compra-eliminar')
                const botonGuardar = rowItem.querySelector('.btn-orden-compra-guardar')

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
                botonEditar.addEventListener('click', function () { editarDetalleOrdenCompra(rowItem) })
                botonGuardar.addEventListener('click', function () { guardarDetalleOrdenCompra(rowItem) })
                botonEliminar.addEventListener('click', function () { eliminarDetalleOrdenCompra(rowData, rowItem) })

                $('#productosOrdenCompraTable tbody').append(rowItem)
                $('#tbl-orden-compra-productos tbody').empty()
                calcularResumenOrdenCompra()
            }
        } else {
            alert('Por favor, agregue un producto')
        }
    })

    function eliminarDetalleOrdenCompra(rowData, rowItem) {
        $(rowItem).remove()
        const productos = $('#productosOrdenCompraTable tbody tr')
        productos.each(function (index, row) {
            var input = $(row).find('.orden')
            input.text(index + 1)
        })
        calcularResumenOrdenCompra()
    }

    function guardarDetalleOrdenCompra(rowItem) {
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

        calcularResumenOrdenCompra()

        $(rowItem).find('.descripcion-input').prop('readonly', true)
        $(rowItem).find('.cantidad-input').prop('readonly', true)
        $(rowItem).find('.precio-input').prop('readonly', true)
        $(rowItem).find('.btn-orden-compra-guardar').css('display', 'none')
        $(rowItem).find('.btn-orden-compra-editar').css('display', '')

    }

    function editarDetalleOrdenCompra(rowItem) {
        $(rowItem).find('.descripcion-input').prop('readonly', false)
        $(rowItem).find('.cantidad-input').prop('readonly', false)
        $(rowItem).find('.precio-input').prop('readonly', false)
        $(rowItem).find('.btn-orden-compra-editar').css('display', 'none')
        $(rowItem).find('.btn-orden-compra-guardar').css('display', '')
    }

    // funcion para calcular resumen de orden de compra
    function calcularResumenOrdenCompra() {
        const subtotalOrdenCompra = $('#subtotalOrdenCompra')
        const igvOrdenCompra = $('#igvOrdenCompra')
        const totalOrdenCompra = $('#totalOrdenCompra')
    
        const productos = $('#productosOrdenCompraTable tbody tr')
        let subtotalOrdenCompraAcumulado = 0
    
        // Sumar los totales de todos los productos
        productos.each(function (index, row) {
            const total = parseFloat($(row).find('.total-input').val())
            subtotalOrdenCompraAcumulado += total
        })
    
        // Cálculo sin redondeo previo
        const igv = subtotalOrdenCompraAcumulado * 0.18
        const total = subtotalOrdenCompraAcumulado + igv
    
        // Aplicar toFixed(2) solo al mostrar los valores
        subtotalOrdenCompra.text(subtotalOrdenCompraAcumulado.toFixed(2))
        igvOrdenCompra.text(igv.toFixed(2))
        totalOrdenCompra.text(total.toFixed(2))
    }
    

    // funcion para validar ingreso unico de producto
    function buscarDetalleProducto(id) {
        const productos = $('#productosOrdenCompraTable tbody tr')
        productos.each(function (index, row) {
            const productoId = $(row).find('.producto-id').val()
            if (productoId == id) {
                return true
            }
        })
        return false
    }

    $('#btn-guardar-orden-compra').on('click', async function () {
        // proveedor informacion
        const prv_id = $('#idProveedorOrdenCompraInput').val()
        const pvc_id = $('#cuentaProveedorOrdenCompra').val()
        // datos de orden de compra
        const mon_codigo = $('#monedaOrdenCompraInput').val()
        const occ_formapago = $('#formaDePagoOrdenCompraInput').val()
        const occ_fecha = $('#fechaOrdenCompraPicker').val()
        const occ_fechaentrega = $('#fechaEntregaOrdenCompraPicker').val()
        const occ_referencia = $('#referenciaOrdenCompraInput').val()
        const tra_elaborado = $('#elaboradoOrdenCompraInput').val()
        const tra_solicitado = $('#solicitadoOrdenCompraInput').val()
        const tra_autorizado = $('#autorizadoOrdenCompraInput').val()
        const occ_notas = $('#notaOrdenCompraInput').val()
        // datos de pago de orden compra
        const occ_adelanto = $('#adelantoOrdenCompraInput').val()
        const occ_saldo = $('#saldoOrdenCompraInput').val()
        const occ_observacionpago = $('#observacionPagoOrdenCompraInput').val()
        // resumen de orden de compra
        const occ_total = $('#totalOrdenCompra').text()
        const occ_subtotal = $('#subtotalOrdenCompra').text()
        const occ_impuesto = $('#igvOrdenCompra').text()
        const detalle_productos = $('#productosOrdenCompraTable tbody tr')

        let handleError = ''
        if(occ_fecha.length === 0 || prv_id.length === 0 || detalle_productos.length === 0) {
            if(occ_fecha.length === 0) {
                handleError += '- La fecha de orden de compra es requerida\n'
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
                ocd_orden: $(row).find('.orden').text(),
                pro_id: $(row).hasClass('sin-asociar') ? null : $(row).find('.producto-id').val(),
                ocd_descripcion: $(row).find('.descripcion-input').val(),
                ocd_cantidad: $(row).find('.cantidad-input').val(),
                ocd_preciounitario: $(row).find('.precio-input').val(),
                ocd_total: $(row).find('.total-input').val(),
            }
            formatDetalleProductos.push(item)
        })

        const data = {
            coc_id: cotizacionRelacionada,
            prv_id,
            pvc_cuentasoles: null,
            pvc_cuentadolares: null,
            pvc_cuentabanconacion: null,
            occ_fecha: transformarFecha(occ_fecha),
            occ_fechaentrega: transformarFecha(occ_fechaentrega),
            mon_codigo: mon_codigo || null,
            occ_formapago: occ_formapago || null,
            occ_referencia: occ_referencia || null,
            tra_elaborado: tra_elaborado || null,
            tra_solicitado: tra_solicitado || null,
            tra_autorizado: tra_autorizado || null,
            occ_notas: occ_notas || null,
            occ_total: occ_total,
            occ_subtotal: occ_subtotal,
            occ_impuesto: occ_impuesto,
            occ_adelanto: occ_adelanto || null,
            occ_saldo: occ_saldo || null,
            occ_observacionpago: occ_observacionpago || null,
            detalle_productos: formatDetalleProductos,
        }
        console.log(data)

        try {
            const response = await client.post('/ordenescompra', data)
            window.location.href = 'orden-compra'
        } catch (error) {
            console.log(error)
            alert('Error al crear la orden de compra')
        }

    })
})