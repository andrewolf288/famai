$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/trabajadores'

    // referencias de filtros
    const filterSelector = $('#filter-selector')
    const filterInput = $('#filter-input')
    const filterButton = $('#filter-button')

    // Opciones de DataTable
    const dataTableOptions = {
        destroy: true,
        responsive: true,
        paging: false,
        searching: false,
        info: false
    }

    // Inicializacion de data table
    function initDataTable(data) {
        let content = ''
        data.forEach((trabajador, index) => {
            content += `
                <tr>
                    <td>${trabajador.tra_codigosap || 'No aplica'}</td>
                    <td>${trabajador.tra_nombre}</td>
                    <td>${trabajador.area?.are_descripcion || 'No aplica'}</td>
                    <td>${trabajador.sede?.sed_nombre || 'No aplica'}</td>
                    <td>${trabajador.tra_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-warning btn-trabajador-editar" data-id-trabajador="${trabajador.tra_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${trabajador.tra_usucreacion === null ? 'No aplica' : trabajador.tra_usucreacion}</td>
                    <td>${trabajador.tra_feccreacion === null ? 'No aplica' : parseDate(trabajador.tra_feccreacion)}</td>
                    <td>${trabajador.tra_usumodificacion === null ? 'No aplica' : trabajador.tra_usumodificacion}</td>
                    <td>${trabajador.tra_fecmodificacion === null ? 'No aplica' : parseDate(trabajador.tra_fecmodificacion)}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
    }

    filterButton.on('click', () => {
        // seleccionamos el valor del selector
        const filterField = filterSelector.val().trim()
        // seleccionamos el valor del criterio de busqueda
        const filterValue = filterInput.val().trim()

        let filteredURL = apiURL
        // si se aplica un filtro y se ingresa un criterio de busqueda
        if (filterField.length !== 0 && filterValue.length !== 0) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        }

        initPagination(filteredURL, initDataTable, dataTableOptions)
    });

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)


    async function cargarOpcionesSelect(url, $selectElement, nombre, codigo, defaultOption) {
        try {
            // Realiza la solicitud fetch al servidor
            const { data } = await client.get(url)

            $selectElement.empty()
            $selectElement.append($('<option>', {
                value: "",
                text: defaultOption
            }))
            $.each(data, function (index, item) {
                $selectElement.append($('<option>', {
                    value: item[codigo],
                    text: item[nombre]
                }))
            })
        } catch (error) {
            console.error('Error al cargar opciones:', error)
        }
    }

    // ------------- CREACION DE TRABAJADOR ---------------
    $("#btn-link-create-trabajador").on('click', async function () {
        // reseteamos el formulario
        $('#crearTrabajadorForm')[0].reset()

        const usuarioTrabajador = $("#usuarioTrabajador")
        const areaTrabajador = $("#areaTrabajador")
        const sedeTrabajador = $("#sedeTrabajador")
        const solicitudes = [
            cargarOpcionesSelect('/usuariosSimple', usuarioTrabajador, 'usu_nombre', 'usu_codigo', 'Seleccione un usuario'),
            cargarOpcionesSelect('/areasSimple', areaTrabajador, 'are_descripcion', 'are_codigo', 'Seleccione una área'),
            cargarOpcionesSelect('/sedesSimple', sedeTrabajador, 'sed_nombre', 'sed_codigo', 'Seleccione una sede'),
        ]

        try {
            await Promise.all(solicitudes)
            const loaderModalCreate = new bootstrap.Modal(document.getElementById('crearTrabajadorModal'))
            loaderModalCreate.show()
        } catch (error) {
            alert('Error al cargar la información de creación.')
        }
    })

    $("#btnCrearTrabajador").on('click', async (event) => {
        event.preventDefault()

        const usuarioTrabajador = $.trim($("#usuarioTrabajador").val())
        const areaTrabajador = $.trim($("#areaTrabajador").val())
        const sedeTrabajador = $.trim($("#sedeTrabajador").val())
        const nombreTrabajador = $.trim($("#nombreTrabajador").val())
        const codigoSAPTrabajador = $.trim($("#codigoSAPTrabajador").val())

        let handleError = ''

        if (usuarioTrabajador.length === 0) {
            handleError += '- El campo usuario es obligatorio.\n'
        }

        if (areaTrabajador.length === 0) {
            handleError += '- El campo área es obligatorio.\n'
        }

        if (sedeTrabajador.length === 0) {
            handleError += '- El campo sede es obligatorio.\n'
        }

        if (nombreTrabajador.length === 0) {
            handleError += '- El campo nombre es obligatorio.\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        const formatData = {
            usu_codigo: usuarioTrabajador,
            are_codigo: areaTrabajador,
            sed_codigo: sedeTrabajador,
            tra_nombre: nombreTrabajador,
            tra_codigosap: codigoSAPTrabajador || null
        }

        try {
            console.log(formatData)
            await client.post('/trabajadores', formatData)
            // oculatamos el modal
            const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('crearTrabajadorModal'))
            loaderModalCreate.hide()
            // traemos de nuevo la data
            initPagination(apiURL, initDataTable, dataTableOptions)
        } catch (error) {
            const { response } = error
            if (response.status === 400) {
                const handleError = formatErrorsFromString(response.data.error)
                alert(handleError)
            } else {
                alert(response.data.error)
            }
        }
    })

    // ------------ EDICION DE TRABAJADOR --------------

    async function cargarDetalleTrabajadorById(id_trabajador) {
        try {
            const { data } = await client.get(`/trabajador/${id_trabajador}`)
            $("#id_trabajador_hidden").val(data.tra_id)
            $("#usuarioTrabajadorEdit").val(data.usu_codigo)
            $("#areaTrabajadorEdit").val(data.are_codigo)
            $("#sedeTrabajadorEdit").val(data.sed_codigo)
            $("#nombreTrabajadorEdit").val(data.tra_nombre || "")
            $("#codigoSAPTrabajadorEdit").val(data.tra_codigosap || "")
            $("#activoTrabajadorEdit").prop("checked", data.tra_activo == 1 ? true : false)
        } catch (error) {
            alert('Error al cargar la informacion del trabajador')
        }
    }

    $('#data-container').on('click', '.btn-trabajador-editar', async function () {
        // reseteamos el formulario
        const id_trabajador = $(this).data('id-trabajador')

        const usuarioTrabajador = $("#usuarioTrabajadorEdit")
        const areaTrabajador = $("#areaTrabajadorEdit")
        const sedeTrabajador = $("#sedeTrabajadorEdit")
        const solicitudes = [
            cargarOpcionesSelect('/usuariosSimple', usuarioTrabajador, 'usu_nombre', 'usu_codigo', 'Seleccione un usuario'),
            cargarOpcionesSelect('/areasSimple', areaTrabajador, 'are_descripcion', 'are_codigo', 'Seleccione una área'),
            cargarOpcionesSelect('/sedesSimple', sedeTrabajador, 'sed_nombre', 'sed_codigo', 'Seleccione una sede'),
        ]

        try {
            await Promise.all(solicitudes)
            await cargarDetalleTrabajadorById(id_trabajador)

            const loaderModalEdit = new bootstrap.Modal(document.getElementById('editarTrabajadorModal'))
            loaderModalEdit.show()
        } catch (error) {
            alert('Error al cargar la informacion de creación')
        }

        $("#btnEditarTrabajador").on('click', async (event) => {
            event.preventDefault()

            const id_trabajador = $("#id_trabajador_hidden").val()
            const usuarioTrabajador = $.trim($("#usuarioTrabajadorEdit").val())
            const areaTrabajador = $.trim($("#areaTrabajadorEdit").val())
            const sedeTrabajador = $.trim($("#sedeTrabajadorEdit").val())
            const nombreTrabajador = $.trim($("#nombreTrabajadorEdit").val())
            const codigoSAPTrabajador = $.trim($("#codigoSAPTrabajadorEdit").val())
            const activoTrabajador = $('#activoTrabajadorEdit').is(':checked')

            let handleError = ''

            if (usuarioTrabajador.length === 0) {
                handleError += '- El campo usuario es obligatorio.\n'
            }

            if (areaTrabajador.length === 0) {
                handleError += '- El campo área es obligatorio.\n'
            }

            if (sedeTrabajador.length === 0) {
                handleError += '- El campo sede es obligatorio.\n'
            }

            if (nombreTrabajador.length === 0) {
                handleError += '- El campo nombre es obligatorio.\n'
            }

            if (handleError.length !== 0) {
                alert(handleError)
                return
            }

            const formatData = {
                usu_codigo: usuarioTrabajador,
                are_codigo: areaTrabajador,
                sed_codigo: sedeTrabajador,
                tra_nombre: nombreTrabajador,
                tra_codigosap: codigoSAPTrabajador || null,
                tra_activo: activoTrabajador
            }

            try {
                await client.put(`/trabajador/${id_trabajador}`, formatData)
                // oculatamos el modal
                const loaderModalEditar = bootstrap.Modal.getInstance(document.getElementById('editarTrabajadorModal'))
                loaderModalEditar.hide()

                // traemos de nuevo la data
                initPagination(apiURL, initDataTable, dataTableOptions)
            } catch (error) {
                const { response } = error
                console.log(error)
                if (response.status === 400) {
                    const handleError = formatErrorsFromString(response.data.error)
                    alert(handleError)
                } else {
                    alert(response.data.error)
                }
            }
        })
    })
})
