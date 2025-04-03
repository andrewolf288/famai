$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/entidadesbancarias'

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

    const initDataTable = (data) => {
        let content = ''
        data.forEach((entidadBancaria, index) => {
            content += `
            <tr>
                <td scope="row" class="text-left">${index + 1}</td>
                <td>${entidadBancaria.eba_codigo}</td>
                <td>${entidadBancaria.eba_descripcion}</td>
                <td class="text-center">${entidadBancaria.eba_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
                <td>${entidadBancaria.eba_usucreacion === null ? 'No aplica' : entidadBancaria.eba_usucreacion}</td>
                <td>${entidadBancaria.eba_feccreacion === null ? 'No aplica' : parseDate(entidadBancaria.eba_feccreacion)}</td>
                <td>${entidadBancaria.eba_usumodificacion === null ? 'No aplica' : entidadBancaria.eba_usumodificacion}</td>
                <td>${entidadBancaria.eba_fecmodificacion === null ? 'No aplica' : parseDate(entidadBancaria.eba_fecmodificacion)}</td>
                <td>
                    <div class="d-flex justify-content-around">
                        <button class="btn btn-sm btn-warning btn-entidad-editar" data-id-entidad="${entidadBancaria.eba_id}"}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
            `
        })
        $("#data-container-body").html(content)
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
        console.log(filteredURL)

        initPagination(filteredURL, initDataTable, dataTableOptions)
    });

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)

    $('#btn-link-create-entidad-bancaria').on('click', async function () {
        // reseteamos el formulario
        $('#crearEntidadBancariaForm')[0].reset()
        const loaderModalCreate = new bootstrap.Modal(document.getElementById('entidadBancariaCrearModal'))
        loaderModalCreate.show()
    })

    $('#btnCrearEntidadBancaria').on('click', async (event) => {
        event.preventDefault()
        let handleError = ''

        const codigoEntidadBancaria = $.trim($('#codigoEntidadBancaria').val())
        const descripcionEntidadBancaria = $.trim($('#descripcionEntidadBancaria').val())

        if (!codigoEntidadBancaria) {
            handleError += '- Debe ingresar el código de la entidad bancaria\n'
        }

        if (!descripcionEntidadBancaria) {
            handleError += '- Debe ingresar el nombre de la entidad bancaria\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        const entidadBancariaData = {
            eba_codigo: codigoEntidadBancaria,
            eba_descripcion: descripcionEntidadBancaria
        }
        try {
            const { data } = await client.post('/entidadesbancarias', entidadBancariaData)
            // reseteamos el formulario
            $('#crearEntidadBancariaForm')[0].reset()
            // oculatamos el modal
            const loaderModalCreate = bootstrap.Modal.getInstance(document.getElementById('entidadBancariaCrearModal'))
            loaderModalCreate.hide()
            // traemos de nuevo la data
            initPagination(apiURL, initDataTable, dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Hubo un error al momento de crear la entidad bancaria')
        }
    })

    // ------ MODAL EDIT --------
    async function cargarDetalleEntidadBancariaById(id_entidad) {
        try {
            const { data } = await client.get(`/entidadbancaria/${id_entidad}`)

            // actualizamos el formulario de edicion
            $("#entidadBancariaIDEdit").val(data.eba_id)
            $("#editarCodigoEntidadBancaria").val(data.eba_codigo)
            $("#editarDescripcionEntidadBancaria").val(data.eba_descripcion)
            $("#activoEntidadBancariaEdit").prop("checked", data.eba_activo == 1 ? true : false)

        } catch (error) {
            alert('Hubo un error al obtener datos de la entidad bancaria')
        }
    }

    $('#data-container').on('click', '.btn-entidad-editar', async function () {
        // reseteamos el formulario
        const id_entidad = $(this).data('id-entidad')
        await cargarDetalleEntidadBancariaById(id_entidad)

        // hideLoaderModal()
        const loaderModalEdit = new bootstrap.Modal(document.getElementById('entidadBancariaEditarModal'))
        loaderModalEdit.show()
    })

    $('#btnEditarEntidadBancaria').on('click', async (event) => {
        event.preventDefault()
        let handleError = ''
        const idEntidadBancaria = $("#entidadBancariaIDEdit").val()
        const codigoEntidadBancaria = $.trim($('#editarCodigoEntidadBancaria').val())
        const descripcionEntidadBancaria= $.trim($('#editarDescripcionEntidadBancaria').val())
        const activoEntidadBancara = $('#activoEntidadBancariaEdit').is(':checked')

        if (!codigoEntidadBancaria) {
            handleError += '- Debe ingresar el código de la entidad bancaria\n'
        }

        if(!descripcionEntidadBancaria){
            handleError += '- Debe ingresar el nombre de la entidad bancaria\n'
        }

        if (handleError.length !== 0) {
            alert(handleError)
            return
        }

        const entidadBancariaData = {
            eba_codigo: codigoEntidadBancaria,
            eba_descripcion: descripcionEntidadBancaria,
            eba_activo: activoEntidadBancara
        }
        try {
            const { data } = await client.put(`/entidadbancaria/${idEntidadBancaria}`, entidadBancariaData)
            // reseteamos el formulario
            $('#editarEntidadBancariaForm')[0].reset()
            // oculatamos el modal
            const loaderModalEdit = bootstrap.Modal.getInstance(document.getElementById('entidadBancariaEditarModal'))
            loaderModalEdit.hide()
            // traemos de nuevo la data
            initPagination(apiURL, initDataTable, dataTableOptions)
        } catch (error) {
            console.log(error)
            alert('Hubo un error al momento de editar la entidad bancaria')
        }
    })


})