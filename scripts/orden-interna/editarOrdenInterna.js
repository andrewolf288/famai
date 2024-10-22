$(document).ready(async function () {
    let abortController
    const path = window.location.pathname
    const segments = path.split('/')
    const id = segments.pop()
    const tiempoAutoguardado = 5 * 60 * 1000
    let estadoOI = ""

    let detalleOrdenInterna = []
    let currentDetalleParte = 0

    function intentarEjecutarFuncion() {
        guardadoAutomatico()
            .then(() => {
                console.log("Se resolvio")
                setTimeout(() => {
                    intentarEjecutarFuncion();
                }, tiempoAutoguardado);
            })
            .catch((error) => {
                toastr.options = {
                    "closeButton": false,
                    "debug": false,
                    "newestOnTop": false,
                    "progressBar": false,
                    "positionClass": "toast-top-center",
                    "preventDuplicates": false,
                    "onclick": null,
                    "showDuration": "300",
                    "hideDuration": "1000",
                    "timeOut": "5000",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                }
                toastr["error"](parserAlert(error), "Error en el autoguardado")

                setTimeout(() => {
                    intentarEjecutarFuncion();
                }, tiempoAutoguardado);
            });
    }

    // funcion de busqueda de detalle de parte
    function buscarDetalleParte(id_detalle_parte) {
        return detalleOrdenInterna.find(element => element.opd_id == id_detalle_parte)
    }

    async function cargarDetalleOrdenInterna() {
        try {
            const { data } = await client.get(`/ordeninterna/${id}`)
            estadoOI = data.oic_estado
            detalleOrdenInterna = data.partes
            // reemplazamos el valor en orden trabajo
            $('#otInput').val(data.odt_numero)
            // reemplazamos el valor en orden interna
            $('#oiInput').val(data.oic_numero)
            // reemplazamos el valor en cliente
            $('#clienteInput').val(data.cliente?.cli_nombre ?? 'No aplica')
            // reemplazamos el valor en fecha
            $('#fechaPicker').val(data.oic_fecha ? parseDateSimple(data.oic_fecha) : 'No aplica')
            // reemplazamos el valor en area
            $('#areaSelect').val(data.area.are_descripcion || 'No aplica')
            // reemplazamos el valor en equipo de trabajo
            $('#equipoInput').val(data.oic_equipo_descripcion || 'No aplica')
            // reemplazamos el valor de componente
            $('#componenteInput').val(data.oic_componente_descripcion || 'No aplica')
            // reemplazamos el valor de encargado origen
            $('#responsableOrigen').val(data.trabajador_origen?.tra_nombre ?? 'No aplica')
            // reemplazamos el valor de encargado maestro
            $('#responsableMaestro').val(data.trabajador_maestro?.tra_nombre ?? 'No aplica')
            // reemplazamos el valor de encargado almacen
            $('#responsableAlmacen').val(data.trabajador_almacen?.tra_nombre ?? 'No aplica')

            data.partes.forEach(function (item, index) {
                const totalDetalleProcesos = item.procesos.filter(element => element.odp_estado == 1).length
                const totalDetalleProductos = item.materiales.filter(element => element.odm_estado == 1).length
                const totalRegulares = item.materiales.filter((element) => element.odm_tipo == 1 && element.odm_estado == 1).length
                const totalAdicionales = item.materiales.filter((element) => element.odm_tipo == 2 && element.odm_estado == 1).length
                const totalClientes = item.materiales.filter((element) => element.odm_tipo == 3 && element.odm_estado == 1).length

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
                    <td>
                        <p class="text-center" id="cantidad-clientes-${item.opd_id}">${totalClientes}</p>
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

    setTimeout(() => {
        intentarEjecutarFuncion();
    }, tiempoAutoguardado);

    // ---------- JAVASCRIPT PARA IMPRESION DE PDF ------------------
    $('#btn-imprimir-orden-interna').on('click', async function () {
        try {
            const response = await client.get(`/generarReporteOrdenTrabajo?oic_id=${id}`, {
                headers: {
                    'Accept': 'application/pdf'
                },
                responseType: 'blob'
            })

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            showModalPreview(pdfUrl)
        } catch (error) {
            alert('Error al generar el reporte')
        }
    })

    // ------------ JAVASCRIPT PARA GESTION DE PROCESOS -------------
    // carga de selector de procesos
    const cargarProcesosSelect = async (id_parte) => {
        try {
            const { data } = await client.get(`/procesosByParte/${id_parte}`)
            // ordenamos la data
            const dataOrdenada = data.sort((a, b) => a.opp_orden - b.opp_orden)

            const $procesosSelect = $('#procesosSelect')
            $procesosSelect.empty().append(`<option value="0">Seleccione un proceso</option>`)
            dataOrdenada.forEach(function (proceso) {
                const option = $('<option>').val(proceso["opp_id"]).text(`${proceso["opp_codigo"]} - ${proceso["opp_descripcion"]}`).attr('data-codigo', proceso["opp_codigo"])
                $procesosSelect.append(option)
            })
        } catch (error) {
            alert('Error al cargar el listado de procesos')
        }
    }

    function cargarProcesosDetalle(id_parte) {
        $('#tbl-orden-interna-procesos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { procesos } = findElement
        const palabraClave = 'otro'

        procesos.sort((a, b) => a.opp_codigo - b.opp_codigo)

        console.log(procesos)
        
        // <input type="text" class="form-control observacion-input" value='${element.odp_observacion.replace(/'/g, "&#39;") || ''}' readonly/>
        procesos.forEach(element => {
            const claseCondicional = element.proceso.opp_descripcion.toLowerCase().includes(palabraClave) ? true : false
            const row = `
            <tr data-id-proceso="${element.proceso.opp_id}" data-id-detalle="${element.odp_id}" class="table-primary ${claseCondicional ? 'editable-descripcion' : ''}">
                <td>${element.proceso.opp_codigo}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${element.odp_descripcion.replace(/'/g, "&#39;") || element.proceso.opp_descripcion.replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td class="text-center">
                    <input type="checkbox" ${element.odp_ccalidad == 1 ? 'checked' : ''} disabled/>
                </td>
                <td>
                    <textarea type="text" class="form-control observacion-input" readonly>${element.odp_observacion || ''}</textarea>
                </td>
                <td>${element.odp_usumodificacion ?? 'No aplica'}</td>
                <td>${element.odp_fecmodificacion ? parseDate(element.odp_fecmodificacion) : 'No aplica'}</td>
                <td>${element.odp_usucreacion ?? 'No aplica'}</td>
                <td>${element.odp_feccreacion ? parseDate(element.odp_feccreacion) : 'No aplica'}</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
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
        const palabraClave = 'otro'
        const selectedProcesoId = $(this).val()
        if (selectedProcesoId == "0") {
            alert('Debes seleccionar un proceso')
            return
        }
        const selectedProcesoName = $(this).find('option:selected').text().split(" - ")[1].trim()
        const selectedProcesoCode = $(this).find('option:selected').data('codigo')
        const claseCondicional = selectedProcesoName.toLowerCase().includes(palabraClave) ? true : false

        let idProcesosArray = []
        $('#tbl-orden-interna-procesos tbody tr').each(function () {
            let idProceso = $(this).data('id-proceso')
            idProcesosArray.push(idProceso)
        })

        const findProceso = idProcesosArray.find(element => element == selectedProcesoId)

        if (findProceso) {
            alert('Este proceso ya fué agregado')
            return
        } else {
            // primero añadimos al DOM
            const row = `
            <tr class="row-editable table-warning ${claseCondicional ? 'editable-descripcion' : ''}" data-id-proceso="${selectedProcesoId}">
                <td>${selectedProcesoCode}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${selectedProcesoName.replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td class="text-center">
                    <input type="checkbox" disabled/>
                </td>
                <td>
                    <textarea type="text" class="form-control observacion-input" readonly></textarea>
                </td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar">
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
        const $inputDescripcion = $row.find('.descripcion-input')
        const $inputObservacion = $row.find('.observacion-input')
        const $inputCheckbox = $row.find('input[type="checkbox"]')

        // debemos verificar si cuenta con la clase editable-descripcion
        const claseCondicional = $row.hasClass('editable-descripcion')

        // CAMBIAMOS LA PROPIEDAD PARA QUE SE PUEDA EDITAR
        $inputDescripcion.prop('readonly', !claseCondicional)
        $inputObservacion.prop('readonly', false)
        $inputCheckbox.prop('disabled', false)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-proceso-editar')
            .addClass('btn-success btn-detalle-proceso-guardar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`)
    })

    // funcion de guarda detalle de proceso (gestionar caso de uso)
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-guardar', async function () {
        const $row = $(this).closest('tr')
        const $inputDescripcion = $row.find('.descripcion-input')
        const $inputObservacion = $row.find('.observacion-input')
        const $inputCheckbox = $row.find('input[type="checkbox"]')
        // si se trata de un registro existente
        if (!$row.hasClass('row-editable')) {
            // debemos extraer la informacion dl tr
            const odp_id = $row.data('id-detalle')
            const odp_descripcion = $inputDescripcion.val().trim()
            const odp_observacion = $inputObservacion.val().trim()
            const odp_ccalidad = $inputCheckbox.is(':checked') ? true : false
            const formatData = {
                odp_descripcion,
                odp_observacion,
                odp_ccalidad
            }
            console.log(formatData)
            try {
                const { data } = await client.put(`/ordeninternaprocesos/${odp_id}`, formatData)
                const { procesos } = buscarDetalleParte(currentDetalleParte)
                const findProceso = procesos.find(element => element.odp_id == odp_id)
                findProceso["odp_descripcion"] = data.odp_descripcion || ""
                findProceso["odp_observacion"] = data.odp_observacion || ""
                findProceso["odp_ccalidad"] = data.odp_ccalidad
                findProceso["odp_usumodificacion"] = data.odp_usumodificacion
                findProceso["odp_fecmodificacion"] = data.odp_fecmodificacion

                $row.find('td').eq(4).text(data.odp_usumodificacion || 'No aplica')
                $row.find('td').eq(5).text(data.odp_fecmodificacion ? parseDate(data.odp_fecmodificacion) : 'No aplica')
            } catch (error) {
                alert('Error al actualizar el detalle de proceso')
            }
        }

        $inputDescripcion.prop('readonly', true)
        $inputObservacion.prop('readonly', true)
        $inputCheckbox.prop('disabled', true)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-success btn-detalle-proceso-guardar')
            .addClass('btn-warning btn-detalle-proceso-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`)
    })

    // funcion de eliminacion de detalle de proceso (gestionar condicional)
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-eliminar', async function () {
        const $row = $(this).closest('tr')
        // si se trata de un registro existente
        if (!$row.hasClass('row-editable')) {
            // debemos extraer la informacion dl tr
            const odp_id = $row.data('id-detalle')
            try {
                await client.delete(`/ordeninternaprocesos/${odp_id}`)
                const { procesos } = buscarDetalleParte(currentDetalleParte)
                const findProcesoIndex = procesos.findIndex(element => element.odp_id == odp_id)
                procesos.splice(findProcesoIndex, 1)
                // actualizamos el total de procesos
                $(`#cantidad-procesos-${currentDetalleParte}`).text(procesos.length)
                $row.remove()
            } catch (error) {
                alert('Error al eliminar el detalle de proceso')
            }
        } else {
            // removemos el DOM
            $row.remove()
        }
    })

    // Gestionamos el cierre del modal
    $('#procesosModal').on('hide.bs.modal', function (e) {
        const $elementoGuardar = $('.btn-detalle-proceso-guardar').first()
        // si se encuentran elementos editables en el modal sin guardar
        if ($elementoGuardar.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            } else {
                // borramos los elementos del DOM
                $('#tbl-orden-interna-procesos tbody .row-editable').remove()
            }
        }

        const $elementEdicion = $('#tbl-orden-interna-procesos tbody .row-editable')
        const $btnDetalleProceso = $elementEdicion.find('.btn-detalle-proceso-editar')

        if ($btnDetalleProceso.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            } else {
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
                odp_descripcion: $(this).find('.descripcion-input').val().trim(),
                odp_observacion: $(this).find('.observacion-input').val().trim(),
                odp_ccalidad: $(this).find('input[type="checkbox"]').is(':checked') ? true : false
            }
            dataArray.push(dataObject)
        })

        if (dataArray.length === 0) {
            alert('No hay procesos para guardar')
            return
        }
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
        } catch (error) {
            alert('Errror al guardar los procesos')
        }
    }

    // Gestionamos el guardar del modal
    $('#btn-guardar-proceso').on('click', async function (e) {
        const $elementEdicion = $('#tbl-orden-interna-procesos tbody .row-editable')
        const $elementoGuardar = $elementEdicion.find('.btn-detalle-proceso-guardar')
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

    $('#checkAsociarProducto').change(function () {
        if ($(this).is(':checked')) {
            // Si está marcado, cambia el placeholder
            $('#productosInput').attr('placeholder', 'Describa material...');
        } else {
            // Si no está marcado, vuelve al placeholder original
            $('#productosInput').attr('placeholder', 'Buscar material...');
        }
        // $('#productosInput').val('')
        limpiarLista()
    });

    // carga de detalle de materiales en tabla
    function cargarProductosDetalle(id_detalle_parte) {
        $('#tbl-orden-interna-productos tbody').empty()
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_detalle_parte)
        const { materiales } = findElement
        materiales.forEach(element => {
            const row = `
            <tr data-id-producto="${element.producto?.pro_codigo ?? ''}" data-id-detalle="${element.odm_id}" class="table-primary">
                <td>${element.producto?.pro_codigo ?? '-'}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${element.odm_descripcion?.replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='${element.odm_cantidad}' readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value='${element.odm_observacion?.replace(/'/g, "&#39;") || ''}' readonly/>
                </td>
                <td>${element.odm_usumodificacion ?? 'No aplica'}</td>
                <td>${element.odm_fecmodificacion ? parseDate(element.odm_fecmodificacion) : 'No aplica'}</td>
                <td>${element.odm_usucreacion ?? 'No aplica'}</td>
                <td>${element.odm_feccreacion ? parseDate(element.odm_feccreacion) : 'No aplica'}</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm ${element["odm_tipo"] == 3 ? 'btn-secondary' : 'btn-success'} btn-detalle-proporcionado-cliente" ${element["odm_tipo"] == 3 ? 'disabled' : ''}>
                            C
                        </button>
                    </div>
                </td>
            </tr>`
            $('#tbl-orden-interna-productos tbody').append(row)
        })
    }

    // funcion cargar modal de productos
    $('#tbl-orden-interna').on('click', '.btn-productos', async (event) => {
        $('#checkAsociarProducto').prop('checked', false)
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
                // alert('Error al buscar materiales. Inténtalo de nuevo.'); // Muestra un mensaje de error al usuario
            }
        }
    }

    function limpiarLista() {
        $('#resultadosLista').empty()
    }

    function ingresarProductoSinCodigo() {
        // obtenemos el valor de checked
        const checked = false
        const pro_id = obtenerIdUnico()
        const pro_codigo = ""
        const pro_descripcion = $.trim($('#productosInput').val())

        if (pro_descripcion.length < 3) {
            alert('La descripción debe tener al menos 3 caracteres')
        } else {
            $('#productosInput').val('')
            const row = `
            <tr class="row-editable table-warning" data-id-producto="${pro_id}" data-asociar="${checked}">
                <td>${pro_codigo}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${pro_descripcion.replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='1.00' readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value='' readonly/>
                </td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-success btn-detalle-proporcionado-cliente">
                            C
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-productos tbody').append(row)
        }
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
            const checked = true

            const row = `
            <tr class="row-editable table-warning" data-id-producto="${pro_id}" data-asociar="${checked}">
                <td>${pro_codigo}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value='${pro_descripcion.replace(/'/g, "&#39;")}' readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value='1.00' readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value='' readonly/>
                </td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>No aplica</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-success btn-detalle-proporcionado-cliente">
                            C
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-productos tbody').append(row)
        }
    }

    // funcion de cambiar de tipo
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-proporcionado-cliente', async function () {
        const $row = $(this).closest('tr')
        const $observacionInput = $row.find('.observacion-input')
        const textNota = 'proporcionado por cliente ' + $observacionInput.val()

        if (!$row.hasClass('row-editable')) {
            const odm_id = $row.data('id-detalle')
            const odm_tipo = 3
            const formatData = {
                odm_tipo,
                odm_observacion: textNota
            }
            try {
                const { data } = await client.put(`/ordeninternamateriales/tipo/${odm_id}`, formatData)
                const { materiales } = buscarDetalleParte(currentDetalleParte)
                const findMaterial = materiales.find(element => element.odm_id == odm_id)

                const tipo_anterior = findMaterial["odm_tipo"]
                findMaterial["odm_observacion"] = data.odm_observacion
                findMaterial["odm_tipo"] = data.odm_tipo
                findMaterial["odm_usumodificacion"] = data.odm_usumodificacion
                findMaterial["odm_fecmodificacion"] = data.odm_fecmodificacion

                $row.find('td').eq(4).text(data.odm_usumodificacion || 'No aplica')
                $row.find('td').eq(5).text(data.odm_fecmodificacion ? parseDate(data.odm_fecmodificacion) : 'No aplica')

                // se actualiza las cantidades
                const idCantidadClientes = `#cantidad-clientes-${currentDetalleParte}`
                $(idCantidadClientes).text(parseInt($(idCantidadClientes).text()) + 1)

                const idCantidad = tipo_anterior == 1 ? `#cantidad-regulares-${currentDetalleParte}` : `#cantidad-adicionales-${currentDetalleParte}`
                $(idCantidad).text(parseInt($(idCantidad).text()) - 1)

            } catch (error) {
                alert('Error al actualizar el detalle de material')
            }

        }

        $observacionInput.val(textNota)
        // deshabilitar el input
        $(this).attr('disabled', true)
        // cambiamos los estilos del boton
        $(this).removeClass('btn-success btn-detalle-proporcionado-cliente')
            .addClass('btn-secondary btn-detalle-proporcionado-cliente')
    })

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
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-guardar', async function () {
        const $row = $(this).closest('tr')

        const $descripcionInput = $row.find('.descripcion-input')
        const $cantidadInput = $row.find('.cantidad-input')
        const $observacionInput = $row.find('.observacion-input')

        // si se trata de un registro existente
        if (!$row.hasClass('row-editable')) {
            // debemos extraer la informacion dl tr
            const odm_id = $row.data('id-detalle')
            const odm_descripcion = $descripcionInput.val().trim()
            const odm_cantidad = $cantidadInput.val().trim()
            const odm_observacion = $observacionInput.val().trim()
            const formatData = {
                odm_descripcion,
                odm_cantidad,
                odm_observacion
            }
            try {
                const { data } = await client.put(`/ordeninternamateriales/${odm_id}`, formatData)
                const { materiales } = buscarDetalleParte(currentDetalleParte)
                const findMaterial = materiales.find(element => element.odm_id == odm_id)
                findMaterial["odm_descripcion"] = data.odm_descripcion
                findMaterial["odm_cantidad"] = data.odm_cantidad
                findMaterial["odm_observacion"] = data.odm_observacion
                findMaterial["odm_usumodificacion"] = data.odm_usumodificacion
                findMaterial["odm_fecmodificacion"] = data.odm_fecmodificacion

                $row.find('td').eq(4).text(data.odm_usumodificacion || 'No aplica')
                $row.find('td').eq(5).text(data.odm_fecmodificacion ? parseDate(data.odm_fecmodificacion) : 'No aplica')
            } catch (error) {
                alert('Error al actualizar el detalle de material')
            }
        }

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
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-eliminar', async function () {
        const $row = $(this).closest('tr')
        // si se trata de un registro existente
        if (!$row.hasClass('row-editable')) {
            // debemos extraer la informacion dl tr
            const odm_id = $row.data('id-detalle')
            try {
                await client.delete(`/ordeninternamateriales/${odm_id}`)
                const { materiales } = buscarDetalleParte(currentDetalleParte)
                const findMaterialIndex = materiales.findIndex(element => element.odm_id == odm_id)
                const findMaterial = materiales[findMaterialIndex]
                const tipo = findMaterial["odm_tipo"]
                materiales.splice(findMaterialIndex, 1)
                // actualizamos el total de procesos
                $(`#cantidad-productos-${currentDetalleParte}`).text(materiales.length)
                let cantidadTotal = 0
                if (tipo == '1') {
                    cantidadTotal = parseInt($(`#cantidad-regulares-${currentDetalleParte}`).text()) - 1
                    $(`#cantidad-regulares-${currentDetalleParte}`).text(cantidadTotal)
                }
                if (tipo == '2') {
                    cantidadTotal = parseInt($(`#cantidad-adicionales-${currentDetalleParte}`).text()) - 1
                    $(`#cantidad-adicionales-${currentDetalleParte}`).text(cantidadTotal)
                }
                if (tipo == '3') {
                    cantidadTotal = parseInt($(`#cantidad-clientes-${currentDetalleParte}`).text()) - 1
                    console.log(cantidadTotal)
                    $(`#cantidad-clientes-${currentDetalleParte}`).text(cantidadTotal)
                }
                $row.remove()
            } catch (error) {
                alert('Error al eliminar el detalle de material')
            }
        } else {
            // removemos el DOM
            $row.remove()
        }
    })

    // Gestionamos el cierre del modal
    $('#productosModal').on('hide.bs.modal', function (e) {
        const $elementoGuardar = $('.btn-detalle-producto-guardar').first()
        // si se encuentran elementos editables en el modal sin guardar
        if ($elementoGuardar.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            } else {
                // borramos los elementos del DOM
                $('#tbl-orden-interna-productos tbody .row-editable').remove()
            }
        }

        const $elementEdicion = $('#tbl-orden-interna-productos tbody .row-editable')
        const $btnDetalleProducto = $elementEdicion.find('.btn-detalle-producto-editar')

        if ($btnDetalleProducto.length > 0) {
            // permanecemos en el modal
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault()
            } else {
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
            const tipoProducto = estadoOI === "INGRESO" ? 1 : 2
            let dataObject = {
                pro_id: $(this).data('id-producto'),
                odm_item: item,
                odm_asociar: asociar,
                odm_descripcion: $(this).find('.descripcion-input').val().trim(),
                odm_cantidad: $(this).find('.cantidad-input').val().trim(),
                odm_observacion: $(this).find('.observacion-input').val().trim(),
                odm_tipo: $(this).find('.btn-detalle-proporcionado-cliente').hasClass('btn-success') ? tipoProducto : 3
            }
            dataArray.push(dataObject)
        })

        if (dataArray.length === 0) {
            alert('No hay materiales para guardar')
            return
        }

        // validacion de cantidades
        const validatedCantidades = dataArray.every(element => esValorNumericoValidoYMayorQueCero(element.odm_cantidad))
        if (!validatedCantidades) {
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
            const idCantidadRegulares = `#cantidad-regulares-${currentDetalleParte}`
            const idCantidadAdicionales = `#cantidad-adicionales-${currentDetalleParte}`
            const idCantidadClientes = `#cantidad-clientes-${currentDetalleParte}`
            const totalRegulares = materiales.filter(element => element.odm_tipo == 1).length
            const totalAdicionales = materiales.filter(element => element.odm_tipo == 2).length
            const totalClientes = materiales.filter(element => element.odm_tipo == 3).length
            $(idCantidadProductos).text(totalProductos)
            $(idCantidadRegulares).text(totalRegulares)
            $(idCantidadAdicionales).text(totalAdicionales)
            $(idCantidadClientes).text(totalClientes)

            // borramos los datos temporales
            $('#tbl-orden-interna-productos tbody .row-editable').remove()

            // cerramos el modal
            $('#productosModal').modal('hide')
        } catch (error) {
            console.log(error)
            alert('Error al guardar los materiales')
        }
    }

    // Gestionamos el guardar del modal
    $('#btn-guardar-producto').on('click', async function (e) {
        const $elementEdicion = $('#tbl-orden-interna-productos tbody .row-editable')
        const $elementoGuardar = $elementEdicion.find('.btn-detalle-producto-guardar')
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

    // mostrar preview de PDF
    function showModalPreview(pdfUrl) {
        document.getElementById('pdf-frame').src = pdfUrl;
        const modal = new bootstrap.Modal(document.getElementById("previewPDFModal"));
        modal.show();
    }

    // funcion guardado automatico de procesos
    async function guardadoAutomaticoProcesos() {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-top-center",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "10000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }
        toastr["info"]("Espere mientras se ejecuta el autoguardado.", "Autoguardando")

        let dataArray = []
        $('.row-editable').each(function () {
            let dataObject = {
                opp_id: $(this).data('id-proceso'),
                odp_descripcion: $(this).find('.descripcion-input').val().trim(),
                odp_observacion: $(this).find('.observacion-input').val().trim(),
                odp_ccalidad: $(this).find('input[type="checkbox"]').is(':checked') ? true : false
            }
            dataArray.push(dataObject)
        })

        if (dataArray.length === 0) {
            toastr.remove()
            return Promise.resolve()
        }
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

            const findParte = buscarDetalleParte(currentDetalleParte)
            cargarProcesosDetalle(findParte.opd_id)
            // borramos los datos temporales
            // $('#tbl-orden-interna-procesos tbody .row-editable').remove()

            // cerramos el modal
            // $('#procesosModal').modal('hide')
            toastr.remove()
            return Promise.resolve()
        } catch (error) {
            console.log(error)
            toastr.remove()
            return Promise.reject('Error al guardar los procesos')
        }
    }

    async function guardadoAutomaticoProductos() {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-top-center",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "10000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        }
        toastr["info"]("Espere mientras se ejecuta el autoguardado.", "Autoguardando")

        const findElement = buscarDetalleParte(currentDetalleParte)
        const { materiales } = findElement

        let dataArray = []
        let item = materiales.length + 1

        $('.row-editable').each(function () {
            const asociar = $(this).data('asociar')
            const tipoProducto = estadoOI === "INGRESO" ? 1 : 2
            let dataObject = {
                pro_id: $(this).data('id-producto'),
                odm_item: item,
                odm_asociar: asociar,
                odm_descripcion: $(this).find('.descripcion-input').val().trim(),
                odm_cantidad: $(this).find('.cantidad-input').val().trim(),
                odm_observacion: $(this).find('.observacion-input').val().trim(),
                odm_tipo: $(this).find('.btn-detalle-proporcionado-cliente').hasClass('btn-success') ? tipoProducto : 3
            }
            dataArray.push(dataObject)
        })

        if (dataArray.length === 0) {
            toastr.remove()
            return Promise.resolve()
        }

        // validacion de cantidades
        const validatedCantidades = dataArray.every(element => esValorNumericoValidoYMayorQueCero(element.odm_cantidad))
        if (!validatedCantidades) {
            toastr.remove()
            return Promise.resolve('Asegurate que todas las cantidades sean valores numéricos mayores a 0')
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
            const idCantidadRegulares = `#cantidad-regulares-${currentDetalleParte}`
            const idCantidadAdicionales = `#cantidad-adicionales-${currentDetalleParte}`
            const idCantidadClientes = `#cantidad-clientes-${currentDetalleParte}`
            const totalRegulares = materiales.filter(element => element.odm_tipo == 1).length
            const totalAdicionales = materiales.filter(element => element.odm_tipo == 2).length
            const totalClientes = materiales.filter(element => element.odm_tipo == 3).length
            $(idCantidadProductos).text(totalProductos)
            $(idCantidadRegulares).text(totalRegulares)
            $(idCantidadAdicionales).text(totalAdicionales)
            $(idCantidadClientes).text(totalClientes)

            const findParte = buscarDetalleParte(currentDetalleParte)
            cargarProductosDetalle(findParte.opd_id)

            // borramos los datos temporales
            // $('#tbl-orden-interna-productos tbody .row-editable').remove()
            // cerramos el modal
            // $('#productosModal').modal('hide')
            toastr.remove()
            return Promise.resolve()
        } catch (error) {
            console.log(error)
            toastr.remove()
            return Promise.reject('Error al guardar los materiales')
        }
    }

    // funcion guardado automatico de productos

    async function guardadoAutomatico() {
        // comprobar si el modal de procesos esta abierto
        const modalProcesos = document.getElementById('procesosModal')
        const modalProductos = document.getElementById('productosModal')

        if (modalProcesos.classList.contains('show')) {
            console.log("Procesos abierto")
            await guardadoAutomaticoProcesos()
        } else if (modalProductos.classList.contains('show')) {
            console.log("Productos abierto")
            await guardadoAutomaticoProductos()
        }

        // si no esta abierto ningun modal, pues simplemente no hacemos nada
        return Promise.resolve()
    }

    // enviar orden interna
    $('#btn-enviar-orden-interna').on('click', async function () {
        const estado = "ENVIADO"
        try {
            await client.put(`/ordeninterna/${id}`, { oic_estado: estado })
            window.location.href = 'orden-interna';
        } catch (error) {
            alert('Error al cambiar el estado')
        }
    })
})
