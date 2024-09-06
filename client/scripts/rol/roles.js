$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/roles'

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
        data.forEach((rol, index) => {
            content += `
                <tr>
                    <td>${rol.rol_descripcion}</td>
                    <td>${rol.rol_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                    <td>${rol.rol_usucreacion === null ? 'No aplica' : rol.rol_usucreacion}</td>
                    <td>${rol.rol_feccreacion === null ? 'No aplica' : parseDate(rol.rol_feccreacion)}</td>
                    <td>${rol.rol_usumodificacion === null ? 'No aplica' : rol.rol_usumodificacion}</td>
                    <td>${rol.rol_fecmodificacion === null ? 'No aplica' : parseDate(rol.rol_fecmodificacion)}</td>
                    <td>
                        <div class="d-flex justify-content-around">
                            <button class="btn btn-sm btn-warning btn-rol-editar" data-id-rol="${rol.rol_id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
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

    // -------- CREACION DE ROL ----------
    const traerInformacionModulosEdit = async ($groupCheckbox) => {
        try {
            const response = await client.get('/modulosSimple')
            const modulos = response.data
            modulos.forEach(modulo => {
                $groupCheckbox.append(`
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="modulos[]" value="${modulo.mol_id}" id="modulo_edit_${modulo.mol_id}">
                        <label class="form-check-label" for="modulo_edit_${modulo.mol_id}">
                            ${modulo.mol_descripcion}
                        </label>
                    </div>
                `)
            })

        } catch (error) {
            alert("Hubo un error al traer la informacion de modulos")
        }
    }
    const traerInformacionModulos = async ($groupCheckbox) => {
        try {
            const response = await client.get('/modulosSimple')
            const modulos = response.data
            modulos.forEach(modulo => {
                $groupCheckbox.append(`
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="modulos[]" value="${modulo.mol_id}" id="modulo_${modulo.mol_id}">
                        <label class="form-check-label" for="modulo_${modulo.mol_id}">
                            ${modulo.mol_descripcion}
                        </label>
                    </div>
                `)
            })

        } catch (error) {
            alert("Hubo un error al traer la informacion de modulos")
        }
    }

    $('#btn-link-create-rol').on('click', async function () {
        const selectorCheckbox = $("#checkboxGroup")
        selectorCheckbox.empty()
        await traerInformacionModulos(selectorCheckbox)
        const loaderModalCreate = new bootstrap.Modal(document.getElementById('crearRolModal'))
        loaderModalCreate.show()
    })

    $('#btn-create-rol').on('click', async (event) => {
        event.preventDefault()
        // Obtener todos los checkboxes seleccionados
        const nombreRol = $('#rolDescripcion').val()
        const checkboxes = $('input[name="modulos[]"]:checked');

        // Crear un array con los valores seleccionados
        const selectedValues = checkboxes.map(function () {
            return $(this).val();
        }).get();

        let handleError = ''
        if (selectedValues.length === 0) {
            handleError += '- Debe seleccionar al menos un modulo\n'
        }
        if (nombreRol.length === 0) {
            handleError += '- El campo nombre es obligatorio\n'
        }
        if (handleError.length > 0) {
            alert(handleError)
            return
        }
        try {
            await client.post('/roles', {
                rol_descripcion: nombreRol,
                modulos: selectedValues
            })

            // reseteamos el formulario
            $('#crearRolForm')[0].reset()

            // oculatamos el modal
            const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('crearRolModal'))
            loaderModalCreate.hide()

            // traemos de nuevo la data
            initPagination(apiURL, initDataTable, dataTableOptions)
        } catch (error) {
            alert("Hubo un error al crear el rol")
        }
    })

    $('#data-container').on('click', '.btn-rol-editar', async function () {
        // reseteamos el formulario
        const id_rol = $(this).data('id-rol')
        const selectorCheckboxEdit = $("#checkboxGroupEdit")
        selectorCheckboxEdit.empty()
        try {
            // traemos la infomracion de modulos
            await traerInformacionModulosEdit(selectorCheckboxEdit)
            // traemos informacion de modulos por rol
            const { data } = await client.get(`/findModulosByRol/${id_rol}`)
            const { rol_descripcion, rol_modulo, rol_id } = data[0]
            $("#rol_id_hidden").val(rol_id)
            $("#rolDescripcionEdit").val(rol_descripcion)

            // seleccionamos los modulos por rol
            rol_modulo.forEach(modulo => {
                $(`#modulo_edit_${modulo.mol_id}`).prop('checked', true);
            });

            const loaderModalEdit = new bootstrap.Modal(document.getElementById('editarRolModal'))
            loaderModalEdit.show()
        } catch (error) {
            console.log(error)
        }
    })

    $("#btn-editar-rol").on('click', async (event) => {
        event.preventDefault()

        const id_rol = $("#rol_id_hidden").val()
        const nombreRol = $.trim($("#rolDescripcionEdit").val())
        const checkboxes = $('input[name="modulos[]"]:checked');

        // Crear un array con los valores seleccionados
        const selectedValues = checkboxes.map(function () {
            return $(this).val();
        }).get();

        let handleError = ''
        if (selectedValues.length === 0) {
            handleError += '- Debe seleccionar al menos un modulo\n'
        }
        if (nombreRol.length === 0) {
            handleError += '- El campo nombre es obligatorio\n'
        }
        if (handleError.length > 0) {
            alert(handleError)
            return
        }
        try {
            console.log(nombreRol, selectedValues)
            await client.put(`/rol/${id_rol}`, {
                rol_descripcion: nombreRol,
                modulos: selectedValues
            })
            // reseteamos el formulario
            $('#editarRolForm')[0].reset()
            // oculatamos el modal
            const loaderModalEdit = bootstrap.Modal.getInstance(document.getElementById('editarRolModal'))
            loaderModalEdit.hide()
            // traemos de nuevo la data
            initPagination(apiURL, initDataTable, dataTableOptions)
        } catch (error) {
            const {response} = error
            if(response.status === 400) {
                const handleError = formatErrorsFromString(response.data.error)
                alert(handleError)
            } else {
                alert(response.data.error)
            }
        }
    })

})