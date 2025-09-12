$(document).ready(async () => {
    // variables para el manejo de datatable
    let dataTable;
    const dataContainer = $('#data-container')

    // URL ENDPOINT
    const apiURL = '/detalleMaterialesOrdenInterna'

    // -------- MANEJO DE FECHA ----------
    $("#fechaDesde").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().startOf('month').toDate());
    $("#fechaHasta").datepicker({
        dateFormat: 'dd/mm/yy',
    }).datepicker("setDate", moment().toDate());

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: true,
        pageLength: 50,
        lengthMenu: [50, 100, 250, 500],
        searching: true,
        info: true,
        language: {
            lengthMenu: "Mostrar _MENU_ registros por página",
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
            {targets: [5, 6], searchable: true},
            {targets: [0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13], searchable: false},
        ],
        order: [[6, 'desc']],
    }

    const dataTableOptionsHistorico = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: true,
    }

    // Inicializacion de data table
    async function initDataTable(URL = apiURL) {
        // verificamos que no se haya inicializado el datatable
        if ($.fn.DataTable.isDataTable(dataContainer)) {
            dataContainer.DataTable().destroy();
        }

        // vaciamos la lista
        $('#data-container-body').empty()
        
        // Agregamos el loader de nuevo después de vaciar
        $('#data-container-body').append(`
            <tr id="loader-row">
                <td colspan="18" class="text-center">
                    <div class="d-flex justify-content-center align-items-center p-3">
                        <div class="spinner-border text-primary me-2" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <span>Cargando datos...</span>
                    </div>
                </td>
            </tr>
        `)

        try {
            const { data } = await client.get(URL)
            
            // Removemos el loader antes de agregar los datos
            $('#loader-row').remove()
            
            data.forEach((material, index) => {
                // obtenemos los datos
                const { producto, orden_interna_parte, cotizaciones_count, ordenes_compra_count } = material
                const { orden_interna } = orden_interna_parte
                const { odt_numero, oic_tipo, oic_otsap } = orden_interna

                const rowItem = document.createElement('tr')
                rowItem.dataset.detalle = material.odm_id
                rowItem.innerHTML = `
                    <td class="text-center">
                        ${oic_tipo}
                    </td>
                    <td>${odt_numero || 'N/A'}</td>
                    <td>${oic_otsap || 'N/A'}</td>
                    <td>${parseDate(material.odm_feccreacion)}</td>
                    <td>${material.odm_estado || 'N/A'}</td>
                    <td>${orden_interna.oic_estado || 'N/A'}</td>
                    <td class="text-center">
                        ${material.odm_tipo == 1 ? 'R' : 'A'}
                    </td>
                    <td>${producto?.pro_codigo || 'N/A'}</td>
                    <td style="max-width: 500px; white-space: wrap;">${material.odm_descripcion}</td>
                    <td>${material.odm_observacion || 'N/A'}</td>
                    <td class="text-center">${material.odm_cantidad}</td>
                    <td class="text-center">${producto?.unidad?.uni_codigo || 'N/A'}</td>
                    <td class="text-center">${producto?.stock?.alp_stock || "0.00"}</td>
                    <td class="text-center">
                        <button class="btn btn-primary btn-historico" data-historico="${producto?.pro_id || null}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
                                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z"/>
                                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z"/>
                                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5"/>
                            </svg>
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary position-relative btn-cotizado text-black" data-detalle="${material.odm_id}" style="${!+cotizaciones_count > 0 ? 'background-color: #FC6868 !important' : 'background-color: #BDFFB0 !important'}">
                            Cotizaciones
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                ${cotizaciones_count}
                            </span>
                        </button>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-primary position-relative btn-ordenado text-black" data-detalle="${material.odm_id}" style="${!+ordenes_compra_count > 0 ? 'background-color: #FC6868 !important' : 'background-color: #BDFFB0 !important'}">
                            Ordenes de compra
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                ${ordenes_compra_count}
                            </span>
                        </button>
                    </td>
                `
                $('#data-container-body').append(rowItem)
            })

            // inicializamos el datatable
            dataTable = dataContainer.DataTable(dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Error al cargar la data')
        }
    }

    // ------------ INCIIALIZAMOS EL DATATABLE ------------
    await traerInformacionAlmacenes()
    
    initDataTable(`${apiURL}?fecha_desde=${moment().startOf('month').format('YYYY-MM-DD')}&fecha_hasta=${moment().format('YYYY-MM-DD')}`)

    // traer informacion de almacenes
    async function traerInformacionAlmacenes() {
        const { data } = await client.get('/sedes')
        const $sedes = $("#sed_id")
        data.forEach(sede => {
            const option = $('<option>').val(sede["sed_codigo"]).text(sede["sed_nombre"])
            $sedes.append(option)
        })

        if (document.getElementById('sed-actual').value) {
            $sedes.val(document.getElementById('sed-actual').value)
        }
    }

    $('#btn-buscar').on('click', () => {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const filterField = $('#filter-selector').val().trim()
        const filterValue = $('#filter-input').val().trim()
        const sedId = $('#sed_id').val().trim()

        let filteredURL = `${apiURL}?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        if (filterField) {
            filteredURL += `&${filterField}=${encodeURIComponent(filterValue)}`
        }
        if (sedId) {
            filteredURL += `&sed_id=${sedId}`
        }
        initDataTable(filteredURL)
    })

    $('#filter-selector').on('change', () => {
        const filterField = $('#filter-selector').val().trim()
        if (filterField) {
            $('#filter-input').attr('disabled', false)
        } else {
            $('#filter-input').attr('disabled', true)
        }
    })

    $('#filter-input').on('keypress', (e) => {
        if (e.which === 13) {
            $('#btn-buscar').click()
        }
    })

    $('#sed_id').on('change', () => {
        $('#btn-buscar').click()
    })

    // ------------- GESTION DE HISTORICO --------------
    function initHistoricoCotizaciones(data) {
        console.log(data)
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
            rowItem.classList.add(`${orden_compra.occ_estado === 'EMI' ? 'table-danger' : 'table-success'}`)

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
        // tenemos que detectar si el modal de cotizacion esta abierto
        const loadModalPresupuesto = bootstrap.Modal.getInstance(document.getElementById('cotizacionesModal'))
        if (loadModalPresupuesto) {
            // buscamos el numero de documento de todos los proveedores que tiene un check en filter check
            proveedoresFilter = $('.filter-check').filter(':checked').map((index, element) => {
                const row = $(element).closest('tr')
                const documentoProveedor = row.find('.nrodocumento-proveedor').text()
                return documentoProveedor
            }).get()
        }

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

    $("#data-container-body").on('click', '.btn-historico', async function () {
        const producto = $(this).data('historico')
        initHistoricoByProducto(producto)
    })

    // ------------- GESTION DE RESERVACION -------------
    $("#data-container-body").on('click', '.btn-reservado', function () {
        const loadModalReservado = new bootstrap.Modal(document.getElementById('reservacionModal'))
        loadModalReservado.show()
    })

    // ------------- GESTION DE ATENDIDO -----------------
    $("#data-container-body").on('click', '.btn-atendido', function () {
        const loadModalAtendido = new bootstrap.Modal(document.getElementById('atendidoModal'))
        loadModalAtendido.show()
    })

    // ------------ DETALLE DE COTIZACIONES ------------
    $("#data-container-body").on('click', '.btn-cotizado', async function () {
        const id = $(this).data('detalle')
        const params = new URLSearchParams({
            param: [id].join(','),
        })

        const { data } = await client.get(`/ordeninternamateriales/cotizacion?${params.toString()}`)
        console.log(data)
        $("#data-container-cotizacion tbody").empty()

        data.forEach(detalle => {
            const { cotizacion } = detalle
            const { proveedor, moneda } = cotizacion
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${cotizacion.coc_estado === 'RPR' && detalle.cod_cotizar != 1 ? 'table-danger' : 'table-success'}`)

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
            $('#data-container-cotizacion tbody').append(rowItem)
        })

        const loadModalCotizado = new bootstrap.Modal(document.getElementById('cotizadoModal'))
        loadModalCotizado.show()
    })

    // ------------- DETALLE DE ORDEN DE COMPRAS --------------
    $("#data-container-body").on('click', '.btn-ordenado', async function () {
        const id = $(this).data('detalle')
        const params = new URLSearchParams({
            param: [id].join(','),
        })

        const { data } = await client.get(`/ordeninternamateriales/ordencompra?${params.toString()}`)

        $("#data-container-ordencompra tbody").empty()

        data.forEach(detalle => {
            const { orden_compra } = detalle
            const { proveedor, moneda } = orden_compra
            const rowItem = document.createElement('tr')
            rowItem.classList.add(`${orden_compra.occ_estado === 'EMI' ? 'table-danger' : 'table-success'}`)

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
            $('#data-container-ordencompra tbody').append(rowItem)
        })

        const loadModalOrdenado = new bootstrap.Modal(document.getElementById('ordenadoModal'))
        loadModalOrdenado.show()
    })

    // ------------------ GESTION DE PRESUPUESTO -------------------
    $("#data-container-body").on('click', '.btn-presupuesto', async function () {
        const idDetalleMaterial = $(this).data('detalle')
        const notapresupuesto = $(this).data('notapresupuesto')
        const adjuntopresupuesto = $(this).data('adjuntopresupuesto')

        // establecemos los valores
        $("#idDetalleMaterialByPresupuesto").val(idDetalleMaterial)
        // restablecemos el adjuntos
        $("#idPresupuestoAdjunto").val('')

        $("#idPresupuestoNota").val(notapresupuesto)

        if (adjuntopresupuesto) {
            $("#linkPresupuestoAdjunto")
                .attr('href', `${config.BACK_STORAGE_URL}${adjuntopresupuesto}`)
                .text('Ver archivo adjunto')
                .off('click')
                .on('click', function (e) {
                })
        } else {
            $("#linkPresupuestoAdjunto")
                .attr('href', '#')
                .text('No hay archivo adjunto')
                .off('click')
                .on('click', function (e) {
                    e.preventDefault();
                })
        }

        // abrimos el modal
        const loadModalPresupuesto = new bootstrap.Modal(document.getElementById('presupuestoModal'))
        loadModalPresupuesto.show()
    })

    $("#btn-cambiar-presupuesto-detalle").on('click', async function () {
        // obtenemos el valor del id del detalle de material
        const idDetalleMaterial = $("#idDetalleMaterialByPresupuesto").val()
        const notapresupuesto = $('#idPresupuestoNota').val()
        const archivoAdjunto = document.getElementById('idPresupuestoAdjunto').files[0]

        if (!notapresupuesto || notapresupuesto.length == 0) {
            alert('Debe ingresar una nota de presupuesto');
            return;
        }

        const formatData = {
            odm_notapresupuesto: notapresupuesto
        }

        // obtenemos el file adjunto
        const formData = new FormData();
        formData.append('notapresupuesto', JSON.stringify(formatData));
        if (archivoAdjunto) {
            formData.append('adjuntopresupuesto', archivoAdjunto);
        }

        // hacemos un form data
        try {
            await client.post(`/ordeninternamateriales/presupuesto/${idDetalleMaterial}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            // cerramos el modal
            const loadModalPresupuesto = bootstrap.Modal.getInstance(document.getElementById('presupuestoModal'))
            loadModalPresupuesto.hide()
            // initPagination(`${apiURL}?alm_id=1&fecha_desde=${transformarFecha($('#fechaDesde').val())}&fecha_hasta=${transformarFecha($('#fechaHasta').val())}`, initDataTable, dataTableOptions, 50)
        } catch (error) {
            console.log(error)
            alert('Error al cambiar presupuesto')
        }
    })

    // ------------------ GESTION DE RESPONSABLE -------------------
    $("#data-container-body").on('click', '.btn-responsable', async function () {
        // obtenemos el valor del id del detalle de material
        const idDetalleMaterial = $(this).data('detalle')

        // consultamos la informacion de detalle de material
        const {data:ordenMaterial} = await client.get(`/detalleMaterialOrdenInterna/${idDetalleMaterial}`)

        const idResponsable = ordenMaterial.tra_responsable
        const nombreResponsable = ordenMaterial.responsable?.tra_nombre || 'Sin responsable'
        const fechaResponsable = ordenMaterial.odm_fecasignacionresponsable ? parseDate(ordenMaterial.odm_fecasignacionresponsable) : 'Sin fecha de asignación'
        $("#idDetalleMaterialByResponsable").val(idDetalleMaterial)
        $("#responsableDetalleMaterial").text(nombreResponsable)
        $("#fechaAsignacionResponsableDetalleMaterial").text(fechaResponsable)

        // hacemos llamado a la lista de trabajadores
        const { data } = await client.get('/trabajadoresSimple')
        
        const $selectorResponsable = $('#selectorResponsableDetalleMaterial')
        $selectorResponsable.empty()

        // Ordenar la data alfabéticamente según el nombre (índice [1])
        data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre))

        $selectorResponsable.append($('<option selected>').val('').text('Sin responsable'))
        data.forEach(trabajador => {
            const option = $(`<option ${trabajador.tra_id == idResponsable ? 'selected' : ''}>`).val(trabajador.tra_id).text(trabajador.tra_nombre)
            $selectorResponsable.append(option.clone())
        })

        // abrimos el modal
        const loadModalResponsable = new bootstrap.Modal(document.getElementById('responsableModal'))
        loadModalResponsable.show()
    })

    $("#btn-cambiar-responsable-detalle").on('click', async function () {
        // obtenemos el valor del id del detalle de material
        const idDetalleMaterial = $("#idDetalleMaterialByResponsable").val()
        const responsable = $.trim($("#selectorResponsableDetalleMaterial").val())

        if (responsable.length == 0) {
            alert('Debe seleccionar un responsable')
            return
        }

        const formatData = {
            tra_responsable: responsable,
            param: [idDetalleMaterial].join(',')
        }
        try {
            const { data } = await client.post(`/ordeninternamateriales/responsable-masivo`, formatData)
            const row = dataTable.rows().nodes().to$().filter(function () {
                return $(this).find('button.btn-responsable').data('detalle') == idDetalleMaterial;
            })

            if (row.length > 0) {
                const botonResponsable = row.find('button.btn-responsable')
                botonResponsable.text(data.responsable.tra_nombre)
                dataTable.row(row).invalidate().draw(false)
            }

            // cerramos el modal
            const loadModalResponsable = bootstrap.Modal.getInstance(document.getElementById('responsableModal'))
            loadModalResponsable.hide()
        } catch (error) {
            console.log(error)
            alert('Error al cambiar responsable')
        }
    })

    // -------------- GESTION DE EXPORTACIONES -----------------
    // exportacion de excel de datos
    $('#btn-export-data').click(async function () {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const filterField = $('#filter-selector').val().trim()
        const filterValue = $('#filter-input').val().trim()

        let filteredURL = `/ordeninternamateriales/export-excel`

        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        } else {
            filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        }

        try {
            const response = await client.get(filteredURL, {
                responseType: 'blob',
            })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar el archivo:", error);
        }
    })

    // exportamos excel presupuesto
    $('#btn-export-data-presupuesto').click(async function () {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const filterField = $('#filter-selector').val().trim()
        const filterValue = $('#filter-input').val().trim()

        let filteredURL = `/ordeninternamateriales/export-excel-presupuesto`

        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        } else {
            filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        }

        try {
            const response = await client.get(filteredURL, {
                responseType: 'blob',
            })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar el archivo:", error);
        }
    })

    // exportamos excel almacen
    $('#btn-export-data-almacen').click(async function () {
        const fechaDesde = transformarFecha($('#fechaDesde').val())
        const fechaHasta = transformarFecha($('#fechaHasta').val())
        const filterField = filterSelector.val().trim()
        const filterValue = filterInput.val().trim()

        let filteredURL = `/ordeninternamateriales/export-excel-almacen`

        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        } else {
            filteredURL += `?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
        }

        try {
            const response = await client.get(filteredURL, {
                responseType: 'blob',
            })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar el archivo:", error);
        }
    })
})
