$(document).ready(function () {
    // data guardada
    const ordenInterna = {
        OrdenTrabajo: "",
        id_cliente: "",
        codigo_area: "",
        fecha: "",
        descripcion_equipo: "",
        detalle_partes: []
    };

    let currentParte = 0

    // funcion de busqueda de detalle de parte
    function buscarDetalleParte(id_parte) {
        return findElement = ordenInterna.detalle_partes.find(element => element.id_parte == id_parte)
    }

    // funcion de buscar Orden de Trabajo
    function buscarOrdenTrabajo() {
        // Obtener el valor del campo de texto
        var otValue = $('#otInput').val().trim();

        // Validar si el campo está vacío
        if (otValue.length === 0) {
            alert('Por favor, ingrese un valor para buscar.');
            return;
        }

        const data = {
            odt_numero: otValue
        }

        showLoadingModal()
        $.ajax({
            url: `./php/vistas/leerUnaOrdenTrabajo.php`,
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (response) {
                const { data } = response
                if (data.length === 0) {
                    alert('No se encontró la OT.')
                } else {
                    ordenInterna["OrdenTrabajo"] = data[0][0]
                    ordenInterna["id_cliente"] = data[0][2]
                    $('#clienteInput').val(data[0][3])
                }
            },
            error: function (error) {
                console.error('Error en la solicitud AJAX:', error)
            },
            complete: function () {
                hideLoadingModal()
            }
        })
    }

    // Maneja el evento de enter en el campo de orden de trabajo
    $('#otInput').on('keypress', function (event) {
        if (event.which === 13) {
            buscarOrdenTrabajo()
        }
    })

    // Maneja el evento de clic en el botón de búsqueda
    $('#searchButton').on('click', function () {
        buscarOrdenTrabajo()
    });

    // ------- JAVASCRIPT para el manejo de AREA -------
    $('#areaSelect').on('change', function () {
        const selectedAreaId = $(this).val();
        ordenInterna["codigo_area"] = selectedAreaId
    })

    function cargarAreas() {
        $.ajax({
            url: './php/vistas/leerAreasAdvanced.php',
            method: 'GET',
            success: function (response) {
                const { data } = response;
                const $areaSelect = $('#areaSelect');

                // Ordenar la data alfabéticamente según el nombre (índice [1])
                data.sort((a, b) => a[1].localeCompare(b[1]));

                data.forEach(area => {
                    const option = $('<option>').val(area[0]).text(area[1]);
                    $areaSelect.append(option);
                });
            },
            error: function (error) {
                console.log('Error al obtener las áreas:', error)
            }
        })
    }

    function cargarResponsables() {
        $.ajax({
            url: './php/vistas/leertrabajadoresadvanced.php',
            method: 'POST',
            success: function (response) {
                const { data } = response;
                console.log(data)
                const $responsableOrigen = $('#responsableOrigen');
                const $responsableMaestro = $('#responsableMaestro');
                const $responsableAlmacen = $('#responsableAlmacen');

                // Ordenar la data alfabéticamente según el nombre (índice [1])
                data.sort((a, b) => a.tra_nombre.localeCompare(b.tra_nombre));

                data.forEach(responsable => {
                    const option = $('<option>').val(responsable.tra_id).text(responsable.tra_nombre);
                    $responsableOrigen.append(option)
                    $responsableMaestro.append(option)
                    $responsableAlmacen.append(option)
                });
            },
            error: function (error) {
                console.log('Error al obtener las áreas:', error)
            }
        })
    }


    // -------- MANEJO DE FECHA ----------
    $("#fechaPicker").datepicker({
        dateFormat: 'dd/mm/yy',
        setDate: new Date()
    }).datepicker("setDate", new Date())

    $('#fechaPicker').on('change', function () {
        $fechaPicker = $('#fechaPicker')
        const dateString = $fechaPicker.val();
        const [day, month, year] = dateString.split('/').map(Number);
        const inputDate = new Date(year, month - 1, day);
        const formattedDate = formatDateToYYYYMMDD(inputDate);
        ordenInterna["fecha"] = formattedDate;
    });

    function formatDateToYYYYMMDD(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --------- CARGA INICIAL DE DATA DE PARTES ----------
    function cargarTablaOrdenInterna() {
        $.ajax({
            url: './php/vistas/leerOrdenInternaPartesAdvanced.php',
            method: 'POST',
            dataType: 'json',
            success: function (response) {
                const { data } = response
                // Suponiendo que data es un array de objetos
                data.forEach(function (item, index) {
                    const row = `
                        <tr>
                            <td>${item[1]}</td>
                            <td>
                                <button class="btn btn-sm btn-editar btn-procesos" data-element="${item[1]}" data-bs-id="${item[0]}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                                        <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                                    </svg>
                                    Procesos
                                </button>
                            </td>
                            <td>
                                <p class="text-center" id="cantidad-procesos-${item[0]}">0</p>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-eliminar btn-productos" data-element="${item[1]}" data-bs-id="${item[0]}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hammer" viewBox="0 0 16 16">
                                        <path d="M9.972 2.508a.5.5 0 0 0-.16-.556l-.178-.129a5 5 0 0 0-2.076-.783C6.215.862 4.504 1.229 2.84 3.133H1.786a.5.5 0 0 0-.354.147L.146 4.567a.5.5 0 0 0 0 .706l2.571 2.579a.5.5 0 0 0 .708 0l1.286-1.29a.5.5 0 0 0 .146-.353V5.57l8.387 8.873A.5.5 0 0 0 14 14.5l1.5-1.5a.5.5 0 0 0 .017-.689l-9.129-8.63c.747-.456 1.772-.839 3.112-.839a.5.5 0 0 0 .472-.334"/>
                                    </svg> 
                                    Materiales
                                </button>
                            </td>
                            <td>
                                <p class="text-center" id="cantidad-productos-${item[0]}">0</p>
                            </td>
                        </tr>
                    `;
                    // agregamos la tabla
                    $('#tbl-orden-interna tbody').append(row);
                    // formamos la data de procesos y productos
                    const data = {
                        id_parte: item[0],
                        nombre_parte: item[1],
                        detalle_materiales: [],
                        detalle_procesos: []
                    }
                    ordenInterna["detalle_partes"].push(data)
                });
                // hideLoadingModal()
            },
            error: function (xhr, status, error) {
                alert('Error en la solicitud')
                // hideLoadingModal()
            }
        })
    }

    showLoadingModal()
    cargarTablaOrdenInterna()
    cargarAreas()
    cargarResponsables()
    hideLoadingModal()

    // ------------ JAVASCRIPT PARA GESTION DE PROCESOS -------------
    // carga de selector de procesos
    function cargarProcesosSelect(id_parte) {
        const data = {
            oip_id: id_parte
        }
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_procesos } = findElement

        $.ajax({
            url: './php/vistas/leerOrdenInternaProcesos.php',
            method: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (response) {
                const { data } = response;
                const dataFilter = data.filter(element => !detalle_procesos.some(detalle => detalle["id_proceso"] == element[0]))
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

    // carga de detalle de procesos en tabla
    function cargarProcesosDetalle(id_parte) {
        $('#tbl-orden-interna-procesos tbody').empty();
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_procesos } = findElement

        detalle_procesos.sort((a, b) => a.codigo - b.codigo);

        detalle_procesos.forEach(element => {
            const row = `
            <tr>
                <td>${element["codigo"]}</td>
                <td>${element["nombre"]}</td>
                <td>
                    <input type="text" class="form-control" value="${element["observacion_proceso"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${element["id_proceso"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${element["id_proceso"]}">
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
        const id = $(this).data('bs-id')
        currentParte = id
        // abrimos el modal
        const findParte = buscarDetalleParte(id)
        $('#procesosModalLabel').text(`PROCESOS - ${findParte.nombre_parte}`)
        $('#procesosModal').modal('show')
        // cargamos la informacion
        cargarProcesosSelect(id)
        // cargar informacion de los detalles añadidos
        cargarProcesosDetalle(id)
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

        const findProceso = detalle_procesos.find(element => element.id_proceso == selectedProcesoId)

        if (findProceso) {
            alert('Este proceso ya fué agregado')
        } else {
            const data = {
                id_proceso: selectedProcesoId,
                codigo: selectedProcesoCode,
                nombre: selectedProcesoName,
                observacion_proceso: ""
            }

            // primero añadimos al DOM
            const row = `
            <tr>
                <td>${data["codigo"]}</td>
                <td>${data["nombre"]}</td>
                <td>
                    <input type="text" class="form-control" value="${data["observacion_proceso"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-proceso-editar me-2" data-proceso="${data["id_proceso"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-proceso-eliminar" data-proceso="${data["id_proceso"]}">
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
            console.log(idCantidadProceso, totalProcesos)
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
        const findElementProceso = detalle_procesos.find(element => element.id_proceso == id_proceso)
        findElementProceso["observacion_proceso"] = valueObservacion

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

        const findIndexElementProceso = detalle_procesos.findIndex(element => element.id_proceso == id_proceso)
        detalle_procesos.splice(findIndexElementProceso, 1)

        // debemos actualizar la cantidad de procesos
        const totalProcesos = detalle_procesos.length
        const idCantidadProceso = `#cantidad-procesos-${currentParte}`
        console.log(idCantidadProceso, totalProcesos)
        $(idCantidadProceso).text(totalProcesos)
    })

    // ------------ JAVASCRIPT PARA GESTION DE PROCESOS -------------
    function cargarProductosSelect(id_parte) {
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_materiales } = findElement

        $.ajax({
            url: './php/vistas/leerProductos.php',
            method: 'POST',
            dataType: 'json',
            success: function (response) {
                const { data } = response;
                const dataFilter = data.filter(element => !detalle_materiales.some(detalle => detalle["id_producto"] == element[0]))
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
    function cargarProductosDetalle(id_parte) {
        $('#tbl-orden-interna-productos tbody').empty();
        // buscamos el detalle de la parte correspondiente
        const findElement = buscarDetalleParte(id_parte)
        const { detalle_materiales } = findElement
        detalle_materiales.forEach(element => {
            const row = `
            <tr>
                <td>${element["codigo"]}</td>
                <td>${element["nombre"]}</td>
                <td>
                    <input type="number" class="form-control cantidad-input" value="${element["cantidad"]}" readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${element["observacion_material"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${element["id_producto"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${element["id_producto"]}">
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
        const id = $(this).data('bs-id')
        currentParte = id
        // abrimos el modal
        const findParte = buscarDetalleParte(id)
        $('#productosModalLabel').text(`MATERIALES - ${findParte.nombre_parte}`)
        $('#productosModal').modal('show')
        // cargamos la informacion
        cargarProductosSelect(id)
        // cargar informacion de los detalles añadidos
        cargarProductosDetalle(id)

    })

    // funcion para añadir al detalle de materiales de la parte correspondiente
    $('#productosSelect').on('change', function () {
        const selectedProductoId = $(this).val();
        if (selectedProductoId == "0") {
            alert('Debes seleccionar un producto')
            return
        }
        const selectedProductoName = $(this).find('option:selected').text().split(" - ")[1].trim();
        const selectedProductoCodigo = $(this).find('option:selected').data('codigo');

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement

        const findProducto = detalle_materiales.find(element => element.id_producto == selectedProductoId)

        if (findProducto) {
            alert('Este producto ya fué agregado')
        } else {
            const data = {
                id_producto: selectedProductoId,
                codigo: selectedProductoCodigo,
                nombre: selectedProductoName,
                cantidad: 1.00,
                observacion_material: ""
            }

            // primero añadimos al DOM
            const row = `
            <tr>
                <td>${data["codigo"]}</td>
                <td>${data["nombre"]}</td>
                <td>
                    <input type="number" class="form-control cantidad-input" value="${data["cantidad"]}" readonly/>
                </td>
                <td>
                    <input type="text" class="form-control observacion-input" value="${data["observacion_material"]}" readonly/>
                </td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-detalle-producto-editar me-2" data-producto="${data["id_producto"]}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger btn-detalle-producto-eliminar" data-producto="${data["id_producto"]}">
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

        // seleccionamos el valor por defecto
        $('#productoSelect').val(0)
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
    })

    // funcion de guardar detalle de productos
    $('#tbl-orden-interna-productos').on('click', '.btn-detalle-producto-guardar', function () {
        const id_producto = $(this).data('producto')
        const $row = $(this).closest('tr')
        const $cantidadInput = $row.find('.cantidad-input');
        const $observacionInput = $row.find('.observacion-input');

        const valueCantidad = $cantidadInput.val()
        const valueObservacion = $observacionInput.val()

        const findElement = buscarDetalleParte(currentParte)
        const { detalle_materiales } = findElement
        const findElementProducto = detalle_materiales.find(element => element.id_producto == id_producto)
        findElementProducto["cantidad"] = valueCantidad
        findElementProducto["observacion_material"] = valueObservacion

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

        const findIndexElementProceso = detalle_materiales.findIndex(element => element.id_producto == id_producto)
        detalle_materiales.splice(findIndexElementProceso, 1)

        // debemos actualizar la cantidad de productos
        const totalProductos = detalle_materiales.length
        const idCantidadProducto = `#cantidad-productos-${currentParte}`
        console.log(idCantidadProducto, totalProductos)
        $(idCantidadProducto).text(totalProductos)
    })

    // ---------- BOTONES DE CRUD GUARDAR ------------

    // validar información de detalle sin cantidad
    function validarInformacionDetalleMateriales() {
        let handleError = ''
        const { detalle_partes } = ordenInterna
        detalle_partes.forEach(element => {
            element.detalle_materiales.forEach(detalle => {
                if (detalle.cantidad <= 0) {
                    handleError += `- El detalle de material: ${detalle['nombre']} ,en la parte ${element['nombre_parte']}, tiene una cantidad menor igual a 0\n`
                }
            })
        })
        return handleError
    }

    // validacion informacion detalles partes
    function validarInformacionDetallePartes() {
        let handleError = ''
        const { detalle_partes } = ordenInterna
        console.log(detalle_partes)
        detalle_partes.forEach(element => {
            const nombre_parte = element['nombre_parte']
            if (element.detalle_materiales.length === 0 || element.detalle_procesos.length === 0) {
                handleError += `- La parte: ${nombre_parte}, debe tener en sus detalles de materiales y procesos al menos un registro\n`
            }
        })
        return handleError
    }

    // Funcion de reset
    function resetValues() {
        // data guardada
        ordenInterna.OrdenTrabajo = 0
        ordenInterna.codigo_area = 0
        ordenInterna.id_cliente = 0
        ordenInterna.fecha = ''
        ordenInterna.detalle_partes = []
        currentParte = 0
    }

    // Funcion de crear
    $('#btn-guardar-orden-interna').on('click', function () {
        let handleError = ''
        $valorEquipo = $('#equipoInput').val().trim()

        if (ordenInterna.id_cliente.length === 0 ||
            ordenInterna.codigo_area.length === 0 ||
            $valorEquipo.length === 0 ||
            ordenInterna.OrdenTrabajo.length === 0 ||
            ordenInterna.fecha.length === 0) {
            if (ordenInterna.id_cliente.length === 0) {
                handleError += '- Se debe ingresar información del cliente\n'
            }
            if (ordenInterna.codigo_area.length === 0) {
                handleError += '- Se debe ingresar información del área\n'
            }
            if ($valorEquipo.length === 0) {
                handleError += '- Se debe ingresar información del equipo\n'
            }
            if (ordenInterna.OrdenTrabajo.length === 0) {
                handleError += '- Se debe ingresar información de orden interna\n'
            }
            if (ordenInterna.fecha.length === 0) {
                handleError += '- Se debe ingresar información de la fecha'
            }
        }
        if (handleError.length === 0) {
            const formatData = {
                ...ordenInterna,
                estado: 1,
                descripcion_equipo: $valorEquipo  //añadido RRTD
            }

            // formateamos la data de numero de orden
            formatData.detalle_partes.forEach(element => {
                element.detalle_materiales.forEach((detalle, index) => {
                    detalle["numero_item"] = index + 1
                })
            })

            // VALIDAMOS SI LOS DETALLES DE LAS PARTES NO ESTAN VACIOS
            const validacionDetallePartes = validarInformacionDetallePartes()
            if (validacionDetallePartes.length === 0) {
                // VALIDAMOS QUE LAS CANTIDADES DE LOS DETALLES DE MATERIALES NO ESTEN VACIOS
                const validacionDetalleMateriales = validarInformacionDetalleMateriales()
                if (validacionDetalleMateriales.length === 0) {
                    showLoadingModal()
                    $.ajax({
                        url: './php/vistas/generarOI.php',
                        method: 'POST',
                        dataType: 'json',
                        data: JSON.stringify(formatData),
                        success: function (response) {
                            const { varRespuesta } = response
                            showSuccessAlert(varRespuesta)
                            $('#content').load('./paginas/orden-interna/listOrdenInterna.html')
                        },
                        error: function (xhr, status, error) {
                            alert('Error en la solicitud')
                        },
                        complete: function () {
                            hideLoadingModal()
                        }
                    })
                } else {
                    alert(validacionDetalleMateriales)
                }
            } else {
                alert(validacionDetallePartes)
            }
        } else {
            alert(handleError)
        }
    })
    // Funcion de cancelar
    $('#btn-cancelar-orden-interna').on('click', function () {
        resetValues()
        $('#content').load('./paginas/orden-interna/listOrdenInterna.html')
    })

    // -------- MANEJADORES DE DIALOG ---------------
    // Mostrar el modal de carga
    function showLoadingModal() {
        $('#loadingModal').modal('show');
    }

    // Ocultar el modal de carga
    function hideLoadingModal() {
        $('#loadingModal').modal('hide');
    }

    function showSuccessAlert(message) {
        $('#success-alert-message').val(message);
        $('#success-alert').removeClass('d-none');
        setTimeout(function () {
            $('#success-alert').addClass('d-none');
        }, 3000); // Ocultar la alerta después de 3 segundos
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

});
