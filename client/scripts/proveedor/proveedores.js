$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/proveedores'

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
        data.forEach((proveedor, index) => {
            content += `
                <tr>
                    <td>${proveedor.prv_nombre}</td>
                    <td>${proveedor.prv_nrodocumento ?? 'No aplica'}</td>
                    <td>${proveedor.prv_telefono ?? 'No aplica'}</td>
                    <td>${proveedor.prv_correo ?? 'No aplica'}</td>
                    <td>${proveedor.prv_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-warning btn-proveedor-editar" data-id-proveedor="${proveedor.prv_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${proveedor.prv_usucreacion ?? 'No aplica'}</td>
                    <td>${proveedor.prv_feccreacion === null ? 'No aplica' : parseDate(proveedor.prv_feccreacion)}</td>
                    <td>${proveedor.prv_usumodificacion ?? 'No aplica'}</td>
                    <td>${proveedor.prv_fecmodificacion === null ? 'No aplica' : parseDate(proveedor.prv_fecmodificacion)}</td>
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

    //--------- CREACION PROVEEDOR -------------
    $("#btn-link-create-proveedor").on('click', async function () {
        // reseteamos el formulario
        $('#crearProveedorForm')[0].reset()

        const tipoDocumento = $("#tipoDocumentoProveedor")
        const solicitudes = [
            cargarOpcionesSelect('/tiposdocumentosSimple', tipoDocumento, 'tdo_descripcion', 'tdo_codigo', 'Seleccione un tipo de documento')
        ]

        try {
            await Promise.all(solicitudes)
            const loaderModalCreate = new bootstrap.Modal(document.getElementById('crearProveedorModal'))
            loaderModalCreate.show()
        } catch (error) {
            console.log(error)
        }

    })

    $("#btnCrearProveedor").on('click', async (event) => {
        event.preventDefault()

        const tipoDocumento = $.trim($("#tipoDocumentoProveedor").val())
        const numeroDocumentoProveedor = $.trim($("#numeroDocumentoProveedor").val())
        const nombreProveedor = $.trim($("#nombreProveedor").val())
        const ubigeoProveedor = $.trim($("#ubigeoProveedor").val())
        const telefonoProveedor = $.trim($("#telefonoProveedor").val())
        const contactoProveedor = $.trim($("#contactoProveedor").val())
        const correoProveedor = $.trim($("#correoProveedor").val())
        const whatsappProveedor = $.trim($("#whatsappProveedor").val())
        const direccionProveedor = $.trim($("#direccionProveedor").val())

        let handleError = ''

        if (tipoDocumento.length === 0) {
            handleError += '- El campo tipo de documento es obligatorio.\n'
        }

        if (numeroDocumentoProveedor.length === 0) {
            handleError += '- El campo numero documento es obligatorio.\n'
        }

        if (nombreProveedor.length === 0) {
            handleError += '- El campo nombre es obligatorio.\n'
        }

        if (handleError.length !== 0) {
            console.log(handleError)
            alert(handleError)
            return
        }

        const formatData = {
            tdo_codigo: tipoDocumento,
            prv_nrodocumento: numeroDocumentoProveedor,
            prv_nombre: nombreProveedor,
            prv_direccion: direccionProveedor || null,
            ubi_codigo: ubigeoProveedor || null,
            prv_telefono: telefonoProveedor || null,
            prv_contacto: contactoProveedor || null,
            prv_correo: correoProveedor || null,
            prv_whatsapp: whatsappProveedor || null
        }

        try {
            console.log(formatData)
            await client.post('/proveedores', formatData)
            // oculatamos el modal
            const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('crearProveedorModal'))
            loaderModalCreate.hide()
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

    //--------- EDITAR USUARIO -------------
    async function cargarDetalleProveedorById(id_proveedor) {
        try {
            const { data } = await client.get(`/proveedor/${id_proveedor}`)
            $("#id_proveedor_hidden").val(data.prv_id)
            $("#tipoDocumentoProveedorEdit").val(data.tdo_codigo)
            $("#numeroDocumentoProveedorEdit").val(data.prv_nrodocumento)
            $("#nombreProveedorEdit").val(data.prv_nombre)
            $("#ubigeoProveedorEdit").val(data.ubi_codigo || "")
            $("#telefonoProveedorEdit").val(data.prv_telefono || "")
            $("#contactoProveedorEdit").val(data.prv_contacto || "")
            $("#correoProveedorEdit").val(data.prv_correo || "")
            $("#whatsappProveedorEdit").val(data.prv_whatsapp || "")
            $("#direccionProveedorEdit").val(data.prv_direccion || "")
            $("#activoProveedorEdit").prop("checked", data.prv_activo == 1 ? true : false)
        } catch (error) {
            console.log(error)
        }
    }

    $('#data-container').on('click', '.btn-proveedor-editar', async function () {
        // reseteamos el formulario
        const id_proveedor = $(this).data('id-proveedor')

        const tipoDocumento = $("#tipoDocumentoProveedorEdit")
        const solicitudes = [
            cargarOpcionesSelect('/tiposdocumentosSimple', tipoDocumento, 'tdo_descripcion', 'tdo_codigo', 'Seleccione un tipo de documento')
        ]

        try {
            await Promise.all(solicitudes)
            await cargarDetalleProveedorById(id_proveedor)

            const loaderModalEdit = new bootstrap.Modal(document.getElementById('editarProveedorModal'))
            loaderModalEdit.show()
        } catch (error) {
            console.log(error)
        }

    })

    $("#btnEditarProveedor").on('click', async (event) => {
        event.preventDefault()

        const id_proveedor = $("#id_proveedor_hidden").val()
        const tipoDocumento = $.trim($("#tipoDocumentoProveedorEdit").val())
        const numeroDocumentoProveedor = $.trim($("#numeroDocumentoProveedorEdit").val())
        const nombreProveedor = $.trim($("#nombreProveedorEdit").val())
        const ubigeoProveedor = $.trim($("#ubigeoProveedorEdit").val())
        const telefonoProveedor = $.trim($("#telefonoProveedorEdit").val())
        const contactoProveedor = $.trim($("#contactoProveedorEdit").val())
        const correoProveedor = $.trim($("#correoProveedorEdit").val())
        const whatsappProveedor = $.trim($("#whatsappProveedorEdit").val())
        const direccionProveedor = $.trim($("#direccionProveedorEdit").val())
        const activoProveedor = $('#activoProveedorEdit').is(':checked')

        let handleError = ''

        if (tipoDocumento.length === 0) {
            handleError += '- El campo tipo de documento es obligatorio.\n'
        }

        if (numeroDocumentoProveedor.length === 0) {
            handleError += '- El campo numero documento es obligatorio.\n'
        }

        if (nombreProveedor.length === 0) {
            handleError += '- El campo nombre es obligatorio.\n'
        }

        if (handleError.length !== 0) {
            console.log(handleError)
            alert(handleError)
            return
        }

        const formatData = {
            tdo_codigo: tipoDocumento,
            prv_nrodocumento: numeroDocumentoProveedor,
            prv_nombre: nombreProveedor,
            prv_direccion: direccionProveedor || null,
            ubi_codigo: ubigeoProveedor || null,
            prv_telefono: telefonoProveedor || null,
            prv_contacto: contactoProveedor || null,
            prv_correo: correoProveedor || null,
            prv_whatsapp: whatsappProveedor || null,
            prv_activo: activoProveedor
        }

        try {
            await client.put(`/proveedor/${id_proveedor}`, formatData)
            // oculatamos el modal
            const loaderModalEditar = bootstrap.Modal.getInstance(document.getElementById('editarProveedorModal'))
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