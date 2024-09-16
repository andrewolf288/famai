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
                    <td>${trabajador.tra_activo == 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'}</td>
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
})