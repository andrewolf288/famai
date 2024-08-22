$(document).ready(() => {
    // URL ENDPOINT
    const apiURL = '/productos'

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
        console.log(data)
        let content = ''
        data.forEach((producto, index) => {
            content += `
                <tr>
                    <td>${producto.pro_codigo}</td>
                    <td>${producto.grupo_inventario !== null ? producto.grupo_inventario.pgi_codigo : 'No aplica'}</td>
                    <td>${producto.familia !== null ? producto.familia.pfa_codigo : 'No aplica'}</td>
                    <td>${producto.subfamilia !== null ? producto.subfamilia.psf_codigo : 'No aplica'}</td>
                    <td>${producto.pro_descripcion}</td>
                    <td>${producto.unidad !== null ? producto.unidad.uni_codigo : 'No aplica'}</td>
                </tr>
            `
        })
        $('#data-container-body').html(content)
    }

    filterButton.on('click', () => {
        const filterField = filterSelector.val().trim()
        const filterValue = filterInput.val().trim()
        let filteredURL = apiURL

        if (filterField && filterValue) {
            filteredURL += `?${filterField}=${encodeURIComponent(filterValue)}`
        }

        initPagination(filteredURL, initDataTable, dataTableOptions)
    });

    // inicializamos la paginacion con datatable
    initPagination(apiURL, initDataTable, dataTableOptions)
})