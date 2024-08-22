$(document).ready(function () {
    const id = localStorage.getItem('ordenInternaId')
    localStorage.removeItem('ordenInternaId')
    console.log('ID:', id)

    let detalleOrdenInterna = {}
    let currentDetalleParte = 0

    // funcion de busqueda de detalle de parte
    function buscarDetalleParte(id_detalle_parte) {
        return findElement = detalleOrdenInterna.detalle_partes.find(element => element.opd_id == id_detalle_parte)
    }

    function cargarDetalleOrdenInterna() {
        const data = {
            oic_id: id
        }

        showLoadingModal()
        $.ajax({
            url: `./php/vistas/leerOI.php`,
            type: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (response) {
                console.log(response)
                detalleOrdenInterna = response
                // reemplazamos el valor en orden trabajo
                $('#otInput').val(response.oic_numero)
                // reemplazamos el valor en cliente
                $('#clienteInput').val(response.cli_nombre)
                // reemplazamos el valor en fecha
                $('#fechaPicker').val(convertirFecha(response.oic_fecha))
                // reemplazamos el valor en area
                $('#areaSelect').val(response.are_descripcion)
                // reemplazamos el valor en equipo de trabajo
                $('#equipoInput').val(response.oic_equipo_descripcion)

                // reemplazamos el valor de la tabla de ordenes internas
                const { detalle_partes } = response
                detalle_partes.forEach(function (item, index) {
                    const totalDetalleProcesos = item.detalle_procesos.filter(element => element.odp_estado == 1).length
                    const totalDetalleProductos = item.detalle_materiales.filter(element => element.odm_estado == 1).length
                    const totalAdicionales = item.detalle_materiales.filter((element) => element.odm_tipo == 2 && element.odm_estado == 1).length
                    const totalRegulares = item.detalle_materiales.filter((element) => element.odm_tipo == 1 && element.odm_estado == 1).length

                    const row = `
                        <tr>
                            <td>${item.oip_descripcion}</td>
                            <td>
                                <button class="btn btn-sm btn-editar btn-procesos" data-element="${item.oip_descripcion}" data-id-parte="${item.oip_id}" data-id-detalle-parte="${item.opd_id}">
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
                                <button class="btn btn-sm btn-eliminar btn-productos" data-element="${item.oip_descripcion}" data-id-parte="${item.oip_id}" data-id-detalle-parte="${item.opd_id}">
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
                    `;
                    // agregamos la tabla
                    $('#tbl-orden-interna tbody').append(row);
                })
            },
            error: function (error) {
                console.log(error)
            },
            complete: function () {
                hideLoadingModal()
            }
        })
    }

    cargarDetalleOrdenInterna()

    // cargar procesos select
    function cargarProcesosSelect(id_parte, id_detalle_parte) {
        const data = {
            oip_id: id_parte
        }
        const findElement = buscarDetalleParte(id_detalle_parte)
        const { detalle_procesos } = findElement

        $.ajax({
            url: './php/vistas/leerOrdenInternaProcesos.php',
            method: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (response) {
                const { data } = response;
                const dataFilter = data.filter(element => !detalle_procesos.some(detalle => detalle.opp_id == element[0]))
                const $procesosSelect = $('#procesosSelect');
                $procesosSelect.empty().append(`<option value="0">Seleccione un proceso</option>`);
                dataFilter.forEach(function (proceso) {
                    const option = $('<option>').val(proceso[0]).text(`${proceso[2]} - ${proceso[3]}`).attr('data-codigo', proceso[2]);
                    $procesosSelect.append(option);
                });
            },
            error: function (xhr, status, error) {
                console.error('Error al obtener los procesos:', error);
            }
        });
    }

    // cargar procesos detalle
    function cargarProcesosDetalle(id_detalle_parte) {
        $('#tbl-orden-interna-procesos tbody').empty();
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_detalle_parte)
        const { detalle_procesos } = findElement

        detalle_procesos.sort((a, b) => a.opp_codigo - b.opp_codigo);

        detalle_procesos.forEach(element => {
            const isDisabled = element.odp_estado === 0;
            const backgroundColor = isDisabled ? 'table-danger' : '';
            const disabledAttribute = isDisabled ? 'disabled' : '';

            const row = `
            <tr data-id-detalle-proceso="${element.odp_id}" class="${backgroundColor}">
                <td>${element.opp_codigo}</td>
                <td>${element.opp_descripcion}</td>
                <td>
                    <input type="text" class="form-control" value="${element.odp_observacion}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-id-proceso="${element.opp_id}" ${disabledAttribute}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-id-proceso="${element.opp_id}" ${disabledAttribute}>
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
    $('#tbl-orden-interna').on('click', '.btn-procesos', function () {
        const id_parte = $(this).data('id-parte')
        const id_detalle_parte = $(this).data('id-detalle-parte')
        currentDetalleParte = id_detalle_parte
        // abrimos el modal
        const findParte = buscarDetalleParte(id_detalle_parte)
        $('#procesosModalLabel').text(`PROCESOS - ${findParte.oip_descripcion}`)
        $('#procesosModal').modal('show')
        // cargamos la informacion
        cargarProcesosSelect(id_parte, id_detalle_parte)
        // cargar informacion de los detalles añadidos
        cargarProcesosDetalle(id_detalle_parte)

    })

    // funcion de agregar detalle de proceso a parte de orden interna
    $('#procesosSelect').on('change', function () {
        const selectedProcesoId = $(this).val()
        if (selectedProcesoId == "0") {
            alert('Debes seleccionar un proceso')
            return
        }

        const findElement = buscarDetalleParte(currentDetalleParte)
        const { detalle_procesos, opd_id } = findElement

        const findProceso = detalle_procesos.find(element => element.opp_id == selectedProcesoId)

        if (findProceso) {
            alert('Este proceso ya fué agregado')
        } else {
            const data = {
                opd_id,
                opp_id: selectedProcesoId,
                odp_observacion: "",
            }

            showLoadingModal()
            $.ajax({
                url: './php/vistas/crearOrdenInternaDetProcesos.php',
                method: 'POST',
                data: JSON.stringify(data),
                dataType: 'json',
                success: function (response) {
                    console.log(response)
                    const row = `
                    <tr data-id-detalle-proceso="${response.odp_id}">
                        <td>${response.opp_codigo}</td>
                        <td>${response.opp_descripcion}</td>
                        <td>
                            <input type="text" class="form-control" value="${response.odp_observacion}" readonly/>
                        </td>
                        <td>
                            <div class="d-flex justify-content-around">
                                <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-id-proceso="${response.opp_id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                    </svg>
                                </button>
                                <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-id-proceso="${response.opp_id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>`

                    // Agregamos al detalle de procesos
                    $('#tbl-orden-interna-procesos tbody').append(row);

                    // Agregamos al detalle de procesos
                    detalle_procesos.push(response)

                    // debemos actualizar la cantidad de procesos
                    const totalProcesos = detalle_procesos.length
                    const idCantidadProceso = `#cantidad-procesos-${currentDetalleParte}`
                    $(idCantidadProceso).text(totalProcesos)
                    
                    // seleccionamos el valor por defecto
                    $('#procesosSelect').val(0)
                },
                error: function (xhr, status, error) {
                    console.log('Error al obtener los procesos:', error);
                    alert('Error al agregar el proceso')
                },
                complete: function () {
                    hideLoadingModal()
                }

            })
        }
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
        $row.find('.btn-danger.btn-detalle-proceso-eliminar').attr('disabled', true)
    })

    // funcion de guarda detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-guardar', function () {
        const id_proceso = $(this).data('id-proceso')
        const $row = $(this).closest('tr')
        const $input = $row.find('input')
        const id_detalle_proceso = $row.data('id-detalle-proceso')
        const $button = $(this);

        const valueObservacion = $input.val()

        const data = {
            odp_id: id_detalle_proceso,
            odp_observacion: valueObservacion
        }
        console.log(data)

        const findElement = buscarDetalleParte(currentDetalleParte)
        const { detalle_procesos } = findElement

        const findProceso = detalle_procesos.find(element => element.opp_id == id_proceso)

        showLoadingModal()
        $.ajax({
            url: './php/vistas/editarOrdenInternaDetProcesos.php',
            method: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (response) {
                // actualizamos el valor de observacion
                findProceso.odp_observacion = valueObservacion
            },
            error: function (xhr, status, error) {
                console.log('Error al obtener los procesos:', error);
                // actualizamos el input de observacion
                $input.val(findProceso.odp_observacion)
                alert('Error al actualizar el detalle');
            },
            complete: function () {
                // el input se hace no editable
                $input.prop('readonly', true)
                // cambiamos de icono al boton
                $button.removeClass('btn-success btn-detalle-proceso-guardar')
                    .addClass('btn-warning btn-detalle-proceso-editar')
                    .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`);
                $row.find('.btn-danger.btn-detalle-proceso-eliminar').attr('disabled', false)
                hideLoadingModal()
            }
        })
    })

    // funcion de eliminacion de detalle de proceso
    $('#tbl-orden-interna-procesos').on('click', '.btn-detalle-proceso-eliminar', function () {
        const id_proceso = $(this).data('id-proceso')
        const $row = $(this).closest('tr')
        const id_detalle_proceso = $row.data('id-detalle-proceso')

        const findElement = buscarDetalleParte(currentDetalleParte)
        const { detalle_procesos } = findElement

        // debemos actualizar la cantidad de procesos
        const totalProcesos = detalle_procesos.length - 1
        const idCantidadProceso = `#cantidad-procesos-${currentDetalleParte}`
        $(idCantidadProceso).text(totalProcesos)

        const findProceso = detalle_procesos.find(element => element.opp_id == id_proceso)

        const data = {
            odp_id: id_detalle_proceso,
            odp_estado: 0
        }

        showLoadingModal()
        $.ajax({
            url: './php/vistas/eliminarOrdenInternaDetProcesos.php',
            method: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (response) {
                // actualizamos el valor de observacion
                findProceso.odp_estado = 0
                // debemos deshabilitar los botones
                $row.find('button').attr('disabled', true)
                $row.addClass('table-danger')
            },
            error: function (xhr, status, error) {
                console.log('Error al obtener los procesos:', error);
                alert('Error al eliminar el detalle');
            },
            complete: function () {
                hideLoadingModal()
            }
        })
    })

    // cargar select de productos
    function cargarProductosSelect(id_detalle_parte) {
        const findElement = buscarDetalleParte(id_detalle_parte)
        const { detalle_materiales } = findElement

        $.ajax({
            url: './php/vistas/leerProductos.php',
            method: 'POST',
            dataType: 'json',
            success: function (response) {
                const { data } = response;
                const dataFilter = data.filter(element => !detalle_materiales.some(detalle => detalle.pro_id == element[0]))
                const $productosSelect = $('#productosSelect');
                $productosSelect.empty().append('<option value="0">Seleccione un material</option>');
                dataFilter.forEach(function (producto) {
                    const option = $('<option>').val(producto[0]).text(`${producto[1]} - ${producto[2]}`).attr('data-codigo', producto[1]);
                    $productosSelect.append(option);
                });
            },
            error: function (xhr, status, error) {
                console.error('Error al obtener los materiales:', error);
            }
        });
    }

    // carga de detalle de materiales en tabla
    function cargarProductosDetalle(id_detalle_parte) {
        $('#tbl-orden-interna-productos tbody').empty();
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_detalle_parte)
        const { detalle_materiales } = findElement
        detalle_materiales.forEach(element => {
            const isDisabled = element.odm_estado === 0;
            const backgroundColor = isDisabled ? 'table-danger"' : element.odm_tipo == 2 ? 'table-primary' : '';
            const disabledAttribute = isDisabled ? 'disabled' : '';

            const row = `
            <tr data-id-detalle-producto="${element.odm_id}" class="${backgroundColor}">
                <td>${element.pro_codigo}</td>
                <td>${element.pro_descripcion}</td>
                <td>
                    <input type="number" class="form-control cantidad-input" value="${element.odm_cantidad}" readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${element.odm_observacion}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-id-producto="${element.pro_id}" ${disabledAttribute}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-id-producto="${element.pro_id}" ${disabledAttribute}>
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
    $('#tbl-orden-interna').on('click', '.btn-productos', function () {
        const id_detalle_parte = $(this).data('id-detalle-parte')
        currentDetalleParte = id_detalle_parte
        // abrimos el modal
        const findParte = buscarDetalleParte(id_detalle_parte)
        $('#productosModalLabel').text(`MATERIALES - ${findParte.oip_descripcion}`)
        $('#productosModal').modal('show')
        // cargamos la informacion
        cargarProductosSelect(id_detalle_parte)
        // cargar informacion de los detalles añadidos
        cargarProductosDetalle(id_detalle_parte)
    })

    // funcion para añadir al detalle de materiales de la parte correspondiente
    $('#productosSelect').on('change', function () {
        const selectedProductoId = $(this).val();
        if (selectedProductoId == "0") {
            alert('Debes seleccionar un producto')
            return
        }

        const findElement = buscarDetalleParte(currentDetalleParte)
        const { detalle_materiales, opd_id } = findElement

        const findProducto = detalle_materiales.find(element => element.pro_id == selectedProductoId)

        if (findProducto) {
            alert('Este producto ya fué agregado')
        } else {
            const data = {
                opd_id,
                pro_id: selectedProductoId,
                odm_item: detalle_materiales.length + 1,
                odm_cantidad: 1.00,
                odm_observacion: "",
                odm_tipo: 2
            }

            showLoadingModal()
            $.ajax({
                url: './php/vistas/crearOrdenInternaDetMateriales.php',
                method: 'POST',
                data: JSON.stringify(data),
                dataType: 'json',
                success: function (response) {
                    console.log(response)
                    const row = `
                    <tr data-id-detalle-producto="${response.odm_id}" class="table-primary">
                        <td>${response.pro_codigo}</td>
                        <td>${response.pro_descripcion}</td>
                        <td>
                            <input type="number" class="form-control cantidad-input" value="${response.odm_cantidad}" readonly/>
                        </td>
                        <td>
                            <input type="text" class="form-control observacion-input" value="${response.odm_observacion}" readonly/>
                        </td>
                        <td>
                            <div class="d-flex justify-content-around">
                                <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-id-producto="${response.pro_id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                    </svg>
                                </button>
                                <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-id-producto="${response.pro_id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>`

                    // Agregamos al detalle de procesos
                    $('#tbl-orden-interna-productos tbody').append(row);

                    // Agregamos al detalle de procesos
                    detalle_materiales.push(response)

                    // debemos actualizar la cantidad de procesos
                    const totalMateriales = detalle_materiales.length
                    const idCantidadProducto = `#cantidad-productos-${currentDetalleParte}`
                    $(idCantidadProducto).text(totalMateriales)

                    const idCantidadAdicionales = `#cantidad-adicionales-${currentDetalleParte}`
                    const valorAdicionales = parseInt($(idCantidadAdicionales).text()) + 1
                    $(idCantidadAdicionales).text(valorAdicionales)

                    // seleccionamos el valor por defecto
                    $('#productosSelect').val(0)
                },
                error: function (xhr, status, error) {
                    console.log('Error al obtener los productos:', error);
                    alert('Error al agregar el material')
                },
                complete: function () {
                    console.log("Se completo la solicitud")
                    hideLoadingModal()
                }

            })
        }
    })

    // funcion de editar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-editar', function () {
        const $row = $(this).closest('tr')
        const $cantidadInput = $row.find('.cantidad-input');
        const $observacionInput = $row.find('.observacion-input');

        // Habilitar los inputs
        $cantidadInput.prop('readonly', false);
        $observacionInput.prop('readonly', false);

        // ACTUALIZAMOS EL ELEMENTO
        $(this).removeClass('btn-warning btn-detalle-producto-editar')
            .addClass('btn-success btn-detalle-producto-guardar')
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-floppy-fill" viewBox="0 0 16 16">
                    <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0H3v5.5A1.5 1.5 0 0 0 4.5 7h7A1.5 1.5 0 0 0 13 5.5V0h.086a1.5 1.5 0 0 1 1.06.44l1.415 1.414A1.5 1.5 0 0 1 16 2.914V14.5a1.5 1.5 0 0 1-1.5 1.5H14v-5.5A1.5 1.5 0 0 0 12.5 9h-9A1.5 1.5 0 0 0 2 10.5V16h-.5A1.5 1.5 0 0 1 0 14.5z"/>
                    <path d="M3 16h10v-5.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5zm9-16H4v5.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5zM9 1h2v4H9z"/>
                </svg>`);
        $row.find('.btn-danger.btn-detalle-producto-eliminar').attr('disabled', true)
    })

    // funcion de guarda detalle de proceso
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-guardar', function () {
        const id_producto = $(this).data('id-producto')
        const $row = $(this).closest('tr')
        const $cantidadInput = $row.find('.cantidad-input');
        const $observacionInput = $row.find('.observacion-input');
        const id_detalle_producto = $row.data('id-detalle-producto')
        const $button = $(this);

        const valueCantidad = $cantidadInput.val()
        const valueObservacion = $observacionInput.val()

        if(esNumeroYMayorQueCero(valueCantidad)){
            alert('La cantidad ingresada debe ser numérica y mayor que 0')
            return
        }

        const data = {
            odm_id: id_detalle_producto,
            odm_cantidad: valueCantidad,
            odm_observacion: valueObservacion
        }
        console.log(data)

        const findElement = buscarDetalleParte(currentDetalleParte)
        const { detalle_materiales } = findElement

        const findProducto = detalle_materiales.find(element => element.pro_id == id_producto)

        showLoadingModal()
        $.ajax({
            url: './php/vistas/editarOrdenInternaDetMateriales.php',
            method: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (response) {
                // actualizamos el valor de observacion
                findProducto.odm_observacion = valueObservacion
                // actualizamos el valor de cantidad
                findProducto.odm_cantidad = valueCantidad
            },
            error: function (xhr, status, error) {
                console.log('Error al obtener los materiales:', error);
                // actualizamos el input de observacion
                $observacionInput.val(findProducto.odp_observacion)
                // actualizamos el input de cantidad
                $cantidadInput.val(findProducto.odm_cantidad)
                alert('Error al actualizar el detalle');
            },
            complete: function () {
                // el input se hace no editable
                $cantidadInput.prop('readonly', true)
                $observacionInput.prop('readonly', true)

                // cambiamos de icono al boton
                $button.removeClass('btn-success btn-detalle-producto-guardar')
                    .addClass('btn-warning btn-detalle-producto-editar')
                    .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                    </svg>`);
                $row.find('.btn-danger.btn-detalle-producto-eliminar').attr('disabled', false)
                hideLoadingModal()
            }
        })
    })

    // funcion de eliminacion de detalle de proceso
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-eliminar', function () {
        const id_producto = $(this).data('id-producto')
        const $row = $(this).closest('tr')
        const id_detalle_producto = $row.data('id-detalle-producto')

        const findElement = buscarDetalleParte(currentDetalleParte)
        const { detalle_materiales } = findElement

        // debemos actualizar la cantidad de procesos
        const totalMateriales = detalle_materiales.length - 1
        const idCantidadProducto = `#cantidad-productos-${currentDetalleParte}`
        $(idCantidadProducto).text(totalMateriales)

        const findProducto = detalle_materiales.find(element => element.pro_id == id_producto)

        // si es un producto regular
        if(findProducto.odm_tipo == 1){
            const idCantidaRegulares= `#cantidad-regulares-${currentDetalleParte}`
            const valorRegulares = parseInt($(idCantidaRegulares).text()) - 1
            $(idCantidaRegulares).text(valorRegulares)
        } 
        // si es un adicional
        else {
            const idCantidadAdicionales = `#cantidad-adicionales-${currentDetalleParte}`
            const valorAdicionales = parseInt($(idCantidadAdicionales).text()) - 1
            $(idCantidadAdicionales).text(valorAdicionales)
        }

        const data = {
            odm_id: id_detalle_producto,
            odm_estado: 0
        }

        showLoadingModal()
        $.ajax({
            url: './php/vistas/eliminarOrdenInternaDetMateriales.php',
            method: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (response) {
                // actualizamos el valor de observacion
                findProducto.odm_estado = 0
                // debemos deshabilitar los botones
                $row.find('button').attr('disabled', true)
                if(findProducto.odm_tipo == 2){
                    $row.removeClass('table-primary')
                }
                $row.addClass('table-danger')
            },
            error: function (xhr, status, error) {
                console.log('Error al obtener los procesos:', error);
                alert('Error al eliminar el detalle');
            },
            complete: function () {
                hideLoadingModal()
            }
        })
    })

    // Funcion de cancelar
    $('#btn-cancelar-orden-interna').on('click', function () {
        resetValues()
        $('#content').load('./paginas/orden-interna/listOrdenInterna.html')
    })

    function resetValues() {
        detalleOrdenInterna = {}
    }

    function showLoadingModal() {
        $('#loadingModal').modal('show');
    }

    // Ocultar el modal de carga
    function hideLoadingModal() {
        $('#loadingModal').modal('hide');
    }

    // funciones utilitarias
    function convertirFecha(formatoISO) {
        // Divide la fecha en año, mes y día
        const [anio, mes, dia] = formatoISO.split('-');

        // Retorna la fecha en el nuevo formato
        return `${dia}/${mes}/${anio}`;
    }

    function esNumeroYMayorQueCero(valor) {
        // Primero verificamos que el valor sea un número y no NaN
        if (typeof valor === 'number' && !isNaN(valor)) {
            // Luego verificamos que el valor sea mayor que 0
            if (valor > 0) {
                return true;
            }
        }
        return false;
    }

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

})