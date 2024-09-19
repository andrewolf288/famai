$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/usuarios'

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
        data.forEach((usuario, index) => {
            content += `
                <tr>
                    <td>${usuario.usu_codigo}</td>
                    <td>${usuario.usu_nombre}</td>
                    <td>${usuario.rol.rol_descripcion}</td>
                    <td>${usuario.usu_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>${usuario.usu_ultimoacceso !== null ? parseDate(usuario.usu_ultimoacceso) : 'No aplica'}</td>
                    <td>${usuario.usu_usucreacion === null ? 'No aplica' : usuario.usu_usucreacion}</td>
                    <td>${usuario.usu_feccreacion === null ? 'No aplica' : parseDate(usuario.usu_feccreacion)}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-warning btn-usuario-editar" data-id-usuario="${usuario.usu_codigo}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td>${usuario.usu_usumodificacion === null ? 'No aplica' : usuario.usu_usumodificacion}</td>
                    <td>${usuario.usu_fecmodificacion === null ? 'No aplica' : parseDate(usuario.usu_fecmodificacion)}</td>
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

    //--------- MANEJADOR DE CONTRASEÑAS ---------
    $('.toggle-password').on('click', function () {
        const passwordField = $(this).siblings('input');
        const passwordFieldType = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', passwordFieldType);

        const icon = $(this).find('i');
        if (passwordFieldType === 'text') {
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });

    //--------- CREACION USUARIO -------------

    const traerInformacionRoles = async ($selectElement) => {
        try {
            const { data } = await client.get('/rolesSimple')
            $selectElement.empty()

            $selectElement.append($('<option>', {
                value: '',
                text: 'Seleccionar un rol'
            }))

            $.each(data, function (index, item) {
                $selectElement.append($('<option>', {
                    value: item.rol_id,
                    text: item.rol_descripcion
                }))
            })

        } catch (error) {
            console.log(error)
            alert("Hubo un error al traer la informacion de roles")
        }
    }

    $("#btn-link-create-usuario").on('click', async function () {
        const selectorRol = $("#rolUsuario")
        await traerInformacionRoles(selectorRol)
        const loaderModalCreate = new bootstrap.Modal(document.getElementById('crearUsuarioModal'))
        $('#crearUsuarioForm')[0].reset()
        loaderModalCreate.show()
    })

    $("#btn-create-usuario").on('click', async (event) => {
        event.preventDefault()

        const usuario = $.trim($("#usu_codigo").val())
        const nombre = $.trim($("#usu_nombre").val())
        const rol = $("#rolUsuario").val()
        const contrasena = $.trim($("#usu_contrasena").val())
        const contrasena_confirmar = $.trim($("#usu_contrasena_confirmar").val())

        let handleError = ''

        if (usuario.length === 0) {
            handleError += '- El campo usuario es obligatorio.\n'
        }

        if (nombre.length === 0) {
            handleError += '- El campo nombre es obligatorio.\n'
        }

        if (rol.length === 0) {
            handleError += '- El campo rol es obligatorio.\n'
        }

        if (contrasena.length === 0) {
            handleError += '- El campo contraseña es obligatorio.\n'
        } else {
            if (contrasena !== contrasena_confirmar) {
                handleError += '- Las contraseñas no coinciden.\n'
            }
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        const formatData = {
            usu_codigo: usuario,
            usu_nombre: nombre,
            rol_id: rol,
            usu_contrasena: contrasena
        }

        try {
            await client.post('/usuarios', formatData)
            // oculatamos el modal
            const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('crearUsuarioModal'))
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
    $('#data-container').on('click', '.btn-usuario-editar', async function () {
        // reseteamos el formulario
        const id_usuario = $(this).data('id-usuario')
        const selectorRolEdit = $("#rolUsuarioEdit")
        await traerInformacionRoles(selectorRolEdit)
        try {
            const { data } = await client.get(`/usuario/${id_usuario}`)
            const { usu_codigo, usu_nombre, usu_activo, rol } = data
            $("#usu_codigo_hidden").val(usu_codigo)
            $("#usu_codigo_editar").val(usu_codigo)
            $("#usu_nombre_editar").val(usu_nombre)
            $("#rolUsuarioEdit").val(rol.rol_id)
            $("#activoUsuarioEdit").prop("checked", usu_activo == 1 ? true : false)

            const loaderModalEdit = new bootstrap.Modal(document.getElementById('editarUsuarioModal'))
            loaderModalEdit.show()
        } catch (error) {
            console.log(error)
        }
    })

    $("#btn-editar-usuario").on('click', async (event) => {
        event.preventDefault()

        const usuarioHidden = $("#usu_codigo_hidden").val()
        const usuario = $.trim($("#usu_codigo_editar").val())
        const nombre = $.trim($("#usu_nombre_editar").val())
        const rol = $("#rolUsuarioEdit").val()
        const activoUsuario = $('#activoUsuarioEdit').is(':checked')

        let handleError = ''

        if (usuario.length === 0) {
            handleError += '- El campo usuario es obligatorio.\n'
        }

        if (nombre.length === 0) {
            handleError += '- El campo nombre es obligatorio.\n'
        }

        if (rol.length === 0) {
            handleError += '- El campo rol es obligatorio.\n'
        }

        if (handleError.length > 0) {
            alert(handleError)
            return
        }

        const formatData = {
            usu_codigo: usuario,
            usu_nombre: nombre,
            rol_id: rol,
            usu_activo: activoUsuario
        }

        try {
            await client.put(`/usuario/${usuarioHidden}`, formatData)
            // oculatamos el modal
            const loaderModalEdit = bootstrap.Modal.getInstance(document.getElementById('editarUsuarioModal'))
            loaderModalEdit.hide()
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