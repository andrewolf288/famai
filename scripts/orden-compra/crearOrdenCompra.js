$(document).ready(() => {
    let abortController
    // inicializamos la data
    let cotizacionRelacionada = null
    let dataTableCotizaciones
    let dataTableMateriales
    const dataCotizacionesContainer = $("#cotizaciones-container")
    const dataMaterialesContainer = $("#tbl-detalle-orden-interna")

    $("#fechaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $("#fechaEntregaOrdenCompraPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // ---------- CARGA DE AREAS INICIALES -----------
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

    // ---------- CARGA DE TRABAJADORES INCIALES ------------
    const cargarTrabajadores = async () => {
        try {
            const usu_codigo = decodeJWT(localStorage.getItem('authToken')).usu_codigo
            const { data } = await client.get('/trabajadoresSimple')
            const $elaboradoOrdenCompraInput = $('#elaboradoOrdenCompraInput')
            const $solicitadoOrdenCompraInput = $('#solicitadoOrdenCompraInput')
            const $autorizadoOrdenCompraInput = $('#autorizadoOrdenCompraInput')

            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

            data.forEach(trabajador => {
                const option = $('<option>').val(trabajador.tra_id).text(trabajador.tra_nombre)
                $elaboradoOrdenCompraInput.append(option.clone())
                $solicitadoOrdenCompraInput.append(option.clone())
                $autorizadoOrdenCompraInput.append(option.clone())
            })

            const { data: trabajador } = await client.get(`/trabajadorByUsuario/${usu_codigo}`)
            $elaboradoOrdenCompraInput.val(trabajador.tra_id)
        } catch (error) {
            alert('Error al obtener los encargados')
        }
    }

    // ---------- FUNCION DE INICIALIZACION DE INFORMACION ----------
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

    // ----------- GESTION DE CREACION DE ORDEN DE COMPRA JALANDO UNA COTIZACION ------------
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: true,
        columnDefs: [
            {
                targets: 0,
                orderable: false,
            },
            {
                orderable: false,
                render: DataTable.render.select(),
                targets: 1,
                className: 'form-check-input'
            }
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    // funcion para inicializar la informacion de cotizaciones respondidas por el proveedor
    async function initCotizaciones() {
        const modalCotizaciones = new bootstrap.Modal(document.getElementById('cotizacionesModal'))
        modalCotizaciones.show()

        try {
            if ($.fn.DataTable.isDataTable(dataCotizacionesContainer)) {
                dataCotizacionesContainer.DataTable().destroy();
            }
            const { data } = await client.get('/cotizacion-detalle-pendiente')
            $('#cotizaciones-container tbody').empty()
            data.forEach(detalle => {
                const { cotizacion, detalle_material, cod_id, cod_tiempoentrega, cod_descripcion, cod_observacion, cod_cantidad, cod_preciounitario, cod_total, cod_usucreacion, cod_feccreacion } = detalle
                const { proveedor, moneda } = cotizacion

                const rowItem = document.createElement('tr')
                rowItem.dataset.detalle = cod_id

                rowItem.innerHTML = `
                    <td>
                        <input type="hidden" value="${cod_id}" />
                    </td>
                    <td></td>
                    <td>${detalle_material.orden_interna_parte?.orden_interna.odt_numero || 'N/A'}</td>
                    <td>${parseDateSimple(cotizacion.coc_fechacotizacion)}</td>
                    <td>${cotizacion.coc_numero}</td>
                    <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
                    <td>${proveedor.prv_nrodocumento}</td>
                    <td>${proveedor.prv_nombre}</td>
                    <td>${escapeHTML(cod_descripcion)}</td>
                    <td class="text-center">${cod_cantidad || 'N/A'}</td>
                    <td class="text-center">${moneda.mon_simbolo || ''} ${cod_preciounitario || 'N/A'}</td>
                    <td class="text-center">${moneda.mon_simbolo || ''} ${cod_total || 'N/A'}</td>
                    <td class="text-center">${cod_tiempoentrega ? `${cod_tiempoentrega} día(s)` : 'N/A'}</td>
                    <td>${escapeHTML(cod_observacion)}</td>
                    <td>
                        <span class="badge bg-primary">
                            ${cotizacion.coc_estado}
                        </span>
                    </td>
                    <td>${cod_usucreacion}</td>
                    <td>${parseDate(cod_feccreacion)}</td>
                `
                $('#cotizaciones-container tbody').append(rowItem)
            })
            dataTableCotizaciones = dataCotizacionesContainer.DataTable(dataTableOptions)
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener las cotizaciones")
        }
    }

    // inicializamos la información
    $("#btn-agregar-cotizaciones-detalle").on('click', async function () {
        // debemos obtener los odm_id de los detalles seleccionados
        const filasSeleccionadas = dataTableCotizaciones.rows({ selected: true }).nodes();
        const valoresSeleccionados = [];
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).find('input[type="hidden"]').val(); // Extrae el valor del checkbox
            valoresSeleccionados.push(valor);
        });

        if (valoresSeleccionados.length === 0) {
            alert('Debe seleccionar al menos un material')
            return
        }

        const formatData = {
            materiales: valoresSeleccionados
        }

        try {
            const { data } = await client.post('/cotizacion-detalle-masivo', formatData)
            renderizarDetallesCotizacion(data)
            // cerramos el modal y mostramos el formulario de creación
            const dialogCotizaciones = bootstrap.Modal.getInstance(document.getElementById('cotizacionesModal'))
            dialogCotizaciones.hide()
        } catch (error) {
            console.log(error)
        }

    })

    function renderizarDetallesCotizacion(materiales) {
        console.log(materiales)
        // cotizacionRelacionada = data.coc_id
        // const {proveedor, moneda, detalle_cotizacion} = data
        // $('#idProveedorOrdenCompraInput').val(proveedor.prv_id)
        // $('#documentoProveedorInput').val(`${proveedor.tdo_codigo} - ${proveedor.prv_nrodocumento}`)
        // $('#razonSocialProveedorInput').val(proveedor.prv_nombre || '')
        // $('#correoProveedorInput').val(proveedor.prv_correo || '')
        // $('#contactoProveedorInput').val(proveedor.prv_contacto || '')
        // $('#whatsappProveedorInput').val(proveedor.prv_whatsapp || '')
        // $('#direccionProveedorInput').val(proveedor.prv_direccion || '')
        // $('#monedaOrdenCompraInput').val(moneda.mon_codigo)
        // $('#formaDePagoOrdenCompraInput').val(data.coc_formapago || '')
        // $('#notaOrdenCompraInput').val(data.coc_notas || '')
        // $('#productosOrdenCompraBody').empty()

        // recorremos la data del detalle de producto
        materiales.forEach((detalle, index) => {
            const rowData = {
                odm_id: detalle.odm_id,
                ocd_orden: index + 1,
                ocd_descripcion: detalle.cod_descripcion,
                ocd_cantidad: detalle.cod_cantidad,
                ocd_preciounitario: detalle.cod_preciounitario,
                ocd_total: detalle.cod_total,
            }

            // agregamos al detalle general
            const rowItem = document.createElement('tr')
            rowItem.innerHTML = `
                <input class="detalle-material-id" value="${rowData.odm_id}" type="hidden"/>
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
    }

    initCotizaciones()
    initInformacion()


    // ------------ GESTION DE INGRESO DE INFORMACION DE PROVEEDOR -------------
    $('#proveedoresInput').on('input', debounce(async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarProveedores(query)
        } else {
            limpiarListaProveedores()
        }
    }))

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

    // -------------- GESTION DE INGRESO DE PRODUCTOS DE ORDEN INTERNA ---------------

    $("#addProductBtn").on('click', function () {
        $("#inputOrdenTrabajo").val("")
        $("#tbl-detalle-orden-interna tbody").empty()

        // abrimos los modales
        const modalAgregarProducto = new bootstrap.Modal(document.getElementById('addProductModal'))
        modalAgregarProducto.show()
    })

    async function buscarDetalleOrdenTrabajo(ordenTrabajo) {
        try {
            if ($.fn.DataTable.isDataTable(dataMaterialesContainer)) {
                dataMaterialesContainer.DataTable().destroy();
            }

            const formatData = {
                odt_numero: ordenTrabajo
            }
            const {data} = await client.post('/detalleMaterialesOrdenInterna/findByNumeroOrdenTrabajo', formatData)
            
            $("#tbl-detalle-orden-interna tbody").empty()

            data.forEach(material => {
                const {producto} = material
                const rowItem = document.createElement('tr')

                rowItem.innerHTML = `
                    <td>
                        <input type="hidden" value="${material.odm_id}" />
                    </td>
                    <td></td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td>${escapeHTML(material.odm_descripcion)}</td>
                    <td>${escapeHTML(material.odm_observacion)}</td>
                    <td>${material.odm_cantidad}</td>
                    <td>${material.odm_tipo == 1 ? 'R' : 'A'}</td>
                    <td>${material.odm_estado}</td>
                    <td>${parseDate(material.odm_fechacreacion)}</td>
                    <td>${material.odm_usucreacion}</td>
                    <td>${material.odm_fechamodificacion ? parseDate(material.odm_fechamodificacion) : 'N/A'}</td>
                    <td>${material.odm_usumodificacion ? material.odm_usumodificacion : 'N/A'}</td>
                `
                $("#tbl-detalle-orden-interna tbody").append(rowItem)
            })

            dataTableMateriales = dataMaterialesContainer.DataTable(dataTableOptions)

        } catch(error){
            console.log(error)
            alert('Error al buscar el detalle de la orden de trabajo')
        }
    }

    $("#btn-buscar-orden-trabajo").on('click', function () {
        const ordenTrabajo = $("#inputOrdenTrabajo").val().trim()
        if (ordenTrabajo.length === 0) {
            alert('Por favor, ingrese un número de orden de trabajo')
            return
        }

        buscarDetalleOrdenTrabajo(ordenTrabajo)
    })

    $('#btn-agregar-producto').on('click', function () {
        const productos = $('#tbl-orden-compra-productos tbody tr')

        let handleError = ''
        if (productos.length > 0) {
            let fila = $(productos[0])
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
                    ocd_orden: $('#productosOrdenCompraTable tbody tr').length + 1,
                    ocd_descripcion: descripcion,
                    ocd_cantidad: cantidad,
                    ocd_preciounitario: precio,
                    ocd_total: total,
                }

                // agregamos al detalle general
                const rowItem = document.createElement('tr')
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
        if (occ_fecha.length === 0 || prv_id.length === 0 || detalle_productos.length === 0) {
            if (occ_fecha.length === 0) {
                handleError += '- La fecha de orden de compra es requerida\n'
            }
            if (prv_id.length === 0) {
                handleError += '- El proveedor es requerido\n'
            }
            if (detalle_productos.length === 0) {
                handleError += '- Se debe agregar al menos un producto al detalle\n'
            }

        }

        if (handleError.length > 0) {
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