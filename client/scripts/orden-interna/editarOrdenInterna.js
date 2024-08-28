$(document).ready(async function () {
    const path = window.location.pathname
    const segments = path.split('/')
    const id = segments.pop()

    let detalleOrdenInterna = []
    let currentDetalleParte = 0

    // funcion de busqueda de detalle de parte
    function buscarDetalleParte(id_detalle_parte) {
        return detalleOrdenInterna.find(element => element.opd_id == id_detalle_parte)
    }

    async function cargarDetalleOrdenInterna() {
        try {
            const { data } = await client.get(`/ordeninterna/${id}`)
            detalleOrdenInterna = data.partes
            // reemplazamos el valor en orden trabajo
            $('#otInput').val(data.odt_numero)
            // reemplazamos el valor en cliente
            $('#clienteInput').val(data.cliente?.cli_nombre ?? 'No aplica')
            // reemplazamos el valor en fecha
            $('#fechaPicker').val(data.oic_fecha ? parseDateSimple(data.oic_fecha) : 'No aplica')
            // reemplazamos el valor en area
            $('#areaSelect').val(data.area.are_descripcion || 'No aplica')
            // reemplazamos el valor en equipo de trabajo
            $('#equipoInput').val(data.oic_equipo_descripcion || 'No aplica')
            // reemplazamos el valor de encargado origen
            $('#responsableOrigen').val(data.trabajador_origen?.tra_nombre ?? 'No aplica')
            // reemplazamos el valor de encargado maestro
            $('#responsableMaestro').val(data.trabajador_maestro?.tra_nombre ?? 'No aplica')
            // reemplazamos el valor de encargado almacen
            $('#responsableAlmacen').val(data.trabajador_almacen?.tra_nombre ?? 'No aplica')

            data.partes.forEach(function (item, index) {
                const totalDetalleProcesos = item.procesos.filter(element => element.odp_estado == 1).length
                const totalDetalleProductos = item.materiales.filter(element => element.odm_estado == 1).length
                const totalAdicionales = item.materiales.filter((element) => element.odm_tipo == 2 && element.odm_estado == 1).length
                const totalRegulares = item.materiales.filter((element) => element.odm_tipo == 1 && element.odm_estado == 1).length

                const row = `
                <tr>
                    <td>${item.parte.oip_descripcion}</td>
                    <td>
                        <button class="btn btn-sm btn-editar btn-procesos" data-element="${item.parte.oip_descripcion}" data-id-parte="${item.oip_id}" data-id-detalle-parte="${item.opd_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                            </svg>
                            Procesos
                        </button>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-procesos-${item.opd_id}">${totalDetalleProcesos}</p>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-eliminar btn-productos" data-element="${item.parte.oip_descripcion}" data-id-parte="${item.oip_id}" data-id-detalle-parte="${item.opd_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hammer" viewBox="0 0 16 16">
                                <path d="M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5 5 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334"/>
                            </svg>
                            Materiales
                        </button>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-productos-${item.opd_id}">${totalDetalleProductos}</p>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-regulares-${item.opd_id}">${totalRegulares}</p>
                    </td>
                    <td>
                        <p class="text-center" id="cantidad-adicionales-${item.opd_id}">${totalAdicionales}</p>
                    </td>
                </tr>
                `
                // agregamos la tabla
                $('#tbl-orden-interna tbody').append(row)
            })
        } catch (error) {
            alert('Error al cargar la orden interna')
        }
    }

    await cargarDetalleOrdenInterna()

    // ------------ JAVASCRIPT PARA GESTION DE PROCESOS -------------
    // carga de selector de procesos
    const cargarProcesosSelect = async (id_parte) => {
        try {
            const { data } = await client.get(`/procesosByParte/${id_parte}`)
            const $procesosSelect = $('#procesosSelect')
            $procesosSelect.empty().append(`<option value="0">Seleccione un proceso</option>`)
            data.forEach(function (proceso) {
                const option = $('<option>').val(proceso["opp_id"]).text(`${proceso["opp_codigo"]} - ${proceso["opp_descripcion"]}`).attr('data-codigo', proceso["opp_codigo"])
                $procesosSelect.append(option)
            })
        } catch (error) {
            alert('Error al cargar el lsitado de procesos')
        }
    }

    function cargarProcesosDetalle(id_parte) {
        $('#tbl-orden-interna-procesos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { procesos } = findElement

        procesos.sort((a, b) => a.opp_codigo - b.opp_codigo)

        procesos.forEach(element => {
            const row = `
            <tr data-id-proceso="${element.proceso.opp_id}">
                <td>${element.proceso.opp_codigo}</td>
                <td>${element.proceso.opp_descripcion}</td>
                <td>
                    ${element.odp_observacion || ''}
                </td>
                <td>${element.usu_usucreacion ?? 'No aplica'}</td>
                <td>${element.usu_feccreacion ? parseDate(element.usu_feccreacion) : 'No aplica'}</td>
                <td>Sin acciones</td>
            </tr>`
            $('#tbl-orden-interna-procesos tbody').append(row)
        })
    }

    // funcion cargar modal de procesos
    $('#tbl-orden-interna').on('click', '.btn-procesos', async (event) => {
        // obtnemos el id del detalle de la parte
        const id_detalle_parte = $(event.currentTarget).data('id-detalle-parte')
        // actualizamos nuestra variable flag
        currentDetalleParte = id_detalle_parte
        // buscamos el detalle de la parte en la data traida
        const findParte = buscarDetalleParte(id_detalle_parte)

        // modificamos el nombre del modal
        $('#procesosModalLabel').text(`PROCESOS - ${findParte.parte.oip_descripcion}`)
        // cargamos la informacion
        await cargarProcesosSelect(findParte.parte.oip_id)
        // cargar informacion de los detalles añadidos
        cargarProcesosDetalle(findParte.opd_id)
        // mostramos el modal
        $('#procesosModal').modal('show')
    })

    // funcion de agregar detalle de proceso a parte de orden interna
    $('#procesosSelect').on('change', function () {
        const selectedProcesoId = $(this).val()
        if (selectedProcesoId == "0") {
            alert('Debes seleccionar un proceso')
            return
        }
        const selectedProcesoName = $(this).find('option:selected').text().split(" - ")[1].trim()
        const selectedProcesoCode = $(this).find('option:selected').data('codigo')

        let idProcesosArray = []
        $('#tbl-orden-interna-procesos tbody tr').each(function () {
            let idProceso = $(this).data('id-proceso')
            idProcesosArray.push(idProceso)
        })

        const findProceso = idProcesosArray.find(element => element == selectedProcesoId)

        if (findProceso) {
            alert('Este proceso ya fué agregado')
        } else {
            // primero añadimos al DOM
            const row = `
            <tr class="row-editable" data-id-proceso="${selectedProcesoId}">
                <td>${selectedProcesoCode}</td>
                <td>${selectedProcesoName}</td>
                <td>
                    <input type="text" class="form-control" value="" readonly/>
                </td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${selectedProcesoId}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${selectedProcesoId}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-procesos tbody').append(row)
        }
        // seleccionamos el valor por defecto
        $('#procesosSelect').val(0)
    })

    // funcion de editar detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-editar', function () {
        const $row = $(this).closest('tr')
        const $input = $row.find('input')

        // CAMBIAMOS LA PROPIEDAD PARA QUE SE PUEDA EDITAR
        $input.prop('readonly', false)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-proceso-editar')
            .addClass('btn-success btn-detalle-proceso-guardar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`)
    })

    // funcion de guarda detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-guardar', function () {
        const $row = $(this).closest('tr')
        const $input = $row.find('input')

        $input.prop('readonly', true)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-success btn-detalle-proceso-guardar')
            .addClass('btn-warning btn-detalle-proceso-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`)
    })

    // funcion de eliminacion de detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-eliminar', function () {
        const $row = $(this).closest('tr')
        // removemos el DOM
        $row.remove()
    })

    // Gestionamos el cierre del modal
    $('#procesosModal').on('hide.bs.modal', function (e) {
        const $elementoGuardar = $('.btn-detalle-proceso-guardar').first()
        const $elementEdicion = $('.btn-detalle-proceso-editar').first()
        // si se encuentran elementos editables en el modal sin guardar
        if ($elementoGuardar.length > 0 || $elementEdicion.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            }
            // salir del modal
            else {
                // borramos los elementos del DOM
                $('#tbl-orden-interna-procesos tbody .row-editable').remove()
            }
        }
    })

    // guardar detalle de procesos
    async function guardarProcesos() {
        let dataArray = []
        $('.row-editable').each(function () {
            let dataObject = {
                opp_id: $(this).data('id-proceso'),
                odp_observacion: $(this).find('input[type="text"]').val().trim(),
            }
            dataArray.push(dataObject)
        })

        try {
            const { data } = await client.put(`/ordeninterna/guardar-procesos/${currentDetalleParte}`, { procesos: dataArray })
    
            // actualizamos la data
            const findElement = buscarDetalleParte(currentDetalleParte)
            const { procesos } = findElement
    
            data.data.forEach(element => {
                procesos.push(element)
            })
    
            // aumentamos el total de procesos
            const totalProcesos = procesos.length
            const idCantidadProceso = `#cantidad-procesos-${currentDetalleParte}`
            $(idCantidadProceso).text(totalProcesos)
    
            // borramos los datos temporales
            $('#tbl-orden-interna-procesos tbody .row-editable').remove()
    
            // cerramos el modal
            $('#procesosModal').modal('hide')
        } catch(error){
            alert('Errror al guardar los procesos')
        }
    }

    // Gestionamos el guardar del modal
    $('#btn-guardar-proceso').on('click', async function (e) {
        const $elementoGuardar = $('.btn-detalle-proceso-guardar').first()
        if ($elementoGuardar.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres guardar?")) {
                e.preventDefault()
                return
            }
        }
        // invocamos la funcion de guardar proceso
        guardarProcesos()
    })

    // --------- JAVASCRIPT para el manejo de PRODUCTOS ---------

    // carga de detalle de materiales en tabla
    function cargarProductosDetalle(id_detalle_parte) {
        $('#tbl-orden-interna-productos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_detalle_parte)
        const { materiales } = findElement
        materiales.forEach(element => {
            const row = `
            <tr data-id-producto="${element.producto?.pro_id ?? 0}">
                <td>${element.producto?.pro_codigo ?? '-'}</td>
                <td>${element.odm_descripcion}</td>
                <td>${element.odm_cantidad}</td>
                <td>${element.odm_observacion || ''}</td>
                <td>${element.usu_usucreacion ?? 'No aplica'}</td>
                <td>${element.usu_feccreacion ? parseDate(element.usu_feccreacion) : 'No aplica'}</td>
                <td>Sin acciones</td>
            </tr>`
            $('#tbl-orden-interna-productos tbody').append(row)
        })
    }

    // funcion cargar modal de productos
    $('#tbl-orden-interna').on('click', '.btn-productos', async (event) => {
        $('#checkAsociarProducto').prop('checked', true)
        const id_detalle_parte = $(event.currentTarget).data('id-detalle-parte')
        currentDetalleParte = id_detalle_parte
        // abrimos el modal
        const findParte = buscarDetalleParte(id_detalle_parte)
        $('#productosModalLabel').text(`MATERIALES - ${findParte.parte.oip_descripcion}`)
        // cargar informacion de los detalles añadidos
        cargarProductosDetalle(id_detalle_parte)
        // mostramos el modal
        $('#productosModal').modal('show')
    })

    $('#productosInput').on('input', async function () {
        const query = $(this).val().trim()
        if (query.length >= 3) {
            await buscarMateriales(query)
        } else {
            limpiarLista()
        }
    })

    async function buscarMateriales(query) {
        try {
            const { data } = await client.get(`/productosByQuery?query=${query}`)
            // Limpiamos la lista
            limpiarLista()
            // formamos la lista
            data.forEach(material => {
                const listItem = document.createElement('li')
                listItem.className = 'list-group-item list-group-item-action'
                listItem.textContent = `${material.pro_codigo} - ${material.pro_descripcion}`
                listItem.dataset.id = material.pro_id
                listItem.addEventListener('click', () => seleccionarMaterial(material))
                // agregar la lista completa
                $('#resultadosLista').append(listItem)
            })
        } catch (error) {
            alert('Error al buscar materiales')
        }
    }

    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    function seleccionarMaterial(material) {
        const { pro_id, pro_codigo, pro_descripcion } = material

        let idProductosArray = []
        $('#tbl-orden-interna-productos tbody tr').each(function () {
            let idProducto = $(this).data('id-producto')
            idProductosArray.push(idProducto)
        })

        const findProducto = idProductosArray.find(element => element == pro_id)

        if (findProducto) {
            alert('Este producto ya fué agregado')
        } else {
            limpiarLista()
            $('#productosInput').val('')

            // obtenemos el valor de checked
            const checked = $('#checkAsociarProducto').prop('checked')

            const row = `
            <tr class="row-editable" data-id-producto="${pro_id}" data-asociar="${checked}">
                <td>${pro_codigo}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value="${pro_descripcion}" readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value="1.00" readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="" readonly/>
                </td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${pro_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${pro_id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-productos tbody').append(row)
        }
    }

    // funcion de editar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-editar', function () {
        const $row = $(this).closest('tr')
        const $descripcionInput = $row.find('.descripcion-input')
        const $cantidadInput = $row.find('.cantidad-input')
        const $observacionInput = $row.find('.observacion-input')

        // Habilitar los inputs
        $descripcionInput.prop('readonly', false)
        $cantidadInput.prop('readonly', false)
        $observacionInput.prop('readonly', false)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-producto-editar')
            .addClass('btn-success btn-detalle-producto-guardar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`)
    })

    // funcion de guardar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-guardar', function () {
        const $row = $(this).closest('tr')

        const $descripcionInput = $row.find('.descripcion-input')
        const $cantidadInput = $row.find('.cantidad-input')
        const $observacionInput = $row.find('.observacion-input')

        $descripcionInput.prop('readonly', true)
        $cantidadInput.prop('readonly', true)
        $observacionInput.prop('readonly', true)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-producto-guardar')
            .addClass('btn-warning btn-detalle-producto-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`)
    })

    // funcion de eliminacion de detalle de producto
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-eliminar', function () {
        const $row = $(this).closest('tr')
        // removemos el DOM
        $row.remove()
    })

    // Gestionamos el cierre del modal
    $('#productosModal').on('hide.bs.modal', function (e) {
        const $elementoGuardar = $('.btn-detalle-producto-guardar').first()
        const $elementEdicion = $('.btn-detalle-producto-editar').first()
        // si se encuentran elementos editables en el modal sin guardar
        if ($elementoGuardar.length > 0 || $elementEdicion.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            }
            // salir del modal
            else {
                // borramos los elementos del DOM
                $('#tbl-orden-interna-productos tbody .row-editable').remove()
            }
        }
    })

    // guardar detalle de productos
    async function guardarProductos() {
        const findElement = buscarDetalleParte(currentDetalleParte)
        const { materiales } = findElement

        let dataArray = []
        let item = materiales.length + 1

        $('.row-editable').each(function () {
            const asociar = $(this).data('asociar')
            let dataObject = {
                pro_id: $(this).data('id-producto'),
                odm_item: item,
                odm_asociar: asociar,
                odm_descrcipcion: $(this).find('.descripcion-input').val().trim(),
                odm_cantidad: $(this).find('.cantidad-input').val().trim(),
                odm_observacion: $(this).find('.observacion-input').val().trim(),
            }
            dataArray.push(dataObject)
        })

        // validacion de cantidades
        const validatedCantidades = dataArray.every(element => esValorNumericoValidoYMayorQueCero(element.odm_cantidad))
        if(!validatedCantidades){
            alert('Asegurate que todas las cantidades sean valores numéricos mayores a 0')
            return
        }
        try {
            const { data } = await client.put(`/ordeninterna/guardar-materiales/${currentDetalleParte}`, { materiales: dataArray })
            // actualizamos la data
    
            data.data.forEach(element => {
                materiales.push(element)
            })
    
            // aumentamos el total de productos
            const totalProductos = materiales.length
            const idCantidadProductos = `#cantidad-productos-${currentDetalleParte}`
            const idCantidadAdicionales = `#cantidad-adicionales-${currentDetalleParte}`
            const totalAdicionales = data.data.length + parseInt($(idCantidadAdicionales).text())
            $(idCantidadProductos).text(totalProductos)
            $(idCantidadAdicionales).text(totalAdicionales)
    
            // borramos los datos temporales
            $('#tbl-orden-interna-productos tbody .row-editable').remove()
    
            // cerramos el modal
            $('#productosModal').modal('hide')
        } catch(error){
            alert('Error al guardar los materiales')
        }
    }

    // Gestionamos el guardar del modal
    $('#btn-guardar-producto').on('click', async function (e) {
        const $elementoGuardar = $('.btn-detalle-producto-guardar').first()
        if ($elementoGuardar.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres guardar?")) {
                e.preventDefault()
                return
            }
        }
        // invocamos la funcion de guardar producto
        guardarProductos()
    })
})