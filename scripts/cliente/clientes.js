$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/clientes'

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
        data.forEach((cliente, index) => {
            content += `
                <tr>
                    <td>${cliente.cli_nombre || 'No aplica'}</td>
                    <td>${cliente.tipo_documento?.tdo_codigo ?? 'No aplica'}</td>
                    <td>${cliente.cli_nrodocumento || 'No aplica'}</td>
                    <td>${cliente.cli_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-warning btn-cliente-editar" data-id-cliente="${cliente.cli_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${cliente.cli_usucreacion ?? 'No aplica'}</td>
                    <td>${cliente.cli_feccreacion === null ? 'No aplica' : parseDate(cliente.cli_feccreacion)}</td>
                    <td>${cliente.cli_usumodificacion ?? 'No aplica'}</td>
                    <td>${cliente.cli_fecmodificacion === null ? 'No aplica' : parseDate(cliente.cli_fecmodificacion)}</td>
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

    // ------------MODAL CREATE--------------
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

    //--------- CREACION CLIENTE -------------
    $("#btn-link-create-cliente").on('click', async function () {
        // reseteamos el formulario
        $('#crearClienteForm')[0].reset()

        const tipoDocumento = $("#tipoDocumentoCliente")
        const solicitudes = [
            cargarOpcionesSelect('/tiposdocumentosSimple', tipoDocumento, 'tdo_descripcion', 'tdo_codigo', 'Seleccione un tipo de documento')
        ]

        try {
            await Promise.all(solicitudes)
            const loaderModalCreate = new bootstrap.Modal(document.getElementById('crearClienteModal'))
            loaderModalCreate.show()
        } catch (error) {
            alert('Error al cargar la información de creación.')
        }

    })

    $("#btnCrearCliente").on('click', async (event) => {
        event.preventDefault()

        const tipoDocumento = $.trim($("#tipoDocumentoCliente").val())
        const numeroDocumentoCliente = $.trim($("#numeroDocumentoCliente").val())
        const nombreCliente = $.trim($("#nombreCliente").val())

        let handleError = ''

        if (tipoDocumento.length === 0) {
            handleError += '- El campo tipo de documento es obligatorio.\n'
        }

        if (numeroDocumentoCliente.length === 0) {
            handleError += '- El campo numero documento es obligatorio.\n'
        }

        if (nombreCliente.length === 0) {
            handleError += '- El campo nombre es obligatorio.\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        const formatData = {
            tdo_codigo: tipoDocumento,
            cli_nrodocumento: numeroDocumentoCliente,
            cli_nombre: nombreCliente,
        }
        console.log(formatData)

        try {
            await client.post('/clientes', formatData)
            // oculatamos el modal
            const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('crearClienteModal'))
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

    //--------- EDITAR CLIENTE -------------
    async function cargarDetalleClienteById(id_cliente) {
        try {
            const { data } = await client.get(`/cliente/${id_cliente}`)
            $("#id_cliente_hidden").val(data.cli_id)
            $("#tipoDocumentoClienteEdit").val(data.tdo_codigo)
            $("#numeroDocumentoClienteEdit").val(data.cli_nrodocumento)
            $("#nombreClienteEdit").val(data.cli_nombre)
            $("#activoClienteEdit").prop("checked", data.cli_activo == 1 ? true : false)
        } catch (error) {
            alert('Error al cargar la informacion del cliente')
        }
    }

    $('#data-container').on('click', '.btn-cliente-editar', async function () {
        // reseteamos el formulario
        const id_cliente = $(this).data('id-cliente')

        const tipoDocumento = $("#tipoDocumentoClienteEdit")
        const solicitudes = [
            cargarOpcionesSelect('/tiposdocumentosSimple', tipoDocumento, 'tdo_descripcion', 'tdo_codigo', 'Seleccione un tipo de documento')
        ]

        try {
            await Promise.all(solicitudes)
            await cargarDetalleClienteById(id_cliente)

            const loaderModalEdit = new bootstrap.Modal(document.getElementById('editarClienteModal'))
            loaderModalEdit.show()
        } catch (error) {
            alert('Error al cargar la informacion de edición')
        }

    })

    $("#btnEditarCliente").on('click', async (event) => {
        event.preventDefault()

        const id_cliente = $("#id_cliente_hidden").val()
        const tipoDocumento = $.trim($("#tipoDocumentoClienteEdit").val())
        const numeroDocumentoCliente = $.trim($("#numeroDocumentoClienteEdit").val())
        const nombreCliente = $.trim($("#nombreClienteEdit").val())
        const activoCliente = $('#activoClienteEdit').is(':checked')

        let handleError = ''

        if (tipoDocumento.length === 0) {
            handleError += '- El campo tipo de documento es obligatorio.\n'
        }

        if (numeroDocumentoCliente.length === 0) {
            handleError += '- El campo numero documento es obligatorio.\n'
        }

        if (nombreCliente.length === 0) {
            handleError += '- El campo nombre es obligatorio.\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        const formatData = {
            tdo_codigo: tipoDocumento,
            cli_nrodocumento: numeroDocumentoCliente,
            cli_nombre: nombreCliente,
            cli_activo: activoCliente
        }

        try {
            console.log(formatData)
            await client.put(`/cliente/${id_cliente}`, formatData)
            // oculatamos el modal
            const loaderModalEditar = bootstrap.Modal.getInstance(document.getElementById('editarClienteModal'))
            loaderModalEditar.hide()

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
})