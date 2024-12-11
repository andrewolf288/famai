$(document).ready(() => {
    let abortController
    // inicializamos la data
    let dataTableCotizaciones
    let dataTableRequerimientos

    const dataCotizacionesContainer = $("#cotizaciones-container")
    const dataRequerimientosContainer = $("#requerimientos-container")

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
    const dataTableOptionsCotizaciones = {
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        searching: true,
        info: true,
        language: {
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            search: "Buscar:",
            zeroRecords: "No se encontraron resultados",
            select: {
                rows: {
                    _: " - %d filas seleccionadas",
                    0: " - Ninguna fila seleccionada",
                    1: " - 1 fila seleccionada"
                }
            },
        },
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
            },
            { targets: [6, 7, 8], searchable: true },
            { targets: [0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], searchable: false }
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    const dataTableOptionsRequerimientos = {
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        searching: true,
        info: true,
        language: {
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            infoFiltered: "(filtrado de _MAX_ registros totales)",
            search: "Buscar:",
            zeroRecords: "No se encontraron resultados",
            select: {
                rows: {
                    _: " - %d filas seleccionadas",
                    0: " - Ninguna fila seleccionada",
                    1: " - 1 fila seleccionada"
                }
            },
        },
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
            },
            { targets: [4, 5], searchable: true },
            { targets: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12], searchable: false }
        ],
        select: {
            style: 'multi',
            selector: 'td.form-check-input'
        },
    }

    const dataTableOptionsHistorico = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: true,
    }

    // ------- GESTION DE COTZACIONES DESPLEGABLE PARA CREACION DE ORDEN DE COMPRA -------

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
                const { cotizacion, detalle_material, cod_id, cod_tiempoentrega, cod_descripcion, cod_observacion, cod_cantidad, cod_preciounitario, cod_total, cod_usucreacion, cod_feccreacion, cod_parastock, cod_observacionproveedor, cod_cantidadcotizada } = detalle
                const { producto, orden_interna_parte } = detalle_material
                const { proveedor, moneda } = cotizacion

                const rowItem = document.createElement('tr')
                rowItem.dataset.detalle = cod_id

                rowItem.innerHTML = `
                    <td>
                        <input type="hidden" value="${cod_id}" />
                    </td>
                    <td></td>
                    <td>${orden_interna_parte?.orden_interna.odt_numero || 'N/A'}</td>
                    <td>${parseDateSimple(cotizacion.coc_fechacotizacion)}</td>
                    <td>${cotizacion.coc_numero}</td>
                    <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
                    <td class="numdocumento-proveedor">${proveedor.prv_nrodocumento}</td>
                    <td>${proveedor.prv_nombre}</td>
                    <td>${escapeHTML(cod_descripcion)}</td>
                    <td class="text-center">${cod_cantidad || 'N/A'}</td>
                    <td class="text-center">${cod_cantidadcotizada || 'N/A'}</td>
                    <td class="text-center">${moneda.mon_simbolo || ''} ${cod_preciounitario || 'N/A'}</td>
                    <td class="text-center">${moneda.mon_simbolo || ''} ${cod_total || 'N/A'}</td>
                    <td class="text-center">${cod_tiempoentrega ? `${cod_tiempoentrega} día(s)` : 'N/A'}</td>
                    <td>${escapeHTML(cod_observacion)}</td>
                    <td>${escapeHTML(cod_observacionproveedor)}</td>
                    <td>
                        <span class="badge bg-primary">
                            ${cotizacion.coc_estado}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-historico" data-historico="${producto?.pro_id || null}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                    </td>
                    <td>${cod_usucreacion}</td>
                    <td>${parseDate(cod_feccreacion)}</td>
                `
                $('#cotizaciones-container tbody').append(rowItem)
            })
            dataTableCotizaciones = dataCotizacionesContainer.DataTable(dataTableOptionsCotizaciones)
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener las cotizaciones")
        }
    }

    // inicializamos la información
    $("#btn-agregar-cotizaciones-detalle").on('click', async function () {
        const filasSeleccionadas = dataTableCotizaciones.rows({ selected: true }).nodes();
        const valoresSeleccionados = [];
        let nroProveedor = null

        // tenemos que verificar que el proveedor de la cotizacion sea el mismo
        $(filasSeleccionadas).each(function (index, node) {
            if (nroProveedor === null) {
                nroProveedor = $(node).find('.numdocumento-proveedor').text()
            } else {
                if (nroProveedor !== $(node).find('.numdocumento-proveedor').text()) {
                    alert('Debe seleccionar cotizaciones de un mismo proveedor')
                    return
                }
            }
        })

        // recolectamos las cotizaciones
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).find('input[type="hidden"]').val();
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
            alert("No se pudo traer la información para realizar la orden de compra")
        }
    })

    function renderizarDetallesCotizacion(data) {
        const { materiales, cotizacion, proveedor } = data
        const { cuentas_bancarias } = proveedor

        // completamos informacion de proveedor
        $('#idProveedorOrdenCompraInput').val(proveedor.prv_id)
        $('#documentoProveedorInput').val(`${proveedor.tdo_codigo} - ${proveedor.prv_nrodocumento}`)
        $('#razonSocialProveedorInput').val(proveedor.prv_nombre || '')
        $('#correoProveedorInput').val(proveedor.prv_correo || '')
        $('#contactoProveedorInput').val(proveedor.prv_contacto || '')
        $('#whatsappProveedorInput').val(proveedor.prv_whatsapp || '')
        $('#direccionProveedorInput').val(proveedor.prv_direccion || '')

        // completamos informacion de bancos
        const cuenta_banco_nacion = cuentas_bancarias.find(cuenta => compareStringsIgnoreCaseAndAccents(cuenta.entidad_bancaria?.eba_descripcion, 'Banco de la Nación'))
        const cuenta_soles = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'SOL' && cuenta.pvc_numerocuenta !== cuenta_banco_nacion.pvc_numerocuenta
            } else {
                return cuenta.mon_codigo === 'SOL'
            }
        })
        const cuenta_dolares = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'DOL' && cuenta.pvc_numerocuenta !== cuenta_banco_nacion.pvc_numerocuenta
            } else {
                cuenta.mon_codigo === 'DOL'
            }
        })

        $('#cuentaSolesProveedorOrdenCompra').val(cuenta_soles?.pvc_numerocuenta || '')
        $('#cuentaDolaresProveedorOrdenCompra').val(cuenta_dolares?.pvc_numerocuenta || '')
        $('#cuentaBancoNacionProveedorOrdenCompra').val(cuenta_banco_nacion?.pvc_numerocuenta || '')

        // si proviene de una cotizacion, debemos deshabilitar la opcion de seleccionar proveedor
        $('#proveedoresSUNAT').prop('disabled', true)
        $('#searchProveedorSUNAT').prop('disabled', true)
        $('#proveedoresInput').prop('disabled', true)

        // completamos informacion de cotizacion
        $('#monedaOrdenCompraInput').val(cotizacion.moneda.mon_codigo)
        $('#formaDePagoOrdenCompraInput').val(cotizacion.coc_formapago)
        $('#notaOrdenCompraInput').val(cotizacion.coc_notas || '')
        $('#productosOrdenCompraBody').empty()

        // recorremos la data del detalle de producto
        materiales.forEach((detalle, index) => {
            console.log(detalle)
            const { detalle_material } = detalle
            const { orden_interna_parte } = detalle_material
            const { orden_interna } = orden_interna_parte

            // agregamos al detalle general
            const rowItem = document.createElement('tr')
            rowItem.innerHTML = `
                <input class="detalle-material-id" value="${detalle.odm_id}" type="hidden"/>
                <td class="orden">${index + 1}</td>
                <td>${orden_interna?.odt_numero || 'N/A'}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${escapeHTML(detalle.cod_descripcion)}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${detalle.cod_cantidadcotizada}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control precio-input" value='${detalle.cod_preciounitario}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control total-input" value='${detalle.cod_total}' readonly/>
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

    // ------------- GESTION DE HISTORICO --------------

    function initHistoricoCotizaciones(data) {
        $('#historico-cotizaciones-container tbody').empty()
        data.forEach(detalle => {
            const { cotizacion } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${cotizacion.coc_estado === 'SOL' ? 'table-danger' : 'table-success'}`)

            rowItem.innerHTML = `
            <td>${parseDateSimple(cotizacion.coc_fechacotizacion)}</td>
            <td>${cotizacion.coc_numero}</td>
            <td>${cotizacion.coc_cotizacionproveedor || 'No aplica'}</td>
            <td>
                <span class="badge ${cotizacion.coc_estado === 'SOL' ? 'bg-danger' : cotizacion.coc_estado === 'RPR' ? 'bg-primary' : 'bg-success'}">
                    ${cotizacion.coc_estado}
                </span>
            </td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${detalle.cod_descripcion}</td>
            <td class="text-center">${detalle.cod_cantidad || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.cod_preciounitario || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.cod_total || 'N/A'}</td>
            <td class="text-center">${detalle.cod_tiempoentrega ? `${detalle.cod_tiempoentrega} día(s)` : 'N/A'}</td>
            `
            $('#historico-cotizaciones-container tbody').append(rowItem)
        })
    }

    function initHistoricoOrdenCompra(data) {
        $('#historico-ordenescompra-container tbody').empty()
        data.forEach(detalle => {
            const { orden_compra } = detalle
            const { proveedor, moneda } = orden_compra
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${orden_compra.occ_estado === 'SOL' ? 'table-danger' : 'table-success'}`)

            rowItem.innerHTML = `
            <td>${parseDateSimple(orden_compra.occ_fecha)}</td>
            <td>${orden_compra.occ_numero}</td>
            <td>
                <span class="badge bg-primary">
                    ${orden_compra.occ_estado}
                </span>
            </td>
            <td>${proveedor.prv_nrodocumento}</td>
            <td>${proveedor.prv_nombre}</td>
            <td>${detalle.ocd_descripcion}</td>
            <td class="text-center">${detalle.ocd_cantidad || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_preciounitario || 'N/A'}</td>
            <td class="text-center">${moneda?.mon_simbolo || ''} ${detalle.ocd_total || 'N/A'}</td>
            `
            $('#historico-ordenescompra-container tbody').append(rowItem)
        })
    }

    function initHistoricoByProducto(producto) {
        // debemos verificar que sea un material asignado
        if (producto === null) {
            alert("Este material no tiene un código asignado")
            return
        }

        let proveedoresFilter = []

        try {
            const params = new URLSearchParams({
                pro_id: producto,
                param: proveedoresFilter.join(','),
            })

            const urlCotizacion = `/cotizacion-detalle-findByProducto?${params.toString()}`;
            initPagination(urlCotizacion,
                initHistoricoCotizaciones,
                dataTableOptionsHistorico,
                10,
                "#historico-cotizaciones-container",
                "#historico-cotizaciones-container-body",
                "#pagination-container-historico-cotizacion")

            const urlOrdenCompra = `/ordencompra-detalle-findByProducto?${params.toString()}`
            initPagination(urlOrdenCompra,
                initHistoricoOrdenCompra,
                dataTableOptionsHistorico,
                10,
                "#historico-ordenescompra-container",
                "#historico-ordenescompra-container-body",
                "#pagination-container-historico-ordencompra"
            )
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener la información de históricos")
        }

        const loadModalHistorico = new bootstrap.Modal(document.getElementById('historicoModal'))
        loadModalHistorico.show()
    }

    $("#cotizaciones-container-body").on('click', '.btn-historico', async function () {
        const producto = $(this).data('historico')
        initHistoricoByProducto(producto)
    })

    $("#requerimientos-container-body").on('click', '.btn-historico', async function () {
        const producto = $(this).data('historico')
        initHistoricoByProducto(producto)
    })

    // ------------ GESTION DE MODAL DE DETALLE DE REQUERIMIENTOS ------------

    $("#btn-open-modal-requerimientos").on('click', function () {
        initRequerimientos()
    })

    async function initRequerimientos() {
        const getInstanceModalCotizaciones = bootstrap.Modal.getInstance(document.getElementById('cotizacionesModal'))
        if (getInstanceModalCotizaciones) {
            getInstanceModalCotizaciones.hide()
        }

        // mostrar modal de requerimientos
        const modalRequerimientos = new bootstrap.Modal(document.getElementById('requerimientosModal'))
        modalRequerimientos.show()

        try {
            if ($.fn.DataTable.isDataTable(dataRequerimientosContainer)) {
                dataRequerimientosContainer.DataTable().destroy();
            }

            const odm_estado = 'REQ'
            const { data } = await client.get(`/requerimientosdetalles?odm_estado=${odm_estado}`)

            $('#requerimientos-container tbody').empty()

            data.forEach(detalle => {
                const { producto, orden_interna_parte, odm_descripcion, odm_observacion, odm_cantidad, odm_id, odm_usucreacion, odm_feccreacion } = detalle
                const { orden_interna } = orden_interna_parte
                const { area, trabajador_origen, oic_fecha, oic_fechaentregaestimada } = orden_interna

                const rowItem = document.createElement('tr')
                rowItem.dataset.detalle = odm_id

                rowItem.innerHTML = `
                    <td>
                        <input type="hidden" value="${odm_id}" />
                    </td>
                    <td></td>
                    <td>${oic_fecha ? parseDateSimple(oic_fecha) : 'N/A'}</td>
                    <td>${oic_fechaentregaestimada ? parseDateSimple(oic_fechaentregaestimada) : 'N/A'}</td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td>${escapeHTML(odm_descripcion)}</td>
                    <td>${escapeHTML(odm_observacion)}</td>
                    <td>${odm_cantidad}</td>
                    <td>${area?.are_descripcion || 'N/A'}</td>
                    <td>${trabajador_origen?.tra_nombre || 'N/A'}</td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-historico" data-historico="${producto?.pro_id || null}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                    </td>
                    <td>${odm_usucreacion}</td>
                    <td>${parseDate(odm_feccreacion)}</td>
                `
                $('#requerimientos-container tbody').append(rowItem)
            })
            dataTableRequerimientos = dataRequerimientosContainer.DataTable(dataTableOptionsRequerimientos)
        } catch (error) {
            console.log(error)
            alert("Ocurrio un error al obtener los requerimientos")
        }
    }

    
    $("#btn-agregar-requerimientos-detalle").on('click', async function () {
        const filasSeleccionadas = dataTableRequerimientos.rows({ selected: true }).nodes();
        const valoresSeleccionados = [];

        // recolectamos las cotizaciones
        $(filasSeleccionadas).each(function (index, node) {
            const valor = $(node).find('input[type="hidden"]').val();
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
            const { data } = await client.post('/detalleMaterialesOrdenInterna/materiales-cotizar', formatData)
            renderizarDetallesRequerimientos(data)
            // cerramos el modal y mostramos el formulario de creación
            const dialogRequerimientos= bootstrap.Modal.getInstance(document.getElementById('requerimientosModal'))
            dialogRequerimientos.hide()
        } catch (error) {
            console.log(error)
            alert("No se pudo traer la información para realizar la orden de compra")
        }
    })

    function renderizarDetallesRequerimientos(materiales) {
        // recorremos la data del detalle de producto
        materiales.forEach((detalle, index) => {
            console.log(detalle)
            const { orden_interna_parte } = detalle
            const { orden_interna } = orden_interna_parte

            // agregamos al detalle general
            const rowItem = document.createElement('tr')
            rowItem.innerHTML = `
                <input class="detalle-material-id" value="${detalle.odm_id}" type="hidden"/>
                <td class="orden">${index + 1}</td>
                <td>${orden_interna?.odt_numero || 'N/A'}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${escapeHTML(detalle.odm_descripcion)}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${detalle.odm_cantidad}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control precio-input" value='0.00' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control total-input" value='0.00' readonly/>
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
        const { prv_id, prv_nrodocumento, prv_nombre, tdo_codigo, prv_correo, prv_whatsapp, prv_contacto, prv_direccion, cuentas_bancarias } = proveedor

        limpiarListaProveedores()
        $('#proveedoresInput').val('')

        $('#idProveedorOrdenCompraInput').val(prv_id)
        $('#documentoProveedorInput').val(`${tdo_codigo} - ${prv_nrodocumento}`)
        $('#razonSocialProveedorInput').val(prv_nombre || '')
        $('#correoProveedorInput').val(prv_correo || '')
        $('#contactoProveedorInput').val(prv_contacto || '')
        $('#whatsappProveedorInput').val(prv_whatsapp || '')
        $('#direccionProveedorInput').val(prv_direccion || '')

        // completamos informacion de bancos
        const cuenta_banco_nacion = cuentas_bancarias.find(cuenta => compareStringsIgnoreCaseAndAccents(cuenta.entidad_bancaria?.eba_descripcion, 'Banco de la Nación'))
        const cuenta_soles = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'SOL' && cuenta.pvc_numerocuenta !== cuenta_banco_nacion.pvc_numerocuenta
            } else {
                return cuenta.mon_codigo === 'SOL'
            }
        })
        const cuenta_dolares = cuentas_bancarias.find(cuenta => {
            if (cuenta_banco_nacion) {
                return cuenta.mon_codigo === 'DOL' && cuenta.pvc_numerocuenta !== cuenta_banco_nacion.pvc_numerocuenta
            } else {
                cuenta.mon_codigo === 'DOL'
            }
        })

        $('#cuentaSolesProveedorOrdenCompra').val(cuenta_soles?.pvc_numerocuenta || '')
        $('#cuentaDolaresProveedorOrdenCompra').val(cuenta_dolares?.pvc_numerocuenta || '')
        $('#cuentaBancoNacionProveedorOrdenCompra').val(cuenta_banco_nacion?.pvc_numerocuenta || '')
    }

    // -------------- GESTION DE INGRESO DE PRODUCTOS DE ORDEN INTERNA ---------------

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
        const porcentajeIGV = $('#porcentajeIGVOrdenCompra')

        // verificamos que el porcentaje de IGV sea numerico mayor a 0
        if (!esValorNumericoValidoYMayorQueCero(porcentajeIGV.val())) {
            alert('El porcentaje de IGV debe ser un valor numérico mayor a 0')
            return
        }

        const productos = $('#productosOrdenCompraTable tbody tr')
        let subtotalOrdenCompraAcumulado = 0

        // Sumar los totales de todos los productos
        productos.each(function (index, row) {
            const total = parseFloat($(row).find('.total-input').val())
            subtotalOrdenCompraAcumulado += total
        })

        // Cálculo sin redondeo previo
        const parsePorcentajeIGV = parseFloat(porcentajeIGV.val()) / 100
        console.log(parsePorcentajeIGV)
        const igv = subtotalOrdenCompraAcumulado * parsePorcentajeIGV
        const total = subtotalOrdenCompraAcumulado + igv

        // Aplicar toFixed(2) solo al mostrar los valores
        subtotalOrdenCompra.text(subtotalOrdenCompraAcumulado.toFixed(2))
        igvOrdenCompra.text(igv.toFixed(2))
        totalOrdenCompra.text(total.toFixed(2))
    }

    $("#porcentajeIGVOrdenCompra").on("input", function () {
        calcularResumenOrdenCompra()
    })


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
        const occ_porcentajeimpuesto = $('#porcentajeIGVOrdenCompra').val()
        const occ_impuesto = $('#igvOrdenCompra').text()
        const detalle_productos = $('#productosOrdenCompraTable tbody tr')

        let handleError = ''
        if (occ_fecha.length === 0) {
            handleError += '- La fecha de orden de compra es requerida\n'
        }
        if (prv_id.length === 0) {
            handleError += '- El proveedor es requerido\n'
        }
        if (detalle_productos.length === 0) {
            handleError += '- Se debe agregar al menos un producto al detalle\n'
        }
        if (!esValorNumericoValidoYMayorQueCero(occ_porcentajeimpuesto)) {
            handleError += '- El porcentaje de IGV debe ser un valor numérico mayor a 0\n'
        }
        if (!esValorNumericoValidoYMayorQueCero(occ_total)) {
            handleError += '- El total debe ser un valor numérico mayor a 0\n'
        }
        if (!esValorNumericoValidoYMayorQueCero(occ_subtotal)) {
            handleError += '- El subtotal debe ser un valor numérico mayor a 0\n'
        }
        if (!esValorNumericoValidoYMayorQueCero(occ_impuesto)) {
            handleError += '- El impuesto debe ser un valor numérico mayor a 0\n'
        }


        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        const formatDetalleProductos = []
        detalle_productos.each(function (index, row) {
            const item = {
                odm_id: $(row).find('.detalle-material-id').val(),
                ocd_orden: $(row).find('.orden').text(),
                ocd_descripcion: $(row).find('.descripcion-input').val(),
                ocd_cantidad: $(row).find('.cantidad-input').val(),
                ocd_preciounitario: $(row).find('.precio-input').val(),
                ocd_total: $(row).find('.total-input').val(),
            }
            formatDetalleProductos.push(item)
        })

        const data = {
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
            occ_porcentajeimpuesto: occ_porcentajeimpuesto,
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