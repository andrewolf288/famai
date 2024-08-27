$(document).ready(function () {
    const showLoaderModal = () => {
        const loaderModal = new bootstrap.Modal(document.getElementById('loaderModal'), {
            backdrop: 'static',
            keyboard: false
        });
        loaderModal.show();
    };

    const hideLoaderModal = () => {
        const loaderModal = bootstrap.Modal.getInstance(document.getElementById('loaderModal'));
        if (loaderModal) {
            loaderModal.hide();
        } else {
            console.log("El modal ya no existe")
        }
    }

    // data guardada
    const ordenInterna = {
        detalle_partes: []
    };

    let currentParte = 0

    // funcion de busqueda de detalle de parte
    function buscarDetalleParte(id_parte) {
        return findElement = ordenInterna.detalle_partes.find(element => element.oip_id == id_parte)
    }

    // funcion de buscar Orden de Trabajo
    const buscarOrdenTrabajo = async () => {
        // Obtener el valor del campo de texto
        var otValue = $('#otInput').val().trim();

        // Validar si el campo está vacío
        if (otValue.length === 0) {
            alert('Por favor, ingrese un valor para buscar.');
            return;
        }

        showLoaderModal()
        try {
            const { data } = await client.get(`/ordenestrabajosByNumero/${otValue}`)
            $('#clienteInput').val(data.cliente.cli_nombre)
            $('#idClienteInput').val(data.cliente.cli_id)
        } catch (error) {
            const { response } = error
            if (response.status === 404) {
                alert(response.data.error)
            } else {
                alert('Error al buscar la orden de trabajo')
            }

            // actualizamos la referencia
            $('#otInput').val("")
            $('#clienteInput').val("")
            $('#idClienteInput').val("")
        } finally {
            hideLoaderModal()
        }
    }

    // Maneja el evento de enter en el campo de orden de trabajo
    $('#otInput').on('keypress', async (event) => {
        if (event.which === 13) {
            await buscarOrdenTrabajo()
        }
    })

    // Maneja el evento de clic en el botón de búsqueda
    $('#searchButton').on('click', async () => {
        await buscarOrdenTrabajo()
    });

    // cargar areas
    const cargarAreas = async () => {
        try {
            const { data } = await client.get('/areasSimple')
            const $areaSelect = $('#areaSelect');

            data.sort((a, b) => a["are_descripcion"].localeCompare(b["are_descripcion"]))

            data.forEach(area => {
                const option = $('<option>').val(area["are_codigo"]).text(area["are_descripcion"]);
                $areaSelect.append(option);
            });

        } catch (error) {
            console.log('Error al obtener las áreas:', error)
        }
    }

    // cargamos responsables
    const cargarResponsables = async () => {
        try {
            const { data } = await client.get('/trabajadoresSimple')
            const $responsableOrigen = $('#responsableOrigen');
            const $responsableMaestro = $('#responsableMaestro');
            const $responsableAlmacen = $('#responsableAlmacen');

            // Ordenar la data alfabéticamente según el nombre (índice [1])
            data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre));

            data.forEach(responsable => {
                const option = $('<option>').val(responsable.tra_id).text(responsable.tra_nombre);
                $responsableOrigen.append(option.clone())
                $responsableMaestro.append(option.clone())
                $responsableAlmacen.append(option.clone())
            });
        } catch (error) {
            console.log('Error al obtener los encargados:', error)
        }
    }

    // -------- MANEJO DE FECHA ----------
    $("#fechaPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    // --------- CARGA INICIAL DE DATA DE PARTES ----------
    const cargarTablaOrdenInterna = async () => {
        try {
            const { data } = await client.get('/partesSimple')
            data.forEach(function (item, index) {
                const {oip_id, oip_descripcion} = item
                const row = `
                    <tr>
                        <td>${oip_descripcion}</td>
                        <td>
                            <button class="btn btn-sm btn-editar btn-procesos" data-element="${oip_descripcion}" data-bs-id="${oip_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                                    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                                </svg>
                                Procesos
                            </button>
                        </td>
                        <td>
                            <p class="text-center" id="cantidad-procesos-${oip_id}">0</p>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-eliminar btn-productos" data-element="${oip_descripcion}" data-bs-id="${oip_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hammer" viewBox="0 0 16 16">
                                    <path d="M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5 5 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334"/>
                                </svg> 
                                Materiales
                            </button>
                        </td>
                        <td>
                            <p class="text-center" id="cantidad-productos-${oip_id}">0</p>
                        </td>
                    </tr>
                `;
                // agregamos la tabla
                $('#tbl-orden-interna tbody').append(row);
                // formamos la data de procesos y productos
                const data = {
                    oip_id: oip_id,
                    oip_descripcion: oip_descripcion,
                    detalle_materiales: [],
                    detalle_procesos: []
                }
                ordenInterna["detalle_partes"].push(data)
            })
        } catch (error) {
            console.log("Hubo un error en la solicitud: " + error)
        }
    }

    const initInformacion = async () => {
        try {
            showLoaderModal()
            await Promise.all([
                cargarTablaOrdenInterna(),
                cargarAreas(),
                cargarResponsables()
            ])
        } catch (error) {
            console.error("Error al cargar los datos:", error);
        } finally {
            hideLoaderModal()

        }
    }

    // inicializamos la data
    initInformacion()

    // ------------ JAVASCRIPT PARA GESTION DE PROCESOS -------------
    // carga de selector de procesos
    const cargarProcesosSelect = async (id_parte) => {
        try {
            const { data } = await client.get(`/procesosByParte/${id_parte}`)
            const $procesosSelect = $('#procesosSelect');
            $procesosSelect.empty().append(`<option value="0">Seleccione un proceso</option>`);
            data.forEach(function (proceso) {
                const option = $('<option>').val(proceso["opp_id"]).text(`${proceso["opp_codigo"]} - ${proceso["opp_descripcion"]}`).attr('data-codigo', proceso["opp_codigo"]);
                $procesosSelect.append(option);
            });
        } catch (error) {
            console.log(error)
        }
    }

    // carga de detalle de procesos en tabla
    function cargarProcesosDetalle(id_parte) {
        $('#tbl-orden-interna-procesos tbody').empty();
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_procesos } = findElement

        detalle_procesos.sort((a, b) => a.opp_codigo - b.opp_codigo);

        detalle_procesos.forEach(element => {
            const row = `
            <tr>
                <td>${element["opp_codigo"]}</td>
                <td>${element["opp_descripcion"]}</td>
                <td>
                    <input type="text" class="form-control" value="${element["odp_observacion"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${element["opp_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${element["opp_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`
            $('#tbl-orden-interna-procesos tbody').append(row);
        })
    }

    // funcion cargar modal de procesos
    $('#tbl-orden-interna').on('click', '.btn-procesos', async (event) => {
        const id = $(event.currentTarget).data('bs-id')
        currentParte = id
        const findParte = buscarDetalleParte(id)

        $('#procesosModalLabel').text(`PROCESOS - ${findParte.oip_descripcion}`)
        // cargamos la informacion
        await cargarProcesosSelect(id)
        // cargar informacion de los detalles añadidos
        cargarProcesosDetalle(id)
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

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_procesos } = findElement

        const findProceso = detalle_procesos.find(element => element.opp_id == selectedProcesoId)

        if (findProceso) {
            alert('Este proceso ya fué agregado')
        } else {
            const data = {
                opp_id: selectedProcesoId,
                opp_codigo: selectedProcesoCode,
                opp_descripcion: selectedProcesoName,
                odp_observacion: ""
            }

            // primero añadimos al DOM
            const row = `
            <tr>
                <td>${data["opp_codigo"]}</td>
                <td>${data["opp_descripcion"]}</td>
                <td>
                    <input type="text" class="form-control" value="${data["odp_observacion"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${data["opp_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${data["opp_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-procesos tbody').append(row);
            detalle_procesos.push(data)
            // debemos actualizar la cantidad de procesos
            const totalProcesos = detalle_procesos.length
            const idCantidadProceso = `#cantidad-procesos-${currentParte}`
            $(idCantidadProceso).text(totalProcesos)
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
                </svg>`);
    })

    // funcion de guarda detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-guardar', function () {
        const id_proceso = $(this).data('proceso')
        const $row = $(this).closest('tr')
        const $input = $row.find('input')

        const valueObservacion = $input.val()
        $input.prop('readonly', true)

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_procesos } = findElement
        const findElementProceso = detalle_procesos.find(element => element.opp_id == id_proceso)
        findElementProceso["odp_observacion"] = valueObservacion

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-success btn-detalle-proceso-guardar')
            .addClass('btn-warning btn-detalle-proceso-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`);
    })

    // funcion de eliminacion de detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-eliminar', function () {
        const id_proceso = $(this).data('proceso')
        const $row = $(this).closest('tr')

        // removemos el DOM
        $row.remove()

        // actualizamos la data
        const findElement = buscarDetalleParte(currentParte)
        const { detalle_procesos } = findElement

        const findIndexElementProceso = detalle_procesos.findIndex(element => element.opp_id == id_proceso)
        detalle_procesos.splice(findIndexElementProceso, 1)

        // debemos actualizar la cantidad de procesos
        const totalProcesos = detalle_procesos.length
        const idCantidadProceso = `#cantidad-procesos-${currentParte}`
        $(idCantidadProceso).text(totalProcesos)
    })

    // ------------ JAVASCRIPT PARA GESTION DE PRODUCTOS -------------
    // carga de detalle de materiales en tabla
    function cargarProductosDetalle(id_parte) {
        $('#tbl-orden-interna-productos tbody').empty();
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_materiales } = findElement
        detalle_materiales.forEach(element => {
            const row = `
            <tr>
                <td>${element["pro_codigo"]}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value="${element["odm_descripcion"]}" readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value="${element["odm_cantidad"]}" readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${element["odm_observacion"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${element["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${element["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`
            $('#tbl-orden-interna-productos tbody').append(row);
        })
    }

    // funcion cargar modal de productos
    $('#tbl-orden-interna').on('click', '.btn-productos', async (event) => {
        const id = $(event.currentTarget).data('bs-id')
        currentParte = id
        // abrimos el modal
        const findParte = buscarDetalleParte(id)
        $('#productosModalLabel').text(`MATERIALES - ${findParte.oip_descripcion}`)
        // cargar informacion de los detalles añadidos
        cargarProductosDetalle(id)
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
                $('#resultadosLista').append(listItem);
            })
        } catch (error) {
            console.log(error)
            alert('Error al buscar materiales')
        }
    }

    function limpiarLista() {
        $('#resultadosLista').empty();
    }

    function seleccionarMaterial(material) {
        const { pro_id, pro_codigo, pro_descripcion } = material
        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement
        const findProducto = detalle_materiales.find(element => element.pro_id == pro_id)

        if (findProducto) {
            alert('Este producto ya fué agregado')
        } else {
            limpiarLista();
            $('#productosInput').val('')

            // obtenemos el valor de checked
            const checked = $('#checkAsociarProducto').prop('checked')

            const data = {
                pro_id,
                pro_codigo,
                odm_descripcion: pro_descripcion,
                odm_cantidad: 1.00,
                odm_observacion: "",
                odm_asociar: checked
            }

            const row = `
            <tr>
                <td>${data["pro_codigo"]}</td>
                <td>
                    <input type="text" class="form-control descripcion-input" value="${data["odm_descripcion"]}" readonly/>
                </td>
                <td>
                    <input type="number" class="form-control cantidad-input" value="${data["odm_cantidad"]}" readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${data["odm_observacion"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${data["pro_id"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>`

            $('#tbl-orden-interna-productos tbody').append(row);
            detalle_materiales.push(data)

            // debemos actualizar la cantidad de productos
            const totalProductos = detalle_materiales.length
            const idCantidadProducto = `#cantidad-productos-${currentParte}`
            $(idCantidadProducto).text(totalProductos)
        }
    }

    // funcion de editar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-editar', function () {
        const $row = $(this).closest('tr')
        const $descripcionInput = $row.find('.descripcion-input');
        const $cantidadInput = $row.find('.cantidad-input');
        const $observacionInput = $row.find('.observacion-input');

        // Habilitar los inputs
        $descripcionInput.prop('readonly', false);
        $cantidadInput.prop('readonly', false);
        $observacionInput.prop('readonly', false);

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-producto-editar')
            .addClass('btn-success btn-detalle-producto-guardar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`);
    })

    // funcion de guardar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-guardar', function () {
        const id_producto = $(this).data('producto')
        const $row = $(this).closest('tr')

        const $descripcionInput = $row.find('.descripcion-input');
        const $cantidadInput = $row.find('.cantidad-input');
        const $observacionInput = $row.find('.observacion-input');

        const valueDescripcion = $descripcionInput.val()
        const valueCantidad = $cantidadInput.val()
        const valueObservacion = $observacionInput.val()

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement
        const findElementProducto = detalle_materiales.find(element => element.pro_id == id_producto)
        findElementProducto["odm_descripcion"] = valueDescripcion
        findElementProducto["odm_cantidad"] = valueCantidad
        findElementProducto["odm_observacion"] = valueObservacion

        $descripcionInput.prop('readonly', true)
        $cantidadInput.prop('readonly', true)
        $observacionInput.prop('readonly', true)

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-producto-guardar')
            .addClass('btn-warning btn-detalle-producto-editar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`);
    })

    // funcion de eliminacion de detalle de producto
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-eliminar', function () {
        const id_producto = $(this).data('producto')
        const $row = $(this).closest('tr')

        // removemos el DOM
        $row.remove()

        // actualizamos la data
        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement

        const findIndexElementProceso = detalle_materiales.findIndex(element => element.pro_id == id_producto)
        detalle_materiales.splice(findIndexElementProceso, 1)

        // debemos actualizar la cantidad de productos
        const totalProductos = detalle_materiales.length
        const idCantidadProducto = `#cantidad-productos-${currentParte}`
        $(idCantidadProducto).text(totalProductos)
    })

    // ---------- BOTONES DE CRUD GUARDAR ------------

    // validar información de detalle sin cantidad
    function validarInformacionDetalleMateriales() {
        const { detalle_partes } = ordenInterna;

        // Acumular los errores en un solo string
        const handleError = detalle_partes.reduce((errores, { oip_descripcion, detalle_materiales }) => {
            detalle_materiales.forEach(({ odm_cantidad, odm_observacion }) => {
                if (!odm_cantidad || odm_cantidad <= 0) {
                    errores += `- La cantidad del material "${odm_observacion}" en la parte "${oip_descripcion}" debe ser un valor numérico mayor a 0.\n`;
                }
            });
            return errores;
        }, '');

        return handleError;
    }

    // validacion informacion detalles partes
    function validarInformacionDetallePartes() {
        let validation = false
        const { detalle_partes } = ordenInterna
        detalle_partes.forEach(element => {
            if (element.detalle_materiales.length !== 0 && element.detalle_procesos.length !== 0) {
                validation = true
            }
        })
        return validation
    }

    // Funcion de reset
    function resetValues() {
        ordenInterna.detalle_partes = []
        currentParte = 0
    }

    // Funcion de crear
    $('#btn-guardar-orden-interna').on('click', async () => {
        let handleError = ''
        const $oiCliente = $('#idClienteInput').val().trim()
        const $otInput = $('#otInput').val().trim()
        const $oiValorEquipo = $('#equipoInput').val().trim()
        const $oiCodigoArea = $('#areaSelect').val()
        const $oiFecha = $('#fechaPicker').val()
        const $oiEncargadoOrigen = $('#responsableOrigen').val()
        const $oiEncargadoMaestro = $('#responsableMaestro').val()
        const $oiEncargadoAlmacen = $('#responsableAlmacen').val()

        if (
            $oiCliente.length === 0 ||
            $otInput.length === 0 ||
            $oiValorEquipo.length === 0 ||
            $oiCodigoArea.length === 0 ||
            $oiFecha.length === 0 ||
            $oiEncargadoOrigen.length === 0 ||
            $oiEncargadoMaestro.length === 0 ||
            $oiEncargadoAlmacen.length === 0
        ) {
            if ($otInput.length === 0) {
                handleError += '- Se debe ingresar información de orden trabajo\n'
            }
            if ($oiCliente.length === 0) {
                handleError += '- Se debe ingresar información del cliente\n'
            }
            if ($oiCodigoArea.length === 0) {
                handleError += '- Se debe ingresar información del área\n'
            }
            if ($oiValorEquipo.length === 0) {
                handleError += '- Se debe ingresar información del equipo\n'
            }
            if ($oiFecha.length === 0) {
                handleError += '- Se debe ingresar información de la fecha\n'
            }
            if ($oiEncargadoOrigen.length === 0) {
                handleError += '- Se debe ingresar información de encargado origen\n'
            }
            if ($oiEncargadoMaestro.length === 0) {
                handleError += '- Se debe ingresar información de encargado maestro\n'
            }
            if ($oiEncargadoAlmacen.length === 0) {
                handleError += '- Se debe ingresar información de encargado almacen\n'
            }
        }

        // manejamos el error
        if (handleError.length === 0) {
            const formatData = {
                odt_numero: $otInput,
                cli_id: $oiCliente,
                are_codigo: $oiCodigoArea,
                oic_fecha: transformarFecha($oiFecha),
                tra_idorigen: $oiEncargadoOrigen,
                tra_idmaestro: $oiEncargadoMaestro,
                tra_idalmacen: $oiEncargadoAlmacen,
                oic_equipo_descripcion: $oiValorEquipo,
                detalle_partes: ordenInterna.detalle_partes,
            }

            // // formateamos la data de numero de orden
            formatData.detalle_partes.forEach(element => {
                element.detalle_materiales.forEach((detalle, index) => {
                    detalle["odm_item"] = index + 1
                })
            })

            // VALIDAMOS SI LOS DETALLES DE LAS PARTES NO ESTAN VACIOS
            const validacionDetallePartes = validarInformacionDetallePartes()
            if (validacionDetallePartes) {
                // VALIDAMOS QUE LAS CANTIDADES DE LOS DETALLES DE MATERIALES NO ESTEN VACIOS
                const validacionDetalleMateriales = validarInformacionDetalleMateriales()
                if (validacionDetalleMateriales.length === 0) {
                    showLoaderModal()
                    try {
                        console.log(formatData)
                        await client.post('/ordenesinternas', formatData)
                        window.location.href = '/orden-interna'
                    } catch (error) {
                        const {response} = error
                        if(response.status === 500){
                            alert(response.data.error)
                        } else {
                            alert('Hubo un error en la creacion de orden interna')
                        }
                    } finally {
                        hideLoaderModal()
                    }
                } else {
                    alert(validacionDetalleMateriales)
                }
            } else {
                alert('- Al menos una parte debe tener procesos y materiales')
            }
        } else {
            alert(handleError)
        }
    })

    // Funcion de cancelar
    $('#btn-cancelar-orden-interna').on('click', function () {
        resetValues()
        window.location.href = '/orden-interna'
    })

    // -------- MANEJADORES DE DIALOG ---------------

    // Antes de que el modal se cierre
    $('#procesosModal').on('hide.bs.modal', function (e) {
        const $elemento = $('.btn-detalle-proceso-guardar').first();
        if ($elemento.length > 0) {
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault();
            }
        }
    });

    $('#productosModal').on('hide.bs.modal', function (e) {
        const $elemento = $('.btn-detalle-producto-guardar').first();
        if ($elemento.length > 0) {
            if (!confirm("Aún tienes elementos sin guardar ¿Seguro que quieres cerrar el modal?")) {
                e.preventDefault();
            }
        }
    });

});
